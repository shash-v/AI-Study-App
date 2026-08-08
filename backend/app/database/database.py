import math
import os
from typing import Any, List, Optional

from app.services.vector_store import embed_sentences

import chromadb



class EmbeddingStore:
    """Simple embedding store with an in-memory fallback and optional ChromaDB persistence."""

    def __init__(self, collection_name: str = "study-assistant", persist_directory: Optional[str] = None):
        self.collection_name = collection_name
        self.persist_directory = persist_directory or os.path.join(
            os.path.dirname(__file__), "..", "..", "data", "chroma"
        )
        self._items: List[dict[str, Any]] = []
        self._collection = None

        if chromadb is not None:
            try:
                self._client = chromadb.PersistentClient(path=self.persist_directory)
                self._collection = self._client.get_or_create_collection(name=self.collection_name)
            except Exception:
                self._collection = None

    def add_embeddings(
        self,
        texts: List[str],
        embeddings: List[List[float]],
        ids: Optional[List[str]] = None,
        metadatas: Optional[List[dict[str, Any]]] = None,
    ) -> List[str]:
        if len(texts) != len(embeddings):
            raise ValueError("texts and embeddings must be the same length")

        if ids is None:
            ids = [str(i) for i in range(len(texts))]

        if metadatas is None:
            metadatas = [{"source": "test"} for _ in texts]
        else:
            metadatas = [metadata or {"source": "test"} for metadata in metadatas]

        if self._collection is not None:
            self._collection.add(
                documents=texts,
                embeddings=embeddings,
                ids=ids,
                metadatas=metadatas,
            )
            return ids

        for text, embedding, item_id, metadata in zip(texts, embeddings, ids, metadatas):
            self._items.append(
                {
                    "id": item_id,
                    "text": text,
                    "embedding": embedding,
                    "metadata": metadata or {},
                }
            )
        return ids

    def query(self, query_embedding: List[float], n_results: int = 5) -> List[dict[str, Any]]:
        if self._collection is not None:
            results = self._collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
            )
            return [
                {
                    "id": item_id,
                    "text": text,
                    "metadata": metadata,
                    "distance": distance,
                }
                for item_id, text, metadata, distance in zip(
                    results.get("ids", [[]])[0],
                    results.get("documents", [[]])[0],
                    results.get("metadatas", [[]])[0],
                    results.get("distances", [[]])[0],
                )
            ]

        scored_items = []
        for item in self._items:
            score = cosine_similarity(query_embedding, item["embedding"])
            scored_items.append((score, item))

        scored_items.sort(key=lambda x: x[0], reverse=True)
        return [
            {
                "id": item["id"],
                "text": item["text"],
                "metadata": item["metadata"],
                "distance": 1 - score,
            }
            for score, item in scored_items[:n_results]
        ]

    def get_by_id(self, item_id: str) -> Optional[dict[str, Any]]:
        if self._collection is not None:
            result = self._collection.get(ids=[item_id])
            if not result.get("ids"):
                return None
            return {
                "id": result["ids"][0],
                "text": result["documents"][0],
                "metadata": result["metadatas"][0],
            }

        for item in self._items:
            if item["id"] == item_id:
                return item
        return None

    def delete(self, item_ids: List[str]) -> None:
        if self._collection is not None:
            self._collection.delete(ids=item_ids)
            return

        self._items = [item for item in self._items if item["id"] not in set(item_ids)]

    def add_texts(self, texts: List[str], ids: Optional[List[str]] = None, metadatas: Optional[List[dict[str, Any]]] = None) -> List[str]:
        embeddings = embed_sentences(texts)
        return self.add_embeddings(texts=texts, embeddings=embeddings.tolist(), ids=ids, metadatas=metadatas)



# Computing the similarity between two embeddings using cosine similarity.
def cosine_similarity(a: List[float], b: List[float]) -> float:
    if len(a) != len(b):
        raise ValueError("embeddings must have the same length")

    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def create_store(collection_name: str = "study-assistant") -> EmbeddingStore:
    return EmbeddingStore(collection_name=collection_name)

