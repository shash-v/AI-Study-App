from fastapi import APIRouter

from app.services.retrieval import LangChainRetriever

router = APIRouter()


@router.get("/")
def read_root():
    return {"message": "Study HUD API is running!"}


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.post("/search")
def search_documents(query: str):
    retriever = LangChainRetriever()
    results = retriever.search(query, k=5)
    return {"query": query, "results": [doc.page_content for doc in results]}
