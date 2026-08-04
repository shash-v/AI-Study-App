from fastapi import FastAPI

app = FastAPI(title="my-study-hud")

@app.get("/health")
def health():
    return {"status": "ok"}
