package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.VitalSign;
import com.example.clinic_backend.service.VitalSignService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vitals")
@CrossOrigin(origins = "http://localhost:3000") // React
public class VitalSignController {
    private final VitalSignService service;

    public VitalSignController(VitalSignService service) {
        this.service = service;
    }

    @PostMapping
    public VitalSign addVital(@RequestBody VitalSign vs) {
        return service.save(vs);
    }

    @GetMapping("/{patientId}")
    public List<VitalSign> getVitals(@PathVariable Long patientId) {
        return service.getByPatient(patientId);
    }
}
