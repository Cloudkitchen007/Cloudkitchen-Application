package com.cloudkitchen.menu.repository;

import com.cloudkitchen.menu.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findByIsAvailableTrue();

    List<MenuItem> findByCategoryIdAndIsAvailableTrue(Long categoryId);

    @Query("SELECT m FROM MenuItem m WHERE m.isAvailable = true AND " +
           "(LOWER(m.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(m.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<MenuItem> searchByKeyword(String keyword);

    List<MenuItem> findByIsVegTrueAndIsAvailableTrue();
}
