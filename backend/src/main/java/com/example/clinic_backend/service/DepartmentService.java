package com.example.clinic_backend.service;

import com.example.clinic_backend.model.Department;
import com.example.clinic_backend.repository.DepartmentRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    public List<Department> getAllDepartments() {
        // Sử dụng findAll() thay vì findAllByOrderByDepartmentNameAsc()
        List<Department> departments = departmentRepository.findAll();
        // Sắp xếp theo tên khoa
        departments.sort(Comparator.comparing(Department::getDepartmentName));
        return departments;
    }

    public Optional<Department> getDepartmentById(Long id) {
        return departmentRepository.findById(id);
    }

    public Optional<Department> getDepartmentByName(String name) {
        return departmentRepository.findByDepartmentName(name);
    }

    @Transactional
    public Department createDepartment(Department department) {
        if (departmentRepository.existsByDepartmentName(department.getDepartmentName())) {
            throw new RuntimeException("Tên khoa đã tồn tại!");
        }
        if (department.getCreatedAt() == null) {
            department.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        }
        return departmentRepository.save(department);
    }

    @Transactional
    public Department updateDepartment(Long id, Department departmentDetails) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khoa với ID: " + id));
        
        // Kiểm tra tên khoa trùng (trừ chính nó)
        if (!department.getDepartmentName().equals(departmentDetails.getDepartmentName()) &&
            departmentRepository.existsByDepartmentName(departmentDetails.getDepartmentName())) {
            throw new RuntimeException("Tên khoa đã tồn tại!");
        }
        
        department.setDepartmentName(departmentDetails.getDepartmentName());
        department.setDescription(departmentDetails.getDescription());
        
        return departmentRepository.save(department);
    }

    @Transactional
    public void deleteDepartment(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khoa với ID: " + id));
        
        // Có thể thêm kiểm tra nếu có bác sĩ thuộc khoa này
        departmentRepository.delete(department);
    }

    @Transactional
    public void importFromExcel(MultipartFile file) throws Exception {
        List<Department> departments = new ArrayList<>();
        
        try (InputStream inputStream = file.getInputStream()) {
            Workbook workbook;
            
            if (file.getOriginalFilename().endsWith(".xlsx")) {
                workbook = new XSSFWorkbook(inputStream);
            } else if (file.getOriginalFilename().endsWith(".xls")) {
                workbook = new HSSFWorkbook(inputStream);
            } else {
                throw new RuntimeException("Định dạng file không hỗ trợ");
            }
            
            Sheet sheet = workbook.getSheetAt(0);
            
            // Bỏ qua dòng tiêu đề (dòng đầu tiên)
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                
                // Bỏ qua dòng trống
                if (isRowEmpty(row)) {
                    continue;
                }
                
                try {
                    // Cột A: Tên khoa
                    String departmentName = getCellStringValue(row.getCell(0));
                    
                    // Cột B: Mô tả
                    String description = getCellStringValue(row.getCell(1));
                    
                    if (departmentName == null || departmentName.trim().isEmpty()) {
                        continue; // Bỏ qua nếu tên khoa trống
                    }
                    
                    departmentName = departmentName.trim();
                    
                    // Kiểm tra xem khoa đã tồn tại chưa
                    Optional<Department> existingDept = departmentRepository.findByDepartmentName(departmentName);
                    if (existingDept.isPresent()) {
                        // Cập nhật khoa đã tồn tại
                        Department dept = existingDept.get();
                        if (description != null && !description.trim().isEmpty()) {
                            dept.setDescription(description.trim());
                        }
                        departmentRepository.save(dept);
                    } else {
                        // Thêm khoa mới
                        Department department = new Department();
                        department.setDepartmentName(departmentName);
                        department.setDescription(description != null ? description.trim() : null);
                        department.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                        
                        departments.add(department);
                    }
                } catch (Exception e) {
                    System.err.println("Lỗi khi xử lý dòng " + (i + 1) + ": " + e.getMessage());
                    // Tiếp tục với các dòng khác
                }
            }
            
            workbook.close();
        }
        
        // Lưu tất cả khoa mới
        if (!departments.isEmpty()) {
            departmentRepository.saveAll(departments);
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
    
    private String getCellStringValue(Cell cell) {
        if (cell == null) {
            return "";
        }
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toString();
                } else {
                    double value = cell.getNumericCellValue();
                    // Nếu là số nguyên
                    if (value == Math.floor(value)) {
                        return String.valueOf((int) value);
                    } else {
                        return String.valueOf(value);
                    }
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
                        return cell.getCellFormula();
                    }
                }
            default:
                return "";
        }
    }
}