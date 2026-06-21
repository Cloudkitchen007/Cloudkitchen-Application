package com.cloudkitchen.order.event;

import com.cloudkitchen.order.model.Order;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderPlacedEvent(
        Long orderId,
        String customerEmail,
        String customerName,
        List<OrderItemEvent> items,
        BigDecimal totalAmount,
        String timestamp
) {

    public record OrderItemEvent(
            Long menuItemId,
            String name,
            Integer quantity,
            BigDecimal unitPrice
    ) {}

    public static OrderPlacedEvent from(Order order) {
        List<OrderItemEvent> items = order.getOrderItems().stream()
                .map(oi -> new OrderItemEvent(
                        oi.getMenuItem().getId(),
                        oi.getMenuItem().getName(),
                        oi.getQuantity(),
                        oi.getUnitPrice()
                ))
                .toList();

        return new OrderPlacedEvent(
                order.getId(),
                order.getCustomerEmail(),
                order.getCustomerName(),
                items,
                order.getTotalAmount(),
                LocalDateTime.now().toString()
        );
    }
}
