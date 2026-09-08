# StudyAssistant

A lightweight AI study workspace for uploading course material, extracting knowledge, and asking questions over your notes.

## What it includes

- Document upload and study material ingestion
- OCR/text extraction for PDFs and image-based content
- Retrieval-augmented Q&A over indexed study notes
- A browser-style dashboard for searching and reviewing material
- Pomodoro and focused-study UI support

## Stack

- Backend: FastAPI, Python
- Frontend: React + Vite
- Desktop shell: Tauri
- Retrieval: FAISS / Chroma + embeddings
- AI: Gemini + LangSmith tracing

## Local setup

1. Create your environment file from the example:
   ```bash
   copy .env.example .env
   ```

2. Fill in the required values in `.env`, especially:
   - `GEMINI_API_KEY`
   - `LANGSMITH_API_KEY` if tracing is enabled

3. Install backend dependencies:
   ```bash
   cd backend
   uv sync
   ```

4. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

5. Run the app from the project root:
   ```bash
   cd ..
   npm run dev
   ```

This starts the backend and Tauri desktop app together.

## Notes

- The API runs on port `8000` by default.
- The root `.env` file is loaded by the backend during startup.
- OCR tooling such as Tesseract may need to be installed on the machine separately.
