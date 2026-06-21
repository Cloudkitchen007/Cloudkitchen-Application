package com.cloudkitchen.menu.controller;

import com.cloudkitchen.menu.dto.ApiResponse;
import com.cloudkitchen.menu.model.MenuItem;
import com.cloudkitchen.menu.service.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MenuItem>>> getAllMenuItems() {
        return ResponseEntity.ok(
                ApiResponse.success(menuService.getAllAvailableItems(), "Menu items fetched successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MenuItem>> getMenuItemById(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success(menuService.getItemById(id), "Menu item fetched successfully"));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ApiResponse<List<MenuItem>>> getItemsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(
                ApiResponse.success(menuService.getItemsByCategory(categoryId), "Items by category fetched successfully"));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<MenuItem>>> searchMenu(@RequestParam String keyword) {
        return ResponseEntity.ok(
                ApiResponse.success(menuService.searchItems(keyword), "Search results fetched successfully"));
    }

    @GetMapping("/veg")
    public ResponseEntity<ApiResponse<List<MenuItem>>> getVegItems() {
        return ResponseEntity.ok(
                ApiResponse.success(menuService.getVegItems(), "Veg items fetched successfully"));
    }
}
