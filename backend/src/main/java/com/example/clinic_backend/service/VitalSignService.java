package com.example.clinic_backend.service;

import com.example.clinic_backend.model.VitalSign;
import com.example.clinic_backend.repository.VitalSignRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VitalSignService {
    private final VitalSignRepository repository;

    public VitalSignService(VitalSignRepository repository) {
        this.repository = repository;
    }

    public VitalSign save(VitalSign vs) {
        return repository.save(vs);
    }

    public List<VitalSign> getByPatient(Long patientId) {
        return repository.findByPatientId(patientId);
    }
}
