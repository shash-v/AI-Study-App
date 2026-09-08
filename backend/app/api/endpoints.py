from datetime import datetime, timezone
import logging
import re
from pathlib import Path
import shutil
import tempfile
import traceback
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.services.pipeline import StudyPipeline
from app.observability.tracing import traced
from app.services.llm.llm import llm_query

router = APIRouter()
pipeline = StudyPipeline()
logger = logging.getLogger("uvicorn.error")


class SearchRequest(BaseModel):
    query: str
    k: int = 5


class ChatRequest(BaseModel):
    message: str
    rag: bool = False
    k: int = 5
    history: list[dict[str, str]] = Field(default_factory=list)


def normalize_chat_history(history: list[dict[str, str]]) -> list[dict[str, str]]:
    return [
        {
            "role": turn["role"],
            "content": turn["content"].strip(),
        }
        for turn in history[-12:]
        if turn.get("role") in {"user", "assistant"}
        and turn.get("content", "").strip()
    ]


@traced("screen.analyze")
def analyze_screen_file(file_path: str) -> dict:
    """Run OCR and retrieval for a temporary screenshot without tracing its contents."""
    from app.services.ocr.ocr import extract_text_from_image

    ocr_result = extract_text_from_image(file_path, crop_top_pct=0)
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


@router.post("/chat")
@traced("chat.answer")
def chat(request: ChatRequest):
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if request.k < 1 or request.k > 20:
        raise HTTPException(status_code=400, detail="k must be between 1 and 20")

    history = normalize_chat_history(request.history)
    recent_context = "\n".join(
        f"{turn['role']}: {turn['content']}"
        for turn in history[-6:]
    )
    retrieval_query = f"{recent_context}\nuser: {message}" if recent_context else message
    is_conversation_edit = bool(
        history and re.search(
            r"\b(rewrite|rephrase|shorten|shorter|concise|simplify|summarize|expand|elaborate|last answer|last question|previous answer|previous question|that answer|that)\b",
            message.lower(),
        )
    )
    documents = (
        pipeline.retrieve(retrieval_query)[: request.k]
        if request.rag and not is_conversation_edit
        else []
    )
    used_rag = bool(request.rag and documents)
    context = "\n\n---\n\n".join(document.page_content for document in documents)
    answer = llm_query(message, context=context, grounded=used_rag, history=history)

    return {
        "answer": answer,
        "rag": used_rag,
        "sources": [
            {"text": document.page_content, "metadata": document.metadata}
            for document in documents
        ],
    }

@router.post("/analyze-screen")
async def analyze_screen(image: UploadFile = File(...)):
    temp_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
            shutil.copyfileobj(image.file, temp_file)
            temp_path = temp_file.name

        return analyze_screen_file(temp_path)
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