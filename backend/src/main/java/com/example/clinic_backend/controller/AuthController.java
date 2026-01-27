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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    
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

            log.info("Đang thử đăng nhập: {}", usernameOrPhone);

            // Kiểm tra dữ liệu đầu vào
            if (usernameOrPhone == null || usernameOrPhone.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Tên đăng nhập là bắt buộc"));
            }
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Mật khẩu là bắt buộc"));
            }

            User user = userService.authenticate(usernameOrPhone, password);
            String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("role", user.getRole());
            response.put("email", user.getEmail());
            response.put("fullName", user.getFullName());
            response.put("phone", user.getPhone());
            response.put("token", token);

            log.info("Đăng nhập thành công: {} | Vai trò: {}", usernameOrPhone, user.getRole());
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.error("Đăng nhập thất bại: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Lỗi đăng nhập: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Lỗi server khi đăng nhập"));
        }
    }

    @PostMapping("/phone-login")
    public ResponseEntity<?> phoneLogin(@RequestBody Map<String, String> body) {
        try {
            String phone = body.get("phone");
            log.info("Đang thử đăng nhập bằng số điện thoại: {}", phone);

            // Kiểm tra dữ liệu đầu vào
            if (phone == null || phone.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Số điện thoại là bắt buộc"));
            }

            User user = userService.findByPhoneNumber(phone);

            if (user == null) {
                log.info("Tạo user mới từ số điện thoại: {}", phone);
                User newUser = new User();
                newUser.setUsername(phone);
                newUser.setPhone(phone);
                newUser.setRole("PATIENT");
                newUser.setPassword("");
                user = userService.save(newUser);
                
                // Tạo patient cho user mới
                createPatientForUser(user, phone);
                log.info("Đã tạo user và patient mới cho số điện thoại: {}", phone);
            } else if (user.getRole() == null || user.getRole().isEmpty()) {
                log.info("Cập nhật role cho user: {}", phone);
                user.setRole("PATIENT");
                user = userService.save(user);
                
                // Kiểm tra và tạo patient nếu chưa có
                createPatientIfNotExists(user);
                log.info("Đã cập nhật role cho user: {}", phone);
            }

            String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("role", user.getRole());
            response.put("phone", user.getPhone());
            response.put("fullName", user.getFullName());
            response.put("email", user.getEmail());
            response.put("token", token);

            log.info("Đăng nhập bằng số điện thoại thành công: {}", phone);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Lỗi đăng nhập bằng số điện thoại: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(createErrorResponse("Đăng nhập bằng số điện thoại thất bại"));
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

            log.info("Đang thử đăng nhập mạng xã hội: {} | {} | {}", email, provider, name);

            // Kiểm tra dữ liệu đầu vào cơ bản
            if (email == null || email.trim().isEmpty()) {
                log.warn("Đăng nhập mạng xã hội: Email là bắt buộc");
                return ResponseEntity.badRequest().body(createErrorResponse("Email là bắt buộc"));
            }
            
            if (provider == null || (!"google".equalsIgnoreCase(provider) && !"facebook".equalsIgnoreCase(provider))) {
                log.warn("Đăng nhập mạng xã hội: Nhà cung cấp không hợp lệ: {}", provider);
                return ResponseEntity.badRequest().body(createErrorResponse("Nhà cung cấp không hợp lệ"));
            }

            // Tạo hoặc cập nhật user
            User user;
            
            if ("google".equalsIgnoreCase(provider)) {
                user = userService.createOrUpdateUserFromGoogle(email, name, uid, picture);
                log.info("Đã xử lý user Google: {}", email);
            } else {
                user = userService.createOrUpdateUserFromFacebook(email, name, uid);
                log.info("Đã xử lý user Facebook: {}", email);
            }

            // Đảm bảo user có role
            if (user.getRole() == null || user.getRole().isEmpty()) {
                user.setRole("PATIENT");
                user = userService.save(user);
                log.info("Tự động gán role PATIENT cho: {}", email);
            }

            // Tạo patient nếu chưa có
            createPatientIfNotExists(user);
            log.info("Đã đảm bảo patient cho user: {}", user.getId());

            // Tạo token
            String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

            // Tạo response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("email", user.getEmail());
            response.put("fullName", user.getFullName() != null ? user.getFullName() : 
                        name != null ? name : email);
            response.put("role", user.getRole());
            response.put("avatar", user.getAvatar() != null ? user.getAvatar() : "");
            response.put("phone", user.getPhone() != null ? user.getPhone() : "");
            response.put("token", token);

            log.info("Đăng nhập mạng xã hội thành công: {} | Vai trò: {}", email, user.getRole());
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("Lỗi kiểm tra đăng nhập mạng xã hội: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Lỗi đăng nhập mạng xã hội: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(createErrorResponse("Đăng nhập thất bại: " + e.getMessage()));
        }
    }

    // Phương thức quan trọng: Tạo patient nếu chưa tồn tại
    private void createPatientIfNotExists(User user) {
        try {
            Optional<Patient> existingPatient = patientService.getPatientByUserId(user.getId());
            if (existingPatient.isEmpty()) {
                log.info("Tạo patient mới cho user: {}", user.getId());
                
                Patient newPatient = new Patient();
                newPatient.setUser(user);
                newPatient.setFullName(user.getFullName() != null ? user.getFullName() : user.getUsername());
                newPatient.setEmail(user.getEmail());
                newPatient.setPhone(user.getPhone() != null ? user.getPhone() : "");
                newPatient.setAddress("");
                newPatient.setBhyt("");
                newPatient.setDob(null);
                // KHÔNG SET GENDER VÌ PATIENT CLASS KHÔNG CÓ FIELD GENDER
                
                patientService.save(newPatient);
                log.info("Đã tạo patient mới: {}", newPatient.getId());
            } else {
                log.debug("Patient đã tồn tại: {}", existingPatient.get().getId());
            }
        } catch (Exception patientError) {
            log.error("Lỗi khi tạo patient: {}", patientError.getMessage());
            // KHÔNG THROW EXCEPTION - KHÔNG ẢNH HƯỞNG ĐẾN QUÁ TRÌNH LOGIN
        }
    }

    private void createPatientForUser(User user, String fullName) {
        try {
            Patient newPatient = new Patient();
            newPatient.setUser(user);
            newPatient.setFullName(fullName != null ? fullName : user.getUsername());
            newPatient.setEmail(user.getEmail());
            newPatient.setPhone(user.getPhone() != null ? user.getPhone() : "");
            newPatient.setAddress("");
            newPatient.setBhyt("");
            newPatient.setDob(null);
            // KHÔNG SET GENDER VÌ PATIENT CLASS KHÔNG CÓ FIELD GENDER
            
            patientService.save(newPatient);
            log.info("Đã tạo patient cho user: {}", user.getId());
        } catch (Exception e) {
            log.error("Lỗi khi tạo patient: {}", e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest payload) {
        try {
            String username = (payload.getEmail() != null && !payload.getEmail().isEmpty())
                    ? payload.getEmail()
                    : payload.getPhone();

            log.info("Đang thử đăng ký: {}", username);

            // Kiểm tra dữ liệu đầu vào
            if (username == null || username.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Email hoặc số điện thoại là bắt buộc"));
            }
            if (payload.getPassword() == null || payload.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Mật khẩu là bắt buộc"));
            }
            if (payload.getFullName() == null || payload.getFullName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Họ và tên là bắt buộc"));
            }

            // Kiểm tra user đã tồn tại
            if (userService.findByUsernameOptional(username).isPresent()) {
                log.warn("Đăng ký: User đã tồn tại: {}", username);
                return ResponseEntity.badRequest().body(createErrorResponse("Tài khoản đã tồn tại"));
            }

            // Tạo user
            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(payload.getPassword()));
            user.setRole("PATIENT");
            user.setEmail(payload.getEmail());
            user.setPhone(payload.getPhone());
            user.setFullName(payload.getFullName());
            user = userService.save(user);

            // Tạo patient
            Patient patient = new Patient();
            patient.setUser(user);
            patient.setFullName(payload.getFullName());
            patient.setDob(payload.getDob());
            patient.setPhone(payload.getPhone());
            patient.setAddress(payload.getAddress());
            patient.setEmail(payload.getEmail());
            patient.setBhyt(payload.getBhyt());
            // KHÔNG SET GENDER VÌ PATIENT CLASS KHÔNG CÓ FIELD GENDER
            patientService.save(patient);

            String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("id", patient.getId());
            response.put("userId", user.getId());
            response.put("username", user.getUsername());
            response.put("fullName", payload.getFullName());
            response.put("email", payload.getEmail());
            response.put("phone", payload.getPhone());
            response.put("bhyt", payload.getBhyt());
            response.put("role", user.getRole());
            response.put("token", token);

            log.info("Đăng ký thành công: {}", username);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Lỗi đăng ký: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(createErrorResponse("Đăng ký thất bại: " + e.getMessage()));
        }
    }

    @PostMapping("/ensure-patient")
    public ResponseEntity<?> ensurePatientExists() {
        try {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Patient đã được đảm bảo"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        }
    }

    // API kiểm tra sức khỏe
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "Dịch vụ xác thực",
            "timestamp", System.currentTimeMillis()
        ));
    }
    
    // Phương thức tạo error response thống nhất
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", message);
        errorResponse.put("timestamp", System.currentTimeMillis());
        return errorResponse;
    }
}