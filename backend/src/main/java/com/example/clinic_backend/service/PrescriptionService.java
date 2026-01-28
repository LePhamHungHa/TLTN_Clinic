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
    
    // Tìm kiếm thuốc
    public Map<String, Object> searchMedicines(String keyword) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Tìm kiếm thuốc với từ khóa: {}", keyword);
            
            // Lấy tất cả thuốc từ database
            List<Medicine> allMedicines = medicineRepository.findAll();
            List<Medicine> filteredMedicines = new ArrayList<>();
            
            if (keyword == null || keyword.trim().isEmpty()) {
                // Nếu không có keyword, chỉ lấy thuốc còn hàng và đang hoạt động
                filteredMedicines = allMedicines.stream()
                    .filter(m -> "ACTIVE".equals(m.getStatus()) && m.getStockQuantity() > 0)
                    .collect(Collectors.toList());
            } else {
                String lowerKeyword = keyword.toLowerCase().trim();
                // Tìm theo tên thuốc, mã thuốc, hoạt chất, danh mục
                filteredMedicines = allMedicines.stream()
                    .filter(m -> "ACTIVE".equals(m.getStatus()) && m.getStockQuantity() > 0)
                    .filter(m -> 
                        (m.getMedicineName() != null && m.getMedicineName().toLowerCase().contains(lowerKeyword)) ||
                        (m.getMedicineCode() != null && m.getMedicineCode().toLowerCase().contains(lowerKeyword)) ||
                        (m.getActiveIngredient() != null && m.getActiveIngredient().toLowerCase().contains(lowerKeyword)) ||
                        (m.getCategory() != null && m.getCategory().toLowerCase().contains(lowerKeyword))
                    )
                    .collect(Collectors.toList());
            }
            
            response.put("success", true);
            response.put("medicines", filteredMedicines);
            response.put("count", filteredMedicines.size());
            
            logger.info("Tìm thấy {} thuốc với từ khóa: {}", filteredMedicines.size(), keyword);
            
        } catch (Exception e) {
            logger.error("Lỗi khi tìm kiếm thuốc: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi tìm kiếm thuốc: " + e.getMessage());
        }
        
        return response;
    }
    
    // Lấy tất cả thuốc đang hoạt động
    public Map<String, Object> getActiveMedicines() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Lấy tất cả thuốc đang hoạt động");
            
            // Lọc thuốc còn hàng và đang active
            List<Medicine> allMedicines = medicineRepository.findAll();
            List<Medicine> activeMedicines = allMedicines.stream()
                .filter(m -> "ACTIVE".equals(m.getStatus()) && m.getStockQuantity() > 0)
                .collect(Collectors.toList());
            
            response.put("success", true);
            response.put("medicines", activeMedicines);
            response.put("count", activeMedicines.size());
            
            logger.info("Tìm thấy {} thuốc đang hoạt động", activeMedicines.size());
            
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách thuốc: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi lấy danh sách thuốc: " + e.getMessage());
        }
        
        return response;
    }
    
    // Lấy thuốc theo danh mục
    public Map<String, Object> getMedicinesByCategory(String category) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Lấy thuốc theo danh mục: {}", category);
            
            // Nếu là "Tất cả" thì lấy tất cả thuốc đang hoạt động
            if ("Tất cả".equals(category) || category == null || category.trim().isEmpty()) {
                return getActiveMedicines();
            }
            
            // Lọc theo danh mục
            List<Medicine> medicines = medicineRepository.findAll().stream()
                .filter(m -> category.equals(m.getCategory()) && 
                           "ACTIVE".equals(m.getStatus()) && 
                           m.getStockQuantity() > 0)
                .collect(Collectors.toList());
            
            response.put("success", true);
            response.put("medicines", medicines);
            response.put("count", medicines.size());
            
            logger.info("Tìm thấy {} thuốc trong danh mục {}", medicines.size(), category);
            
        } catch (Exception e) {
            logger.error("Lỗi khi lấy thuốc theo danh mục: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi lấy thuốc theo danh mục: " + e.getMessage());
        }
        
        return response;
    }
    
    // Lấy tất cả danh mục thuốc
    public Map<String, Object> getMedicineCategories() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Lấy danh mục thuốc");
            
            // Lấy tất cả danh mục từ thuốc đang hoạt động
            List<Medicine> allMedicines = medicineRepository.findAll();
            List<String> categories = allMedicines.stream()
                .filter(m -> "ACTIVE".equals(m.getStatus()) && m.getStockQuantity() > 0)
                .map(Medicine::getCategory)
                .filter(category -> category != null && !category.trim().isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
            
            // Thêm "Tất cả" vào đầu danh sách
            List<String> allCategories = new ArrayList<>();
            allCategories.add("Tất cả");
            allCategories.addAll(categories);
            
            response.put("success", true);
            response.put("categories", allCategories);
            response.put("count", allCategories.size());
            
            logger.info("Tìm thấy {} danh mục thuốc", allCategories.size());
            
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh mục thuốc: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi lấy danh mục thuốc: " + e.getMessage());
        }
        
        return response;
    }
    
    // Lấy đơn thuốc theo medical record
    public Map<String, Object> getPrescriptionByMedicalRecord(Long medicalRecordId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Lấy đơn thuốc cho medical record {}", medicalRecordId);
            
            // 1. Lấy chi tiết đơn thuốc từ database
            List<PrescriptionDetail> prescriptionDetails = 
                prescriptionDetailRepository.findByMedicalRecordId(medicalRecordId);
            
            // 2. Chuyển sang DTO
            List<PrescriptionDetailDTO> prescriptionDTOs = prescriptionDetails.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
            
            // 3. Tính tổng tiền của đơn thuốc
            Double totalAmount = prescriptionDetailRepository.getTotalPrescriptionPrice(medicalRecordId);
            
            response.put("success", true);
            response.put("prescription", prescriptionDTOs);
            response.put("totalAmount", totalAmount != null ? totalAmount : 0.0);
            response.put("itemCount", prescriptionDTOs.size());
            
            logger.info("Tìm thấy {} loại thuốc trong đơn", prescriptionDTOs.size());
            
        } catch (Exception e) {
            logger.error("Lỗi khi lấy đơn thuốc: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi lấy thông tin đơn thuốc: " + e.getMessage());
        }
        
        return response;
    }
    
    // Lấy lịch sử sử dụng thuốc theo medical record
    public Map<String, Object> getMedicationHistoryByMedicalRecord(Long medicalRecordId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Lấy lịch sử thuốc cho medical record {}", medicalRecordId);
            
            // Dùng SQL query để lấy dữ liệu kết hợp từ nhiều bảng
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
            
            // Thực thi query và map kết quả
            List<MedicationHistoryDTO> history = jdbcTemplate.query(sql, new RowMapper<MedicationHistoryDTO>() {
                @Override
                public MedicationHistoryDTO mapRow(ResultSet rs, int rowNum) throws SQLException {
                    MedicationHistoryDTO dto = new MedicationHistoryDTO();
                    // Map tất cả các trường từ ResultSet sang DTO
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
                    
                    // Chuyển timestamp sang LocalDateTime
                    if (rs.getTimestamp("created_at") != null) {
                        dto.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
                    }
                    
                    // Lấy thêm thông tin từ các bảng khác
                    dto.setExaminationDate(rs.getDate("examination_date"));
                    dto.setUnit(rs.getString("unit"));
                    dto.setStrength(rs.getString("strength"));
                    dto.setCategory(rs.getString("category"));
                    
                    return dto;
                }
            }, medicalRecordId);
            
            // Tính tổng tiền và đếm số lượng
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
            
            logger.info("Tìm thấy {} bản ghi lịch sử thuốc", history.size());
            
        } catch (Exception e) {
            logger.error("Lỗi khi lấy lịch sử thuốc: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi lấy lịch sử sử dụng thuốc: " + e.getMessage());
        }
        
        return response;
    }
    
    
    //  Lấy lịch sử sử dụng thuốc của bệnh nhân
    //  Dùng để xem bệnh nhân đã dùng những loại thuốc nào trước đây
     
    public Map<String, Object> getPatientMedicationHistory(Long patientId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Lấy lịch sử thuốc của bệnh nhân {}", patientId);
            
            // Query SQL để lấy lịch sử thuốc của bệnh nhân
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
                    // Map dữ liệu từ ResultSet
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
                    
                    // Chuyển đổi thời gian
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
            
            // Tính toán thống kê
            BigDecimal totalAmount = BigDecimal.ZERO;
            int totalItems = 0;
            Map<String, Integer> medicineUsage = new HashMap<>();
            
            for (MedicationHistoryDTO item : history) {
                // Tính tổng tiền
                if (item.getTotalPrice() != null) {
                    totalAmount = totalAmount.add(item.getTotalPrice());
                }
                totalItems++;
                
                // Đếm số lần sử dụng mỗi loại thuốc
                String medicineKey = item.getMedicineName();
                medicineUsage.put(medicineKey, medicineUsage.getOrDefault(medicineKey, 0) + 1);
            }
            
            // Sắp xếp thuốc theo số lần sử dụng (nhiều nhất trước)
            List<Map.Entry<String, Integer>> sortedUsage = new ArrayList<>(medicineUsage.entrySet());
            sortedUsage.sort((a, b) -> b.getValue().compareTo(a.getValue()));
            
            // Lấy top 5 thuốc dùng nhiều nhất
            List<Map<String, Object>> topMedicines = new ArrayList<>();
            for (int i = 0; i < Math.min(5, sortedUsage.size()); i++) {
                Map<String, Object> medicineStat = new HashMap<>();
                medicineStat.put("medicineName", sortedUsage.get(i).getKey());
                medicineStat.put("usageCount", sortedUsage.get(i).getValue());
                topMedicines.add(medicineStat);
            }
            
            // Trả về kết quả
            response.put("success", true);
            response.put("history", history);
            response.put("count", history.size());
            response.put("totalAmount", totalAmount);
            response.put("totalItems", totalItems);
            response.put("topMedicines", topMedicines);
            response.put("medicineUsage", medicineUsage);
            
            logger.info("Tìm thấy {} bản ghi lịch sử thuốc của bệnh nhân", history.size());
            
        } catch (Exception e) {
            logger.error("Lỗi khi lấy lịch sử thuốc bệnh nhân: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi lấy lịch sử sử dụng thuốc: " + e.getMessage());
        }
        
        return response;
    }
    
    // Chuyển PrescriptionDetail sang DTO
   
    private PrescriptionDetailDTO convertToDTO(PrescriptionDetail prescriptionDetail) {
        PrescriptionDetailDTO dto = new PrescriptionDetailDTO();
        
        // Copy tất cả các trường từ entity sang DTO
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
    
    // Tạo đơn thuốc mới
   
    @Transactional
    public Map<String, Object> createPrescription(Long medicalRecordId, List<Map<String, Object>> prescriptionItems) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Tạo đơn thuốc cho medical record {}", medicalRecordId);
            logger.info("Số loại thuốc: {}", prescriptionItems.size());
            
            // Kiểm tra đầu vào
            if (medicalRecordId == null) {
                throw new IllegalArgumentException("Medical Record ID không được null");
            }
            
            if (prescriptionItems == null || prescriptionItems.isEmpty()) {
                throw new IllegalArgumentException("Danh sách thuốc không được rỗng");
            }
            
            List<PrescriptionDetail> prescriptionDetails = new ArrayList<>();
            BigDecimal totalAmount = BigDecimal.ZERO;
            
            // Xử lý từng loại thuốc trong đơn
            for (int i = 0; i < prescriptionItems.size(); i++) {
                Map<String, Object> item = prescriptionItems.get(i);
                logger.info("Xử lý thuốc thứ {}: {}", i + 1, item);
                
                try {
                    // Lấy dữ liệu từ request
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
                    
                    // Kiểm tra dữ liệu bắt buộc
                    if (medicineId == null) {
                        throw new IllegalArgumentException("Medicine ID không được null tại item " + (i + 1));
                    }
                    if (quantity == null || quantity <= 0) {
                        throw new IllegalArgumentException("Số lượng không hợp lệ tại item " + (i + 1));
                    }
                    
                    // Tìm thuốc trong database
                    Medicine medicine = medicineRepository.findById(medicineId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy thuốc với ID: " + medicineId));
                    
                    logger.info("Tìm thấy thuốc: {} (Tồn kho: {})", medicine.getMedicineName(), medicine.getStockQuantity());
                    
                    // Kiểm tra tồn kho
                    if (medicine.getStockQuantity() < quantity) {
                        throw new RuntimeException("Không đủ tồn kho cho thuốc: " + medicine.getMedicineName() + 
                                                 ". Có sẵn: " + medicine.getStockQuantity() + 
                                                 ", Yêu cầu: " + quantity);
                    }
                    
                    // Sử dụng giá từ database nếu không có trong request
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
                    logger.info("Cập nhật tồn kho {}: {} -> {}", medicine.getMedicineName(), 
                              medicine.getStockQuantity() + quantity, newStock);
                    
                    // Tạo chi tiết đơn thuốc
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
                    
                    // Tính tổng tiền cho loại thuốc này
                    BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
                    prescriptionDetail.setTotalPrice(itemTotal);
                    totalAmount = totalAmount.add(itemTotal);
                    
                    prescriptionDetails.add(prescriptionDetail);
                    
                } catch (Exception e) {
                    logger.error("Lỗi xử lý thuốc thứ {}: {}", i + 1, e.getMessage(), e);
                    throw new RuntimeException("Lỗi xử lý thuốc thứ " + (i + 1) + ": " + e.getMessage());
                }
            }
            
            // Lưu tất cả chi tiết đơn thuốc vào database
            List<PrescriptionDetail> savedPrescription = prescriptionDetailRepository.saveAll(prescriptionDetails);
            
            // Chuyển sang DTO để trả về
            List<PrescriptionDetailDTO> prescriptionDTOs = savedPrescription.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
            
            response.put("success", true);
            response.put("message", "Đã tạo đơn thuốc thành công");
            response.put("prescription", prescriptionDTOs);
            response.put("totalAmount", totalAmount);
            response.put("itemCount", savedPrescription.size());
            
            logger.info("Tạo đơn thuốc thành công với {} loại thuốc, tổng tiền: {}", 
                       savedPrescription.size(), totalAmount);
            
        } catch (Exception e) {
            logger.error("Lỗi khi tạo đơn thuốc: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi tạo đơn thuốc: " + e.getMessage());
            response.put("error", e.getMessage());
        }
        
        return response;
    }
    
    // Các hàm helper để lấy dữ liệu từ Map một cách an toàn
    
    // Lấy Long từ Object
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
            logger.warn("Không thể chuyển {} sang Long: {}", value, e.getMessage());
            return null;
        }
    }
    
    // Lấy Integer từ Object
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
            logger.warn("Không thể chuyển {} sang Integer: {}", value, e.getMessage());
            return null;
        }
    }
    
    // Lấy BigDecimal từ Object
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
            logger.warn("Không thể chuyển {} sang BigDecimal: {}", value, e.getMessage());
            return null;
        }
    }
    
    // Lấy String từ Object
    private String extractString(Object value) {
        if (value == null) return null;
        return value.toString();
    }
}