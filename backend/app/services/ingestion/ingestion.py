import re # For regular expressions.
import requests
from bs4 import BeautifulSoup
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader


def is_exam_paper(text: str) -> bool:
    lowered = text.lower()
    exam_markers = ["exam", "question", "answer all questions", "paper", "section"]
    return sum(marker in lowered for marker in exam_markers) >= 2


def chunk_exam_questions(text: str):
    if not text:
        return []

    # Clean horizontal whitespace while preserving actual line breaks
    normalized = re.sub(r"[ \t]+", " ", text).strip()

    if not is_exam_paper(normalized):
        # If we don't have an exam paper then we recursively split the text into chunks of 800 characters with 100 character overlap.
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=100,
            separators=["\n\n", "\n", " ", ""],
        )
        return splitter.split_text(normalized)

    # Matches patterns at the start of lines or newlines:
    # 1) "Question 1", "Q1", "Q.1"
    # 2) "1.", "2. (a)", "3(b)", "4 (c)"
    question_pattern = re.compile(
        r"(?m)(?:^|\n)\s*(?:"
        r"(?:question|q)\s*\.?\s*\d+(?:\s*[\(\[]?[a-z][\)\].]?)?|"  # e.g., Question 1, Q1(a), Q.2
        r"\d+\s*[\.\)]?\s*(?:[\(\[]?[a-z][\)\].]?)?"                 # e.g., 2. (a), 1., 3(b)
        r")\b",
        re.IGNORECASE
    )

    matches = list(question_pattern.finditer(normalized))

    if len(matches) < 2:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=100,
            separators=["\n\n", "\n", " ", ""],
        )
        return splitter.split_text(normalized)

    chunks = []
    for idx, match in enumerate(matches):
        # Strip leading newline if the regex captured it
        start = match.start()
        if normalized[start] == "\n":
            start += 1

        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(normalized)
        chunk = normalized[start:end].strip()
        if chunk:
            chunks.append(chunk)

    return chunks
    if not text:
        return []

    normalized = re.sub(r"\s+", " ", text).strip()


    question_pattern = re.compile(r"(?i)\b(question\s*\d+|q\s*\d+)\b")
    matches = list(question_pattern.finditer(normalized))

    if len(matches) < 2:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=100,
            separators=["\n\n", "\n", " ", ""],
        )
        return splitter.split_text(normalized)

    chunks = []
    for idx, match in enumerate(matches):
        start = match.start()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(normalized)
        chunk = normalized[start:end].strip()
        if chunk:
            chunks.append(chunk)

    return chunks


def extract_chunks_from_exam_paper (file_path):
    pages = extract_text_from_pdf(file_path)
    text = "\n\n".join(page or "" for page in pages if page)
    return chunk_exam_questions(text)


# Returns an array of strings, each string is the text of a page in the PDF.
def extract_text_from_pdf(file_path):
    reader = PdfReader(file_path)
    pages = []
    for page in reader.pages:
        pages.append(page.extract_text())
    return pages


def extract_text_from_web(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")
    text = soup.get_text()
    return text


def extract_text_from_pptx(file_path: str) -> list[str]:
    """Extracts text slide by slide from PowerPoint files."""
    prs = Presentation(file_path)
    slides_text = []
    for slide in prs.slides:
        slide_text = []
        for shape in slide.shapes:
            if hasattr(shape, "text"):
                slide_text.append(shape.text)
        slides_text.append("\n".join(slide_text))
    return slides_text
