import os
from typing import Sequence

from google import genai
from dotenv import load_dotenv
from app.observability.tracing import traced

load_dotenv()
model = "gemini-3.1-flash-lite"


@traced("llm.gemini_query")
def llm_query(
    question: str,
    context: str = "",
    grounded: bool = True,
    history: Sequence[dict[str, str]] | None = None,
) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set in environment")

    conversation = "\n".join(
        f"{turn.get('role', 'user').title()}: {turn.get('content', '')}"
        for turn in (history or [])[-12:]
    )
    conversation_section = f"Conversation so far:\n{conversation}\n\n" if conversation else ""

    if grounded:
        prompt = (
            "You are a study assistant with conversation memory. "
            "Answer the latest user message using the conversation so far and the study context. "
            "For follow-up requests such as rewrite, summarize, simplify, expand, or explain that, "
            "operate on the relevant previous assistant answer instead of claiming that history is unavailable. "
            "Use the study context to support factual claims, but do not force unrelated retrieved text into a rewrite. "
            "If a new factual answer is not supported by the study context, say so clearly. "
            "Do not invent citations or facts.\n\n"
            f"{conversation_section}Latest user message:\n{question}\n\nStudy context:\n{context}"
        )
    else:
        prompt = (
            "You are a helpful AI study assistant with conversation memory. "
            "Answer the latest user message clearly and concisely. "
            "For follow-up requests, use the relevant previous messages instead of claiming history is unavailable. "
            "When useful, structure the explanation with short sections or bullets.\n\n"
            f"{conversation_section}Latest user message:\n{question}"
        )

    client = genai.Client(api_key=api_key)
    interaction = client.interactions.create(
        model=model,
        input=prompt
    )

    return interaction.output_text
