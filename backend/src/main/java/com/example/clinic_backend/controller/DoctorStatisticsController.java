package com.example.clinic_backend.controller;

import com.example.clinic_backend.service.DoctorStatisticsService;
import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.repository.DoctorRepository;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/doctor/statistics")
@CrossOrigin(origins = "http://localhost:5173")
public class DoctorStatisticsController {
    
    @Autowired
    private DoctorStatisticsService statisticsService;
    
    @Autowired
    private DoctorRepository doctorRepository;
    
    @Autowired
    private PatientRegistrationRepository patientRegistrationRepository;
    
    // Lấy thống kê theo chu kỳ
    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getStatistics(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "TODAY") String period) {
        
        System.out.println("📊 [Controller] Getting statistics for userId: " + userId + ", period: " + period);
        
        try {
            // Tìm doctor theo userId
            var doctorOpt = doctorRepository.findByUserId(userId);
            if (!doctorOpt.isPresent()) {
                System.out.println("❌ [Controller] Không tìm thấy bác sĩ với userId: " + userId);
                
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Không tìm thấy thông tin bác sĩ cho user ID: " + userId);
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            var doctor = doctorOpt.get();
            Long doctorId = doctor.getId();
            
            System.out.println("✅ [Controller] Mapping: userId=" + userId + " -> doctorId=" + doctorId + 
                             ", doctorName=" + doctor.getFullName());
            
            // Gọi service với doctorId đúng
            Map<String, Object> statistics = statisticsService.getDoctorStatistics(doctorId, period);
            
            return ResponseEntity.ok(statistics);
            
        } catch (Exception e) {
            System.out.println("💥 [Controller] Error: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    // Lấy thống kê tùy chỉnh theo khoảng thời gian
    @GetMapping("/custom/{userId}")
    public ResponseEntity<Map<String, Object>> getCustomStatistics(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        System.out.println("📊 [Controller] Getting custom statistics for userId: " + userId + 
                          ", from " + startDate + " to " + endDate);
        
        try {
            // Tìm doctor theo userId
            var doctorOpt = doctorRepository.findByUserId(userId);
            if (!doctorOpt.isPresent()) {
                System.out.println("❌ [Controller] Không tìm thấy bác sĩ với userId: " + userId);
                
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Không tìm thấy thông tin bác sĩ cho user ID: " + userId);
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            var doctor = doctorOpt.get();
            Long doctorId = doctor.getId();
            
            System.out.println("✅ [Controller] Custom Mapping: userId=" + userId + " -> doctorId=" + doctorId);
            
            Map<String, Object> statistics = statisticsService.getCustomStatistics(doctorId, startDate, endDate);
            return ResponseEntity.ok(statistics);
            
        } catch (Exception e) {
            System.out.println("💥 [Controller] Error: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    // Cập nhật thống kê
    @PostMapping("/update/{userId}")
    public ResponseEntity<Map<String, Object>> updateStatistics(@PathVariable Long userId) {
        System.out.println("🔄 [Controller] Updating statistics for userId: " + userId);
        
        try {
            // Tìm doctor theo userId
            var doctorOpt = doctorRepository.findByUserId(userId);
            if (!doctorOpt.isPresent()) {
                System.out.println("❌ [Controller] Không tìm thấy bác sĩ với userId: " + userId);
                
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Không tìm thấy thông tin bác sĩ cho user ID: " + userId);
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            var doctor = doctorOpt.get();
            Long doctorId = doctor.getId();
            
            System.out.println("✅ [Controller] Update Mapping: userId=" + userId + " -> doctorId=" + doctorId);
            
            statisticsService.updateDailyStatistics(doctorId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Cập nhật thống kê thành công");
            response.put("doctorId", doctorId);
            response.put("doctorName", doctor.getFullName());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.out.println("💥 [Controller] Error: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    // API test để kiểm tra mapping
    @GetMapping("/test-mapping/{userId}")
    public ResponseEntity<Map<String, Object>> testMapping(@PathVariable Long userId) {
        System.out.println("🧪 [Controller] Testing mapping for userId: " + userId);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            var doctorOpt = doctorRepository.findByUserId(userId);
            if (!doctorOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "Không tìm thấy bác sĩ với userId: " + userId);
                
                // Thử tìm trực tiếp trong bảng doctors
                var directDoctorOpt = doctorRepository.findById(userId);
                if (directDoctorOpt.isPresent()) {
                    response.put("note", "Found doctor directly with id=" + userId + 
                                       ", name=" + directDoctorOpt.get().getFullName());
                }
            } else {
                var doctor = doctorOpt.get();
                response.put("success", true);
                response.put("userId", userId);
                response.put("doctorId", doctor.getId());
                response.put("doctorName", doctor.getFullName());
                response.put("doctorUserId", doctor.getUserId());
                response.put("message", "Mapping thành công!");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/debug/{doctorId}")
    public ResponseEntity<Map<String, Object>> debugDoctorStatistics(
            @PathVariable Long doctorId,
            @RequestParam LocalDate date) {
        
        System.out.println("🔍 DEBUG API for doctorId: " + doctorId + ", date: " + date);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 1. Kiểm tra doctor có tồn tại không
            var doctorOpt = doctorRepository.findById(doctorId);
            if (!doctorOpt.isPresent()) {
                response.put("doctorExists", false);
                response.put("message", "Doctor not found");
                return ResponseEntity.ok(response);
            }
            
            var doctor = doctorOpt.get();
            response.put("doctorExists", true);
            response.put("doctorId", doctor.getId());
            response.put("doctorName", doctor.getFullName());
            response.put("doctorUserId", doctor.getUserId());
            
            // 2. Kiểm appointments trong ngày (tất cả status)
            List<PatientRegistration> appointments = patientRegistrationRepository
                    .findByDoctorAndDateAndSession(doctorId, date, null);
            
            response.put("appointmentsCount", appointments.size());
            
            // Sửa lỗi: Kiểm tra method getPatientName có tồn tại không
            List<Map<String, Object>> appointmentList = appointments.stream()
                    .map(apt -> {
                        Map<String, Object> appointmentMap = new HashMap<>();
                        appointmentMap.put("id", apt.getId());
                        
                        // Kiểm tra xem có method getPatientName không, nếu không dùng getFullName
                        try {
                            // Thử với getPatientName (nếu có)
                            Object patientName = apt.getClass().getMethod("getPatientName").invoke(apt);
                            appointmentMap.put("patientName", patientName);
                        } catch (Exception e) {
                            // Nếu không có, dùng phương thức khác hoặc để trống
                            appointmentMap.put("patientName", "Unknown");
                        }
                        
                        appointmentMap.put("status", apt.getStatus());
                        
                        try {
                            Object examStatus = apt.getClass().getMethod("getExaminationStatus").invoke(apt);
                            appointmentMap.put("examinationStatus", examStatus);
                        } catch (Exception e) {
                            appointmentMap.put("examinationStatus", "N/A");
                        }
                        
                        try {
                            Object session = apt.getClass().getMethod("getAssignedSession").invoke(apt);
                            appointmentMap.put("assignedSession", session);
                        } catch (Exception e) {
                            appointmentMap.put("assignedSession", "N/A");
                        }
                        
                        try {
                            Object apptDate = apt.getClass().getMethod("getAppointmentDate").invoke(apt);
                            appointmentMap.put("appointmentDate", apptDate);
                        } catch (Exception e) {
                            appointmentMap.put("appointmentDate", date.toString());
                        }
                        
                        appointmentMap.put("doctorId", apt.getDoctorId());
                        return appointmentMap;
                    })
                    .collect(Collectors.toList());
            
            response.put("appointments", appointmentList);
            
            // 3. Tính thống kê chi tiết - SỬA LỖI Anonymous class
            int total = appointments.size();
            int completed = 0;
            int cancelled = 0;
            int noShow = 0;
            int approved = 0;
            int pending = 0;
            
            for (PatientRegistration apt : appointments) {
                String status = apt.getStatus();
                if ("COMPLETED".equals(status)) completed++;
                if ("CANCELLED".equals(status)) cancelled++;
                if ("APPROVED".equals(status)) approved++;
                if ("PENDING".equals(status)) pending++;
                
                try {
                    Object examStatus = apt.getClass().getMethod("getExaminationStatus").invoke(apt);
                    if ("MISSED".equals(examStatus)) noShow++;
                } catch (Exception e) {
                    // Ignore
                }
            }
            
            // SỬA: Không dùng anonymous class, dùng Map.of
            Map<String, Object> statsMap = new HashMap<>();
            statsMap.put("total", total);
            statsMap.put("completed", completed);
            statsMap.put("cancelled", cancelled);
            statsMap.put("noShow", noShow);
            statsMap.put("approved", approved);
            statsMap.put("pending", pending);
            
            response.put("stats", statsMap);
            
            // 4. Thống kê theo session
            Map<String, Long> sessionStats = appointments.stream()
                    .collect(Collectors.groupingBy(
                            apt -> {
                                try {
                                    Object session = apt.getClass().getMethod("getAssignedSession").invoke(apt);
                                    return session != null ? session.toString() : "Unknown";
                                } catch (Exception e) {
                                    return "Unknown";
                                }
                            },
                            Collectors.counting()
                    ));
            response.put("sessionStats", sessionStats);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // API để kiểm tra tất cả appointments của doctor
    @GetMapping("/all-appointments/{doctorId}")
    public ResponseEntity<Map<String, Object>> getAllAppointments(
            @PathVariable Long doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        System.out.println("📋 [Controller] Getting all appointments for doctorId: " + doctorId);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            var doctorOpt = doctorRepository.findById(doctorId);
            if (!doctorOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "Doctor not found");
                return ResponseEntity.ok(response);
            }
            
            var doctor = doctorOpt.get();
            response.put("doctorId", doctorId);
            response.put("doctorName", doctor.getFullName());
            
            List<PatientRegistration> appointments;
            
            if (startDate != null && endDate != null) {
                // Lấy theo khoảng thời gian
                appointments = patientRegistrationRepository.findByDoctorIdAndDateRange(doctorId, startDate, endDate);
                response.put("dateRange", startDate + " to " + endDate);
            } else {
                // Lấy tất cả
                appointments = patientRegistrationRepository.findAll().stream()
                        .filter(apt -> doctorId.equals(apt.getDoctorId()))
                        .collect(Collectors.toList());
            }
            
            response.put("totalAppointments", appointments.size());
            
            List<Map<String, Object>> appointmentList = appointments.stream()
                    .map(apt -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", apt.getId());
                        
                        try {
                            Object patientName = apt.getClass().getMethod("getPatientName").invoke(apt);
                            map.put("patientName", patientName);
                        } catch (Exception e) {
                            map.put("patientName", "Unknown");
                        }
                        
                        try {
                            Object apptDate = apt.getClass().getMethod("getAppointmentDate").invoke(apt);
                            map.put("appointmentDate", apptDate);
                        } catch (Exception e) {
                            map.put("appointmentDate", "N/A");
                        }
                        
                        try {
                            Object session = apt.getClass().getMethod("getAssignedSession").invoke(apt);
                            map.put("assignedSession", session);
                        } catch (Exception e) {
                            map.put("assignedSession", "N/A");
                        }
                        
                        map.put("status", apt.getStatus());
                        
                        try {
                            Object examStatus = apt.getClass().getMethod("getExaminationStatus").invoke(apt);
                            map.put("examinationStatus", examStatus);
                        } catch (Exception e) {
                            map.put("examinationStatus", "N/A");
                        }
                        
                        try {
                            Object createdAt = apt.getClass().getMethod("getCreatedAt").invoke(apt);
                            map.put("createdAt", createdAt);
                        } catch (Exception e) {
                            map.put("createdAt", "N/A");
                        }
                        
                        return map;
                    })
                    .collect(Collectors.toList());
            
            response.put("appointments", appointmentList);
            
            response.put("success", true);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // API để kiểm tra database có appointments không
    @GetMapping("/check-database/{doctorId}")
    public ResponseEntity<Map<String, Object>> checkDatabase(@PathVariable Long doctorId) {
        System.out.println("🔍 [Controller] Checking database for doctorId: " + doctorId);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 1. Kiểm tra doctor có tồn tại không
            var doctorOpt = doctorRepository.findById(doctorId);
            if (!doctorOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "Doctor not found with ID: " + doctorId);
                return ResponseEntity.ok(response);
            }
            
            var doctor = doctorOpt.get();
            response.put("doctor", new HashMap<String, Object>() {{
                put("id", doctor.getId());
                put("name", doctor.getFullName());
                put("userId", doctor.getUserId());
            }});
            
            // 2. Lấy TẤT CẢ appointments của doctor này
            List<PatientRegistration> allAppointments = patientRegistrationRepository.findAll()
                    .stream()
                    .filter(apt -> doctorId.equals(apt.getDoctorId()))
                    .collect(Collectors.toList());
            
            response.put("totalAppointmentsInDB", allAppointments.size());
            
            // 3. Phân tích appointments theo ngày và status
            Map<String, Long> appointmentsByDate = new HashMap<>();
            Map<String, Long> appointmentsByStatus = new HashMap<>();
            
            for (PatientRegistration apt : allAppointments) {
                // Theo ngày
                String dateStr = apt.getAppointmentDate().toString();
                appointmentsByDate.put(dateStr, appointmentsByDate.getOrDefault(dateStr, 0L) + 1);
                
                // Theo status
                String status = apt.getStatus();
                appointmentsByStatus.put(status, appointmentsByStatus.getOrDefault(status, 0L) + 1);
            }
            
            response.put("appointmentsByDate", appointmentsByDate);
            response.put("appointmentsByStatus", appointmentsByStatus);
            
            // 4. Lấy 5 appointments gần nhất để kiểm tra
            List<Map<String, Object>> recentAppointments = allAppointments.stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .limit(5)
                    .map(apt -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", apt.getId());
                        map.put("appointmentDate", apt.getAppointmentDate().toString());
                        map.put("status", apt.getStatus());
                        map.put("assignedSession", apt.getAssignedSession());
                        map.put("examinationStatus", apt.getExaminationStatus() != null ? apt.getExaminationStatus() : "null");
                        map.put("createdAt", apt.getCreatedAt().toString());
                        return map;
                    })
                    .collect(Collectors.toList());
            
            response.put("recentAppointments", recentAppointments);
            
            // 5. Kiểm tra appointments trong vòng 7 ngày gần đây
            LocalDate today = LocalDate.now();
            LocalDate weekAgo = today.minusDays(7);
            
            long appointmentsLastWeek = allAppointments.stream()
                    .filter(apt -> !apt.getAppointmentDate().isBefore(weekAgo) && !apt.getAppointmentDate().isAfter(today))
                    .count();
            
            response.put("appointmentsLast7Days", appointmentsLastWeek);
            
            response.put("success", true);
            response.put("message", "Database check completed");
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            e.printStackTrace();
        }
        
        return ResponseEntity.ok(response);
    }
}