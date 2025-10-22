package com.example.clinic_backend.controller;

import com.example.clinic_backend.dto.BmiRequest;
import com.example.clinic_backend.model.BmiRecord;
import com.example.clinic_backend.service.BmiService;
import com.example.clinic_backend.service.PatientService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bmi")
@CrossOrigin(origins = "http://localhost:5173")
public class BmiController {

    private final BmiService bmiService;
    private final PatientService patientService;

    public BmiController(BmiService bmiService, PatientService patientService) {
        this.bmiService = bmiService;
        this.patientService = patientService;
    }

    // API 1: Lưu kết quả BMI (frontend tính toán)
    @PostMapping("/save")
    public ResponseEntity<?> saveBmi(@RequestBody BmiRequest request, Authentication authentication) {
        try {
            String email = authentication.getName();
            var patient = patientService.getPatientByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin bệnh nhân"));

            // Lưu vào database
            BmiRecord savedRecord = bmiService.saveBmiRecord(
                patient.getId(),
                request.getHeight(),
                request.getWeight(),
                request.getGender(),
                request.getBmiValue(),
                request.getBmiCategory(),
                request.getMeasurementDate() != null ? request.getMeasurementDate() : LocalDate.now()
            );

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Lưu kết quả BMI thành công",
                "data", savedRecord
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Lỗi server: " + e.getMessage()
            ));
        }
    }

    // API 2: Lấy lịch sử BMI
    @GetMapping("/history")
    public ResponseEntity<?> getBmiHistory(Authentication authentication) {
        try {
            String email = authentication.getName();
            var patient = patientService.getPatientByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin bệnh nhân"));

            List<BmiRecord> history = bmiService.getBmiHistory(patient.getId());
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", history
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Lỗi server: " + e.getMessage()
            ));
        }
    }

    // API 3: Lấy BMI gần đây nhất
    @GetMapping("/latest")
    public ResponseEntity<?> getLatestBmi(Authentication authentication) {
        try {
            String email = authentication.getName();
            var patient = patientService.getPatientByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin bệnh nhân"));

            BmiRecord latestBmi = bmiService.getLatestBmi(patient.getId());
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", latestBmi != null ? latestBmi : null
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Lỗi server: " + e.getMessage()
            ));
        }
    }

    // API 4: Tính toán BMI (chỉ tính toán, không lưu)
    @PostMapping("/calculate")
    public ResponseEntity<?> calculateBmi(@RequestBody BmiRequest request) {
        try {
            if (request.getHeight() == null || request.getWeight() == null || request.getGender() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Thiếu thông tin chiều cao, cân nặng hoặc giới tính"
                ));
            }

            Double heightInMeters = request.getHeight() / 100;
            Double bmiValue = request.getWeight() / (heightInMeters * heightInMeters);
            bmiValue = Math.round(bmiValue * 100.0) / 100.0;
            
            String category = bmiService.calculateBmiCategory(bmiValue, request.getGender());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "bmiValue", bmiValue,
                    "bmiCategory", category
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Lỗi tính toán BMI: " + e.getMessage()
            ));
        }
    }

    // API 5: Xóa BMI record
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBmiRecord(@PathVariable Long id, Authentication authentication) {
        try {
            String email = authentication.getName();
            var patient = patientService.getPatientByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin bệnh nhân"));

            // Kiểm tra xem record có thuộc về patient không
            BmiRecord record = bmiService.getBmiHistory(patient.getId())
                    .stream()
                    .filter(r -> r.getId().equals(id))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi BMI"));

            bmiService.deleteBmiRecord(id);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Xóa bản ghi BMI thành công"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Lỗi server: " + e.getMessage()
            ));
        }
    }
}