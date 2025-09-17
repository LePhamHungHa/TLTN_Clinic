package com.example.clinic_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.clinic_backend.model.User;
import com.example.clinic_backend.service.UserService;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {
    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    // Đăng nhập username/password
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String username = body.get("username");
            String password = body.get("password");
            
            User user = userService.authenticate(username, password);
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("role", user.getRole());
            response.put("email", user.getEmail());
            response.put("fullName", user.getFullName());
            response.put("token", "fake-jwt-token-" + user.getUsername());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Đăng nhập bằng số điện thoại
    @PostMapping("/phone-login")
    public ResponseEntity<?> phoneLogin(@RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        User user = userService.findByPhoneNumber(phone);

        if (user == null) {
            // Tạo user mới nếu chưa tồn tại
            User newUser = new User();
            newUser.setUsername(phone);
            newUser.setPhone(phone);
            newUser.setRole("PATIENT");
            newUser.setPassword(""); // Không cần password cho phone login
            user = userService.save(newUser);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("role", user.getRole());
        response.put("phone", user.getPhone());
        response.put("token", "fake-jwt-token-" + user.getUsername());
        return ResponseEntity.ok(response);
    }

    // Đăng nhập Google
    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String name = body.get("name");
            String googleId = body.get("googleId");
            String picture = body.get("picture");

            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email không hợp lệ"));
            }

            User user = userService.createOrUpdateUserFromGoogle(email, name, googleId, picture);

            return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "role", user.getRole(),
                "avatar", user.getAvatar(),
                "token", "fake-jwt-token-" + user.getUsername()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi đăng nhập Google: " + e.getMessage()));
        }
    }

    // Đăng nhập Facebook
    @PostMapping("/facebook-login")
    public ResponseEntity<?> facebookLogin(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String name = body.get("name");
            String accessToken = body.get("accessToken");
            // Facebook ID có thể được lấy từ accessToken hoặc từ response

            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email không hợp lệ"));
            }

            // Sử dụng accessToken như facebookId tạm thời
            User user = userService.createOrUpdateUserFromFacebook(email, name, accessToken);

            return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "role", user.getRole(),
                "token", "fake-jwt-token-" + user.getUsername()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi đăng nhập Facebook: " + e.getMessage()));
        }
    }
}