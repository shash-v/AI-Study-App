from __future__ import annotations

from pathlib import Path
from typing import Any

from langchain_core.documents import Document

from app.services.ingestion import (
    chunk_exam_questions,
    extract_text_from_pdf,
    extract_text_from_pptx,
)
from app.services.retrieval import LangChainRetriever
from langsmith import traceable


class StudyPipeline:
    """Application workflow for ingestion and retrieval-backed questions."""

    def __init__(self, retriever: LangChainRetriever | None = None) -> None:
        self.retriever = retriever or LangChainRetriever()

    @traceable
    def ingest_text(
        self,
        text: str,
        metadata: dict[str, Any] | None = None,
    ) -> int:
        chunks = chunk_exam_questions(text)
        if not chunks:
            return 0

        self.retriever.add_texts(chunks, metadatas=[metadata or {} for _ in chunks])
        return len(chunks)

    @traceable
    def ingest_file(self, file_path: str, original_filename: str = None) -> int:
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
        

        return self.ingest_text(text, metadata={"source": str(path)})
    
    
    @traceable
    def retrieve(self, question: str) -> list[Document]:
        return self.retriever.invoke(question)
