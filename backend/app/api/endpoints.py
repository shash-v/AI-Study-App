from fastapi import APIRouter

from pydantic import BaseModel

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
