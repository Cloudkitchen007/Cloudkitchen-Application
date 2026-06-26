from typing import List
from app.models import FoodItem, UserProfile

def filter_food_items(user: UserProfile, all_items: List[FoodItem]) -> List[FoodItem]:
    """
    Applies strict rule-based filtering to ensure safety and adherence to dietary preferences.
    """
    filtered_items = []
    
    for item in all_items:
        is_safe = True
        
        
        for allergy in user.allergies:
            if allergy in item.dietary_tags:
                is_safe = False
                break
                
        if not is_safe:
            continue
            
      
        if "vegetarian" in user.preferences:
            if "vegetarian" not in item.dietary_tags and "vegan" not in item.dietary_tags:
                is_safe = False
                
        if "vegan" in user.preferences:
            if "vegan" not in item.dietary_tags:
                is_safe = False
                
        if is_safe:
            filtered_items.append(item)
            
    return filtered_items
