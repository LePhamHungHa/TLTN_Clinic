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
    
    // Tìm thuốc theo mã
    Optional<Medicine> findByMedicineCode(String medicineCode);
    
    // Tìm thuốc theo tên (tìm kiếm không phân biệt hoa thường)
    List<Medicine> findByMedicineNameContainingIgnoreCase(String medicineName);
    
    // Tìm thuốc theo danh mục
    List<Medicine> findByCategory(String category);
    
    // Tìm thuốc theo trạng thái
    List<Medicine> findByStatus(String status);
    
    // Tìm thuốc còn hàng
    @Query("SELECT m FROM Medicine m WHERE m.status = 'ACTIVE' AND m.stockQuantity > 0")
    List<Medicine> findAvailableMedicines();
    
    // Tìm thuốc sắp hết hàng
    @Query("SELECT m FROM Medicine m WHERE m.stockQuantity <= m.minStockLevel")
    List<Medicine> findLowStockMedicines();
    
    // Tìm thuốc theo nhiều tiêu chí
    @Query("SELECT m FROM Medicine m WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(m.medicineCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(m.medicineName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(m.activeIngredient) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:category IS NULL OR :category = '' OR m.category = :category) AND " +
           "(:status IS NULL OR :status = '' OR m.status = :status)")
    List<Medicine> searchMedicines(@Param("keyword") String keyword,
                                   @Param("category") String category,
                                   @Param("status") String status);
    
    // Lấy danh sách danh mục duy nhất
    @Query("SELECT DISTINCT m.category FROM Medicine m WHERE m.category IS NOT NULL")
    List<String> findDistinctCategories();
}