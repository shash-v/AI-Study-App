# backend/tests/test_ingestion.py
from pathlib import Path
from pypdf import PdfWriter

from app.services.ingestion.ingestion import (
    chunk_exam_questions,
    extract_text_from_pdf,
)

# example_pdf = "C:\Users\shash\Downloads\cs2620_exam_paper.pdf"
def test_extract_text_from_pdf_returns_pages(tmp_path):
    # Create a temporary PDF file inside pytest's isolated tmp_path
    pdf_file = tmp_path / "test_exam.pdf"

    # Write a blank PDF page to the temp file
    writer = PdfWriter()
    writer.add_blank_page(width=72, height=72)

    with pdf_file.open("wb") as f:
        writer.write(f)

    # Call your ingestion function passing the file path as a string
    pages = extract_text_from_pdf(str(pdf_file))

    assert isinstance(pages, list)
    assert len(pages) == 1


def test_chunk_exam_questions_splits_numbered_questions():
    text = (
        "Exam Paper\n"
        "Question 1: What is the capital of France?\n"
        "Question 2: What is 2 + 2?"
    )

    chunks = chunk_exam_questions(text)

    assert len(chunks) == 2
    assert "Question 1" in chunks[0]
    assert "Question 2" in chunks[1]