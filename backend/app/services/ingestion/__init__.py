from .ingestion import (
    extract_text_from_pdf,
    extract_text_from_web,
    is_exam_paper,
    extract_chunks_from_exam_paper,
)

__all__ = [
    "extract_chunks_from_exam_paper",
    "extract_text_from_pdf",
    "extract_text_from_web",
    "is_exam_paper",
]
