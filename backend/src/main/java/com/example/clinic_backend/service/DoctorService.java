package com.example.clinic_backend.service;

import com.example.clinic_backend.model.Doctor;
import com.example.clinic_backend.repository.DoctorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;

    public DoctorService(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    // Tạo bác sĩ mới
    public Doctor createDoctor(Doctor doctor) {
        try {
            // Kiểm tra email đã tồn tại chưa
            if (doctor.getEmail() != null && doctorRepository.existsByEmail(doctor.getEmail())) {
                throw new RuntimeException("Email đã tồn tại: " + doctor.getEmail());
            }
            
            // Kiểm tra số điện thoại đã tồn tại chưa
            if (doctor.getPhone() != null && doctorRepository.existsByPhone(doctor.getPhone())) {
                throw new RuntimeException("Số điện thoại đã tồn tại: " + doctor.getPhone());
            }

            Doctor savedDoctor = doctorRepository.save(doctor);
            System.out.println("✅ Saved doctor with ID: " + savedDoctor.getId() + 
                ", Department ID: " + savedDoctor.getDepartmentId());
            return savedDoctor;
        } catch (Exception e) {
            System.err.println("❌ Error saving doctor: " + e.getMessage());
            throw new RuntimeException("Lỗi khi tạo bác sĩ: " + e.getMessage());
        }
    }

    // Lấy toàn bộ bác sĩ với department
    @Transactional(readOnly = true)
    public List<Doctor> getAllDoctors() {
        try {
            System.out.println("🔄 DoctorService: Loading all doctors with departments...");
            
            // Sử dụng phương thức có JOIN FETCH
            List<Doctor> doctors = doctorRepository.findAllWithDepartment();
            
            // Debug chi tiết từng doctor
            for (Doctor doctor : doctors) {
                System.out.println("🔍 Doctor Debug - ID: " + doctor.getId() + 
                    ", Name: " + doctor.getFullName() +
                    ", Dept ID: " + doctor.getDepartmentId() + 
                    ", Dept Object: " + (doctor.getDepartment() != null ? 
                    doctor.getDepartment().getDepartmentName() : "NULL") +
                    ", Dept Name via getter: " + doctor.getDepartmentName());
            }
            
            System.out.println("✅ DoctorService: Successfully loaded " + doctors.size() + " doctors");
            return doctors;
            
        } catch (Exception e) {
            System.err.println("❌ DoctorService Error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Lỗi khi lấy danh sách bác sĩ: " + e.getMessage());
        }
    }

    // Lấy bác sĩ theo id
    @Transactional(readOnly = true)
    public Optional<Doctor> getDoctorById(Long id) {
        return doctorRepository.findById(id);
    }

    // Tìm bác sĩ theo tên
    @Transactional(readOnly = true)
    public List<Doctor> getDoctorsByName(String name) {
        return doctorRepository.findByFullNameContainingIgnoreCase(name);
    }

    // Tìm bác sĩ theo tên khoa
    @Transactional(readOnly = true)
    public List<Doctor> getDoctorsByDepartmentName(String departmentName) {
        return doctorRepository.findByDepartmentNameContaining(departmentName);
    }

    // Tìm bác sĩ theo departmentId
    @Transactional(readOnly = true)
    public List<Doctor> getDoctorsByDepartmentId(Long departmentId) {
        return doctorRepository.findByDepartmentId(departmentId);
    }

    // Tìm bác sĩ theo userId
    @Transactional(readOnly = true)
    public Optional<Doctor> getDoctorByUserId(Long userId) {
        return doctorRepository.findByUserId(userId);
    }

    // Cập nhật bác sĩ
    public Doctor updateDoctor(Long id, Doctor updatedDoctor) {
        Optional<Doctor> optionalDoctor = doctorRepository.findById(id);
        if (optionalDoctor.isPresent()) {
            Doctor doctor = optionalDoctor.get();
            doctor.setFullName(updatedDoctor.getFullName());
            doctor.setDateOfBirth(updatedDoctor.getDateOfBirth());
            doctor.setGender(updatedDoctor.getGender());
            doctor.setCitizenId(updatedDoctor.getCitizenId());
            doctor.setAddress(updatedDoctor.getAddress());
            doctor.setPhone(updatedDoctor.getPhone());
            doctor.setEmail(updatedDoctor.getEmail());
            doctor.setDepartmentId(updatedDoctor.getDepartmentId());
            doctor.setDegree(updatedDoctor.getDegree());
            doctor.setPosition(updatedDoctor.getPosition());
            doctor.setRoomNumber(updatedDoctor.getRoomNumber());
            doctor.setFloor(updatedDoctor.getFloor());
            return doctorRepository.save(doctor);
        }
        throw new RuntimeException("Không tìm thấy bác sĩ với ID: " + id);
    }

    // Xóa bác sĩ
    public void deleteDoctor(Long id) {
        if (!doctorRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy bác sĩ với ID: " + id);
        }
        doctorRepository.deleteById(id);
    }

    // Kiểm tra bác sĩ có tồn tại không
    public boolean existsById(Long id) {
        return doctorRepository.existsById(id);
    }
}