package com.example.clinic_backend.service;

import com.example.clinic_backend.model.DoctorStatistics;
import com.example.clinic_backend.model.PatientRegistration;
import com.example.clinic_backend.model.Doctor;
import com.example.clinic_backend.repository.DoctorStatisticsRepository;
import com.example.clinic_backend.repository.PatientRegistrationRepository;
import com.example.clinic_backend.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.format.DateTimeFormatter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DoctorStatisticsService {
    
    @Autowired
    private DoctorStatisticsRepository statisticsRepository;
    
    @Autowired
    private PatientRegistrationRepository patientRegistrationRepository;
    
    @Autowired
    private DoctorRepository doctorRepository;
    
    // Cập nhật thống kê hàng ngày
    @Transactional
    public void updateDailyStatistics(Long doctorId) {
        LocalDate today = LocalDate.now();
        updateStatisticsForDate(doctorId, today);
    }
    
    // Cập nhật thống kê cho một ngày cụ thể
    @Transactional
    public void updateStatisticsForDate(Long doctorId, LocalDate date) {
        System.out.println("🔄 [Service] Updating stats for doctorId: " + doctorId + ", date: " + date);
        
        DoctorStatistics stats = statisticsRepository
                .findByDoctorIdAndStatDateAndStatType(doctorId, date, "DAY")
                .orElse(new DoctorStatistics(doctorId, date, "DAY"));
        
        // Lấy tất cả lịch hẹn của bác sĩ trong ngày (tất cả status)
        List<PatientRegistration> todayAppointments = patientRegistrationRepository
                .findByDoctorAndDateAndSession(doctorId, date, null);
        
        System.out.println("📅 [Service] Found " + todayAppointments.size() + " appointments for date: " + date);
        
        // Log chi tiết từng appointment
        todayAppointments.forEach(apt -> {
            System.out.println("   - Appointment ID: " + apt.getId() + 
                             ", Status: " + apt.getStatus() + 
                             ", Exam Status: " + apt.getExaminationStatus() +
                             ", Session: " + apt.getAssignedSession());
        });
        
        // Tính toán thống kê
        int total = todayAppointments.size();
        int completed = (int) todayAppointments.stream()
                .filter(apt -> "COMPLETED".equals(apt.getStatus()))
                .count();
        int cancelled = (int) todayAppointments.stream()
                .filter(apt -> "CANCELLED".equals(apt.getStatus()))
                .count();
        int noShow = (int) todayAppointments.stream()
                .filter(apt -> "MISSED".equals(apt.getExaminationStatus()))
                .count();
        
        System.out.println("📊 [Service] Calculated stats - Total: " + total + 
                          ", Completed: " + completed + 
                          ", Cancelled: " + cancelled + 
                          ", NoShow: " + noShow);
        
        // Cập nhật giá trị
        stats.setTotalAppointments(total);
        stats.setCompletedAppointments(completed);
        stats.setCancelledAppointments(cancelled);
        stats.setNoShowAppointments(noShow);
        stats.calculateSuccessRate();
        
        statisticsRepository.save(stats);
        System.out.println("✅ [Service] Daily stats saved for doctorId: " + doctorId);
    }
    
    // Lấy thống kê chi tiết
    public Map<String, Object> getDoctorStatistics(Long doctorId, String period) {
        System.out.println("📊 [Service] Getting statistics for doctorId: " + doctorId + ", period: " + period);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Doctor doctor = doctorRepository.findById(doctorId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bác sĩ với ID: " + doctorId));
            
            System.out.println("✅ [Service] Found doctor: " + doctor.getFullName() + 
                             " (userId=" + doctor.getUserId() + ")");
            
            LocalDate today = LocalDate.now();
            LocalDate startDate = today;
            LocalDate endDate = today;
            Map<String, Object> chartData = new HashMap<>();
            
            // Xác định khoảng thời gian dựa trên period
            switch (period.toUpperCase()) {
                case "TODAY":
                    startDate = today;
                    endDate = today;
                    chartData = prepareHourlyChartData(doctorId, today);
                    System.out.println("📅 [Service] TODAY range: " + startDate);
                    break;
                case "WEEK":
                    startDate = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                    endDate = today;
                    chartData = prepareChartData(doctorId, startDate, endDate, "WEEK");
                    System.out.println("📅 [Service] WEEK range: " + startDate + " to " + endDate);
                    break;
                case "MONTH":
                    startDate = today.withDayOfMonth(1);
                    endDate = today;
                    chartData = prepareChartData(doctorId, startDate, endDate, "MONTH");
                    System.out.println("📅 [Service] MONTH range: " + startDate + " to " + endDate);
                    break;
                default:
                    startDate = today;
                    endDate = today;
                    chartData = prepareChartData(doctorId, startDate, endDate, "DAY");
            }
            
            // Lấy tất cả lịch hẹn trong khoảng thời gian
            List<PatientRegistration> appointments = getAppointmentsByDateRange(doctorId, startDate, endDate);
            System.out.println("📋 [Service] Total appointments in range: " + appointments.size());
            
            // Tính toán thống kê
            Map<String, Object> statsMap = calculateStatisticsFromAppointments(appointments);
            
            response.put("success", true);
            response.put("doctorId", doctorId);
            response.put("doctorName", doctor.getFullName());
            response.put("period", period);
            response.put("startDate", startDate.toString());
            response.put("endDate", endDate.toString());
            response.put("stats", statsMap);
            response.put("successRate", statsMap.get("successRate"));
            response.put("failureRate", statsMap.get("failureRate"));
            response.put("chartData", chartData);
            response.put("lastUpdated", LocalDateTime.now().toString());
            
            System.out.println("✅ [Service] Statistics prepared successfully for doctorId: " + doctorId);
            System.out.println("📈 [Service] Stats: " + statsMap);
            
        } catch (Exception e) {
            System.out.println("💥 [Service] Error getting statistics: " + e.getMessage());
            e.printStackTrace();
            
            response.put("success", false);
            response.put("message", "Lỗi khi lấy thống kê: " + e.getMessage());
        }
        
        return response;
    }
    
    // Lấy dữ liệu thống kê theo khoảng thời gian tùy chỉnh
    public Map<String, Object> getCustomStatistics(Long doctorId, LocalDate startDate, LocalDate endDate) {
        System.out.println("📊 [Service] Getting custom statistics for doctorId: " + doctorId + 
                          ", from " + startDate + " to " + endDate);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Doctor doctor = doctorRepository.findById(doctorId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bác sĩ với ID: " + doctorId));
            
            // Lấy tất cả lịch hẹn trong khoảng thời gian
            List<PatientRegistration> appointments = getAppointmentsByDateRange(doctorId, startDate, endDate);
            System.out.println("📋 [Service] Custom range appointments: " + appointments.size());
            
            // Tính toán thống kê
            Map<String, Object> statsMap = calculateStatisticsFromAppointments(appointments);
            
            // Chuẩn bị dữ liệu biểu đồ
            Map<String, Object> chartData = prepareChartData(doctorId, startDate, endDate, "CUSTOM");
            
            response.put("success", true);
            response.put("doctorId", doctorId);
            response.put("doctorName", doctor.getFullName());
            response.put("period", "CUSTOM");
            response.put("startDate", startDate.toString());
            response.put("endDate", endDate.toString());
            response.put("stats", statsMap);
            response.put("successRate", statsMap.get("successRate"));
            response.put("failureRate", statsMap.get("failureRate"));
            response.put("chartData", chartData);
            response.put("lastUpdated", LocalDateTime.now().toString());
            
            System.out.println("✅ [Service] Custom statistics prepared successfully");
            
        } catch (Exception e) {
            System.out.println("💥 [Service] Error getting custom statistics: " + e.getMessage());
            
            response.put("success", false);
            response.put("message", "Lỗi khi lấy thống kê: " + e.getMessage());
        }
        
        return response;
    }
    
    // Helper methods
    private List<PatientRegistration> getAppointmentsByDateRange(Long doctorId, LocalDate startDate, LocalDate endDate) {
    System.out.println("🔍 [Service] Getting appointments for doctorId: " + doctorId + 
                      ", from " + startDate + " to " + endDate);
    
    // Sử dụng phương thức mới từ repository - Lấy TẤT CẢ appointments trong khoảng thời gian
    List<PatientRegistration> appointments = patientRegistrationRepository
            .findByDoctorIdAndDateRange(doctorId, startDate, endDate);
    
    System.out.println("📅 [Service] Found " + appointments.size() + " appointments in range");
    
    // Log chi tiết từng appointment
    if (appointments.isEmpty()) {
        System.out.println("⚠️ [Service] No appointments found for doctorId: " + doctorId);
        
        // Kiểm tra xem có appointments nào trong database không
        List<PatientRegistration> allAppointments = patientRegistrationRepository.findAll();
        long totalForDoctor = allAppointments.stream()
                .filter(apt -> doctorId.equals(apt.getDoctorId()))
                .count();
        System.out.println("📊 [Service] Total appointments for this doctor in entire DB: " + totalForDoctor);
        
        // Hiển thị một vài appointments mẫu để debug
        if (totalForDoctor > 0) {
            System.out.println("🔍 Sample appointments for doctor " + doctorId + ":");
            allAppointments.stream()
                .filter(apt -> doctorId.equals(apt.getDoctorId()))
                .limit(5)
                .forEach(apt -> {
                    try {
                        System.out.println("   - ID: " + apt.getId() + 
                                         ", Date: " + apt.getAppointmentDate() + 
                                         ", Status: " + apt.getStatus() +
                                         ", Exam Status: " + (apt.getExaminationStatus() != null ? apt.getExaminationStatus() : "null"));
                    } catch (Exception e) {
                        System.out.println("   - ID: " + apt.getId() + " (error getting details)");
                    }
                });
        }
    } else {
        // Log chi tiết các appointments tìm thấy
        appointments.forEach(apt -> {
            try {
                System.out.println("📅 Found appointment: " + 
                                 "ID=" + apt.getId() + 
                                 ", Date=" + apt.getAppointmentDate() + 
                                 ", Status=" + apt.getStatus() + 
                                 ", Session=" + apt.getAssignedSession() +
                                 ", ExamStatus=" + (apt.getExaminationStatus() != null ? apt.getExaminationStatus() : "null"));
            } catch (Exception e) {
                System.out.println("📅 Found appointment ID=" + apt.getId() + " (some fields unavailable)");
            }
        });
    }
    
    return appointments;
}
    
    private Map<String, Object> calculateStatisticsFromAppointments(List<PatientRegistration> appointments) {
        Map<String, Object> stats = new HashMap<>();
        
        int total = appointments.size();
        int completed = (int) appointments.stream()
                .filter(apt -> "COMPLETED".equals(apt.getStatus()))
                .count();
        int cancelled = (int) appointments.stream()
                .filter(apt -> "CANCELLED".equals(apt.getStatus()))
                .count();
        int noShow = (int) appointments.stream()
                .filter(apt -> "MISSED".equals(apt.getExaminationStatus()))
                .count();
        
        double successRate = total > 0 ? ((double) completed / total) * 100 : 0.0;
        double failureRate = 100 - successRate;
        
        stats.put("totalAppointments", total);
        stats.put("completedAppointments", completed);
        stats.put("cancelledAppointments", cancelled);
        stats.put("noShowAppointments", noShow);
        stats.put("successRate", Math.round(successRate * 100.0) / 100.0);
        stats.put("failureRate", Math.round(failureRate * 100.0) / 100.0);
        
        // Thêm các stat khác để debug
        stats.put("approvedAppointments", (int) appointments.stream()
                .filter(apt -> "APPROVED".equals(apt.getStatus()))
                .count());
        stats.put("pendingAppointments", (int) appointments.stream()
                .filter(apt -> "PENDING".equals(apt.getStatus()))
                .count());
        
        System.out.println("🧮 [Service] Calculated stats - Total: " + total + 
                          ", Completed: " + completed + 
                          ", Cancelled: " + cancelled + 
                          ", NoShow: " + noShow +
                          ", Success Rate: " + successRate + "%");
        
        return stats;
    }
    
    private Map<String, Object> prepareChartData(Long doctorId, LocalDate startDate, LocalDate endDate, String period) {
        Map<String, Object> chartData = new HashMap<>();
        List<String> labels = new ArrayList<>();
        List<Integer> totals = new ArrayList<>();
        List<Integer> completeds = new ArrayList<>();
        List<Double> successRates = new ArrayList<>();
        
        LocalDate currentDate = startDate;
        
        System.out.println("📈 [Service] Preparing chart data for period: " + period + 
                          ", from " + startDate + " to " + endDate);
        
        while (!currentDate.isAfter(endDate)) {
            // Lấy appointments của ngày hiện tại
            List<PatientRegistration> dailyAppointments = patientRegistrationRepository
                    .findByDoctorAndDateAndSession(doctorId, currentDate, null);
            
            int dailyTotal = dailyAppointments.size();
            int dailyCompleted = (int) dailyAppointments.stream()
                    .filter(apt -> "COMPLETED".equals(apt.getStatus()))
                    .count();
            double dailySuccessRate = dailyTotal > 0 ? ((double) dailyCompleted / dailyTotal) * 100 : 0.0;
            
            // Format label dựa trên period
            String label;
            switch (period.toUpperCase()) {
                case "WEEK":
                    label = currentDate.getDayOfWeek().toString().substring(0, 3) + 
                           " " + currentDate.format(DateTimeFormatter.ofPattern("dd/MM"));
                    break;
                case "MONTH":
                    label = String.valueOf(currentDate.getDayOfMonth());
                    break;
                case "CUSTOM":
                    label = currentDate.format(DateTimeFormatter.ofPattern("dd/MM"));
                    break;
                default:
                    label = currentDate.format(DateTimeFormatter.ofPattern("dd/MM"));
            }
            
            labels.add(label);
            totals.add(dailyTotal);
            completeds.add(dailyCompleted);
            successRates.add(Math.round(dailySuccessRate * 100.0) / 100.0);
            
            if (dailyTotal > 0) {
                System.out.println("   📅 " + currentDate + ": " + dailyTotal + " appointments, " + 
                                 dailyCompleted + " completed (" + dailySuccessRate + "%)");
            }
            
            currentDate = currentDate.plusDays(1);
        }
        
        chartData.put("labels", labels);
        chartData.put("totals", totals);
        chartData.put("completeds", completeds);
        chartData.put("successRates", successRates);
        
        System.out.println("📊 [Service] Chart data prepared: " + labels.size() + " data points");
        System.out.println("📊 Labels: " + labels);
        System.out.println("📊 Totals: " + totals);
        
        return chartData;
    }
    
    private Map<String, Object> prepareHourlyChartData(Long doctorId, LocalDate date) {
        Map<String, Object> chartData = new HashMap<>();
        List<String> labels = new ArrayList<>();
        List<Integer> totals = new ArrayList<>();
        List<Integer> completeds = new ArrayList<>();
        List<Double> successRates = new ArrayList<>();
        
        System.out.println("⏰ [Service] Preparing hourly chart data for date: " + date);
        
        // Danh sách các khung giờ trong ngày
        String[] timeSlots = {
            "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", 
            "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
        };
        
        // Lấy tất cả appointments của ngày
        List<PatientRegistration> dailyAppointments = patientRegistrationRepository
                .findByDoctorAndDateAndSession(doctorId, date, null);
        
        System.out.println("📅 [Service] Daily appointments for hourly chart: " + dailyAppointments.size());
        
        for (String timeSlot : timeSlots) {
            // Lọc appointments theo khung giờ
            List<PatientRegistration> slotAppointments = dailyAppointments.stream()
                    .filter(apt -> timeSlot.equals(apt.getAssignedSession()))
                    .collect(Collectors.toList());
            
            int slotTotal = slotAppointments.size();
            int slotCompleted = (int) slotAppointments.stream()
                    .filter(apt -> "COMPLETED".equals(apt.getStatus()))
                    .count();
            double slotSuccessRate = slotTotal > 0 ? ((double) slotCompleted / slotTotal) * 100 : 0.0;
            
            labels.add(timeSlot);
            totals.add(slotTotal);
            completeds.add(slotCompleted);
            successRates.add(Math.round(slotSuccessRate * 100.0) / 100.0);
            
            if (slotTotal > 0) {
                System.out.println("⏰ [Service] TimeSlot " + timeSlot + ": " + slotTotal + " appointments, " + 
                                 slotCompleted + " completed");
            }
        }
        
        chartData.put("labels", labels);
        chartData.put("totals", totals);
        chartData.put("completeds", completeds);
        chartData.put("successRates", successRates);
        
        System.out.println("✅ [Service] Hourly chart data prepared");
        System.out.println("📊 Labels: " + labels);
        System.out.println("📊 Totals: " + totals);
        
        return chartData;
    }
}