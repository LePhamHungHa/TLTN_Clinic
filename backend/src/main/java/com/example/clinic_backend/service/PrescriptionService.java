package com.example.clinic_backend.service;

import com.example.clinic_backend.dto.PrescriptionDetailDTO;
import com.example.clinic_backend.dto.MedicationHistoryDTO;
import com.example.clinic_backend.model.PrescriptionDetail;
import com.example.clinic_backend.model.Medicine;
import com.example.clinic_backend.repository.PrescriptionDetailRepository;
import com.example.clinic_backend.repository.MedicineRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
public class PrescriptionService {
    
    private static final Logger logger = LoggerFactory.getLogger(PrescriptionService.class);
    private final PrescriptionDetailRepository prescriptionDetailRepository;
    private final MedicineRepository medicineRepository;
    private final JdbcTemplate jdbcTemplate;
    
    public PrescriptionService(PrescriptionDetailRepository prescriptionDetailRepository,
                             MedicineRepository medicineRepository,
                             JdbcTemplate jdbcTemplate) {
        this.prescriptionDetailRepository = prescriptionDetailRepository;
        this.medicineRepository = medicineRepository;
        this.jdbcTemplate = jdbcTemplate;
    }
    
    public Map<String, Object> getPrescriptionByMedicalRecord(Long medicalRecordId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("📋 Getting prescription for medical record {}", medicalRecordId);
            
            // 1. Lấy tất cả prescription details
            List<PrescriptionDetail> prescriptionDetails = 
                prescriptionDetailRepository.findByMedicalRecordId(medicalRecordId);
            
            // 2. Chuyển đổi sang DTO để tránh lỗi JSON serialization
            List<PrescriptionDetailDTO> prescriptionDTOs = prescriptionDetails.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
            
            // 3. Tính tổng tiền
            Double totalAmount = prescriptionDetailRepository.getTotalPrescriptionPrice(medicalRecordId);
            
            response.put("success", true);
            response.put("prescription", prescriptionDTOs);
            response.put("totalAmount", totalAmount != null ? totalAmount : 0.0);
            response.put("itemCount", prescriptionDTOs.size());
            
            logger.info("✅ Found {} prescription items for medical record {}", 
                       prescriptionDTOs.size(), medicalRecordId);
            
        } catch (Exception e) {
            logger.error("💥 Error getting prescription: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi lấy thông tin đơn thuốc: " + e.getMessage());
        }
        
