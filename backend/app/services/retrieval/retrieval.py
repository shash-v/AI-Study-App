from __future__ import annotations

from pathlib import Path
from typing import Any, Sequence

from langchain_community.vectorstores import FAISS
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_huggingface import HuggingFaceEmbeddings


class LangChainRetriever(BaseRetriever):
    """A LangChain retriever built on FAISS and HuggingFace embeddings with LangSmith tracing support."""

    model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    k: int = 5
    persist_directory: Path | None = None
    embeddings: HuggingFaceEmbeddings | None = None
    vectorstore: FAISS | None = None

    def __init__(
        self,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        persist_directory: str | Path | None = None,
        k: int = 5,
    ) -> None:
        super().__init__()
        if k < 1:
            raise ValueError("k must be at least 1")

        self.model_name = model_name
        self.embeddings = HuggingFaceEmbeddings(model_name=model_name)
        self.k = k
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

    def _get_relevant_documents(
        self,
        query: str,
        *,
        run_manager: CallbackManagerForRetrieverRun | None = None,
    ) -> list[Document]:
        """Retrieve documents relevant to a query. This method is called by LangSmith for tracing."""
        if self.vectorstore is None:
            return []
        return self.vectorstore.similarity_search(query=query, k=self.k)

    def add_texts(
        self,
        texts: Sequence[str],
        metadatas: Sequence[dict[str, Any]] | None = None,
    ) -> None:
        if not texts:
            return

        metadata_list = metadatas or [{} for _ in texts]
        if len(metadata_list) != len(texts):
            raise ValueError("texts and metadatas must be the same length")

        docs = [
            Document(page_content=text, metadata=metadata or {})
            for text, metadata in zip(texts, metadata_list)
        ]

        if self.vectorstore is None:
            self.vectorstore = FAISS.from_documents(docs, self.embeddings)
        else:
            self.vectorstore.add_documents(docs)

        self.save()

    def add_documents(self, documents: Sequence[Document]) -> None:
        if not documents:
            return

        if self.vectorstore is None:
            self.vectorstore = FAISS.from_documents(list(documents), self.embeddings)
        else:
            self.vectorstore.add_documents(list(documents))

        self.save()

    def search(self, query: str, k: int | None = None) -> list[Document]:
        """Compatibility wrapper that routes through invoke() for LangSmith tracing."""
        if k is None or k == self.k:
            return self.invoke(query)

        return self.vectorstore.similarity_search(query=query, k=k) if self.vectorstore else []

    def save(self) -> None:
        if self.vectorstore is None:
            return

        self.persist_directory.mkdir(parents=True, exist_ok=True)
        self.vectorstore.save_local(str(self.persist_directory))


def build_retriever(
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
    persist_directory: str | Path | None = None,
    k: int = 5,
) -> LangChainRetriever:
    """Factory function to create a LangChainRetriever instance."""
    return LangChainRetriever(
        model_name=model_name,
        persist_directory=persist_directory,
        k=k,
    )


def retrieve_documents(
    query: str,
    texts: Sequence[str],
    k: int = 5,
    metadatas: Sequence[dict[str, Any]] | None = None,
) -> list[Document]:
    """Convenience function for one-off retrieval. For tracing, use invoke() on the retriever directly."""
    retriever = LangChainRetriever(k=k)
    retriever.add_texts(texts=texts, metadatas=metadatas)
    return retriever.invoke(query)

