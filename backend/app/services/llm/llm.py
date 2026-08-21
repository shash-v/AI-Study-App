import os

from google import genai
from dotenv import load_dotenv

load_dotenv()
model = "gemini-3.1-flash-lite"


def llm_query(question: str, context: str) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set in environment")

    prompt = (
        "Answer the question using only the provided study context. "
        "If the context does not contain the answer, say so.\n\n"
        f"Question:\n{question}\n\nContext:\n{context}"
    )

    client = genai.Client(api_key=api_key)
    interaction = client.interactions.create(
        model=model,
        input=prompt
    )

    return interaction.output_text