        return response;
    }
    
    // Lấy lịch sử sử dụng thuốc của bệnh nhân
    public Map<String, Object> getMedicationHistoryByMedicalRecord(Long medicalRecordId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("📊 Getting medication history for medical record {}", medicalRecordId);
            
            // Cách 1: Sử dụng query đơn giản hơn nếu không có quan hệ đầy đủ
            String sql = """
                SELECT pd.*, 
                       mr.examination_date,
                       m.unit,
                       m.strength,
                       m.category
                FROM prescription_details pd
                JOIN medical_records mr ON pd.medical_record_id = mr.id
                LEFT JOIN medicines m ON pd.medicine_id = m.id
                WHERE pd.medical_record_id = ?
                ORDER BY pd.created_at DESC
                """;
            
            List<MedicationHistoryDTO> history = jdbcTemplate.query(sql, new RowMapper<MedicationHistoryDTO>() {
                @Override
                public MedicationHistoryDTO mapRow(ResultSet rs, int rowNum) throws SQLException {
                    MedicationHistoryDTO dto = new MedicationHistoryDTO();
                    dto.setId(rs.getLong("id"));
                    dto.setMedicalRecordId(rs.getLong("medical_record_id"));
                    dto.setMedicineId(rs.getLong("medicine_id"));
                    dto.setMedicineName(rs.getString("medicine_name"));
                    dto.setDosage(rs.getString("dosage"));
                    dto.setFrequency(rs.getString("frequency"));
                    dto.setDuration(rs.getString("duration"));
                    dto.setQuantity(rs.getInt("quantity"));
                    dto.setUnitPrice(rs.getBigDecimal("unit_price"));
                    dto.setTotalPrice(rs.getBigDecimal("total_price"));
                    dto.setInstructions(rs.getString("instructions"));
                    dto.setNotes(rs.getString("notes"));
                    
                    // Convert timestamp to LocalDateTime
                    if (rs.getTimestamp("created_at") != null) {
                        dto.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
                    }
                    
                    dto.setExaminationDate(rs.getDate("examination_date"));
                    dto.setUnit(rs.getString("unit"));
                    dto.setStrength(rs.getString("strength"));
                    dto.setCategory(rs.getString("category"));
                    
                    return dto;
                }
            }, medicalRecordId);
            
            // Tính tổng số tiền
            BigDecimal totalAmount = BigDecimal.ZERO;
            int totalItems = 0;
            
            for (MedicationHistoryDTO item : history) {
                if (item.getTotalPrice() != null) {
                    totalAmount = totalAmount.add(item.getTotalPrice());
                }
                totalItems++;
            }
            
            response.put("success", true);
            response.put("history", history);
            response.put("count", history.size());
            response.put("totalAmount", totalAmount);
            response.put("totalItems", totalItems);
            
            logger.info("✅ Found {} medication history records for medical record {}", 
                       history.size(), medicalRecordId);
            
        } catch (Exception e) {
            logger.error("💥 Error getting medication history by medical record: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi lấy lịch sử sử dụng thuốc: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Lấy lịch sử sử dụng thuốc của bệnh nhân
     */
    public Map<String, Object> getPatientMedicationHistory(Long patientId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("📊 Getting medication history for patient {}", patientId);
            
            // Cách đơn giản hơn - chỉ lấy thông tin cơ bản
            String sql = """
                SELECT pd.*, 
                       mr.examination_date,
                       m.unit,
                       m.strength,
                       m.category
                FROM prescription_details pd
                JOIN medical_records mr ON pd.medical_record_id = mr.id
                JOIN appointments a ON mr.appointment_id = a.id
                LEFT JOIN medicines m ON pd.medicine_id = m.id
                WHERE a.patient_id = ?
                ORDER BY pd.created_at DESC
                LIMIT 100
                """;
            
            List<MedicationHistoryDTO> history = jdbcTemplate.query(sql, new RowMapper<MedicationHistoryDTO>() {
                @Override
                public MedicationHistoryDTO mapRow(ResultSet rs, int rowNum) throws SQLException {
                    MedicationHistoryDTO dto = new MedicationHistoryDTO();
                    dto.setId(rs.getLong("id"));
                    dto.setMedicalRecordId(rs.getLong("medical_record_id"));
                    dto.setMedicineId(rs.getLong("medicine_id"));
                    dto.setMedicineName(rs.getString("medicine_name"));
                    dto.setDosage(rs.getString("dosage"));
                    dto.setFrequency(rs.getString("frequency"));
                    dto.setDuration(rs.getString("duration"));
                    dto.setQuantity(rs.getInt("quantity"));
                    dto.setUnitPrice(rs.getBigDecimal("unit_price"));
                    dto.setTotalPrice(rs.getBigDecimal("total_price"));
                    dto.setInstructions(rs.getString("instructions"));
                    dto.setNotes(rs.getString("notes"));
                    
                    // Convert timestamp to LocalDateTime
                    if (rs.getTimestamp("created_at") != null) {
                        dto.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
                    }
                    
                    dto.setExaminationDate(rs.getDate("examination_date"));
                    dto.setUnit(rs.getString("unit"));
                    dto.setStrength(rs.getString("strength"));
                    dto.setCategory(rs.getString("category"));
                    dto.setPatientId(patientId);
                    
                    return dto;
                }
            }, patientId);
            
            // Tính tổng số tiền và thống kê
            BigDecimal totalAmount = BigDecimal.ZERO;
            int totalItems = 0;
            Map<String, Integer> medicineUsage = new HashMap<>();
            
            for (MedicationHistoryDTO item : history) {
                if (item.getTotalPrice() != null) {
                    totalAmount = totalAmount.add(item.getTotalPrice());
                }
                totalItems++;
                
                // Thống kê sử dụng thuốc
                String medicineKey = item.getMedicineName();
                medicineUsage.put(medicineKey, medicineUsage.getOrDefault(medicineKey, 0) + 1);
            }
            
            // Sắp xếp thuốc được sử dụng nhiều nhất
            List<Map.Entry<String, Integer>> sortedUsage = new ArrayList<>(medicineUsage.entrySet());
            sortedUsage.sort((a, b) -> b.getValue().compareTo(a.getValue()));
            
            List<Map<String, Object>> topMedicines = new ArrayList<>();
            for (int i = 0; i < Math.min(5, sortedUsage.size()); i++) {
                Map<String, Object> medicineStat = new HashMap<>();
                medicineStat.put("medicineName", sortedUsage.get(i).getKey());
                medicineStat.put("usageCount", sortedUsage.get(i).getValue());
                topMedicines.add(medicineStat);
            }
            
            response.put("success", true);
            response.put("history", history);
            response.put("count", history.size());
            response.put("totalAmount", totalAmount);
            response.put("totalItems", totalItems);
            response.put("topMedicines", topMedicines);
            response.put("medicineUsage", medicineUsage);
            
            logger.info("✅ Found {} medication history records for patient {}", 
                       history.size(), patientId);
            
        } catch (Exception e) {
            logger.error("💥 Error getting patient medication history: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi lấy lịch sử sử dụng thuốc: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Helper method: Chuyển PrescriptionDetail sang DTO
     */
    private PrescriptionDetailDTO convertToDTO(PrescriptionDetail prescriptionDetail) {
        PrescriptionDetailDTO dto = new PrescriptionDetailDTO();
        
        dto.setId(prescriptionDetail.getId());
        dto.setMedicalRecordId(prescriptionDetail.getMedicalRecordId());
        dto.setMedicineId(prescriptionDetail.getMedicineId());
        dto.setMedicineName(prescriptionDetail.getMedicineName());
        dto.setDosage(prescriptionDetail.getDosage());
        dto.setFrequency(prescriptionDetail.getFrequency());
        dto.setDuration(prescriptionDetail.getDuration());
        dto.setQuantity(prescriptionDetail.getQuantity());
        dto.setUnitPrice(prescriptionDetail.getUnitPrice());
        dto.setTotalPrice(prescriptionDetail.getTotalPrice());
        dto.setInstructions(prescriptionDetail.getInstructions());
        dto.setNotes(prescriptionDetail.getNotes());
        dto.setCreatedAt(prescriptionDetail.getCreatedAt());
        
        return dto;
    }
    
    @Transactional
    public Map<String, Object> createPrescription(Long medicalRecordId, List<Map<String, Object>> prescriptionItems) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("💊 Creating prescription for medical record {}", medicalRecordId);
            logger.info("📦 Prescription items count: {}", prescriptionItems.size());
            
            if (medicalRecordId == null) {
                throw new IllegalArgumentException("Medical Record ID không được null");
            }
            
            if (prescriptionItems == null || prescriptionItems.isEmpty()) {
                throw new IllegalArgumentException("Danh sách thuốc không được rỗng");
            }
            
            List<PrescriptionDetail> prescriptionDetails = new ArrayList<>();
            BigDecimal totalAmount = BigDecimal.ZERO;
            
            for (int i = 0; i < prescriptionItems.size(); i++) {
                Map<String, Object> item = prescriptionItems.get(i);
                logger.info("⚡ Processing medicine item {}: {}", i + 1, item);
                
                try {
                    // Parse data from request
                    Long medicineId = extractLong(item.get("medicineId"));
                    String medicineName = extractString(item.get("medicineName"));
                    String dosage = extractString(item.get("dosage"));
                    String frequency = extractString(item.get("frequency"));
                    String duration = extractString(item.get("duration"));
                    Integer quantity = extractInteger(item.get("quantity"));
                    BigDecimal unitPrice = extractBigDecimal(item.get("unitPrice"));
                    String instructions = extractString(item.get("instructions"));
                    String notes = extractString(item.get("notes"));
                    String strength = extractString(item.get("strength"));
                    String unit = extractString(item.get("unit"));
                    
                    // Validate required fields
                    if (medicineId == null) {
                        throw new IllegalArgumentException("Medicine ID không được null tại item " + (i + 1));
                    }
                    if (quantity == null || quantity <= 0) {
                        throw new IllegalArgumentException("Số lượng không hợp lệ tại item " + (i + 1));
                    }
                    
                    // Kiểm tra thuốc tồn tại và còn hàng
                    Medicine medicine = medicineRepository.findById(medicineId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy thuốc với ID: " + medicineId));
                    
                    logger.info("🔍 Medicine found: {} (Stock: {})", medicine.getMedicineName(), medicine.getStockQuantity());
                    
                    if (medicine.getStockQuantity() < quantity) {
                        throw new RuntimeException("Không đủ tồn kho cho thuốc: " + medicine.getMedicineName() + 
                                                 ". Có sẵn: " + medicine.getStockQuantity() + 
                                                 ", Yêu cầu: " + quantity);
                    }
                    
                    // Sử dụng unitPrice từ database nếu không có trong request
                    if (unitPrice == null) {
                        unitPrice = medicine.getUnitPrice();
                    }
                    
                    if (unitPrice == null) {
                        throw new RuntimeException("Không có giá cho thuốc: " + medicine.getMedicineName());
                    }
                    
                    // Cập nhật số lượng tồn kho
                    int newStock = medicine.getStockQuantity() - quantity;
                    medicine.setStockQuantity(newStock);
                    medicineRepository.save(medicine);
                    logger.info("📉 Updated stock for {}: {} -> {}", medicine.getMedicineName(), 
                              medicine.getStockQuantity() + quantity, newStock);
                    
                    // Tạo prescription detail
                    PrescriptionDetail prescriptionDetail = new PrescriptionDetail();
                    prescriptionDetail.setMedicalRecordId(medicalRecordId);
                    prescriptionDetail.setMedicineId(medicineId);
                    prescriptionDetail.setMedicineName(medicineName != null ? medicineName : medicine.getMedicineName());
                    prescriptionDetail.setDosage(dosage != null ? dosage : "1 " + medicine.getUnit());
                    prescriptionDetail.setFrequency(frequency != null ? frequency : "2 lần/ngày");
                    prescriptionDetail.setDuration(duration != null ? duration : "3 ngày");
                    prescriptionDetail.setQuantity(quantity);
                    prescriptionDetail.setUnitPrice(unitPrice);
                    prescriptionDetail.setInstructions(instructions);
                    prescriptionDetail.setNotes(notes);
                    
                    // Tính total price
                    BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
                    prescriptionDetail.setTotalPrice(itemTotal);
                    totalAmount = totalAmount.add(itemTotal);
                    
                    prescriptionDetails.add(prescriptionDetail);
                    
                } catch (Exception e) {
                    logger.error("❌ Error processing medicine item {}: {}", i + 1, e.getMessage(), e);
                    throw new RuntimeException("Lỗi xử lý thuốc thứ " + (i + 1) + ": " + e.getMessage());
                }
            }
            
            // Lưu tất cả prescription details
            List<PrescriptionDetail> savedPrescription = prescriptionDetailRepository.saveAll(prescriptionDetails);
            
            // Chuyển sang DTO
            List<PrescriptionDetailDTO> prescriptionDTOs = savedPrescription.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
            
            response.put("success", true);
            response.put("message", "Đã tạo đơn thuốc thành công");
            response.put("prescription", prescriptionDTOs);
            response.put("totalAmount", totalAmount);
            response.put("itemCount", savedPrescription.size());
            
            logger.info("✅ Prescription created successfully with {} items, total amount: {}", 
                       savedPrescription.size(), totalAmount);
            
        } catch (Exception e) {
            logger.error("💥 Error creating prescription for medical record {}: {}", medicalRecordId, e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi tạo đơn thuốc: " + e.getMessage());
            response.put("error", e.getMessage());
        }
        
        return response;
    }
    
    // Helper methods for safe data extraction
    private Long extractLong(Object value) {
        if (value == null) return null;
        try {
            if (value instanceof Integer) {
                return ((Integer) value).longValue();
            }
            if (value instanceof Long) {
                return (Long) value;
            }
            if (value instanceof String) {
                return Long.parseLong((String) value);
            }
            if (value instanceof Number) {
                return ((Number) value).longValue();
            }
            return null;
        } catch (Exception e) {
            logger.warn("⚠️ Cannot convert {} to Long: {}", value, e.getMessage());
            return null;
        }
    }
    
    private Integer extractInteger(Object value) {
        if (value == null) return null;
        try {
            if (value instanceof Integer) {
                return (Integer) value;
            }
            if (value instanceof Long) {
                return ((Long) value).intValue();
            }
            if (value instanceof String) {
                return Integer.parseInt((String) value);
            }
            if (value instanceof Number) {
                return ((Number) value).intValue();
            }
            return null;
        } catch (Exception e) {
            logger.warn("⚠️ Cannot convert {} to Integer: {}", value, e.getMessage());
            return null;
        }
    }
    
    private BigDecimal extractBigDecimal(Object value) {
        if (value == null) return null;
        try {
            if (value instanceof BigDecimal) {
                return (BigDecimal) value;
            }
            if (value instanceof Integer) {
                return BigDecimal.valueOf((Integer) value);
            }
            if (value instanceof Long) {
                return BigDecimal.valueOf((Long) value);
            }
            if (value instanceof Double) {
                return BigDecimal.valueOf((Double) value);
            }
            if (value instanceof String) {
                return new BigDecimal((String) value);
            }
            if (value instanceof Number) {
                return BigDecimal.valueOf(((Number) value).doubleValue());
            }
            return null;
        } catch (Exception e) {
            logger.warn("⚠️ Cannot convert {} to BigDecimal: {}", value, e.getMessage());
            return null;
        }
    }
    
    private String extractString(Object value) {
        if (value == null) return null;
        return value.toString();
    }
    
    public Map<String, Object> searchMedicines(String keyword) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 Searching medicines with keyword: {}", keyword);
            List<Medicine> medicines = medicineRepository.searchMedicinesForPrescription(keyword);
            response.put("success", true);
            response.put("medicines", medicines);
            response.put("count", medicines.size());
            
        } catch (Exception e) {
            logger.error("💥 Error searching medicines: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi tìm kiếm thuốc: " + e.getMessage());
        }
        
        return response;
    }
    
    public Map<String, Object> getActiveMedicines() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("📊 Getting all active medicines");
            List<Medicine> medicines = medicineRepository.findAllAvailableMedicines();
            response.put("success", true);
            response.put("medicines", medicines);
            response.put("count", medicines.size());
            
            logger.info("✅ Found {} active medicines", medicines.size());
            
        } catch (Exception e) {
            logger.error("💥 Error getting active medicines: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi lấy danh sách thuốc: " + e.getMessage());
        }
        
        return response;
    }
    
    public Map<String, Object> getMedicinesByCategory(String category) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("📊 Getting medicines by category: {}", category);
            List<Medicine> medicines = medicineRepository.findAvailableMedicinesByCategory(category);
            response.put("success", true);
            response.put("medicines", medicines);
            response.put("count", medicines.size());
            
            logger.info("✅ Found {} medicines in category {}", medicines.size(), category);
            
        } catch (Exception e) {
            logger.error("💥 Error getting medicines by category: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi lấy thuốc theo danh mục: " + e.getMessage());
        }
        
        return response;
    }
    
    public Map<String, Object> getMedicineCategories() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("📊 Getting medicine categories");
            List<String> categories = medicineRepository.findAvailableCategories();
            response.put("success", true);
            response.put("categories", categories);
            response.put("count", categories.size());
            
            logger.info("✅ Found {} categories", categories.size());
            
        } catch (Exception e) {
            logger.error("💥 Error getting medicine categories: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi lấy danh mục thuốc: " + e.getMessage());
        }
        
        return response;
    }
}