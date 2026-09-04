import math
import os
import uuid
import hashlib
from typing import Any, List, Optional

import chromadb

from app.services.vector_store import embed_sentences


class EmbeddingStore:
    """Embedding store wrapped around ChromaDB with an in-memory list fallback."""

    def __init__(self, collection_name: str = "study-assistant", persist_directory: Optional[str] = None):
        self.collection_name = collection_name
        self.persist_directory = persist_directory or os.path.join(
            os.path.dirname(__file__), "..", "..", "data", "chroma"
        )
        self._items: List[dict[str, Any]] = []
        self._documents: List[dict[str, Any]] = []
        self._collection = None
        self._documents_collection = None

        try:
            self._client = chromadb.PersistentClient(path=self.persist_directory)
            self._collection = self._client.get_or_create_collection(name=self.collection_name)
            self._documents_collection = self._client.get_or_create_collection(
                name=f"{self.collection_name}-documents"
            )
            self._migrate_legacy_documents()
        except Exception as e:
            print(f"Warning: Could not initialize ChromaDB ({e}). Falling back to in-memory store.")
            self._collection = None
            self._documents_collection = None

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
            ids = [str(uuid.uuid4()) for _ in texts]

        if metadatas is None:
            metadatas = [{"source": "study-assistant"} for _ in texts]
        else:
            metadatas = [metadata or {"source": "study-assistant"} for metadata in metadatas]

        # Use ChromaDB if active
        if self._collection is not None:
            self._collection.add(
                documents=texts,
                embeddings=embeddings,
                ids=ids,
                metadatas=metadatas,
            )

        # Always sync with in-memory store so both stay identical
        for text, embedding, item_id, metadata in zip(texts, embeddings, ids, metadatas):
            self._items.append(
                {
                    "id": item_id,
                    "text": text,
                    "embedding": embedding,
                    "metadata": metadata,
                }
            )
        return ids

    def query(self, query_embedding: List[float], n_results: int = 5) -> List[dict[str, Any]]:
        if self._collection is not None:
            results = self._collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
            )

            # Check if any documents were found
            ids = results.get("ids", [[]])
            if not ids or not ids[0]:
                return []

            documents = results.get("documents", [[]])[0]
            metadatas = results.get("metadatas", [[]])[0]
            distances = results.get("distances", [[]])[0]

            return [
                {
                    "id": item_id,
                    "text": text,
                    "metadata": metadata or {},
                    "distance": distance,
                }
                for item_id, text, metadata, distance in zip(
                    ids[0],
                    documents,
                    metadatas if metadatas else [{}] * len(ids[0]),
                    distances if distances else [0.0] * len(ids[0]),
                )
            ]

        # In-memory similarity computation fallback
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
                "distance": 1.0 - score,
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
                "metadata": result["metadatas"][0] if result.get("metadatas") else {},
            }

        for item in self._items:
            if item["id"] == item_id:
                return item
        return None

    def register_document(self, metadata: dict[str, Any]) -> dict[str, Any]:
        """Store one metadata record per source document, independent of its chunks."""
        source = self._next_available_source(str(metadata.get("source", "")))
        metadata = {**metadata, "source": source}
        document_id = hashlib.sha256(source.encode("utf-8")).hexdigest()
        metadata["document_id"] = document_id
        document_metadata = {key: str(value) for key, value in metadata.items()}

        if self._documents_collection is not None:
            self._documents_collection.upsert(
                ids=[document_id],
                documents=[source or document_id],
                metadatas=[document_metadata],
            )
        else:
            existing = next((item for item in self._documents if item["id"] == document_id), None)
            if existing is None:
                self._documents.append(
                    {
                        "id": document_id,
                        "text": source or document_id,
                        "metadata": document_metadata,
                    }
                )
            else:
                existing["text"] = source or document_id
                existing["metadata"] = document_metadata

        return metadata

    def delete_document(self, document_id: str) -> dict[str, Any] | None:
        """Delete a document record and every chunk belonging to its source."""
        document = self._get_registered_document(document_id)
        if document is None:
            return None

        metadata = document.get("metadata", {})
        source = metadata.get("source", "")
        if self._collection is not None:
            if source:
                self._collection.delete(where={"source": source})
            self._collection.delete(where={"document_id": document_id})
        self._items = [
            item
            for item in self._items
            if item["metadata"].get("source") != source
            and item["metadata"].get("document_id") != document_id
        ]

        if self._documents_collection is not None:
            self._documents_collection.delete(ids=[document_id])
        self._documents = [item for item in self._documents if item["id"] != document_id]
        return document

    def _get_registered_document(self, document_id: str) -> dict[str, Any] | None:
        if self._documents_collection is not None:
            result = self._documents_collection.get(
                ids=[document_id],
                include=["documents", "metadatas"],
            )
            if not result.get("ids"):
                return None
            return {
                "id": result["ids"][0],
                "text": result.get("documents", [""])[0],
                "metadata": (result.get("metadatas") or [{}])[0] or {},
            }
        return next((item for item in self._documents if item["id"] == document_id), None)

    def _next_available_source(self, source: str) -> str:
        """Return source with a numeric suffix when its filename is already registered."""
        if not source:
            return source

        existing_sources = {
            str(metadata.get("source", "")).casefold()
            for metadata in self._registered_metadata()
        }
        if source.casefold() not in existing_sources:
            return source

        source_path = os.path.basename(source)
        stem, extension = os.path.splitext(source_path)
        directory = os.path.dirname(source)
        suffix = 1
        while True:
            candidate_name = f"{stem} ({suffix}){extension}"
            candidate = os.path.join(directory, candidate_name) if directory else candidate_name
            if candidate.casefold() not in existing_sources:
                return candidate
            suffix += 1

    def _registered_metadata(self) -> List[dict[str, Any]]:
        if self._documents_collection is not None:
            result = self._documents_collection.get(include=["metadatas"])
            return result.get("metadatas", [])
        return [item["metadata"] for item in self._documents]

    def _migrate_legacy_documents(self) -> None:
        """Populate the document registry from chunks created before it existed."""
        if self._collection is None or self._documents_collection is None:
            return
        if self._documents_collection.count() > 0:
            return

        legacy = self._collection.get(include=["metadatas"])
        for metadata in legacy.get("metadatas", []):
            if metadata and metadata.get("source"):
                self.register_document({"source": metadata["source"]})

    def list_documents(self) -> List[dict[str, Any]]:
        """Return one record per source document, not one record per chunk."""
        if self._documents_collection is not None:
            result = self._documents_collection.get(include=["documents", "metadatas"])
            ids = result.get("ids", [])
            documents = result.get("documents", [])
            metadatas = result.get("metadatas", [])

            return [
                {
                    "id": item_id,
                    "text": text,
                    "metadata": metadata or {},
                }
                for item_id, text, metadata in zip(
                    ids,
                    documents,
                    metadatas if metadatas else [{}] * len(ids),
                )
            ]

        return [
            {
                "id": item["id"],
                "text": item["text"],
                "metadata": item["metadata"],
            }
            for item in self._documents
        ]

    def delete(self, item_ids: List[str]) -> None:
        if self._collection is not None:
            self._collection.delete(ids=item_ids)

        item_ids_set = set(item_ids)
        self._items = [item for item in self._items if item["id"] not in item_ids_set]

    def add_texts(
        self,
        texts: List[str],
        ids: Optional[List[str]] = None,
        metadatas: Optional[List[dict[str, Any]]] = None,
    ) -> List[str]:
        raw_embeddings = embed_sentences(texts)

        if hasattr(raw_embeddings, "tolist"):
            embeddings_list = raw_embeddings.tolist()
        else:
            embeddings_list = raw_embeddings

        return self.add_embeddings(
            texts=texts,
            embeddings=embeddings_list,
            ids=ids,
            metadatas=metadatas,
        )


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