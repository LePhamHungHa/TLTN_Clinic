package com.example.clinic_backend.service;

import com.example.clinic_backend.model.Medicine;
import com.example.clinic_backend.repository.MedicineRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class MedicineService {
    
    @Autowired
    private MedicineRepository medicineRepository;
    
    public List<Medicine> getAllMedicines() {
        // Sử dụng findAll() thay vì findAllByOrderByMedicineNameAsc()
        List<Medicine> medicines = medicineRepository.findAll();
        // Sắp xếp theo tên thuốc
        medicines.sort(Comparator.comparing(Medicine::getMedicineName));
        return medicines;
    }
    
    public Medicine getMedicineById(Long id) {
        Optional<Medicine> medicine = medicineRepository.findById(id);
        if (medicine.isEmpty()) {
            throw new RuntimeException("Thuốc không tồn tại với ID: " + id);
        }
        return medicine.get();
    }
    
    public List<Medicine> getActiveMedicines() {
        return medicineRepository.findByStatus("ACTIVE");
    }
    
    public List<String> getAllCategories() {
        List<Medicine> medicines = medicineRepository.findAll();
        Set<String> categories = new HashSet<>();
        for (Medicine medicine : medicines) {
            if (medicine.getCategory() != null && !medicine.getCategory().trim().isEmpty()) {
                categories.add(medicine.getCategory().trim());
            }
        }
        return new ArrayList<>(categories);
    }
    
    @Transactional
    public Medicine createMedicine(Medicine medicine) {
        // Kiểm tra mã thuốc đã tồn tại
        if (medicine.getMedicineCode() != null && !medicine.getMedicineCode().isEmpty()) {
            Optional<Medicine> existing = medicineRepository.findByMedicineCode(medicine.getMedicineCode());
            if (existing.isPresent()) {
                throw new RuntimeException("Mã thuốc đã tồn tại: " + medicine.getMedicineCode());
            }
        } else {
            // Tạo mã thuốc mới
            medicine.setMedicineCode(generateMedicineCode());
        }
        
        // Đặt giá trị mặc định
        if (medicine.getStockQuantity() == null) {
            medicine.setStockQuantity(0);
        }
        if (medicine.getMinStockLevel() == null) {
            medicine.setMinStockLevel(10);
        }
        if (medicine.getMaxStockLevel() == null) {
            medicine.setMaxStockLevel(100);
        }
        if (medicine.getUnitPrice() == null) {
            medicine.setUnitPrice(BigDecimal.ZERO);
        }
        if (medicine.getPrescriptionRequired() == null) {
            medicine.setPrescriptionRequired(true);
        }
        if (medicine.getStatus() == null) {
            medicine.setStatus("ACTIVE");
        }
        
        // Cập nhật trạng thái dựa trên stock
        updateMedicineStatus(medicine);
        
        medicine.setCreatedAt(LocalDateTime.now());
        medicine.setUpdatedAt(LocalDateTime.now());
        
        return medicineRepository.save(medicine);
    }
    
    @Transactional
    public Medicine updateMedicine(Long id, Medicine medicineDetails) {
        Medicine medicine = getMedicineById(id);
        
        // Cập nhật từng trường
        if (medicineDetails.getMedicineName() != null) {
            medicine.setMedicineName(medicineDetails.getMedicineName());
        }
        if (medicineDetails.getMedicineCode() != null) {
            // Kiểm tra mã thuốc trùng (trừ chính nó)
            if (!medicine.getMedicineCode().equals(medicineDetails.getMedicineCode())) {
                Optional<Medicine> existing = medicineRepository.findByMedicineCode(medicineDetails.getMedicineCode());
                if (existing.isPresent() && !existing.get().getId().equals(id)) {
                    throw new RuntimeException("Mã thuốc đã tồn tại: " + medicineDetails.getMedicineCode());
                }
                medicine.setMedicineCode(medicineDetails.getMedicineCode());
            }
        }
        if (medicineDetails.getActiveIngredient() != null) {
            medicine.setActiveIngredient(medicineDetails.getActiveIngredient());
        }
        if (medicineDetails.getDosageForm() != null) {
            medicine.setDosageForm(medicineDetails.getDosageForm());
        }
        if (medicineDetails.getStrength() != null) {
            medicine.setStrength(medicineDetails.getStrength());
        }
        if (medicineDetails.getUnit() != null) {
            medicine.setUnit(medicineDetails.getUnit());
        }
        if (medicineDetails.getPackageType() != null) {
            medicine.setPackageType(medicineDetails.getPackageType());
        }
        if (medicineDetails.getQuantityPerPackage() != null) {
            medicine.setQuantityPerPackage(medicineDetails.getQuantityPerPackage());
        }
        if (medicineDetails.getManufacturer() != null) {
            medicine.setManufacturer(medicineDetails.getManufacturer());
        }
        if (medicineDetails.getCountryOrigin() != null) {
            medicine.setCountryOrigin(medicineDetails.getCountryOrigin());
        }
        if (medicineDetails.getUnitPrice() != null) {
            medicine.setUnitPrice(medicineDetails.getUnitPrice());
        }
        if (medicineDetails.getStockQuantity() != null) {
            medicine.setStockQuantity(medicineDetails.getStockQuantity());
        }
        if (medicineDetails.getMinStockLevel() != null) {
            medicine.setMinStockLevel(medicineDetails.getMinStockLevel());
        }
        if (medicineDetails.getMaxStockLevel() != null) {
            medicine.setMaxStockLevel(medicineDetails.getMaxStockLevel());
        }
        if (medicineDetails.getPrescriptionRequired() != null) {
            medicine.setPrescriptionRequired(medicineDetails.getPrescriptionRequired());
        }
        if (medicineDetails.getCategory() != null) {
            medicine.setCategory(medicineDetails.getCategory());
        }
        if (medicineDetails.getStatus() != null) {
            medicine.setStatus(medicineDetails.getStatus());
        }
        
        // Cập nhật trạng thái dựa trên stock
        updateMedicineStatus(medicine);
        
        medicine.setUpdatedAt(LocalDateTime.now());
        
        return medicineRepository.save(medicine);
    }
    
    @Transactional
    public Medicine updateStock(Long id, Integer quantity) {
        if (quantity == null) {
            throw new RuntimeException("Số lượng không được để trống");
        }
        
        Medicine medicine = getMedicineById(id);
        
        int newQuantity = medicine.getStockQuantity() + quantity;
        if (newQuantity < 0) {
            throw new RuntimeException("Số lượng tồn kho không thể âm");
        }
        
        medicine.setStockQuantity(newQuantity);
        
        // Cập nhật trạng thái dựa trên stock mới
        updateMedicineStatus(medicine);
        
        medicine.setUpdatedAt(LocalDateTime.now());
        
        return medicineRepository.save(medicine);
    }
    
    @Transactional
    public void toggleStatus(Long id) {
        Medicine medicine = getMedicineById(id);
        
        if ("ACTIVE".equals(medicine.getStatus())) {
            medicine.setStatus("INACTIVE");
        } else {
            medicine.setStatus("ACTIVE");
            updateMedicineStatus(medicine);
        }
        
        medicine.setUpdatedAt(LocalDateTime.now());
        medicineRepository.save(medicine);
    }
    
    @Transactional
    public void deleteMedicine(Long id) {
        Medicine medicine = getMedicineById(id);
        medicineRepository.delete(medicine);
    }
    
    @Transactional
    public void importFromExcel(MultipartFile file) throws Exception {
        List<Medicine> medicines = new ArrayList<>();
        
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
                    Medicine medicine = mapRowToMedicine(row);
                    
                    // Kiểm tra nếu thuốc đã tồn tại (theo mã thuốc)
                    if (medicine.getMedicineCode() != null && !medicine.getMedicineCode().isEmpty()) {
                        Optional<Medicine> existing = medicineRepository.findByMedicineCode(medicine.getMedicineCode());
                        if (existing.isPresent()) {
                            // Cập nhật thuốc đã tồn tại
                            Medicine existingMedicine = existing.get();
                            existingMedicine.setMedicineName(medicine.getMedicineName());
                            existingMedicine.setActiveIngredient(medicine.getActiveIngredient());
                            existingMedicine.setUnit(medicine.getUnit());
                            existingMedicine.setUnitPrice(medicine.getUnitPrice());
                            existingMedicine.setStockQuantity(medicine.getStockQuantity());
                            existingMedicine.setCategory(medicine.getCategory());
                            existingMedicine.setPrescriptionRequired(medicine.getPrescriptionRequired());
                            updateMedicineStatus(existingMedicine);
                            existingMedicine.setUpdatedAt(LocalDateTime.now());
                            medicineRepository.save(existingMedicine);
                            continue;
                        }
                    }
                    
                    medicines.add(medicine);
                } catch (Exception e) {
                    System.err.println("Lỗi khi xử lý dòng " + (i + 1) + ": " + e.getMessage());
                    // Tiếp tục với các dòng khác
                }
            }
            
            workbook.close();
        }
        
        // Lưu tất cả thuốc mới
        if (!medicines.isEmpty()) {
            medicineRepository.saveAll(medicines);
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
    
    private Medicine mapRowToMedicine(Row row) {
    Medicine medicine = new Medicine();
    
    try {
        medicine.setMedicineCode(getCellStringValue(row.getCell(0)));
        medicine.setMedicineName(getCellStringValue(row.getCell(1)));
        medicine.setActiveIngredient(getCellStringValue(row.getCell(2)));
        medicine.setDosageForm(getCellStringValue(row.getCell(3)));
        medicine.setStrength(getCellStringValue(row.getCell(4)));
        medicine.setUnit(getCellStringValue(row.getCell(5)));
        medicine.setPackageType(getCellStringValue(row.getCell(6)));
        
        Integer quantityPerPackage = getCellIntegerValue(row.getCell(7), 1);
        medicine.setQuantityPerPackage(quantityPerPackage);
        
        medicine.setManufacturer(getCellStringValue(row.getCell(8)));
        medicine.setCountryOrigin(getCellStringValue(row.getCell(9)));
        medicine.setLotNumber(getCellStringValue(row.getCell(10)));
        
        Cell expiryCell = row.getCell(11);
        if (expiryCell != null && expiryCell.getCellType() == CellType.NUMERIC) {
            if (DateUtil.isCellDateFormatted(expiryCell)) {
                medicine.setExpiryDate(expiryCell.getLocalDateTimeCellValue().toLocalDate());
            }
        }
        
        medicine.setUnitPrice(getCellBigDecimalValue(row.getCell(12)));
        
        medicine.setStockQuantity(getCellIntegerValue(row.getCell(13), 0));
        medicine.setMinStockLevel(getCellIntegerValue(row.getCell(14), 10));
        medicine.setMaxStockLevel(getCellIntegerValue(row.getCell(15), 100));
        
        medicine.setPrescriptionRequired(getCellBooleanValue(row.getCell(16), true));
        
        medicine.setDescription(getCellStringValue(row.getCell(17)));
        medicine.setSideEffects(getCellStringValue(row.getCell(18)));
        medicine.setContraindications(getCellStringValue(row.getCell(19)));
        medicine.setUsageInstructions(getCellStringValue(row.getCell(20)));
        medicine.setStorageConditions(getCellStringValue(row.getCell(21)));
        
        medicine.setCategory(getCellStringValue(row.getCell(22)));
        
        String status = getCellStringValue(row.getCell(23));
        if (status != null && !status.isEmpty()) {
            medicine.setStatus(status);
        } else {
            medicine.setStatus("ACTIVE");
        }
        
        updateMedicineStatus(medicine);
        
        medicine.setCreatedAt(LocalDateTime.now());
        medicine.setUpdatedAt(LocalDateTime.now());
        
    } catch (Exception e) {
        throw new RuntimeException("Lỗi khi đọc dữ liệu từ file Excel: " + e.getMessage());
    }
    
    return medicine;
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
                        return cell.getCellFormula();
                    }
                }
            default:
                return "";
        }
    }
    
    private BigDecimal getCellBigDecimalValue(Cell cell) {
        if (cell == null) {
            return BigDecimal.ZERO;
        }
        
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return BigDecimal.valueOf(cell.getNumericCellValue());
            } else if (cell.getCellType() == CellType.STRING) {
                String value = cell.getStringCellValue().trim();
                if (!value.isEmpty()) {
                    // Loại bỏ ký tự không phải số
                    value = value.replaceAll("[^\\d.,]", "").replace(",", ".");
                    return new BigDecimal(value);
                }
            }
        } catch (Exception e) {
            // Nếu có lỗi, trả về 0
        }
        
        return BigDecimal.ZERO;
    }
    
    private Integer getCellIntegerValue(Cell cell, Integer defaultValue) {
        if (cell == null) {
            return defaultValue;
        }
        
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return (int) cell.getNumericCellValue();
            } else if (cell.getCellType() == CellType.STRING) {
                String value = cell.getStringCellValue().trim();
                if (!value.isEmpty()) {
                    // Loại bỏ ký tự không phải số
                    value = value.replaceAll("[^\\d]", "");
                    if (!value.isEmpty()) {
                        return Integer.parseInt(value);
                    }
                }
            }
        } catch (Exception e) {
            // Nếu có lỗi, trả về giá trị mặc định
        }
        
        return defaultValue;
    }
    
    private Boolean getCellBooleanValue(Cell cell, Boolean defaultValue) {
        if (cell == null) {
            return defaultValue;
        }
        
        try {
            if (cell.getCellType() == CellType.BOOLEAN) {
                return cell.getBooleanCellValue();
            } else if (cell.getCellType() == CellType.STRING) {
                String value = cell.getStringCellValue().trim().toLowerCase();
                return value.equals("true") || value.equals("1") || value.equals("yes") || 
                       value.equals("có") || value.equals("c") || value.equals("y");
            } else if (cell.getCellType() == CellType.NUMERIC) {
                return cell.getNumericCellValue() == 1;
            }
        } catch (Exception e) {
            // Nếu có lỗi, trả về giá trị mặc định
        }
        
        return defaultValue;
    }
    
    private void updateMedicineStatus(Medicine medicine) {
        if (medicine.getStockQuantity() <= 0) {
            medicine.setStatus("OUT_OF_STOCK");
        } else if (medicine.getStockQuantity() <= medicine.getMinStockLevel()) {
            medicine.setStatus("LOW_STOCK");
        } else if (!"INACTIVE".equals(medicine.getStatus())) {
            medicine.setStatus("ACTIVE");
        }
    }
    
    private String generateMedicineCode() {
        String prefix = "MED";
        List<Medicine> medicines = medicineRepository.findAll();
        
        long maxNumber = 0;
        for (Medicine medicine : medicines) {
            if (medicine.getMedicineCode() != null && medicine.getMedicineCode().startsWith(prefix)) {
                try {
                    String numberStr = medicine.getMedicineCode().substring(prefix.length());
                    long number = Long.parseLong(numberStr);
                    if (number > maxNumber) {
                        maxNumber = number;
                    }
                } catch (NumberFormatException e) {
                    // Bỏ qua nếu không phải số
                }
            }
        }
        
        return prefix + String.format("%06d", maxNumber + 1);
    }
}