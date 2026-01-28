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
    
    // cap nhat thong ke hang ngay
    @Transactional
    public void updateDailyStatistics(Long doctorId) {
        LocalDate today = LocalDate.now();
        updateStatisticsForDate(doctorId, today);
    }
    
    // cap nhat thong ke cho mot ngay cu the
    @Transactional
    public void updateStatisticsForDate(Long doctorId, LocalDate date) {
        System.out.println("Cap nhat thong ke cho bac si " + doctorId + ", ngay " + date);
        
        DoctorStatistics stats = statisticsRepository
                .findByDoctorIdAndStatDateAndStatType(doctorId, date, "DAY")
                .orElse(new DoctorStatistics(doctorId, date, "DAY"));
        
        // lay tat ca lich hen cua bac si trong ngay
        List<PatientRegistration> todayAppointments = patientRegistrationRepository
                .findByDoctorAndDateAndSession(doctorId, date, null);
        
        System.out.println("Tim thay " + todayAppointments.size() + " lich hen cho ngay " + date);
        
        // tinh toan thong ke
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
        
        System.out.println("Thong ke: Total=" + total + ", Completed=" + completed + 
                          ", Cancelled=" + cancelled + ", NoShow=" + noShow);
        
        // cap nhat gia tri
        stats.setTotalAppointments(total);
        stats.setCompletedAppointments(completed);
        stats.setCancelledAppointments(cancelled);
        stats.setNoShowAppointments(noShow);
        stats.calculateSuccessRate();
        
        statisticsRepository.save(stats);
        System.out.println("Da luu thong ke ngay cho bac si " + doctorId);
    }
    
    // lay thong ke chi tiet
    public Map<String, Object> getDoctorStatistics(Long doctorId, String period) {
        System.out.println("Lay thong ke cho bac si " + doctorId + ", period " + period);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Doctor doctor = doctorRepository.findById(doctorId)
                    .orElseThrow(() -> new RuntimeException("Khong tim thay bac si voi ID: " + doctorId));
            
            System.out.println("Tim thay bac si: " + doctor.getFullName());
            
            LocalDate today = LocalDate.now();
            LocalDate startDate = today;
            LocalDate endDate = today;
            Map<String, Object> chartData = new HashMap<>();
            
            // xac dinh khoang thoi gian
            switch (period.toUpperCase()) {
                case "TODAY":
                    startDate = today;
                    endDate = today;
                    chartData = prepareHourlyChartData(doctorId, today);
                    System.out.println("Khoang thoi gian: TODAY");
                    break;
                case "WEEK":
                    startDate = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                    endDate = today;
                    chartData = prepareChartData(doctorId, startDate, endDate, "WEEK");
                    System.out.println("Khoang thoi gian: TUAN");
                    break;
                case "MONTH":
                    startDate = today.withDayOfMonth(1);
                    endDate = today;
                    chartData = prepareChartData(doctorId, startDate, endDate, "MONTH");
                    System.out.println("Khoang thoi gian: THANG");
                    break;
                default:
                    startDate = today;
                    endDate = today;
                    chartData = prepareChartData(doctorId, startDate, endDate, "DAY");
            }
            
            // lay tat ca lich hen trong khoang thoi gian
            List<PatientRegistration> appointments = getAppointmentsByDateRange(doctorId, startDate, endDate);
            System.out.println("Tong lich hen trong khoang: " + appointments.size());
            
            // tinh toan thong ke
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
            
            System.out.println("Da chuan bi thong ke thanh cong cho bac si " + doctorId);
            
        } catch (Exception e) {
            System.out.println("Loi khi lay thong ke: " + e.getMessage());
            
            response.put("success", false);
            response.put("message", "Loi khi lay thong ke: " + e.getMessage());
        }
        
        return response;
    }
    
    // lay du lieu thong ke theo khoang thoi gian tuy chinh
    public Map<String, Object> getCustomStatistics(Long doctorId, LocalDate startDate, LocalDate endDate) {
        System.out.println("Lay thong ke tuy chinh cho bac si " + doctorId + 
                          ", tu " + startDate + " den " + endDate);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Doctor doctor = doctorRepository.findById(doctorId)
                    .orElseThrow(() -> new RuntimeException("Khong tim thay bac si voi ID: " + doctorId));
            
            // lay tat ca lich hen trong khoang thoi gian
            List<PatientRegistration> appointments = getAppointmentsByDateRange(doctorId, startDate, endDate);
            System.out.println("Lich hen trong khoang tuy chinh: " + appointments.size());
            
            // tinh toan thong ke
            Map<String, Object> statsMap = calculateStatisticsFromAppointments(appointments);
            
            // chuan bi du lieu bieu do
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
            
            System.out.println("Da chuan bi thong ke tuy chinh thanh cong");
            
        } catch (Exception e) {
            System.out.println("Loi khi lay thong ke tuy chinh: " + e.getMessage());
            
            response.put("success", false);
            response.put("message", "Loi khi lay thong ke: " + e.getMessage());
        }
        
        return response;
    }
    
    // helper methods
    private List<PatientRegistration> getAppointmentsByDateRange(Long doctorId, LocalDate startDate, LocalDate endDate) {
    System.out.println("Lay lich hen cho bac si " + doctorId + 
                      ", tu " + startDate + " den " + endDate);
    
    // su dung phuong thuc tu repository
    List<PatientRegistration> appointments = patientRegistrationRepository
            .findByDoctorIdAndDateRange(doctorId, startDate, endDate);
    
    System.out.println("Tim thay " + appointments.size() + " lich hen trong khoang");
    
    // debug neu khong co lich hen
    if (appointments.isEmpty()) {
        System.out.println("Khong tim thay lich hen nao cho bac si " + doctorId);
        
        // kiem tra tong lich hen trong database
        List<PatientRegistration> allAppointments = patientRegistrationRepository.findAll();
        long totalForDoctor = allAppointments.stream()
                .filter(apt -> doctorId.equals(apt.getDoctorId()))
                .count();
        System.out.println("Tong lich hen cho bac si nay trong database: " + totalForDoctor);
        
        // hien thi mot vai lich hen de debug
        if (totalForDoctor > 0) {
            System.out.println("Mau lich hen cho bac si " + doctorId + ":");
            allAppointments.stream()
                .filter(apt -> doctorId.equals(apt.getDoctorId()))
                .limit(5)
                .forEach(apt -> {
                    try {
                        System.out.println("ID: " + apt.getId() + 
                                         ", Ngay: " + apt.getAppointmentDate() + 
                                         ", Trang thai: " + apt.getStatus());
                    } catch (Exception e) {
                        System.out.println("ID: " + apt.getId() + " (loi lay chi tiet)");
                    }
                });
        }
    } else {
        // hien thi chi tiet cac lich hen tim thay
        appointments.forEach(apt -> {
            try {
                System.out.println("Tim thay lich hen: " + 
                                 "ID=" + apt.getId() + 
                                 ", Ngay=" + apt.getAppointmentDate() + 
                                 ", Trang thai=" + apt.getStatus());
            } catch (Exception e) {
                System.out.println("Tim thay lich hen ID=" + apt.getId());
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
        
        // them cac stat khac de debug
        stats.put("approvedAppointments", (int) appointments.stream()
                .filter(apt -> "APPROVED".equals(apt.getStatus()))
                .count());
        stats.put("pendingAppointments", (int) appointments.stream()
                .filter(apt -> "PENDING".equals(apt.getStatus()))
                .count());
        
        System.out.println("Tinh toan thong ke: Total=" + total + 
                          ", Completed=" + completed + 
                          ", Cancelled=" + cancelled + 
                          ", NoShow=" + noShow +
                          ", Success Rate=" + successRate + "%");
        
        return stats;
    }
    
    private Map<String, Object> prepareChartData(Long doctorId, LocalDate startDate, LocalDate endDate, String period) {
        Map<String, Object> chartData = new HashMap<>();
        List<String> labels = new ArrayList<>();
        List<Integer> totals = new ArrayList<>();
        List<Integer> completeds = new ArrayList<>();
        List<Double> successRates = new ArrayList<>();
        
        LocalDate currentDate = startDate;
        
        System.out.println("Chuan bi du lieu bieu do cho period: " + period + 
                          ", tu " + startDate + " den " + endDate);
        
        while (!currentDate.isAfter(endDate)) {
            // lay appointments cua ngay hien tai
            List<PatientRegistration> dailyAppointments = patientRegistrationRepository
                    .findByDoctorAndDateAndSession(doctorId, currentDate, null);
            
            int dailyTotal = dailyAppointments.size();
            int dailyCompleted = (int) dailyAppointments.stream()
                    .filter(apt -> "COMPLETED".equals(apt.getStatus()))
                    .count();
            double dailySuccessRate = dailyTotal > 0 ? ((double) dailyCompleted / dailyTotal) * 100 : 0.0;
            
            // format label dua tren period
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
                System.out.println("Ngay " + currentDate + ": " + dailyTotal + " lich hen, " + 
                                 dailyCompleted + " da hoan thanh (" + dailySuccessRate + "%)");
            }
            
            currentDate = currentDate.plusDays(1);
        }
        
        chartData.put("labels", labels);
        chartData.put("totals", totals);
        chartData.put("completeds", completeds);
        chartData.put("successRates", successRates);
        
        System.out.println("Da chuan bi du lieu bieu do: " + labels.size() + " diem du lieu");
        
        return chartData;
    }
    
    private Map<String, Object> prepareHourlyChartData(Long doctorId, LocalDate date) {
        Map<String, Object> chartData = new HashMap<>();
        List<String> labels = new ArrayList<>();
        List<Integer> totals = new ArrayList<>();
        List<Integer> completeds = new ArrayList<>();
        List<Double> successRates = new ArrayList<>();
        
        System.out.println("Chuan bi du lieu bieu do theo gio cho ngay: " + date);
        
        // danh sach cac khung gio trong ngay
        String[] timeSlots = {
            "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", 
            "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
        };
        
        // lay tat ca appointments cua ngay
        List<PatientRegistration> dailyAppointments = patientRegistrationRepository
                .findByDoctorAndDateAndSession(doctorId, date, null);
        
        System.out.println("Lich hen trong ngay cho bieu do theo gio: " + dailyAppointments.size());
        
        for (String timeSlot : timeSlots) {
            // loc appointments theo khung gio
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
                System.out.println("Khung gio " + timeSlot + ": " + slotTotal + " lich hen, " + 
                                 slotCompleted + " da hoan thanh");
            }
        }
        
        chartData.put("labels", labels);
        chartData.put("totals", totals);
        chartData.put("completeds", completeds);
        chartData.put("successRates", successRates);
        
        System.out.println("Da chuan bi du lieu bieu do theo gio");
        
        return chartData;
    }
}