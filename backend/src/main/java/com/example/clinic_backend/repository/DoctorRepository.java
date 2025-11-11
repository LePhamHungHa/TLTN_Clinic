package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    
    // Lấy tất cả bác sĩ kèm thông tin department
    @Query("SELECT d FROM Doctor d LEFT JOIN FETCH d.department")
    List<Doctor> findAllWithDepartment();
    
    // Tìm bác sĩ theo departmentId
    List<Doctor> findByDepartmentId(Long departmentId);
    
    // Tìm bác sĩ theo tên
    List<Doctor> findByFullNameContainingIgnoreCase(String fullName);
    
    // Tìm bác sĩ theo tên khoa
    @Query("SELECT d FROM Doctor d LEFT JOIN FETCH d.department WHERE d.department.departmentName LIKE %:departmentName%")
    List<Doctor> findByDepartmentNameContaining(@Param("departmentName") String departmentName);
    
    // Tìm bác sĩ theo email
    Optional<Doctor> findByEmail(String email);
    
    // Tìm bác sĩ theo phone
    Optional<Doctor> findByPhone(String phone);
    
    // Kiểm tra tồn tại theo email
    boolean existsByEmail(String email);
    
    // Kiểm tra tồn tại theo phone
    boolean existsByPhone(String phone);
    
    // Tìm bác sĩ theo userId
    Optional<Doctor> findByUserId(Long userId);
}