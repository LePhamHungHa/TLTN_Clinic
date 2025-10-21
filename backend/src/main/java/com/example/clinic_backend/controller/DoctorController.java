package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.Doctor;
import com.example.clinic_backend.service.DoctorService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "*") // ✅ Cho phép React frontend truy cập
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    // 🔹 GET danh sách bác sĩ (có thể lọc theo chuyên khoa)
    @GetMapping
    public List<Doctor> getAllDoctors(@RequestParam(required = false) String department) {
        if (department != null && !department.isEmpty()) {
            return doctorService.getDoctorsBySpecialty(department);
        }
        return doctorService.getAllDoctors();
    }

    // POST tạo bác sĩ
    @PostMapping("/create")
    public Doctor createDoctor(@RequestBody Doctor doctor) {
        return doctorService.createDoctor(doctor);
    }

    // GET bác sĩ theo id
    @GetMapping("/{id}")
    public Optional<Doctor> getDoctorById(@PathVariable Long id) {
        return doctorService.getDoctorById(id);
    }

    // PUT cập nhật bác sĩ
    @PutMapping("/{id}")
    public Doctor updateDoctor(@PathVariable Long id, @RequestBody Doctor doctor) {
        return doctorService.updateDoctor(id, doctor);
    }

    // DELETE bác sĩ
    @DeleteMapping("/{id}")
    public void deleteDoctor(@PathVariable Long id) {
        doctorService.deleteDoctor(id);
    }
}
