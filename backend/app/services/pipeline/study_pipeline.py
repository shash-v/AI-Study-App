from __future__ import annotations

from pathlib import Path
from typing import Any, Sequence

from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.vectorstores import VectorStoreRetriever
from langchain_huggingface import HuggingFaceEmbeddings

from app.database.database import EmbeddingStore
from app.services.ingestion import (
    chunk_exam_questions,
    extract_text_from_pdf,
    extract_text_from_pptx,
)


class VectorStoreManager:
    """Manages persistence and updates for a FAISS vectorstore in LangChain."""

    def __init__(
        self,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        persist_directory: str | Path | None = None,
        k: int = 5,
    ) -> None:
        if k < 1:
            raise ValueError("k must be at least 1")

        self.k = k
        self.embeddings = HuggingFaceEmbeddings(model_name=model_name)
        self.persist_directory = (
            Path(persist_directory)
            if persist_directory is not None
            else Path(__file__).resolve().parents[3] / "data" / "faiss"
        )
        self.vectorstore = self._load_or_create()

    def _load_or_create(self) -> FAISS | None:
        if self.persist_directory.exists():
            try:
                return FAISS.load_local(
                    str(self.persist_directory),
                    self.embeddings,
                    allow_dangerous_deserialization=True,
                )
            except Exception:
                return None
        return None

    def as_retriever(self, search_kwargs: dict[str, Any] | None = None) -> VectorStoreRetriever:
        """Returns a native LangChain VectorStoreRetriever with full LangSmith tracing."""
        if self.vectorstore is None:
            raise ValueError("Vectorstore is empty. Add documents before building a retriever.")
        
        kwargs = {"k": self.k}
        if search_kwargs:
            kwargs.update(search_kwargs)

        return self.vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs=kwargs,
        )

    def add_documents(self, documents: Sequence[Document]) -> None:
        if not documents:
            return

        if self.vectorstore is None:
            self.vectorstore = FAISS.from_documents(list(documents), self.embeddings)
        else:
            self.vectorstore.add_documents(list(documents))

        self.save()

    def add_texts(
        self,
        texts: Sequence[str],
        metadatas: Sequence[dict[str, Any]] | None = None,
    ) -> None:
        if not texts:
            return

        docs = [
            Document(page_content=text, metadata=meta or {})
            for text, meta in zip(texts, metadatas or [{}] * len(texts))
        ]
        self.add_documents(docs)

    def save(self) -> None:
        if self.vectorstore is None:
            return
        self.persist_directory.mkdir(parents=True, exist_ok=True)
        self.vectorstore.save_local(str(self.persist_directory))


class StudyPipeline:
    """Application workflow for ingestion, retrieval, and document listing."""

    def __init__(
        self,
        retriever: VectorStoreManager | None = None,
        embedding_store: EmbeddingStore | None = None,
    ) -> None:
        self.retriever = retriever or VectorStoreManager()
        self.embedding_store = embedding_store or EmbeddingStore()

    def ingest_text(
        self,
        text: str,
        metadata: dict[str, Any] | None = None,
    ) -> int:
        chunks = chunk_exam_questions(text)
        if not chunks:
            return 0

        chunk_metadata = [metadata or {} for _ in chunks]
        self.retriever.add_texts(chunks, metadatas=chunk_metadata)
        self.embedding_store.add_texts(chunks, metadatas=chunk_metadata)
        return len(chunks)

    def ingest_file(self, file_path: str, original_filename: str | None = None) -> int:
        path = Path(file_path)
        suffix = path.suffix.lower()

        if suffix == ".pdf":
            text = "\n\n".join(extract_text_from_pdf(path))
        elif suffix == ".pptx":
            text = "\n\n".join(extract_text_from_pptx(str(path)))
        elif suffix in {".txt", ".md"}:
            text = path.read_text(encoding="utf-8")
        else:
            raise ValueError(f"Unsupported document type: {suffix or 'unknown'}")

        source = original_filename or str(path)
        return self.ingest_text(text, metadata={"source": source})

    def retrieve(self, question: str) -> list[Document]:
        if self.retriever.vectorstore is None:
            return []
        return self.retriever.vectorstore.similarity_search(
            query=question,
            k=self.retriever.k,
        )

    def list_documents(self) -> list[dict[str, Any]]:
        return self.embedding_store.list_documents()


# --- Convenience Functions ---

def build_retriever(
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
    persist_directory: str | Path | None = None,
    k: int = 5,
) -> VectorStoreRetriever:
    """Factory function returning a native LangChain retriever."""
    manager = VectorStoreManager(
        model_name=model_name,
        persist_directory=persist_directory,
        k=k,
    )
    return manager.as_retriever()


def retrieve_documents(
    query: str,
    texts: Sequence[str],
    k: int = 5,
    metadatas: Sequence[dict[str, Any]] | None = None,
) -> list[Document]:
    """One-off retrieval function using a native LangChain retriever."""
    manager = VectorStoreManager(k=k)
    manager.add_texts(texts=texts, metadatas=metadatas)
    
    retriever = manager.as_retriever()
    return retriever.invoke(query)