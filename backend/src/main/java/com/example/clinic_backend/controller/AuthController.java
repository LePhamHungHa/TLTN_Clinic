package com.example.clinic_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.clinic_backend.dto.LoginRequest;
import com.example.clinic_backend.dto.RegisterRequest;
import com.example.clinic_backend.model.User;
import com.example.clinic_backend.service.UserService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173") 
public class AuthController {
    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User user = userService.registerUser(request);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Đăng ký thành công");
            response.put("username", user.getUsername());
            response.put("id", user.getId());
            response.put("role", user.getRole());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        System.out.println("Nhận yêu cầu đăng nhập: " + request.getUsername());
        try {
            return userService.loginUser(request)
                    .map(user -> {
                        System.out.println("Đăng nhập thành công cho: " + user.getUsername());
                        Map<String, Object> response = new HashMap<>();
                        response.put("message", "Đăng nhập thành công");
                        response.put("username", user.getUsername());
                        response.put("id", user.getId());
                        response.put("role", user.getRole()); // thêm role
                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> {
                        System.out.println("Đăng nhập thất bại: Sai username hoặc password");
                        return ResponseEntity.status(401)
                                .body(Map.of("error", "Sai username hoặc password"));
                    });
        } catch (Exception e) {
            System.out.println("Lỗi server: " + e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Lỗi server: " + e.getMessage()));
        }
    }
}
