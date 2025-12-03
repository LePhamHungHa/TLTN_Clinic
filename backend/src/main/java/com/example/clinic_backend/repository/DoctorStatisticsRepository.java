// File: DoctorStatisticsRepository.java
package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.DoctorStatistics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorStatisticsRepository extends JpaRepository<DoctorStatistics, Long> {
    
    // Tìm thống kê theo bác sĩ, ngày và loại
    Optional<DoctorStatistics> findByDoctorIdAndStatDateAndStatType(
            Long doctorId, 
            LocalDate statDate, 
            String statType
    );
    
    // Lấy thống kê theo bác sĩ và khoảng thời gian
    @Query("SELECT s FROM DoctorStatistics s WHERE s.doctorId = :doctorId " +
           "AND s.statDate BETWEEN :startDate AND :endDate " +
           "ORDER BY s.statDate DESC")
    List<DoctorStatistics> findByDoctorIdAndDateRange(
            @Param("doctorId") Long doctorId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
    
    // Lấy thống kê theo bác sĩ và loại
    @Query("SELECT s FROM DoctorStatistics s WHERE s.doctorId = :doctorId " +
           "AND s.statType = :statType " +
           "ORDER BY s.statDate DESC LIMIT :limit")
    List<DoctorStatistics> findByDoctorIdAndStatType(
            @Param("doctorId") Long doctorId,
            @Param("statType") String statType,
            @Param("limit") int limit
    );
    
    // Thống kê theo tuần
    @Query("SELECT s FROM DoctorStatistics s WHERE s.doctorId = :doctorId " +
           "AND YEAR(s.statDate) = YEAR(CURRENT_DATE) " +
           "AND WEEK(s.statDate) = WEEK(CURRENT_DATE) " +
           "AND s.statType = 'DAY'")
    List<DoctorStatistics> findWeeklyStatistics(
            @Param("doctorId") Long doctorId
    );
    
    // Thống kê theo tháng
    @Query("SELECT s FROM DoctorStatistics s WHERE s.doctorId = :doctorId " +
           "AND YEAR(s.statDate) = YEAR(CURRENT_DATE) " +
           "AND MONTH(s.statDate) = MONTH(CURRENT_DATE) " +
           "AND s.statType = 'DAY'")
    List<DoctorStatistics> findMonthlyStatistics(
            @Param("doctorId") Long doctorId
    );
}