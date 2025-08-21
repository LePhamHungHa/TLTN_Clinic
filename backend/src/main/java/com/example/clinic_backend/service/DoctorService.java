package com.example.clinic_backend.service;

import com.example.clinic_backend.model.Doctor;
import com.example.clinic_backend.repository.DoctorRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;

    public DoctorService(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    // Tạo bác sĩ mới
    public Doctor createDoctor(Doctor doctor) {
        return doctorRepository.save(doctor);
    }

    // Lấy danh sách bác sĩ
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    // Lấy bác sĩ theo id
    public Optional<Doctor> getDoctorById(Long id) {
        return doctorRepository.findById(id);
    }

    // Cập nhật bác sĩ
    public Doctor updateDoctor(Long id, Doctor updatedDoctor) {
        Optional<Doctor> optionalDoctor = doctorRepository.findById(id);
        if (optionalDoctor.isPresent()) {
            Doctor doctor = optionalDoctor.get();
            doctor.setUsername(updatedDoctor.getUsername());
            doctor.setPassword(updatedDoctor.getPassword());
            doctor.setFullName(updatedDoctor.getFullName());
            doctor.setSpecialty(updatedDoctor.getSpecialty());
            doctor.setPhone(updatedDoctor.getPhone());
            return doctorRepository.save(doctor);
        }
        return null;
    }

    // Xóa bác sĩ
    public void deleteDoctor(Long id) {
        doctorRepository.deleteById(id);
    }
}
