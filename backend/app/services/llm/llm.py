import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY not set in environment")

client = genai.Client(api_key=api_key)

def main():
    interaction = client.interactions.create(
        model="gemini-3.1-flash-lite",
        input="How does AI work?"
    )
    print(interaction.output_text)


if __name__ == "__main__":
    main()