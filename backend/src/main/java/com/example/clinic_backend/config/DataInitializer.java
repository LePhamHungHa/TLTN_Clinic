package com.example.clinic_backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.example.clinic_backend.model.Doctor;
import com.example.clinic_backend.repository.DoctorRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private final DoctorRepository doctorRepository;

    public DataInitializer(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        if (doctorRepository.count() == 0) { // chỉ thêm nếu table rỗng
            Doctor d1 = new Doctor();
            d1.setUsername("dr.hung");
            d1.setPassword(encoder.encode("123456"));
            d1.setFullName("Nguyen Van Hung");
            d1.setSpecialty("Internal Medicine");
            d1.setPhone("0123456789");

            Doctor d2 = new Doctor();
            d2.setUsername("dr.linh");
            d2.setPassword(encoder.encode("123456"));
            d2.setFullName("Tran Thi Linh");
            d2.setSpecialty("Pediatrics");
            d2.setPhone("0987654321");

            doctorRepository.save(d1);
            doctorRepository.save(d2);

            System.out.println("Doctors initialized!");
        }
    }
}
