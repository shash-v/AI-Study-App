from pathlib import Path
import app.services.ocr as ocr
# from app.services.ingestion import extract_chunks_from_exam_paper, extract_text_from_pdf
# from app.services.vector_store import embed_sentences

# pdf_path = Path(r"C:\Users\shash\Downloads\cs2620_exam_paper.pdf")

# if not pdf_path.exists():
#     print(f"Error: File not found at {pdf_path}")
# else:
#     # 1. Run full PDF extraction + question chunking pipeline
#     chunks = extract_chunks_from_exam_paper(str(pdf_path))

#     # 2. Extract raw pages to check total count
#     pages = extract_text_from_pdf(str(pdf_path))

#     # 3. Generate embeddings for the extracted chunks
#     embeddings = embed_sentences(chunks)

#     print(f"\n Total Pages Extracted: {len(pages)}")
#     print(f" Total Chunks Created: {len(chunks)}")
#     print(f" Total Embeddings Generated: {len(embeddings)}\n")
#     print("=" * 60)

#     for i, chunk in enumerate(chunks, 1):
#         print(f"\n--- [ CHUNK {i} ] ---")
#         print(chunk)
#         print("-" * 60)

