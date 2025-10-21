package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Doctor findByUsername(String username);

    List<Doctor> findBySpecialtyIgnoreCase(String specialty);
}