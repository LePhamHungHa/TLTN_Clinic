package com.example.clinic_backend.service;

import com.example.clinic_backend.model.Doctor;
import com.example.clinic_backend.repository.DoctorRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;

    public DoctorService(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    // Tạo bác sĩ mới
    @Transactional
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

            // Không gọi setCreatedAt() vì model không có field này
            // Database sẽ tự động tạo timestamp nếu cột có DEFAULT CURRENT_TIMESTAMP
            
            Doctor savedDoctor = doctorRepository.save(doctor);
            return savedDoctor;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi tạo bác sĩ: " + e.getMessage());
        }
    }

    // Lấy toàn bộ bác sĩ
    @Transactional(readOnly = true)
    public List<Doctor> getAllDoctors() {
        try {
            List<Doctor> doctors = doctorRepository.findAll();
            return doctors;
        } catch (Exception e) {
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
    @Transactional
    public Doctor updateDoctor(Long id, Doctor updatedDoctor) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bác sĩ với ID: " + id));
        
        // Cập nhật các trường cơ bản
        if (updatedDoctor.getFullName() != null) {
            doctor.setFullName(updatedDoctor.getFullName());
        }
        if (updatedDoctor.getDateOfBirth() != null) {
            doctor.setDateOfBirth(updatedDoctor.getDateOfBirth());
        }
        if (updatedDoctor.getGender() != null) {
            doctor.setGender(updatedDoctor.getGender());
        }
        if (updatedDoctor.getCitizenId() != null) {
            doctor.setCitizenId(updatedDoctor.getCitizenId());
        }
        if (updatedDoctor.getAddress() != null) {
            doctor.setAddress(updatedDoctor.getAddress());
        }
        if (updatedDoctor.getPhone() != null) {
            // Kiểm tra số điện thoại trùng (trừ chính nó)
            if (!doctor.getPhone().equals(updatedDoctor.getPhone()) &&
                doctorRepository.existsByPhone(updatedDoctor.getPhone())) {
                throw new RuntimeException("Số điện thoại đã tồn tại: " + updatedDoctor.getPhone());
            }
            doctor.setPhone(updatedDoctor.getPhone());
        }
        if (updatedDoctor.getEmail() != null) {
            // Kiểm tra email trùng (trừ chính nó)
            if (!doctor.getEmail().equals(updatedDoctor.getEmail()) &&
                doctorRepository.existsByEmail(updatedDoctor.getEmail())) {
                throw new RuntimeException("Email đã tồn tại: " + updatedDoctor.getEmail());
            }
            doctor.setEmail(updatedDoctor.getEmail());
        }
        if (updatedDoctor.getDepartmentId() != null) {
            doctor.setDepartmentId(updatedDoctor.getDepartmentId());
        }
        if (updatedDoctor.getSpecialty() != null) {
            doctor.setSpecialty(updatedDoctor.getSpecialty());
        }
        if (updatedDoctor.getDegree() != null) {
            doctor.setDegree(updatedDoctor.getDegree());
        }
        if (updatedDoctor.getPosition() != null) {
            doctor.setPosition(updatedDoctor.getPosition());
        }
        if (updatedDoctor.getRoomNumber() != null) {
            doctor.setRoomNumber(updatedDoctor.getRoomNumber());
        }
        if (updatedDoctor.getFloor() != null) {
            doctor.setFloor(updatedDoctor.getFloor());
        }
        
        return doctorRepository.save(doctor);
    }

    // Xóa bác sĩ
    @Transactional
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

    // Import doctors from Excel
    @Transactional
    public void importFromExcel(MultipartFile file) throws Exception {
        List<Doctor> doctors = new ArrayList<>();
        
        String fileName = file.getOriginalFilename();
        if (fileName == null || (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls"))) {
            throw new RuntimeException("Chỉ hỗ trợ file Excel (.xlsx, .xls)");
        }
        
        try (InputStream inputStream = file.getInputStream()) {
            Workbook workbook;
            
            if (fileName.endsWith(".xlsx")) {
                workbook = new XSSFWorkbook(inputStream);
            } else {
                workbook = new HSSFWorkbook(inputStream);
            }
            
            Sheet sheet = workbook.getSheetAt(0);
            
            // Duyệt qua các dòng (bắt đầu từ dòng 1 để bỏ qua header)
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) {
                    continue;
                }
                
                // Bỏ qua dòng trống
                if (isRowEmpty(row)) {
                    continue;
                }
                
                try {
                    Doctor doctor = mapRowToDoctor(row);
                    
                    // Kiểm tra nếu bác sĩ đã tồn tại (theo email hoặc SĐT)
                    boolean exists = false;
                    if (doctor.getEmail() != null && !doctor.getEmail().isEmpty()) {
                        exists = doctorRepository.existsByEmail(doctor.getEmail());
                    }
                    if (!exists && doctor.getPhone() != null && !doctor.getPhone().isEmpty()) {
                        exists = doctorRepository.existsByPhone(doctor.getPhone());
                    }
                    
                    if (!exists) {
                        doctors.add(doctor);
                    } else {
                        System.out.println("Bỏ qua bác sĩ đã tồn tại: " + doctor.getFullName());
                    }
                } catch (Exception e) {
                    System.err.println("Lỗi khi xử lý dòng " + (i + 1) + ": " + e.getMessage());
                    // Tiếp tục với các dòng khác
                }
            }
            
            workbook.close();
        }
        
        // Lưu tất cả bác sĩ mới
        if (!doctors.isEmpty()) {
            doctorRepository.saveAll(doctors);
        }
    }
    
    private boolean isRowEmpty(Row row) {
        for (int cellNum = 0; cellNum < row.getLastCellNum(); cellNum++) {
            Cell cell = row.getCell(cellNum);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                return false;
            }
        }
        return true;
    }
    
    private Doctor mapRowToDoctor(Row row) {
        Doctor doctor = new Doctor();
        
        try {
            // Cột A: Họ và tên
            doctor.setFullName(getCellStringValue(row.getCell(0)));
            
            // Cột B: Ngày sinh
            String dobStr = getCellStringValue(row.getCell(1));
            if (dobStr != null && !dobStr.isEmpty()) {
                try {
                    LocalDate dob = LocalDate.parse(dobStr);
                    doctor.setDateOfBirth(dob);
                } catch (Exception e) {
                    // Thử parse với các định dạng khác
                    try {
                        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                        LocalDate dob = LocalDate.parse(dobStr, formatter);
                        doctor.setDateOfBirth(dob);
                    } catch (Exception ex) {
                        // Nếu không parse được, để null
                        System.err.println("Không thể parse ngày sinh: " + dobStr);
                    }
                }
            }
            
            // Cột C: Giới tính
            String genderStr = getCellStringValue(row.getCell(2));
            if (genderStr != null && !genderStr.isEmpty()) {
                if (genderStr.equalsIgnoreCase("nam") || genderStr.equalsIgnoreCase("male")) {
                    doctor.setGender("MALE");
                } else if (genderStr.equalsIgnoreCase("nữ") || genderStr.equalsIgnoreCase("female")) {
                    doctor.setGender("FEMALE");
                } else {
                    doctor.setGender("OTHER");
                }
            } else {
                doctor.setGender("MALE"); 
            }
            
            // Cột D: Email
            String email = getCellStringValue(row.getCell(3));
            if (email != null && !email.isEmpty()) {
                doctor.setEmail(email);
            }
            
            // Cột E: SĐT
            String phone = getCellStringValue(row.getCell(4));
            if (phone != null && !phone.isEmpty()) {
                doctor.setPhone(phone);
            }
            
            // Cột F: Chuyên khoa
            doctor.setSpecialty(getCellStringValue(row.getCell(5)));
            
            // Cột G: Bằng cấp
            doctor.setDegree(getCellStringValue(row.getCell(6)));
            
            // Cột H: Vị trí
            String position = getCellStringValue(row.getCell(7));
            doctor.setPosition(position != null && !position.isEmpty() ? position : "Bác sĩ");
            
            // Cột I: Số phòng
            doctor.setRoomNumber(getCellStringValue(row.getCell(8)));
            
            // Cột J: Tầng
            doctor.setFloor(getCellStringValue(row.getCell(9)));
            
            // Thêm các trường còn lại nếu có
            if (row.getLastCellNum() > 10) {
                // Cột K: Địa chỉ
                doctor.setAddress(getCellStringValue(row.getCell(10)));
            }
            if (row.getLastCellNum() > 11) {
                // Cột L: CMND/CCCD
                doctor.setCitizenId(getCellStringValue(row.getCell(11)));
            }
            
            // Không gọi setCreatedAt() vì model không có field này
            
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi đọc dữ liệu từ file Excel: " + e.getMessage());
        }
        
        return doctor;
    }
    
    private String getCellStringValue(Cell cell) {
        if (cell == null) {
            return "";
        }
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    try {
                        return cell.getLocalDateTimeCellValue().toLocalDate().toString();
                    } catch (Exception e) {
                        return String.valueOf(cell.getNumericCellValue());
                    }
                } else {
                    double value = cell.getNumericCellValue();
                    // Nếu là số nguyên
                    if (value == (int) value) {
                        return String.valueOf((int) value);
                    }
                    return String.valueOf(value);
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return cell.getStringCellValue();
                } catch (Exception e) {
                    try {
                        return String.valueOf(cell.getNumericCellValue());
                    } catch (Exception ex) {
                        return "";
                    }
                }
            default:
                return "";
        }
    }
}