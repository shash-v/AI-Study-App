import os
from google import genai
from dotenv import load_dotenv
load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY not set in environment")

client = genai.Client(api_key=api_key)
model = "gemini-3.1-flash-lite"

def llm_query(ocr_text, vector_store, top_k=3):
    # Create a prompt for the LLM
    prompt = f"Read through these study notes and assert the relevance of this information with relation to the context:\n\n{ocr_text}\n\nContext:\n{vector_store}"

    # Query the LLM
    interaction = client.interactions.create(
        model=model,
        input=prompt
    )

    return interaction.output_text
