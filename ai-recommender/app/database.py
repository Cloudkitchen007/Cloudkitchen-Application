import json
import os
from typing import List, Dict, Optional
from app.models import FoodItem, UserProfile

# Mock Database
class MockDatabase:
    def __init__(self):
        self.food_items: Dict[str, FoodItem] = {}
        self.users: Dict[str, UserProfile] = {}
        self._load_initial_data()

    def _load_initial_data(self):
        # Load sample menu
        data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'sample_menu.json')
        if os.path.exists(data_path):
            with open(data_path, 'r') as f:
                items = json.load(f)
                for item in items:
                    self.food_items[item['id']] = FoodItem(**item)
                    
        # Load synthetic user
        self.users["u1"] = UserProfile(
            user_id="u1",
            preferences=["vegetarian"],
            allergies=["contains_dairy"] # Means lactose intolerant
        )

    def get_all_food(self) -> List[FoodItem]:
        return list(self.food_items.values())

    def get_food_by_id(self, food_id: str) -> Optional[FoodItem]:
        return self.food_items.get(food_id)

    def get_user(self, user_id: str) -> Optional[UserProfile]:
        return self.users.get(user_id)

    def update_user(self, user_id: str, preferences: List[str], allergies: List[str]):
        if user_id in self.users:
            self.users[user_id].preferences = preferences
            self.users[user_id].allergies = allergies
        else:
            self.users[user_id] = UserProfile(user_id=user_id, preferences=preferences, allergies=allergies)

db = MockDatabase()
