from app.database.database import EmbeddingStore


def test_add_and_get_by_id():
    store = EmbeddingStore(collection_name="test-store")

    texts = ["python basics", "exam revision"]
    embeddings = [
        [0.1, 0.2, 0.3],
        [0.2, 0.3, 0.4],
    ]

    store.add_embeddings(texts=texts, embeddings=embeddings, ids=["a", "b"])

    item = store.get_by_id("a")
    assert item is not None
    assert item["text"] == "python basics"
    assert item["id"] == "a"


def test_query_returns_highest_similarity_first():
    store = EmbeddingStore(collection_name="test-store-query")

    texts = ["cat", "dog", "vehicle"]
    embeddings = [
        [1.0, 0.0],
        [0.9, 0.1],
        [0.0, 1.0],
    ]

    store.add_embeddings(texts=texts, embeddings=embeddings, ids=["1", "2", "3"])

    results = store.query([0.95, 0.05], n_results=2)

    assert len(results) == 2
    assert results[0]["id"] == "1"
    assert results[1]["id"] == "2"


def test_delete_removes_item():
    store = EmbeddingStore(collection_name="test-store-delete")

    store.add_embeddings(
        texts=["one", "two"],
        embeddings=[[0.1, 0.2], [0.3, 0.4]],
        ids=["x", "y"],
    )

    store.delete(["x"])

    assert store.get_by_id("x") is None
    assert store.get_by_id("y") is not None
