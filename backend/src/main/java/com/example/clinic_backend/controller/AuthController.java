package com.example.clinic_backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.clinic_backend.dto.LoginRequest;
import com.example.clinic_backend.dto.RegisterRequest;
import com.example.clinic_backend.model.User;
import com.example.clinic_backend.service.UserService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            // gọi phương thức đúng tên trong UserService
            User user = userService.registerUser(request);
            return ResponseEntity.ok("Đăng ký thành công: " + user.getUsername());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // gọi phương thức đúng tên trong UserService
        return userService.loginUser(request)
                .map(user -> ResponseEntity.ok("Đăng nhập thành công: " + user.getUsername()))
                .orElseGet(() -> ResponseEntity.status(401).body("Sai username hoặc password"));
    }
}
