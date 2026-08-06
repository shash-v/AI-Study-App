from fastapi import FastAPI

app = FastAPI(title="Study HUD API")

# Add this endpoint:
@app.get("/")
def read_root():
    return {"message": "Study HUD API is running!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}