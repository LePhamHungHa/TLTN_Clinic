package com.example.clinic_backend.service;

import com.example.clinic_backend.model.MedicalRecord;
import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.model.User;
import com.example.clinic_backend.repository.MedicalRecordRepository;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import com.example.clinic_backend.repository.PatientRepository;
import com.example.clinic_backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PatientMedicalRecordService {
    
    private static final Logger logger = LoggerFactory.getLogger(PatientMedicalRecordService.class);
    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRegistrationRepository patientRegistrationRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;  // Thêm repository để lấy user
    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    
    public PatientMedicalRecordService(MedicalRecordRepository medicalRecordRepository,
                                     PatientRegistrationRepository patientRegistrationRepository,
                                     PatientRepository patientRepository,
                                     UserRepository userRepository) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.patientRegistrationRepository = patientRegistrationRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
    }
    
    public Map<String, Object> getMedicalRecordsByPatientId(Long patientId, int page, int size) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 Getting medical records for patient ID: {}", patientId);
            
            // Kiểm tra patient tồn tại (nếu dùng UserRepository thay vì PatientRepository)
            if (!userRepository.existsById(patientId)) {
                response.put("success", false);
                response.put("message", "Không tìm thấy bệnh nhân");
                return response;
            }
            
            // Lấy user để lấy thông tin
            Optional<User> userOpt = userRepository.findById(patientId);
            if (userOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Không tìm thấy thông tin người dùng");
                return response;
            }
            
            User user = userOpt.get();
            String userEmail = user.getEmail();
            
            logger.info("🔍 Using user email: {} for patientId: {}", userEmail, patientId);
            
            // Lấy tất cả appointment IDs của patient dựa trên email
            List<PatientRegistration> appointments = patientRegistrationRepository.findByEmail(userEmail);
            
            if (appointments == null || appointments.isEmpty()) {
                // Thử tìm theo userId nếu có
                appointments = patientRegistrationRepository.findByUserId(patientId);
            }
            
            List<Long> appointmentIds = appointments.stream()
                    .map(PatientRegistration::getId)
                    .collect(Collectors.toList());
            
            logger.info("🔍 Found {} appointments for patient", appointmentIds.size());
            
            if (appointmentIds.isEmpty()) {
                response.put("success", true);
                response.put("medicalRecords", List.of());
                response.put("totalItems", 0);
                response.put("totalPages", 0);
                response.put("currentPage", page);
                return response;
            }
            
            // Lấy medical records dựa trên appointment IDs
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "examinationDate"));
            Page<MedicalRecord> medicalRecordsPage = medicalRecordRepository.findByAppointmentIdIn(appointmentIds, pageable);
            
            List<Map<String, Object>> medicalRecordsDTO = medicalRecordsPage.getContent()
                    .stream()
                    .map(record -> createMedicalRecordDetailDTO(record, patientId))
                    .collect(Collectors.toList());
            
            response.put("success", true);
            response.put("medicalRecords", medicalRecordsDTO);
            response.put("currentPage", medicalRecordsPage.getNumber());
            response.put("totalPages", medicalRecordsPage.getTotalPages());
            response.put("totalItems", medicalRecordsPage.getTotalElements());
            response.put("totalAppointments", appointments.size());
            
            logger.info("✅ Found {} medical records for patient {}", medicalRecordsDTO.size(), patientId);
            
        } catch (Exception e) {
            logger.error("💥 Error getting patient medical records: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi lấy danh sách kết quả khám: " + e.getMessage());
        }
        
        return response;
    }
    
    public Map<String, Object> getMedicalRecordDetail(Long recordId, Long patientId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 Getting medical record detail: {} for patient: {}", recordId, patientId);
            
            Optional<MedicalRecord> medicalRecordOpt = medicalRecordRepository.findById(recordId);
            if (medicalRecordOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Không tìm thấy kết quả khám");
                return response;
            }
            
            MedicalRecord medicalRecord = medicalRecordOpt.get();
            
            // Kiểm tra xem medical record có thuộc về patient này không
            Optional<PatientRegistration> appointmentOpt = patientRegistrationRepository.findById(medicalRecord.getAppointmentId());
            if (appointmentOpt.isEmpty() || !isPatientAppointment(appointmentOpt.get(), patientId)) {
                response.put("success", false);
                response.put("message", "Bạn không có quyền xem kết quả khám này");
                return response;
            }
            
            Map<String, Object> medicalRecordDTO = createMedicalRecordDetailDTO(medicalRecord, patientId);
            
            response.put("success", true);
            response.put("medicalRecord", medicalRecordDTO);
            
            logger.info("✅ Found medical record detail for patient {}", patientId);
            
        } catch (Exception e) {
            logger.error("💥 Error getting medical record detail: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi lấy chi tiết kết quả khám: " + e.getMessage());
        }
        
        return response;
    }
    
    public Map<String, Object> searchMedicalRecords(Long patientId, String keyword, String fromDate, 
                                                    String toDate, int page, int size) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 Searching medical records for patient: {}", patientId);
            
            // Kiểm tra patient tồn tại
            if (!userRepository.existsById(patientId)) {
                response.put("success", false);
                response.put("message", "Không tìm thấy bệnh nhân");
                return response;
            }
            
            // Lấy user để lấy email
            Optional<User> userOpt = userRepository.findById(patientId);
            if (userOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Không tìm thấy thông tin người dùng");
                return response;
            }
            
            User user = userOpt.get();
            String userEmail = user.getEmail();
            
            // Lấy tất cả appointment IDs của patient
            List<PatientRegistration> appointments = patientRegistrationRepository.findByEmail(userEmail);
            
            if (appointments == null || appointments.isEmpty()) {
                appointments = patientRegistrationRepository.findByUserId(patientId);
            }
            
            List<Long> appointmentIds = appointments.stream()
                    .map(PatientRegistration::getId)
                    .collect(Collectors.toList());
            
            if (appointmentIds.isEmpty()) {
                response.put("success", true);
                response.put("medicalRecords", List.of());
                response.put("totalItems", 0);
                return response;
            }
            
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "examinationDate"));
            Page<MedicalRecord> medicalRecordsPage;
            
            // Áp dụng bộ lọc tìm kiếm
            if (keyword != null && !keyword.trim().isEmpty()) {
                medicalRecordsPage = medicalRecordRepository.searchByPatientAndKeyword(
                    appointmentIds, keyword, pageable);
            } else if (fromDate != null && toDate != null) {
                LocalDate start = LocalDate.parse(fromDate, dateFormatter);
                LocalDate end = LocalDate.parse(toDate, dateFormatter);
                medicalRecordsPage = medicalRecordRepository.findByAppointmentIdInAndExaminationDateBetween(
                    appointmentIds, start, end, pageable);
            } else {
                medicalRecordsPage = medicalRecordRepository.findByAppointmentIdIn(appointmentIds, pageable);
            }
            
            List<Map<String, Object>> medicalRecordsDTO = medicalRecordsPage.getContent()
                    .stream()
                    .map(record -> createMedicalRecordDetailDTO(record, patientId))
                    .collect(Collectors.toList());
            
            response.put("success", true);
            response.put("medicalRecords", medicalRecordsDTO);
            response.put("currentPage", medicalRecordsPage.getNumber());
            response.put("totalPages", medicalRecordsPage.getTotalPages());
            response.put("totalItems", medicalRecordsPage.getTotalElements());
            
            logger.info("✅ Found {} medical records in search", medicalRecordsDTO.size());
            
        } catch (Exception e) {
            logger.error("💥 Error searching medical records: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi tìm kiếm kết quả khám: " + e.getMessage());
        }
        
        return response;
    }
    
    // Helper method để kiểm tra appointment có thuộc về patient không
    private boolean isPatientAppointment(PatientRegistration appointment, Long patientId) {
        try {
            // Kiểm tra theo userId
            if (appointment.getUserId() != null && appointment.getUserId().equals(patientId)) {
                return true;
            }
            
            // Kiểm tra theo email
            Optional<User> userOpt = userRepository.findById(patientId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (appointment.getEmail() != null && appointment.getEmail().equals(user.getEmail())) {
                    return true;
                }
            }
            
            return false;
        } catch (Exception e) {
            logger.error("Error checking patient appointment: {}", e.getMessage());
            return false;
        }
    }
    
    // Helper method để tạo DTO chi tiết
    private Map<String, Object> createMedicalRecordDetailDTO(MedicalRecord medicalRecord, Long patientId) {
        Map<String, Object> dto = new HashMap<>();
        
        // Thông tin cơ bản
        dto.put("id", medicalRecord.getId());
        dto.put("appointmentId", medicalRecord.getAppointmentId());
        dto.put("doctorId", medicalRecord.getDoctorId());
        dto.put("examinationDate", medicalRecord.getExaminationDate());
        dto.put("examinationStatus", medicalRecord.getExaminationStatus());
        
        // Triệu chứng và khám
        dto.put("chiefComplaint", medicalRecord.getChiefComplaint());
        dto.put("historyOfIllness", medicalRecord.getHistoryOfIllness());
        dto.put("physicalExamination", medicalRecord.getPhysicalExamination());
        
        // Dấu hiệu sinh tồn
        if (medicalRecord.getVitalSigns() != null) {
            try {
                dto.put("vitalSigns", medicalRecord.getVitalSignsMap());
            } catch (Exception e) {
                dto.put("vitalSigns", new HashMap<>());
            }
        }
        
        // Chẩn đoán
        dto.put("preliminaryDiagnosis", medicalRecord.getPreliminaryDiagnosis());
        dto.put("finalDiagnosis", medicalRecord.getFinalDiagnosis());
        
        // Điều trị
        dto.put("treatmentPlan", medicalRecord.getTreatmentPlan());
        
        // Thuốc
        if (medicalRecord.getMedications() != null) {
            try {
                dto.put("medications", medicalRecord.getMedicationsList());
            } catch (Exception e) {
                dto.put("medications", List.of());
            }
        }
        
        // Xét nghiệm
        if (medicalRecord.getLabTests() != null) {
            try {
                dto.put("labTests", medicalRecord.getLabTestsList());
            } catch (Exception e) {
                dto.put("labTests", List.of());
            }
        }
        
        // Lời khuyên và theo dõi
        dto.put("advice", medicalRecord.getAdvice());
        dto.put("followUpDate", medicalRecord.getFollowUpDate());
        dto.put("followUpNotes", medicalRecord.getFollowUpNotes());
        
        // Thông tin thời gian
        dto.put("createdAt", medicalRecord.getCreatedAt());
        dto.put("updatedAt", medicalRecord.getUpdatedAt());
        
        // Lấy thông tin appointment và bác sĩ
        try {
            Optional<PatientRegistration> appointmentOpt = patientRegistrationRepository.findById(medicalRecord.getAppointmentId());
            if (appointmentOpt.isPresent()) {
                PatientRegistration appointment = appointmentOpt.get();
                dto.put("appointmentDate", appointment.getAppointmentDate());
                dto.put("department", appointment.getDepartment());
                dto.put("symptoms", appointment.getSymptoms());
                
                // Lấy thông tin bác sĩ từ appointment
                dto.put("doctorName", appointment.getDoctor() != null ? 
                    appointment.getDoctor().getFullName() : "Không xác định");
                dto.put("doctorSpecialty", appointment.getDoctor() != null ? 
                    appointment.getDoctor().getSpecialty() : "Không xác định");
            }
        } catch (Exception e) {
            logger.warn("⚠️ Could not load appointment info for medical record: {}", e.getMessage());
        }
        
        return dto;
    }
}