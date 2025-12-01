package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    
    // 1. Tìm kiếm thuốc cho kê đơn (chỉ thuốc còn hàng và đang active)
    @Query("SELECT m FROM Medicine m WHERE m.status = 'ACTIVE' AND m.stockQuantity > 0 " +
           "AND (LOWER(m.medicineName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(m.medicineCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(m.activeIngredient) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(m.category) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Medicine> searchMedicinesForPrescription(@Param("keyword") String keyword);
    
    // 2. Lấy tất cả thuốc còn hàng để hiển thị
    @Query("SELECT m FROM Medicine m WHERE m.status = 'ACTIVE' AND m.stockQuantity > 0")
    List<Medicine> findAllAvailableMedicines();
    
    // 3. Lấy thuốc theo danh mục (để filter)
    @Query("SELECT m FROM Medicine m WHERE m.status = 'ACTIVE' AND m.stockQuantity > 0 " +
           "AND (:category = 'Tất cả' OR m.category = :category)")
    List<Medicine> findAvailableMedicinesByCategory(@Param("category") String category);
    
    // 4. Kiểm tra và lấy thông tin thuốc theo ID (cho kiểm tra tồn kho)
    Optional<Medicine> findByIdAndStatusAndStockQuantityGreaterThan(
        Long id, String status, Integer minStock);
    
    // 5. Lấy danh sách các danh mục thuốc (cho dropdown filter)
    @Query("SELECT DISTINCT m.category FROM Medicine m WHERE m.status = 'ACTIVE' " +
           "AND m.category IS NOT NULL AND m.stockQuantity > 0")
    List<String> findAvailableCategories();
}