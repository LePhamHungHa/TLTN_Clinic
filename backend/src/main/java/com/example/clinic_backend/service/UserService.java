package com.example.clinic_backend.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.clinic_backend.model.User;
import com.example.clinic_backend.dto.RegisterRequest;
import com.example.clinic_backend.dto.LoginRequest;
import com.example.clinic_backend.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // Đăng ký user mới
    public User registerUser(RegisterRequest request) {
        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(encodedPassword);
        user.setRole("USER"); // mặc định gán role USER, có thể tùy chỉnh
        return userRepository.save(user);
    }

    // Đăng nhập
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
