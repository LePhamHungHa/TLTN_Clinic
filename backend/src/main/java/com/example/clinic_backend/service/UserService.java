package com.example.clinic_backend.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.clinic_backend.model.User;
import com.example.clinic_backend.model.Patient;
import com.example.clinic_backend.dto.RegisterRequest;
import com.example.clinic_backend.dto.LoginRequest;
import com.example.clinic_backend.repository.UserRepository;
import com.example.clinic_backend.repository.PatientRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Transactional
    public User registerUser(RegisterRequest request) {
        // kiểm tra username đã tồn tại
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username đã tồn tại");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(encodedPassword);

        String role = (request.getRole() != null && !request.getRole().isEmpty()) ? request.getRole() : "PATIENT";
        user.setRole(role);

        User savedUser = userRepository.save(user);

        // Nếu là bệnh nhân thì lưu thêm vào bảng patients
        if ("PATIENT".equalsIgnoreCase(role)) {
            Patient patient = new Patient();
            patient.setUser(savedUser);
            patient.setFullName(request.getFullName() != null ? request.getFullName() : request.getUsername());
            patient.setDob(request.getDob());
            patient.setPhone(request.getPhone());
            patient.setAddress(request.getAddress()); // ✅ lưu địa chỉ
            patient.setEmail(request.getEmail());
            patient.setUsername(request.getUsername());
            patient.setPassword(savedUser.getPassword());
            patient.setSymptoms(request.getSymptoms());
            patientRepository.save(patient);
        }

        return savedUser;
    }

    public Optional<User> loginUser(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }
}
