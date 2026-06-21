package com.cloudkitchen.order.repository;

import com.cloudkitchen.order.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// Read-only access to menu_items — used only for price lookup during order placement.
// All writes to this table go through menu-service.
@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
}
