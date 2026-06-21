package com.cloudkitchen.order.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Data
public class OrderRequest {

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String customerEmail;

    @NotBlank(message = "Phone number is required")
    private String customerPhone;

    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;

    private String paymentMethod = "CASH_ON_DELIVERY";
    private String specialNotes;

    @NotEmpty(message = "Order must have at least one item")
    private List<OrderItemRequest> items;
}
