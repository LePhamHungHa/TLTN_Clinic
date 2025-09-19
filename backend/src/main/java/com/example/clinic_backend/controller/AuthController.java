package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.User;
import com.example.clinic_backend.model.Patient;
import com.example.clinic_backend.dto.RegisterRequest;
import com.example.clinic_backend.service.UserService;
import com.example.clinic_backend.service.PatientService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserService userService;
    private final PatientService patientService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserService userService, PatientService patientService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.patientService = patientService;
        this.passwordEncoder = passwordEncoder;
    }

    // Đăng nhập username/password
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String usernameOrPhone  = body.get("username");
            String password = body.get("password");

            // Tìm user theo username hoặc phone
            User user = userService.findByUsernameOrPhone(usernameOrPhone);
            if (user == null) {
                throw new RuntimeException("Tài khoản không tồn tại");
            }

            if (!passwordEncoder.matches(password, user.getPassword())) {
                throw new RuntimeException("Sai mật khẩu");
            }
            
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

     // API đăng ký
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest payload) {
        try {

            // username use gmail or phone
            String username = (payload.getEmail() != null && !payload.getEmail().isEmpty())
                ? payload.getEmail()
                : payload.getPhone();

            // 1. Tạo User
            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(payload.getPassword()));
            user.setRole("PATIENT");
            user.setEmail(payload.getEmail()); // lưu email vào bảng user
            user.setPhone(payload.getPhone()); // lưu phone vào bảng user
            userService.save(user);

            // 2. Tạo Patient và tham chiếu User
            Patient patient = new Patient();
            patient.setUser(user);
            patient.setFullName(payload.getFullName());
            patient.setDob(payload.getDob()); 
            patient.setPhone(payload.getPhone());
            patient.setAddress(payload.getAddress());
            patient.setEmail(payload.getEmail());
            patient.setBhyt(payload.getBhyt());
            patientService.save(patient);

            // 3. Trả về thông tin Patient
            Map<String, Object> response = new HashMap<>();
            response.put("id", patient.getId());
            response.put("username", user.getUsername());
            response.put("fullName", patient.getFullName());
            response.put("email", patient.getEmail());
            response.put("phone", patient.getPhone());
            response.put("bhyt", patient.getBhyt());
            response.put("token", "fake-jwt-token-" + user.getUsername());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Đăng ký thất bại: " + e.getMessage()));
        }
    }
}