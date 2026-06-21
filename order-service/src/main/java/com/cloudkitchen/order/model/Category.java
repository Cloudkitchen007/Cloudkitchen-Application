package com.cloudkitchen.order.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

// Read-only in order-service — menu-service owns this table.
// No menuItems collection here to avoid loading the full menu on every order.
@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;
    private String icon;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
