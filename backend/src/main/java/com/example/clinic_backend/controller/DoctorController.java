package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.Doctor;
import com.example.clinic_backend.service.DoctorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "*")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    // 🔹 GET danh sách bác sĩ (Mặc định trả về TẤT CẢ bác sĩ)
    @GetMapping
    public ResponseEntity<List<Doctor>> getAllDoctors(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String department) {
        
        try {
            List<Doctor> doctors;
            
            if (name != null && !name.isEmpty()) {
                doctors = doctorService.getDoctorsByName(name);
            } else if (department != null && !department.isEmpty()) {
                doctors = doctorService.getDoctorsByDepartmentName(department);
            } else {
                doctors = doctorService.getAllDoctors();
            }
            
            // DEBUG: In ra số lượng bác sĩ trả về
            System.out.println("📊 DoctorController: Trả về " + doctors.size() + " bác sĩ");
            if (!doctors.isEmpty()) {
                System.out.println("📋 Doctor đầu tiên: " + doctors.get(0).getFullName());
            }
            
            return ResponseEntity.ok(doctors);
        } catch (Exception e) {
            System.err.println("❌ Lỗi DoctorController.getAllDoctors: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // POST tạo bác sĩ
    @PostMapping("/create")
    public ResponseEntity<?> createDoctor(@RequestBody Doctor doctor) {
        try {
            System.out.println("➕ DoctorController.createDoctor: " + doctor.getFullName());
            Doctor createdDoctor = doctorService.createDoctor(doctor);
            return ResponseEntity.ok(createdDoctor);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            System.err.println("❌ Lỗi tạo bác sĩ: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Lỗi server khi tạo bác sĩ");
        }
    }

    // GET bác sĩ theo id
    @GetMapping("/{id}")
    public ResponseEntity<Doctor> getDoctorById(@PathVariable Long id) {
        try {
            Optional<Doctor> doctor = doctorService.getDoctorById(id);
            return doctor.map(ResponseEntity::ok)
                       .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // PUT cập nhật bác sĩ
    @PutMapping("/{id}")
    public ResponseEntity<?> updateDoctor(@PathVariable Long id, @RequestBody Doctor doctor) {
        try {
            Doctor updatedDoctor = doctorService.updateDoctor(id, doctor);
            return ResponseEntity.ok(updatedDoctor);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi server khi cập nhật bác sĩ");
        }
    }

    // DELETE bác sĩ
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDoctor(@PathVariable Long id) {
        try {
            doctorService.deleteDoctor(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi server khi xóa bác sĩ");
        }
    }

    // GET bác sĩ theo khoa (departmentId)
    @GetMapping("/department/{departmentId}")
    public ResponseEntity<List<Doctor>> getDoctorsByDepartment(@PathVariable Long departmentId) {
        try {
            List<Doctor> doctors = doctorService.getDoctorsByDepartmentId(departmentId);
            return ResponseEntity.ok(doctors);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // GET bác sĩ theo userId
    @GetMapping("/user/{userId}")
    public ResponseEntity<Doctor> getDoctorByUserId(@PathVariable Long userId) {
        try {
            Optional<Doctor> doctor = doctorService.getDoctorByUserId(userId);
            return doctor.map(ResponseEntity::ok)
                       .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}