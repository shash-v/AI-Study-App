from fastapi import FastAPI
from app.api.endpoints import router as api_router

app = FastAPI(title="Study HUD API")

# Register the routes from endpoints.py under the "/api" prefix
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Study HUD API is running!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}