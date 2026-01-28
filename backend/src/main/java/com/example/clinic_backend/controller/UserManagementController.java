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

    // 1. lay tat ca nguoi dung
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        System.out.println("Lay tat ca nguoi dung");
        
        try {
            List<User> users = userService.getAllUsers();
            System.out.println("Lay duoc " + users.size() + " nguoi dung");
            return ResponseEntity.ok(users);
            
        } catch (Exception e) {
            System.out.println("Loi lay nguoi dung: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    // 2. lay tat ca benh nhan
    @GetMapping("/patients")
    public ResponseEntity<List<Patient>> getAllPatients() {
        System.out.println("Lay tat ca benh nhan");
        
        try {
            List<Patient> patients = patientService.getAllPatients();
            System.out.println("Lay duoc " + patients.size() + " benh nhan");
            return ResponseEntity.ok(patients);
            
        } catch (Exception e) {
            System.out.println("Loi lay benh nhan: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    // 3. lay tat ca bac si
    @GetMapping("/doctors")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Doctor>> getAllDoctors() {
        System.out.println("Lay tat ca bac si");
        
        try {
            List<Doctor> doctors = doctorService.getAllDoctors();
            System.out.println("Lay duoc " + doctors.size() + " bac si");
            
            // debug: kiem tra du lieu
            for (Doctor doctor : doctors) {
                System.out.println("Bac si: " + doctor.getFullName() + 
                    ", Khoa ID: " + doctor.getDepartmentId() +
                    ", Ten khoa: " + doctor.getDepartmentName());
            }
            
            return ResponseEntity.ok(doctors);
            
        } catch (Exception e) {
            System.out.println("Loi lay bac si: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    // 4. tao nguoi dung moi
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user) {
        System.out.println("Tao nguoi dung moi");
        
        try {
            // kiem tra username da ton tai chua
            if (userService.findByUsername(user.getUsername()).isPresent()) {
                return ResponseEntity.badRequest().body("Username da ton tai");
            }
            
            System.out.println("Mat khau: " + user.getPassword());
            
            User createdUser = userService.createUser(user);
            
            System.out.println("Da tao thanh cong: " + createdUser.getUsername());
            return ResponseEntity.ok(createdUser);
            
        } catch (Exception e) {
            System.out.println("Loi tao nguoi dung: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 5. tao bac si moi
    @PostMapping("/doctors")
    public ResponseEntity<?> createDoctor(@RequestBody Map<String, Object> doctorData) {
        System.out.println("Tao bac si moi");
        System.out.println("Du lieu nhan duoc: " + doctorData);
        
        try {
            // lay du lieu tu request
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

            System.out.println("Username: " + username + ", Khoa ID: " + departmentId);

            // kiem tra du lieu bat buoc
            if (username == null || username.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Can username");
            }
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Can password");
            }
            if (fullName == null || fullName.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Can ho ten");
            }
            if (departmentId == null) {
                return ResponseEntity.badRequest().body("Can chon khoa");
            }

            // tao user truoc
            User user = new User();
            user.setUsername(username);
            user.setPassword(password);
            user.setRole("DOCTOR");
            user.setPhone(phone);
            user.setEmail(email);
            user.setFullName(fullName);
            
            User createdUser = userService.createUser(user);
            System.out.println("Da tao user ID: " + createdUser.getId());
            
            // tao bac si
            Doctor doctor = new Doctor();
            doctor.setUserId(createdUser.getId());
            doctor.setFullName(fullName);
            
            if (dateOfBirth != null && !dateOfBirth.isEmpty()) {
                try {
                    doctor.setDateOfBirth(java.time.LocalDate.parse(dateOfBirth));
                } catch (Exception e) {
                    System.out.println("Ngay sinh sai dinh dang: " + dateOfBirth);
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
            System.out.println("Da tao thanh cong bac si: " + createdDoctor.getFullName());
            
            return ResponseEntity.ok(createdDoctor);
            
        } catch (Exception e) {
            System.out.println("Loi tao bac si: " + e.getMessage());
            return ResponseEntity.badRequest().body("Loi khi tao bac si: " + e.getMessage());
        }
    }

    // 6. tao benh nhan moi
    @PostMapping("/patients")
    public ResponseEntity<?> createPatient(@RequestBody Map<String, Object> patientData) {
        System.out.println("Tao benh nhan moi");
        
        try {
            // lay du lieu tu request
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

            // kiem tra username da ton tai chua
            if (userService.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body("Username da ton tai");
            }

            // tao user truoc
            User user = new User();
            user.setUsername(username);
            user.setPassword(password);
            user.setRole("PATIENT");
            user.setPhone(phone);
            user.setEmail(email);
            user.setFullName(fullName);
            
            User createdUser = userService.createUser(user);
            System.out.println("Da tao user ID: " + createdUser.getId());
            
            Patient patient = new Patient();
            patient.setUser(createdUser);
            patient.setFullName(fullName);
            
            if (dob != null && !dob.isEmpty()) {
                try {
                    patient.setDob(java.time.LocalDate.parse(dob));
                } catch (Exception e) {
                    System.out.println("Ngay sinh sai dinh dang: " + dob);
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
            System.out.println("Da tao thanh cong benh nhan: " + createdPatient.getFullName());
            
            return ResponseEntity.ok(createdPatient);
            
        } catch (Exception e) {
            System.out.println("Loi tao benh nhan: " + e.getMessage());
            return ResponseEntity.badRequest().body("Loi khi tao benh nhan: " + e.getMessage());
        }
    }

    // 7. xoa nguoi dung
    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        System.out.println("Xoa nguoi dung");
        
        try {
            userService.deleteUser(userId);
            System.out.println("Da xoa user ID: " + userId);
            return ResponseEntity.ok().build();
            
        } catch (Exception e) {
            System.out.println("Loi xoa nguoi dung: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 8. lay thong ke nguoi dung
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getUserStats() {
        System.out.println("Lay thong ke nguoi dung");
        
        try {
            List<User> users = userService.getAllUsers();
            List<Patient> patients = patientService.getAllPatients();
            List<Doctor> doctors = doctorService.getAllDoctors();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("TOTAL_USERS", users.size());
            stats.put("PATIENTS", patients.size());
            stats.put("DOCTORS", doctors.size());
            stats.put("ADMINS", users.stream().filter(u -> "ADMIN".equals(u.getRole())).count());
            
            System.out.println("Thong ke: " + stats);
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            System.out.println("Loi lay thong ke: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    // 9. cap nhat thong tin nguoi dung
    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable Long userId, @RequestBody User user) {
        System.out.println("Cap nhat nguoi dung");
        
        try {
            Optional<User> existingUser = userService.getUserById(userId);
            if (existingUser.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            User updatedUser = userService.updateUser(userId, user);
            System.out.println("Da cap nhat user ID: " + userId);
            return ResponseEntity.ok(updatedUser);
            
        } catch (Exception e) {
            System.out.println("Loi cap nhat nguoi dung: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 10. lay tat ca khoa
    @GetMapping("/departments")
    public ResponseEntity<List<Department>> getAllDepartments() {
        System.out.println("Lay tat ca khoa");
        
        try {
            List<Department> departments = departmentService.getAllDepartments();
            System.out.println("Lay duoc " + departments.size() + " khoa");
            return ResponseEntity.ok(departments);
            
        } catch (Exception e) {
            System.out.println("Loi lay khoa: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }
}