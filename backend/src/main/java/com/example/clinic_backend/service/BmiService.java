package com.example.clinic_backend.service;

import com.example.clinic_backend.model.BmiRecord;
import com.example.clinic_backend.repository.BmiRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class BmiService {
    
    @Autowired
    private BmiRecordRepository bmiRecordRepository;
    
    // Lưu BMI record (nhận từ frontend)
    public BmiRecord saveBmiRecord(Long patientId, Double height, Double weight, 
                                  String gender, Double bmiValue, String bmiCategory, 
                                  LocalDate measurementDate) {
        BmiRecord record = new BmiRecord(patientId, height, weight, gender, bmiValue, bmiCategory, measurementDate);
        return bmiRecordRepository.save(record);
    }
    
    // Tính toán BMI category theo gender
    public String calculateBmiCategory(Double bmiValue, String gender) {
        return getBmiCategory(bmiValue, gender);
    }
    
    // Phân loại BMI theo giới tính
    private String getBmiCategory(Double bmi, String gender) {
        if ("MALE".equals(gender)) {
            // Tiêu chuẩn cho Nam
            if (bmi < 18.5) return "Thiếu cân";
            if (bmi < 23) return "Bình thường";
            if (bmi < 25) return "Thừa cân";
            if (bmi < 30) return "Tiền béo phì";
            if (bmi < 35) return "Béo phì độ I";
            if (bmi < 40) return "Béo phì độ II";
            return "Béo phì độ III";
        } else {
            // Tiêu chuẩn cho Nữ
            if (bmi < 18) return "Thiếu cân";
            if (bmi < 22) return "Bình thường";
            if (bmi < 24) return "Thừa cân";
            if (bmi < 29) return "Tiền béo phì";
            if (bmi < 34) return "Béo phì độ I";
            if (bmi < 39) return "Béo phì độ II";
            return "Béo phì độ III";
        }
    }
    
    // Lấy lịch sử BMI
    public List<BmiRecord> getBmiHistory(Long patientId) {
        return bmiRecordRepository.findByPatientIdOrderByMeasurementDateDesc(patientId);
    }
    
    // Lấy BMI gần đây nhất
    public BmiRecord getLatestBmi(Long patientId) {
        Optional<BmiRecord> latest = bmiRecordRepository.findFirstByPatientIdOrderByMeasurementDateDesc(patientId);
        return latest.orElse(null);
    }
    
    // Xóa BMI record
    public void deleteBmiRecord(Long id) {
        bmiRecordRepository.deleteById(id);
    }
}