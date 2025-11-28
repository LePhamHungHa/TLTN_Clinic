package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.*;
import com.example.clinic_backend.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "http://localhost:5173")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class UserManagementController {
    
    @Autowired
    private UserService userService;

    @Autowired
    private PatientService patientService;

    @Autowired
    private DoctorService doctorService;

    @Autowired
    private DepartmentService departmentService;

    // API 1: Lấy tất cả người dùng
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        System.out.println("=== 👥 USER MANAGEMENT - GET ALL USERS ===");
        
        try {
            List<User> users = userService.getAllUsers();
            System.out.println("Successfully retrieved " + users.size() + " users");
            return ResponseEntity.ok(users);
            
        } catch (Exception e) {
            System.err.println("❌ Error in getAllUsers: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // API 2: Lấy tất cả bệnh nhân
    @GetMapping("/patients")
    public ResponseEntity<List<Patient>> getAllPatients() {
        System.out.println("=== 🏥 USER MANAGEMENT - GET ALL PATIENTS ===");
        
        try {
            List<Patient> patients = patientService.getAllPatients();
            System.out.println("✅ Successfully retrieved " + patients.size() + " patients");
            return ResponseEntity.ok(patients);
            
        } catch (Exception e) {
            System.err.println("❌ Error in getAllPatients: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // API 3: Lấy tất cả bác sĩ - ĐÃ SỬA
    @GetMapping("/doctors")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Doctor>> getAllDoctors() {
        System.out.println("=== 👨‍⚕️ USER MANAGEMENT - GET ALL DOCTORS ===");
        
        try {
            List<Doctor> doctors = doctorService.getAllDoctors();
            System.out.println("✅ Successfully retrieved " + doctors.size() + " doctors");
            
            // Debug: kiểm tra dữ liệu department
            for (Doctor doctor : doctors) {
                System.out.println("📋 Final Doctor Data: " + doctor.getFullName() + 
                    ", Department ID: " + doctor.getDepartmentId() +
                    ", Department Object: " + (doctor.getDepartment() != null ? 
                    doctor.getDepartment().getDepartmentName() : "NULL") +
                    ", Department Name via getter: " + doctor.getDepartmentName());
            }
            
            return ResponseEntity.ok(doctors);
            
        } catch (Exception e) {
            System.err.println("❌ Error in getAllDoctors: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // API 4: Tạo người dùng mới
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user) {
        System.out.println("=== ➕ USER MANAGEMENT - CREATE USER ===");
        
        try {
            // Kiểm tra username đã tồn tại chưa
            if (userService.findByUsername(user.getUsername()).isPresent()) {
                return ResponseEntity.badRequest().body("Username đã tồn tại");
            }
            
            // DEBUG: In thông tin password
            System.out.println("🔐 Original password: " + user.getPassword());
            
            User createdUser = userService.createUser(user);
            
            System.out.println("✅ Successfully created user: " + createdUser.getUsername());
            return ResponseEntity.ok(createdUser);
            
        } catch (Exception e) {
            System.err.println("❌ Error in createUser: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API 5: Tạo bác sĩ mới
    @PostMapping("/doctors")
public ResponseEntity<?> createDoctor(@RequestBody Map<String, Object> doctorData) {
    System.out.println("=== 👨‍⚕️ USER MANAGEMENT - CREATE DOCTOR ===");
    System.out.println("📥 Received data: " + doctorData);
    
    try {
        // Extract data từ request
        String username = (String) doctorData.get("username");
        String password = (String) doctorData.get("password");
        String fullName = (String) doctorData.get("full_name");
        String dateOfBirth = (String) doctorData.get("date_of_birth");
        String gender = (String) doctorData.get("gender");
        String citizenId = (String) doctorData.get("citizen_id");
        String address = (String) doctorData.get("address");
        String phone = (String) doctorData.get("phone");
        String email = (String) doctorData.get("email");
        Integer departmentId = (Integer) doctorData.get("department_id");
        String degree = (String) doctorData.get("degree");
        String position = (String) doctorData.get("position");
        String roomNumber = (String) doctorData.get("room_number");
        String floor = (String) doctorData.get("floor");

        System.out.println("🔍 Extracted data - Username: " + username + ", Department ID: " + departmentId);

        // Kiểm tra dữ liệu bắt buộc
        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Username là bắt buộc");
        }
        if (password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Password là bắt buộc");
        }
        if (fullName == null || fullName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Họ tên là bắt buộc");
        }
        if (departmentId == null) {
            return ResponseEntity.badRequest().body("Vui lòng chọn khoa");
        }

            // Tạo user trước
            User user = new User();
            user.setUsername(username);
            user.setPassword(password);
            user.setRole("DOCTOR");
            user.setPhone(phone);
            user.setEmail(email);
            user.setFullName(fullName);
            
            User createdUser = userService.createUser(user);
            System.out.println("✅ Created user with ID: " + createdUser.getId());
            
            // Tạo doctor
            Doctor doctor = new Doctor();
            doctor.setUserId(createdUser.getId());
            doctor.setFullName(fullName);
            
            if (dateOfBirth != null && !dateOfBirth.isEmpty()) {
                try {
                    doctor.setDateOfBirth(java.time.LocalDate.parse(dateOfBirth));
                } catch (Exception e) {
                    System.err.println("⚠️ Invalid date format for doctor: " + dateOfBirth);
                    doctor.setDateOfBirth(null);
                }
            } else {
                doctor.setDateOfBirth(null);
            }
            
            doctor.setGender(gender);
            doctor.setCitizenId(citizenId);
            doctor.setAddress(address);
            doctor.setPhone(phone);
            doctor.setEmail(email);
            doctor.setDepartmentId(departmentId.longValue());
            doctor.setDegree(degree);
            doctor.setPosition(position);
            doctor.setRoomNumber(roomNumber);
            doctor.setFloor(floor);
            
            Doctor createdDoctor = doctorService.createDoctor(doctor);
            System.out.println("✅ Successfully created doctor: " + createdDoctor.getFullName());
            
            return ResponseEntity.ok(createdDoctor);
            
        } catch (Exception e) {
            System.err.println("❌ Error in createDoctor: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Lỗi khi tạo bác sĩ: " + e.getMessage());
        }
    }

    // API 6: Tạo bệnh nhân mới
    @PostMapping("/patients")
    public ResponseEntity<?> createPatient(@RequestBody Map<String, Object> patientData) {
        System.out.println("=== 🏥 USER MANAGEMENT - CREATE PATIENT ===");
        
        try {
            // Extract data từ request
            String username = (String) patientData.get("username");
            String password = (String) patientData.get("password");
            String fullName = (String) patientData.get("full_name");
            String dob = (String) patientData.get("dob");
            String phone = (String) patientData.get("phone");
            String address = (String) patientData.get("address");
            String email = (String) patientData.get("email");
            String symptoms = (String) patientData.get("symptoms");
            String bhyt = (String) patientData.get("bhyt");
            String relativeName = (String) patientData.get("relative_name");
            String relativePhone = (String) patientData.get("relative_phone");
            String relativeAddress = (String) patientData.get("relative_address");
            String relativeRelationship = (String) patientData.get("relative_relationship");

            // Kiểm tra username đã tồn tại chưa
            if (userService.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body("Username đã tồn tại");
            }

            // Tạo user trước
            User user = new User();
            user.setUsername(username);
            user.setPassword(password);
            user.setRole("PATIENT");
            user.setPhone(phone);
            user.setEmail(email);
            user.setFullName(fullName);
            
            User createdUser = userService.createUser(user);
            System.out.println("✅ Created user with ID: " + createdUser.getId());
            
            Patient patient = new Patient();
            patient.setUser(createdUser);
            patient.setFullName(fullName);
            
            if (dob != null && !dob.isEmpty()) {
                try {
                    patient.setDob(java.time.LocalDate.parse(dob));
                } catch (Exception e) {
                    System.err.println("⚠️ Invalid date format: " + dob);
                    patient.setDob(null);
                }
            } else {
                patient.setDob(null);
            }
            
            patient.setPhone(phone);
            patient.setAddress(address);
            patient.setEmail(email);
            patient.setSymptoms(symptoms);
            patient.setBhyt(bhyt);
            patient.setRelativeName(relativeName);
            patient.setRelativePhone(relativePhone);
            patient.setRelativeAddress(relativeAddress);
            patient.setRelativeRelationship(relativeRelationship);
            
            Patient createdPatient = patientService.createPatient(patient);
            System.out.println("✅ Successfully created patient: " + createdPatient.getFullName());
            
            return ResponseEntity.ok(createdPatient);
            
        } catch (Exception e) {
            System.err.println("❌ Error in createPatient: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Lỗi khi tạo bệnh nhân: " + e.getMessage());
        }
    }

    // API 7: Xóa người dùng
    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        System.out.println("=== 🗑️ USER MANAGEMENT - DELETE USER ===");
        
        try {
            userService.deleteUser(userId);
            System.out.println("✅ Successfully deleted user ID: " + userId);
            return ResponseEntity.ok().build();
            
        } catch (Exception e) {
            System.err.println("❌ Error in deleteUser: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API 8: Lấy thống kê người dùng
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getUserStats() {
        System.out.println("=== 📊 USER MANAGEMENT - GET USER STATS ===");
        
        try {
            List<User> users = userService.getAllUsers();
            List<Patient> patients = patientService.getAllPatients();
            List<Doctor> doctors = doctorService.getAllDoctors();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("TOTAL_USERS", users.size());
            stats.put("PATIENTS", patients.size());
            stats.put("DOCTORS", doctors.size());
            stats.put("ADMINS", users.stream().filter(u -> "ADMIN".equals(u.getRole())).count());
            
            System.out.println("📈 User Stats: " + stats);
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            System.err.println("❌ Error in getUserStats: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // API 9: Cập nhật thông tin người dùng
    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable Long userId, @RequestBody User user) {
        System.out.println("=== ✏️ USER MANAGEMENT - UPDATE USER ===");
        
        try {
            Optional<User> existingUser = userService.getUserById(userId);
            if (existingUser.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            User updatedUser = userService.updateUser(userId, user);
            System.out.println("✅ Successfully updated user ID: " + userId);
            return ResponseEntity.ok(updatedUser);
            
        } catch (Exception e) {
            System.err.println("❌ Error in updateUser: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API 10: Lấy tất cả departments
    @GetMapping("/departments")
    public ResponseEntity<List<Department>> getAllDepartments() {
        System.out.println("=== 🏥 USER MANAGEMENT - GET ALL DEPARTMENTS ===");
        
        try {
            List<Department> departments = departmentService.getAllDepartments();
            System.out.println("✅ Successfully retrieved " + departments.size() + " departments");
            return ResponseEntity.ok(departments);
            
        } catch (Exception e) {
            System.err.println("❌ Error in getAllDepartments: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}