
from sentence_transformers import SentenceTransformer



def embed_sentences(sentences: list[str]) -> list[float]:
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    # NOTE: This model truncates input text longer than 256 word pieces.


    embeddings = model.encode(sentences)
    print("Embeddings:", embeddings)
    print("Embeddings shape:", embeddings.shape)
    return embeddings

    