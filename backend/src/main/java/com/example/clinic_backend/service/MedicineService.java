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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class MedicineService {
    
    @Autowired
    private MedicineRepository medicineRepository;
    
    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }
    
    public Medicine getMedicineById(Long id) {
        Medicine medicine = medicineRepository.findById(id).orElse(null);
        if (medicine == null) {
            throw new RuntimeException("Thuốc không tồn tại với ID: " + id);
        }
        return medicine;
    }
    
    public List<Medicine> getActiveMedicines() {
        List<Medicine> allMedicines = medicineRepository.findAll();
        List<Medicine> activeMedicines = new ArrayList<>();
        for (Medicine medicine : allMedicines) {
            if ("ACTIVE".equals(medicine.getStatus())) {
                activeMedicines.add(medicine);
            }
        }
        return activeMedicines;
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
            List<Medicine> existing = medicineRepository.findAll();
            for (Medicine med : existing) {
                if (med.getMedicineCode() != null && 
                    med.getMedicineCode().equalsIgnoreCase(medicine.getMedicineCode())) {
                    throw new RuntimeException("Mã thuốc đã tồn tại");
                }
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
        
        // Cập nhật từng trường nếu có
        if (medicineDetails.getMedicineName() != null) {
            medicine.setMedicineName(medicineDetails.getMedicineName());
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
        if (medicineDetails.getLotNumber() != null) {
            medicine.setLotNumber(medicineDetails.getLotNumber());
        }
        if (medicineDetails.getExpiryDate() != null) {
            medicine.setExpiryDate(medicineDetails.getExpiryDate());
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
        if (medicineDetails.getDescription() != null) {
            medicine.setDescription(medicineDetails.getDescription());
        }
        if (medicineDetails.getSideEffects() != null) {
            medicine.setSideEffects(medicineDetails.getSideEffects());
        }
        if (medicineDetails.getContraindications() != null) {
            medicine.setContraindications(medicineDetails.getContraindications());
        }
        if (medicineDetails.getUsageInstructions() != null) {
            medicine.setUsageInstructions(medicineDetails.getUsageInstructions());
        }
        if (medicineDetails.getStorageConditions() != null) {
            medicine.setStorageConditions(medicineDetails.getStorageConditions());
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
                
                Medicine medicine = mapRowToMedicine(row);
                medicines.add(medicine);
            }
            
            workbook.close();
        }
        
        // Lưu tất cả thuốc
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
        
        // Đọc từng ô theo cột
        medicine.setMedicineCode(getCellValue(row.getCell(0)));
        medicine.setMedicineName(getCellValue(row.getCell(1)));
        medicine.setActiveIngredient(getCellValue(row.getCell(2)));
        medicine.setDosageForm(getCellValue(row.getCell(3)));
        medicine.setStrength(getCellValue(row.getCell(4)));
        medicine.setUnit(getCellValue(row.getCell(5)));
        medicine.setPackageType(getCellValue(row.getCell(6)));
        
        // Quantity per package
        try {
            Cell cell = row.getCell(7);
            if (cell != null && cell.getCellType() == CellType.NUMERIC) {
                medicine.setQuantityPerPackage((int) cell.getNumericCellValue());
            } else if (cell != null && cell.getCellType() == CellType.STRING) {
                String value = cell.getStringCellValue().trim();
                if (!value.isEmpty()) {
                    medicine.setQuantityPerPackage(Integer.parseInt(value));
                }
            }
        } catch (Exception e) {
            medicine.setQuantityPerPackage(1);
        }
        
        medicine.setManufacturer(getCellValue(row.getCell(8)));
        medicine.setCountryOrigin(getCellValue(row.getCell(9)));
        medicine.setLotNumber(getCellValue(row.getCell(10)));
        
        // Expiry date
        try {
            Cell cell = row.getCell(11);
            if (cell != null) {
                if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                    medicine.setExpiryDate(cell.getLocalDateTimeCellValue().toLocalDate());
                } else if (cell.getCellType() == CellType.STRING) {
                    String dateStr = cell.getStringCellValue().trim();
                    if (!dateStr.isEmpty()) {
                        medicine.setExpiryDate(LocalDate.parse(dateStr));
                    }
                }
            }
        } catch (Exception e) {
            medicine.setExpiryDate(null);
        }
        
        // Unit price
        try {
            Cell cell = row.getCell(12);
            if (cell != null && cell.getCellType() == CellType.NUMERIC) {
                medicine.setUnitPrice(BigDecimal.valueOf(cell.getNumericCellValue()));
            } else if (cell != null && cell.getCellType() == CellType.STRING) {
                String value = cell.getStringCellValue().trim();
                if (!value.isEmpty()) {
                    medicine.setUnitPrice(new BigDecimal(value));
                } else {
                    medicine.setUnitPrice(BigDecimal.ZERO);
                }
            } else {
                medicine.setUnitPrice(BigDecimal.ZERO);
            }
        } catch (Exception e) {
            medicine.setUnitPrice(BigDecimal.ZERO);
        }
        
        // Stock quantity
        try {
            Cell cell = row.getCell(13);
            if (cell != null && cell.getCellType() == CellType.NUMERIC) {
                medicine.setStockQuantity((int) cell.getNumericCellValue());
            } else if (cell != null && cell.getCellType() == CellType.STRING) {
                String value = cell.getStringCellValue().trim();
                if (!value.isEmpty()) {
                    medicine.setStockQuantity(Integer.parseInt(value));
                } else {
                    medicine.setStockQuantity(0);
                }
            } else {
                medicine.setStockQuantity(0);
            }
        } catch (Exception e) {
            medicine.setStockQuantity(0);
        }
        
        // Min stock level
        try {
            Cell cell = row.getCell(14);
            if (cell != null && cell.getCellType() == CellType.NUMERIC) {
                medicine.setMinStockLevel((int) cell.getNumericCellValue());
            } else if (cell != null && cell.getCellType() == CellType.STRING) {
                String value = cell.getStringCellValue().trim();
                if (!value.isEmpty()) {
                    medicine.setMinStockLevel(Integer.parseInt(value));
                } else {
                    medicine.setMinStockLevel(10);
                }
            } else {
                medicine.setMinStockLevel(10);
            }
        } catch (Exception e) {
            medicine.setMinStockLevel(10);
        }
        
        // Max stock level
        try {
            Cell cell = row.getCell(15);
            if (cell != null && cell.getCellType() == CellType.NUMERIC) {
                medicine.setMaxStockLevel((int) cell.getNumericCellValue());
            } else if (cell != null && cell.getCellType() == CellType.STRING) {
                String value = cell.getStringCellValue().trim();
                if (!value.isEmpty()) {
                    medicine.setMaxStockLevel(Integer.parseInt(value));
                } else {
                    medicine.setMaxStockLevel(100);
                }
            } else {
                medicine.setMaxStockLevel(100);
            }
        } catch (Exception e) {
            medicine.setMaxStockLevel(100);
        }
        
        // Prescription required
        try {
            Cell cell = row.getCell(16);
            if (cell != null) {
                if (cell.getCellType() == CellType.BOOLEAN) {
                    medicine.setPrescriptionRequired(cell.getBooleanCellValue());
                } else if (cell.getCellType() == CellType.STRING) {
                    String value = cell.getStringCellValue().trim().toLowerCase();
                    medicine.setPrescriptionRequired(
                        value.equals("true") || value.equals("1") || value.equals("yes")
                    );
                } else if (cell.getCellType() == CellType.NUMERIC) {
                    medicine.setPrescriptionRequired(cell.getNumericCellValue() == 1);
                } else {
                    medicine.setPrescriptionRequired(true);
                }
            } else {
                medicine.setPrescriptionRequired(true);
            }
        } catch (Exception e) {
            medicine.setPrescriptionRequired(true);
        }
        
        medicine.setDescription(getCellValue(row.getCell(17)));
        medicine.setSideEffects(getCellValue(row.getCell(18)));
        medicine.setContraindications(getCellValue(row.getCell(19)));
        medicine.setUsageInstructions(getCellValue(row.getCell(20)));
        medicine.setStorageConditions(getCellValue(row.getCell(21)));
        medicine.setCategory(getCellValue(row.getCell(22)));
        medicine.setStatus("ACTIVE");
        
        // Cập nhật trạng thái
        updateMedicineStatus(medicine);
        
        medicine.setCreatedAt(LocalDateTime.now());
        medicine.setUpdatedAt(LocalDateTime.now());
        
        return medicine;
    }
    
    private String getCellValue(Cell cell) {
        if (cell == null) {
            return "";
        }
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toLocalDate().toString();
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
        List<Medicine> allMedicines = medicineRepository.findAll();
        
        long maxNumber = 0;
        for (Medicine medicine : allMedicines) {
            if (medicine.getMedicineCode() != null && medicine.getMedicineCode().startsWith(prefix)) {
                try {
                    String numberStr = medicine.getMedicineCode().substring(prefix.length());
                    long number = Long.parseLong(numberStr);
                    if (number > maxNumber) {
                        maxNumber = number;
                    }
                } catch (NumberFormatException e) {
                    // Bỏ qua nếu không parse được
                }
            }
        }
        
        return prefix + String.format("%06d", maxNumber + 1);
    }
}