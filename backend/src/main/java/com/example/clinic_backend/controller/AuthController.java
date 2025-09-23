package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.User;
import com.example.clinic_backend.model.Patient;
import com.example.clinic_backend.dto.RegisterRequest;
import com.example.clinic_backend.service.UserService;
import com.example.clinic_backend.service.PatientService;
import com.example.clinic_backend.security.JwtUtil;

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
    private final JwtUtil jwtUtil; // ✅ thêm jwtUtil

    public AuthController(UserService userService,
                          PatientService patientService,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil) {
        this.userService = userService;
        this.patientService = patientService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    // Đăng nhập username/password
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String usernameOrPhone  = body.get("username");
            String password = body.get("password");

            User user = userService.findByUsernameOrPhone(usernameOrPhone);
            if (user == null) {
                throw new RuntimeException("Tài khoản không tồn tại");
            }

            if (!passwordEncoder.matches(password, user.getPassword())) {
                throw new RuntimeException("Sai mật khẩu");
            }

            // ✅ Tạo JWT thật
            String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("role", user.getRole());
            response.put("email", user.getEmail());
            response.put("fullName", user.getFullName());
            response.put("token", token);

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
            newUser.setPassword(""); 
            user = userService.save(newUser);
        }

        // ✅ Tạo JWT thật
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("role", user.getRole());
        response.put("phone", user.getPhone());
        response.put("token", token);

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

            String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

            return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "role", user.getRole(),
                "avatar", user.getAvatar(),
                "token", token
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

            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email không hợp lệ"));
            }

            User user = userService.createOrUpdateUserFromFacebook(email, name, accessToken);

            String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

            return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "role", user.getRole(),
                "token", token
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi đăng nhập Facebook: " + e.getMessage()));
        }
    }

    // API đăng ký
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest payload) {
        try {
            String username = (payload.getEmail() != null && !payload.getEmail().isEmpty())
                    ? payload.getEmail()
                    : payload.getPhone();

            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(payload.getPassword()));
            user.setRole("PATIENT");
            user.setEmail(payload.getEmail());
            user.setPhone(payload.getPhone());
            userService.save(user);

            Patient patient = new Patient();
            patient.setUser(user);
            patient.setFullName(payload.getFullName());
            patient.setDob(payload.getDob());
            patient.setPhone(payload.getPhone());
            patient.setAddress(payload.getAddress());
            patient.setEmail(payload.getEmail());
            patient.setBhyt(payload.getBhyt());
            patientService.save(patient);

            String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

            Map<String, Object> response = new HashMap<>();
            response.put("id", patient.getId());
            response.put("username", user.getUsername());
            response.put("fullName", patient.getFullName());
            response.put("email", patient.getEmail());
            response.put("phone", patient.getPhone());
            response.put("bhyt", patient.getBhyt());
            response.put("token", token);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Đăng ký thất bại: " + e.getMessage()));
        }
    }
}
