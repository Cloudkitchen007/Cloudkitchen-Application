from pydantic import BaseModel
from typing import List, Optional

class FoodItem(BaseModel):
    id: str
    name: str
    description: str
    ingredients: List[str]
    category: str
    dietary_tags: List[str]
    price: Optional[float] = None

class UserProfile(BaseModel):
    user_id: str
    preferences: List[str] = []
    allergies: List[str] = []

class RecommendationRequest(BaseModel):
    user_id: str
    query: Optional[str] = "I'm hungry, recommend me something."
    top_k: Optional[int] = 3

class QuickRecommendRequest(BaseModel):
    query: str = "I'm hungry, recommend me something."
    preferences: List[str] = []
    allergies: List[str] = []
    top_k: int = 3

class RecommendationResult(BaseModel):
    food_item: FoodItem
    reason: str

class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: List[RecommendationResult]

class ForecastItem(BaseModel):
    id: str
    name: str
    kitchen: str
    inventory: int
    predicted_demand: int

class ForecastInsight(BaseModel):
    id: str
    name: str
    kitchen: str
    inventory: int
    predicted_demand: int
    risk: str
    action: str
    insight: str

class ForecastRequest(BaseModel):
    items: List[ForecastItem]

class ForecastResponse(BaseModel):
    insights: List[ForecastInsight]
