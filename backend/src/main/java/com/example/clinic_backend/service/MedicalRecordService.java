package com.example.clinic_backend.service;

import com.example.clinic_backend.model.MedicalRecord;
import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.MedicalRecordRepository;
import com.example.clinic_backend.repository.DoctorAppointmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MedicalRecordService {
    
    private static final Logger logger = LoggerFactory.getLogger(MedicalRecordService.class);
    private final MedicalRecordRepository medicalRecordRepository;
    private final DoctorAppointmentRepository doctorAppointmentRepository;
    
    public MedicalRecordService(MedicalRecordRepository medicalRecordRepository,
                              DoctorAppointmentRepository doctorAppointmentRepository) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.doctorAppointmentRepository = doctorAppointmentRepository;
    }
    
    public Map<String, Object> startExamination(Long appointmentId, Long requestDoctorId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 Starting examination for appointment {} by doctor {}", appointmentId, requestDoctorId);
            
            // Kiểm tra appointment tồn tại
            Optional<PatientRegistration> appointmentOpt = doctorAppointmentRepository.findById(appointmentId);
            if (appointmentOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Không tìm thấy lịch hẹn");
                return response;
            }
            
            PatientRegistration appointment = appointmentOpt.get();
            logger.info("✅ Found appointment: {} for patient: {}", appointmentId, appointment.getFullName());
            logger.info("🎯 Appointment doctor_id: {}", appointment.getDoctorId());
            logger.info("🎯 Request doctor_id: {}", requestDoctorId);
            
            // 🔥 SỬ DỤNG DOCTOR_ID TỪ PATIENT_REGISTRATIONS, KHÔNG PHẢI TỪ REQUEST
            Long actualDoctorId = appointment.getDoctorId();
            
            if (actualDoctorId == null) {
                logger.error("❌ Appointment does not have a doctor assigned");
                response.put("success", false);
                response.put("message", "Lịch hẹn chưa được phân công cho bác sĩ");
                return response;
            }
            
            // Kiểm tra xem doctor có quyền truy cập appointment này không
            if (!actualDoctorId.equals(requestDoctorId)) {
                logger.warn("⚠️ Doctor {} tried to access appointment {} assigned to doctor {}", 
                           requestDoctorId, appointmentId, actualDoctorId);
                response.put("success", false);
                response.put("message", "Bạn không có quyền truy cập lịch hẹn này");
                return response;
            }
            
            // Kiểm tra xem đã có medical record chưa - SỬA: Dùng method mới
            Optional<MedicalRecord> existingRecordOpt = medicalRecordRepository.findFirstByAppointmentIdOrderByCreatedAtDesc(appointmentId);
            
            MedicalRecord medicalRecord;
            if (existingRecordOpt.isPresent()) {
                // Cập nhật record hiện có
                MedicalRecord existingRecord = existingRecordOpt.get();
                existingRecord.setExaminationStatus("IN_PROGRESS");
                medicalRecord = medicalRecordRepository.save(existingRecord);
                logger.info("✅ Continued existing examination record");
            } else {
                // Tạo record mới - SỬ DỤNG DOCTOR_ID TỪ APPOINTMENT
                medicalRecord = new MedicalRecord(appointmentId, actualDoctorId);
                medicalRecord.setExaminationStatus("IN_PROGRESS");
                medicalRecord = medicalRecordRepository.save(medicalRecord);
                logger.info("✅ Created new examination record with doctor ID: {}", actualDoctorId);
            }
            
            // Cập nhật trạng thái appointment
            appointment.setExaminationStatus("IN_PROGRESS");
            doctorAppointmentRepository.save(appointment);
            
            // Tạo response DTO thay vì trả về entity trực tiếp
            Map<String, Object> medicalRecordDTO = createMedicalRecordDTO(medicalRecord);
            Map<String, Object> appointmentDTO = createAppointmentDTO(appointment);
            
            response.put("success", true);
            response.put("message", "Đã bắt đầu khám bệnh");
            response.put("medicalRecord", medicalRecordDTO);
            response.put("appointment", appointmentDTO);
            
            logger.info("✅ Examination started successfully for appointment {}", appointmentId);
            
        } catch (Exception e) {
            logger.error("💥 Error starting examination: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi bắt đầu khám: " + e.getMessage());
        }
        
        return response;
    }
    
    // Helper method để tạo DTO cho MedicalRecord
    private Map<String, Object> createMedicalRecordDTO(MedicalRecord medicalRecord) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", medicalRecord.getId());
        dto.put("appointmentId", medicalRecord.getAppointmentId());
        dto.put("doctorId", medicalRecord.getDoctorId());
        dto.put("examinationDate", medicalRecord.getExaminationDate());
        dto.put("examinationStatus", medicalRecord.getExaminationStatus());
        dto.put("chiefComplaint", medicalRecord.getChiefComplaint());
        dto.put("historyOfIllness", medicalRecord.getHistoryOfIllness());
        dto.put("physicalExamination", medicalRecord.getPhysicalExamination());
        dto.put("vitalSigns", medicalRecord.getVitalSigns());
        dto.put("preliminaryDiagnosis", medicalRecord.getPreliminaryDiagnosis());
        dto.put("finalDiagnosis", medicalRecord.getFinalDiagnosis());
        dto.put("treatmentPlan", medicalRecord.getTreatmentPlan());
        dto.put("medications", medicalRecord.getMedications());
        dto.put("labTests", medicalRecord.getLabTests());
        dto.put("advice", medicalRecord.getAdvice());
        dto.put("followUpDate", medicalRecord.getFollowUpDate());
        dto.put("followUpNotes", medicalRecord.getFollowUpNotes());
        dto.put("createdAt", medicalRecord.getCreatedAt());
        dto.put("updatedAt", medicalRecord.getUpdatedAt());
        return dto;
    }
    
    // Helper method để tạo DTO cho Appointment
    private Map<String, Object> createAppointmentDTO(PatientRegistration appointment) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", appointment.getId());
        dto.put("fullName", appointment.getFullName());
        dto.put("phone", appointment.getPhone());
        dto.put("email", appointment.getEmail());
        dto.put("dob", appointment.getDob());
        dto.put("gender", appointment.getGender());
        dto.put("appointmentDate", appointment.getAppointmentDate());
        dto.put("expectedTimeSlot", appointment.getExpectedTimeSlot());
        dto.put("department", appointment.getDepartment());
        dto.put("symptoms", appointment.getSymptoms());
        dto.put("status", appointment.getStatus());
        dto.put("examinationStatus", appointment.getExaminationStatus());
        dto.put("queueNumber", appointment.getQueueNumber());
        dto.put("roomNumber", appointment.getRoomNumber());
        dto.put("examinationFee", appointment.getExaminationFee());
        dto.put("paymentStatus", appointment.getPaymentStatus());
        dto.put("registrationNumber", appointment.getRegistrationNumber());
        dto.put("doctorId", appointment.getDoctorId()); // THÊM DOCTOR_ID VÀO DTO
        dto.put("createdAt", appointment.getCreatedAt());
        return dto;
    }
    
    // SỬA LẠI METHOD saveMedicalRecord để tránh tạo nhiều bản ghi
    public Map<String, Object> saveMedicalRecord(MedicalRecord medicalRecord) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("💾 Saving medical record for appointment {}", medicalRecord.getAppointmentId());
            
            // KIỂM TRA XEM ĐÃ CÓ MEDICAL RECORD CHƯA
            Optional<MedicalRecord> existingRecordOpt = medicalRecordRepository.findFirstByAppointmentIdOrderByCreatedAtDesc(medicalRecord.getAppointmentId());
            
            MedicalRecord recordToSave;
            if (existingRecordOpt.isPresent()) {
                // CẬP NHẬT RECORD HIỆN TẠI
                recordToSave = existingRecordOpt.get();
                updateMedicalRecordFields(recordToSave, medicalRecord);
                logger.info("✅ Updated existing medical record");
            } else {
                // TẠO MỚI
                recordToSave = medicalRecord;
                logger.info("✅ Created new medical record");
            }
            
            MedicalRecord savedRecord = medicalRecordRepository.save(recordToSave);
            
            // NẾU LÀ COMPLETED, CẬP NHẬT CẢ APPOINTMENT
            if ("COMPLETED".equals(savedRecord.getExaminationStatus())) {
                updateAppointmentStatus(savedRecord.getAppointmentId(), "COMPLETED", "COMPLETED");
            }
            
            Map<String, Object> medicalRecordDTO = createMedicalRecordDTO(savedRecord);
            
            response.put("success", true);
            response.put("message", "Đã lưu kết quả khám");
            response.put("medicalRecord", medicalRecordDTO);
            
            logger.info("✅ Medical record saved successfully");
            
        } catch (Exception e) {
            logger.error("💥 Error saving medical record: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi lưu kết quả khám: " + e.getMessage());
        }
        
        return response;
    }

    // THÊM METHOD HELPER ĐỂ CẬP NHẬT TRƯỜNG
    private void updateMedicalRecordFields(MedicalRecord existing, MedicalRecord newData) {
        existing.setChiefComplaint(newData.getChiefComplaint());
        existing.setHistoryOfIllness(newData.getHistoryOfIllness());
        existing.setPhysicalExamination(newData.getPhysicalExamination());
        existing.setVitalSigns(newData.getVitalSigns());
        existing.setPreliminaryDiagnosis(newData.getPreliminaryDiagnosis());
        existing.setFinalDiagnosis(newData.getFinalDiagnosis());
        existing.setTreatmentPlan(newData.getTreatmentPlan());
        existing.setMedications(newData.getMedications());
        existing.setLabTests(newData.getLabTests());
        existing.setAdvice(newData.getAdvice());
        existing.setFollowUpDate(newData.getFollowUpDate());
        existing.setFollowUpNotes(newData.getFollowUpNotes());
        existing.setExaminationStatus(newData.getExaminationStatus());
    }

    // THÊM METHOD HELPER ĐỂ CẬP NHẬT APPOINTMENT
    private void updateAppointmentStatus(Long appointmentId, String examinationStatus, String status) {
        try {
            Optional<PatientRegistration> appointmentOpt = doctorAppointmentRepository.findById(appointmentId);
            if (appointmentOpt.isPresent()) {
                PatientRegistration appointment = appointmentOpt.get();
                appointment.setExaminationStatus(examinationStatus);
                appointment.setStatus(status);
                doctorAppointmentRepository.save(appointment);
                logger.info("✅ Updated appointment status to: {}", status);
            }
        } catch (Exception e) {
            logger.error("❌ Error updating appointment status: {}", e.getMessage());
        }
    }
    
    // SỬA LẠI METHOD completeExamination
    public Map<String, Object> completeExamination(Long appointmentId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("✅ Completing examination for appointment {}", appointmentId);
            
            // SỬA: Sử dụng method mới để lấy record mới nhất
            Optional<MedicalRecord> medicalRecordOpt = medicalRecordRepository.findFirstByAppointmentIdOrderByCreatedAtDesc(appointmentId);
            if (medicalRecordOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Không tìm thấy hồ sơ khám bệnh");
                return response;
            }
            
            MedicalRecord medicalRecord = medicalRecordOpt.get();
            medicalRecord.setExaminationStatus("COMPLETED");
            MedicalRecord savedRecord = medicalRecordRepository.save(medicalRecord);
            
            // Cập nhật appointment
            updateAppointmentStatus(appointmentId, "COMPLETED", "COMPLETED");
            
            // Sử dụng DTO
            Map<String, Object> medicalRecordDTO = createMedicalRecordDTO(savedRecord);
            
            response.put("success", true);
            response.put("message", "Đã hoàn thành khám bệnh");
            response.put("medicalRecord", medicalRecordDTO);
            
            logger.info("✅ Examination completed successfully");
            
        } catch (Exception e) {
            logger.error("💥 Error completing examination: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi hoàn thành khám: " + e.getMessage());
        }
        
        return response;
    }
    
    public Map<String, Object> markAsMissed(Long appointmentId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🚫 Marking appointment {} as missed", appointmentId);
            
            Optional<PatientRegistration> appointmentOpt = doctorAppointmentRepository.findById(appointmentId);
            if (appointmentOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Không tìm thấy lịch hẹn");
                return response;
            }
            
            PatientRegistration appointment = appointmentOpt.get();
            appointment.setExaminationStatus("MISSED");
            appointment.setStatus("CANCELLED");
            PatientRegistration savedAppointment = doctorAppointmentRepository.save(appointment);
            
            // Sử dụng DTO
            Map<String, Object> appointmentDTO = createAppointmentDTO(savedAppointment);
            
            response.put("success", true);
            response.put("message", "Đã đánh dấu không đi khám");
            response.put("appointment", appointmentDTO);
            
            logger.info("✅ Appointment marked as missed");
            
        } catch (Exception e) {
            logger.error("💥 Error marking as missed: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi đánh dấu không đi khám: " + e.getMessage());
        }
        
        return response;
    }
    
    // SỬA LẠI METHOD getExaminationDetail
    public Map<String, Object> getExaminationDetail(Long appointmentId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 Getting examination detail for appointment {}", appointmentId);
            
            Optional<PatientRegistration> appointmentOpt = doctorAppointmentRepository.findById(appointmentId);
            if (appointmentOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Không tìm thấy lịch hẹn");
                return response;
            }
            
            PatientRegistration appointment = appointmentOpt.get();
            
            // SỬA: Sử dụng method mới để lấy record mới nhất
            Optional<MedicalRecord> medicalRecordOpt = medicalRecordRepository.findFirstByAppointmentIdOrderByCreatedAtDesc(appointmentId);
            
            // Sử dụng DTO
            Map<String, Object> appointmentDTO = createAppointmentDTO(appointment);
            Map<String, Object> medicalRecordDTO = medicalRecordOpt.map(this::createMedicalRecordDTO).orElse(null);
            
            response.put("success", true);
            response.put("appointment", appointmentDTO);
            response.put("medicalRecord", medicalRecordDTO);
            
        } catch (Exception e) {
            logger.error("💥 Error getting examination detail: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi lấy thông tin khám: " + e.getMessage());
        }
        
        return response;
    }

    // THÊM METHOD MỚI: Lấy danh sách hồ sơ bệnh án theo doctor ID
    public Map<String, Object> getMedicalRecordsByDoctor(Long doctorId, int page, int size) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔍 Getting medical records for doctor ID: {}, page: {}, size: {}", doctorId, page, size);
            
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "examinationDate"));
            Page<MedicalRecord> medicalRecordsPage = medicalRecordRepository.findByDoctorId(doctorId, pageable);
            
            List<Map<String, Object>> medicalRecordsDTO = medicalRecordsPage.getContent()
                    .stream()
                    .map(this::createMedicalRecordWithPatientDTO)
                    .collect(Collectors.toList());
            
            response.put("success", true);
            response.put("medicalRecords", medicalRecordsDTO);
            response.put("currentPage", medicalRecordsPage.getNumber());
            response.put("totalPages", medicalRecordsPage.getTotalPages());
            response.put("totalItems", medicalRecordsPage.getTotalElements());
            
            logger.info("✅ Found {} medical records for doctor {}", medicalRecordsDTO.size(), doctorId);
            
        } catch (Exception e) {
            logger.error("💥 Error getting medical records: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Lỗi khi lấy danh sách hồ sơ bệnh án: " + e.getMessage());
        }
        
        return response;
    }

    // THÊM METHOD MỚI: Tạo DTO với thông tin patient
    private Map<String, Object> createMedicalRecordWithPatientDTO(MedicalRecord medicalRecord) {
        Map<String, Object> dto = createMedicalRecordDTO(medicalRecord);
        
        try {
            // Lấy thông tin patient từ appointment
            Optional<PatientRegistration> appointmentOpt = doctorAppointmentRepository.findById(medicalRecord.getAppointmentId());
            if (appointmentOpt.isPresent()) {
                PatientRegistration appointment = appointmentOpt.get();
                dto.put("patientName", appointment.getFullName());
                dto.put("patientPhone", appointment.getPhone());
                dto.put("patientEmail", appointment.getEmail());
                dto.put("patientDob", appointment.getDob());
                dto.put("patientGender", appointment.getGender());
                dto.put("appointmentDate", appointment.getAppointmentDate());
                dto.put("symptoms", appointment.getSymptoms());
            }
        } catch (Exception e) {
            logger.warn("⚠️ Could not load patient info for medical record {}: {}", medicalRecord.getId(), e.getMessage());
        }
        
        return dto;
    }

    // Thêm vào MedicalRecordService
public Map<String, Object> checkPaymentStatus(Long appointmentId) {
    Map<String, Object> response = new HashMap<>();
    
    try {
        Optional<PatientRegistration> appointmentOpt = doctorAppointmentRepository.findById(appointmentId);
        if (appointmentOpt.isPresent()) {
            PatientRegistration appointment = appointmentOpt.get();
            boolean isPaid = "PAID".equals(appointment.getPaymentStatus());
            
            response.put("success", true);
            response.put("isPaid", isPaid);
            response.put("paymentStatus", appointment.getPaymentStatus());
        } else {
            response.put("success", false);
            response.put("message", "Không tìm thấy lịch hẹn");
        }
    } catch (Exception e) {
        logger.error("💥 Error checking payment status: {}", e.getMessage(), e);
        response.put("success", false);
        response.put("message", "Lỗi khi kiểm tra trạng thái thanh toán");
    }
    
    return response;
}
}