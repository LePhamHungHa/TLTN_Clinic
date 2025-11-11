package com.example.clinic_backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.example.clinic_backend.model.Doctor;
import com.example.clinic_backend.model.Department;
import com.example.clinic_backend.model.User;
import com.example.clinic_backend.repository.DoctorRepository;
import com.example.clinic_backend.repository.DepartmentRepository;
import com.example.clinic_backend.repository.UserRepository;

import java.sql.Timestamp;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public DataInitializer(DoctorRepository doctorRepository, 
                         DepartmentRepository departmentRepository,
                         UserRepository userRepository) {
        this.doctorRepository = doctorRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Override
    public void run(String... args) throws Exception {
        // Tạo khoa mẫu nếu chưa có
        if (departmentRepository.count() == 0) {
            Department dept1 = new Department();
            dept1.setDepartmentName("Khoa Nội tổng quát");
            dept1.setDescription("Khám và điều trị các bệnh nội khoa");
            dept1.setCreatedAt(new Timestamp(System.currentTimeMillis()));

            Department dept2 = new Department();
            dept2.setDepartmentName("Khoa Nhi");
            dept2.setDescription("Khám và điều trị bệnh cho trẻ em");
            dept2.setCreatedAt(new Timestamp(System.currentTimeMillis()));

            Department dept3 = new Department();
            dept3.setDepartmentName("Khoa Ngoại");
            dept3.setDescription("Phẫu thuật và điều trị ngoại khoa");
            dept3.setCreatedAt(new Timestamp(System.currentTimeMillis()));

            departmentRepository.saveAll(List.of(dept1, dept2, dept3));
            System.out.println("✅ Departments initialized!");
        }

        // Tạo user admin mẫu nếu chưa có
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            admin.setFullName("Quản trị viên");
            admin.setEmail("admin@hospital.com");
            admin.setPhone("0900000000");
            
            userRepository.save(admin);
            System.out.println("✅ Admin user initialized!");
        }

        // Tạo bác sĩ mẫu nếu chưa có
        if (doctorRepository.count() == 0) {
            // Lấy danh sách khoa
            List<Department> departments = departmentRepository.findAll();
            
            if (!departments.isEmpty()) {
                Doctor d1 = new Doctor();
                d1.setFullName("Nguyễn Văn Hùng");
                d1.setDegree("Thạc sĩ");
                d1.setPosition("Bác sĩ trưởng khoa");
                d1.setPhone("0123456789");
                d1.setEmail("dr.hung@hospital.com");
                d1.setDepartmentId(departments.get(0).getId()); // Gán khoa Nội tổng quát
                d1.setRoomNumber("101");
                d1.setFloor("1");
                d1.setGender("MALE");
                d1.setAddress("Hà Nội");

                Doctor d2 = new Doctor();
                d2.setFullName("Trần Thị Linh");
                d2.setDegree("Tiến sĩ");
                d2.setPosition("Trưởng khoa");
                d2.setPhone("0987654321");
                d2.setEmail("dr.linh@hospital.com");
                d2.setDepartmentId(departments.get(1).getId()); // Gán khoa Nhi
                d2.setRoomNumber("201");
                d2.setFloor("2");
                d2.setGender("FEMALE");
                d2.setAddress("Hà Nội");

                Doctor d3 = new Doctor();
                d3.setFullName("Lê Văn Tú");
                d3.setDegree("Bác sĩ chuyên khoa II");
                d3.setPosition("Phó khoa");
                d3.setPhone("0912345678");
                d3.setEmail("dr.tu@hospital.com");
                d3.setDepartmentId(departments.get(2).getId()); // Gán khoa Ngoại
                d3.setRoomNumber("301");
                d3.setFloor("3");
                d3.setGender("MALE");
                d3.setAddress("Hà Nội");

                doctorRepository.saveAll(List.of(d1, d2, d3));
                System.out.println("✅ Doctors initialized!");
            }
        }
    }
}