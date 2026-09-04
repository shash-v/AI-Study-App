from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
from typing import List
import shutil
from pathlib import Path
import tempfile
from datetime import datetime, timezone

from app.services.pipeline import StudyPipeline

router = APIRouter()
pipeline = StudyPipeline()


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
        # for file in files:
        file = files
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name

        try:
            # Passes original filename so your metadata stays clean
            chunks_added = pipeline.ingest_file(
                temp_path,
                original_filename=file.filename,
                size_bytes=Path(temp_path).stat().st_size,
                uploaded_at=datetime.now(timezone.utc).isoformat(),
            )
            total_chunks += chunks_added
        finally:
            Path(temp_path).unlink(missing_ok=True)

        return {
            "message": f"Successfully uploaded and indexed  file(s).",## {len(files)}
            "total_chunks_added": total_chunks
        }
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(error_detail)  # Force print to console
        raise HTTPException(status_code=500, detail=str(e))