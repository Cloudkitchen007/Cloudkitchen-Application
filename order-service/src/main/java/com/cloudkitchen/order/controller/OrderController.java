package com.cloudkitchen.order.controller;

import com.cloudkitchen.order.dto.ApiResponse;
import com.cloudkitchen.order.dto.OrderRequest;
import com.cloudkitchen.order.model.Order;
import com.cloudkitchen.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<ApiResponse<Order>> placeOrder(@Valid @RequestBody OrderRequest request) {
        Order order = orderService.placeOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(order, "Order placed successfully!"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Order>> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success(orderService.getOrderById(id), "Order fetched successfully"));
    }

    @GetMapping("/track")
    public ResponseEntity<ApiResponse<List<Order>>> trackOrders(@RequestParam String email) {
        return ResponseEntity.ok(
                ApiResponse.success(orderService.getOrdersByEmail(email), "Orders fetched successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Order>>> getAllOrders() {
        return ResponseEntity.ok(
                ApiResponse.success(orderService.getAllOrders(), "All orders fetched successfully"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Order>> updateStatus(
            @PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(
                ApiResponse.success(orderService.updateOrderStatus(id, status), "Order status updated successfully"));
    }
}
