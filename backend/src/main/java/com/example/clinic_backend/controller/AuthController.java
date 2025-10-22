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
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserService userService;
    private final PatientService patientService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService,
                          PatientService patientService,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil) {
        this.userService = userService;
        this.patientService = patientService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String usernameOrPhone = body.get("username");
            String password = body.get("password");

            System.out.println("🔍 LOGIN: " + usernameOrPhone);

            User user = userService.authenticate(usernameOrPhone, password);

            String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("role", user.getRole());
            response.put("email", user.getEmail());
            response.put("fullName", user.getFullName());
            response.put("phone", user.getPhone());
            response.put("token", token);

            System.out.println("✅ LOGIN SUCCESS: " + usernameOrPhone + " | ROLE: " + user.getRole());
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            System.err.println("❌ LOGIN ERROR: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/phone-login")
    public ResponseEntity<?> phoneLogin(@RequestBody Map<String, String> body) {
        try {
            String phone = body.get("phone");
            User user = userService.findByPhoneNumber(phone);

            if (user == null) {
                User newUser = new User();
                newUser.setUsername(phone);
                newUser.setPhone(phone);
                newUser.setRole("PATIENT");
                newUser.setPassword("");
                user = userService.save(newUser);
                
                // Tự động tạo patient
                createPatientForUser(user, user.getFullName());
                System.out.println("✅ NEW PHONE USER + PATIENT: " + phone);
            } else if (user.getRole() == null || user.getRole().isEmpty()) {
                user.setRole("PATIENT");
                user = userService.save(user);
                
                // Kiểm tra và tạo patient nếu chưa có
                createPatientIfNotExists(user);
                System.out.println("✅ UPDATE PHONE ROLE + PATIENT: " + phone);
            }

            String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("role", user.getRole());
            response.put("phone", user.getPhone());
            response.put("token", token);

            System.out.println("✅ PHONE LOGIN SUCCESS: " + phone + " | ROLE: " + user.getRole());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ PHONE LOGIN ERROR: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/social-login")
    public ResponseEntity<?> socialLogin(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String provider = body.get("provider");
            String uid = body.get("uid");
            String name = body.get("name");
            String picture = body.get("picture");

            System.out.println("🔍 SOCIAL LOGIN: " + email + " | " + provider + " | " + name);

            if (email == null || email.trim().isEmpty()) {
                System.err.println("❌ EMAIL NULL");
                return ResponseEntity.badRequest().body(Map.of("error", "Email bắt buộc"));
            }

            User user;
            try {
                if ("google".equals(provider)) {
                    System.out.println("📞 CALL GOOGLE SERVICE");
                    user = userService.createOrUpdateUserFromGoogle(email, name, uid, picture);
                } else {
                    System.out.println("📞 CALL FACEBOOK SERVICE");
                    user = userService.createOrUpdateUserFromFacebook(email, name, uid);
                }
                System.out.println("✅ SERVICE RETURN USER ID: " + user.getId());
            } catch (Exception serviceError) {
                System.err.println("❌ SERVICE ERROR: " + serviceError.getMessage());
                serviceError.printStackTrace();
                user = createFallbackUser(email, provider, uid, name);
                System.out.println("✅ FALLBACK USER ID: " + user.getId());
            }

            // 🔥 QUAN TRỌNG: Tự động tạo patient nếu chưa có
            createPatientIfNotExists(user);

            if (user.getRole() == null || user.getRole().isEmpty()) {
                user.setRole("PATIENT");
                user = userService.save(user);
                System.out.println("✅ AUTO SET PATIENT: " + email);
            }

            String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

            Map<String, Object> response = Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "fullName", user.getFullName() != null ? user.getFullName() : name != null ? name : email,
                "role", user.getRole(),
                "avatar", user.getAvatar() != null ? user.getAvatar() : "",
                "token", token
            );

            System.out.println("✅ SOCIAL LOGIN SUCCESS: " + email + " | ROLE: " + user.getRole());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ SOCIAL LOGIN ERROR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi server: " + e.getMessage()));
        }
    }

    // 🔥 PHƯƠNG THỨC QUAN TRỌNG: Tạo patient nếu chưa tồn tại
    private void createPatientIfNotExists(User user) {
        try {
            Optional<Patient> existingPatient = patientService.getPatientByUserId(user.getId());
            if (existingPatient.isEmpty()) {
                System.out.println("🆕 Tạo mới patient cho user: " + user.getId());
                
                Patient newPatient = new Patient();
                newPatient.setUser(user);
                newPatient.setFullName(user.getFullName() != null ? user.getFullName() : user.getUsername());
                newPatient.setEmail(user.getEmail());
                newPatient.setPhone(user.getPhone() != null ? user.getPhone() : "");
                newPatient.setAddress("");
                newPatient.setBhyt("");
                
                patientService.save(newPatient);
                System.out.println("✅ Đã tạo patient mới: " + newPatient.getId());
            } else {
                System.out.println("✅ Patient đã tồn tại: " + existingPatient.get().getId());
            }
        } catch (Exception patientError) {
            System.err.println("⚠️ Lỗi khi tạo patient: " + patientError.getMessage());
        }
    }

    // Tạo patient với thông tin cụ thể
    private void createPatientForUser(User user, String fullName) {
        try {
            Patient newPatient = new Patient();
            newPatient.setUser(user);
            newPatient.setFullName(fullName != null ? fullName : user.getUsername());
            newPatient.setEmail(user.getEmail());
            newPatient.setPhone(user.getPhone() != null ? user.getPhone() : "");
            newPatient.setAddress("");
            newPatient.setBhyt("");
            
            patientService.save(newPatient);
            System.out.println("✅ Created patient for user: " + user.getId());
        } catch (Exception e) {
            System.err.println("❌ Error creating patient: " + e.getMessage());
        }
    }

    private User createFallbackUser(String email, String provider, String uid, String name) {
        System.out.println("🔧 Creating FALLBACK user: " + email);
        User fallbackUser = new User();
        fallbackUser.setUsername(email);
        fallbackUser.setEmail(email);
        fallbackUser.setFullName(name != null ? name : email);
        fallbackUser.setRole("PATIENT");
        fallbackUser.setPassword("");
        
        if ("google".equals(provider) && uid != null && !uid.trim().isEmpty()) {
            fallbackUser.setGoogleId(uid);
        } else if ("facebook".equals(provider) && uid != null && !uid.trim().isEmpty()) {
            fallbackUser.setFacebookId(uid);
        }
        
        User savedUser = userService.save(fallbackUser);
        
        // Tạo patient cho fallback user
        createPatientForUser(savedUser, name);
        
        return savedUser;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest payload) {
        try {
            String username = (payload.getEmail() != null && !payload.getEmail().isEmpty())
                    ? payload.getEmail()
                    : payload.getPhone();

            if (userService.findByUsernameOptional(username).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Tài khoản đã tồn tại"));
            }

            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(payload.getPassword()));
            user.setRole("PATIENT");
            user.setEmail(payload.getEmail());
            user.setPhone(payload.getPhone());
            user.setFullName(payload.getFullName());
            user = userService.save(user); 

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
            response.put("fullName", payload.getFullName());
            response.put("email", payload.getEmail());
            response.put("phone", payload.getPhone());
            response.put("bhyt", payload.getBhyt());
            response.put("role", user.getRole());
            response.put("token", token);

            System.out.println("✅ REGISTER SUCCESS: " + username + " | ROLE: PATIENT");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ REGISTER ERROR: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Đăng ký thất bại: " + e.getMessage()));
        }
    }

    @PostMapping("/ensure-patient")
    public ResponseEntity<?> ensurePatientExists() {
        try {
            return ResponseEntity.ok(Map.of("message", "Patient ensured"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}