from datetime import datetime, timezone
import logging
from pathlib import Path
import shutil
import tempfile
import traceback
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.services.pipeline import StudyPipeline

router = APIRouter()
pipeline = StudyPipeline()
logger = logging.getLogger("uvicorn.error")


class SearchRequest(BaseModel):
    query: str
    k: int = 5


@router.get("/")
def read_root():
    return {"message": "Study HUD API is running!"}


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.post("/search")
def search_documents(request: SearchRequest):
    documents = pipeline.retrieve(request.query)
    return {
        "query": request.query,
        "results": [
            {"text": document.page_content, "metadata": document.metadata}
            for document in documents[: request.k]
        ],
    }

@router.post("/analyze-screen")
async def analyze_screen(image: UploadFile = File(...)):
    from app.services.ocr.ocr import extract_text_from_image

    temp_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
            shutil.copyfileobj(image.file, temp_file)
            temp_path = temp_file.name

        ocr_result = extract_text_from_image(temp_path, crop_top_pct=0)
        text = ocr_result.get("text", "")
        documents = pipeline.retrieve(text) if text else []

        return {
            "text": text,
            "regions": ocr_result.get("regions", []),
            "matches": [
                {"text": document.page_content, "metadata": document.metadata}
                for document in documents
            ],
        }
    except Exception as exc:
        logger.error("Error in /analyze-screen:\n%s", traceback.format_exc())
        raise HTTPException(
            status_code=500, detail=f"Screen analysis failed: {exc}"
        ) from exc
    finally:
        if temp_path:
            Path(temp_path).unlink(missing_ok=True)

@router.get("/all-documents")
def get_all_documents():
    documents = pipeline.list_documents()
    return {"documents": documents}


@router.delete("/documents/{document_id}")
def delete_document(document_id: str):
    if not pipeline.delete_document(document_id):
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully"}


@router.post("/upload")
async def upload_document(files: UploadFile = File(...)):
    total_chunks = 0
    try:
        suffix = Path(files.filename).suffix if files.filename else ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            shutil.copyfileobj(files.file, temp_file)
            temp_path = temp_file.name

        try:
            chunks_added = pipeline.ingest_file(
                temp_path,
                original_filename=files.filename,
                size_bytes=Path(temp_path).stat().st_size,
                uploaded_at=datetime.now(timezone.utc).isoformat(),
            )
            total_chunks += chunks_added
        finally:
            Path(temp_path).unlink(missing_ok=True)

        return {
            "message": "Successfully uploaded and indexed file.",
            "total_chunks_added": total_chunks,
        }
    except Exception as e:
        logger.error("Error in /upload:\n%s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e)) from e