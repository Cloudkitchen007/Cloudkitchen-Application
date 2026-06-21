# CloudKitchen AI Recommender System

This is a lightweight, low-cost AI food recommendation microservice built with FastAPI, LangChain, ChromaDB, and Hugging Face models.

## Architecture Highlights
- **Rule-Based Filtering:** Ensures dietary restrictions and allergies are strictly respected *before* AI processing.
- **RAG & Vector Search:** Uses `all-MiniLM-L6-v2` and ChromaDB to find semantically relevant menu items.
- **LLM Reasoning:** Uses `google/flan-t5-small` to explain *why* the food is a good recommendation. Completely CPU-friendly.

## Local Setup Instructions

1. **Create Virtual Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Server:**
   ```bash
   uvicorn app.main:app --reload
   ```

4. **Access the API Docs:**
   Open your browser to: `http://localhost:8000/docs`

## Test the System

### 1. Update User Preferences
```bash
curl -X POST "http://localhost:8000/update_user_preferences" \
     -H "Content-Type: application/json" \
     -d '{
           "user_id": "u1",
           "preferences": ["vegetarian"],
           "allergies": ["contains_dairy"]
         }'
```

### 2. Get Recommendations
```bash
curl -X POST "http://localhost:8000/recommend" \
     -H "Content-Type: application/json" \
     -d '{
           "user_id": "u1",
           "query": "I want something healthy and fresh",
           "top_k": 2
         }'
```

Because user `u1` is vegetarian and lactose intolerant (allergic to dairy), the system will:
1. Strip out `Chicken Curry` (not vegetarian)
2. Strip out `Paneer Butter Masala` and `Cheese Garlic Bread` (contains dairy)
3. Run the vector search on the remaining items (`Vegan Tofu Salad` and `Veg Biryani`) and have the LLM explain why they are good matches!
