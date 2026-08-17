from fastapi import FastAPI

from app.api.endpoints import router as api_router

app = FastAPI(title="Study HUD API")
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Study HUD API is running!"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

