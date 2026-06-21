import chromadb
from typing import List
from sentence_transformers import SentenceTransformer
from app.models import FoodItem


class VectorStore:
    def __init__(self):
        self.chroma_client = chromadb.Client()
        self.collection    = self.chroma_client.create_collection(name="food_menu")
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.is_initialized  = False

    def initialize_db(self, food_items: List[FoodItem]):
        """Embed and index every menu item into ChromaDB on startup."""
        if self.is_initialized or not food_items:
            return

        docs, metadatas, ids, embeddings = [], [], [], []

        for item in food_items:
            # Rich text surface for semantic search: name + description + ingredients
            text = (
                f"Name: {item.name}. "
                f"Description: {item.description}. "
                f"Ingredients: {', '.join(item.ingredients)}. "
                f"Category: {item.category}. "
                f"Tags: {', '.join(item.dietary_tags)}."
            )
            docs.append(text)
            metadatas.append({"name": item.name, "category": item.category})
            ids.append(item.id)

        vectors = self.embedding_model.encode(docs).tolist()
        self.collection.add(embeddings=vectors, documents=docs, metadatas=metadatas, ids=ids)
        self.is_initialized = True

    def search(self, query: str, safe_food_ids: List[str], top_k: int = 3) -> List[str]:
        """
        Embed the query and return the top-k semantically closest items,
        restricted to safe_food_ids (already filtered by the rule layer).
        """
        if not safe_food_ids:
            return []

        query_vector = self.embedding_model.encode([query]).tolist()

        # Retrieve enough candidates to cover the safe-food subset, then intersect.
        raw = self.collection.query(
            query_embeddings=query_vector,
            n_results=min(len(safe_food_ids) + 20, self.collection.count()),
        )

        ranked = []
        for item_id in (raw["ids"][0] if raw and raw["ids"] else []):
            if item_id in safe_food_ids:
                ranked.append(item_id)
            if len(ranked) == top_k:
                break

        return ranked


vector_store = VectorStore()
