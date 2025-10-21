package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.Department;
import com.example.clinic_backend.service.DepartmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/departments")
@CrossOrigin(origins = "http://localhost:5173") //  Cho React truy cập
public class DepartmentController {

    @Autowired
    private DepartmentService departmentService;

    //  Lấy tất cả khoa
    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    //  Lấy khoa theo ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getDepartmentById(@PathVariable Long id) {
        Optional<Department> department = departmentService.getDepartmentById(id);
        return department.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    //  Lấy khoa theo tên
    @GetMapping("/by-name/{name}")
    public ResponseEntity<?> getDepartmentByName(@PathVariable String name) {
        Optional<Department> department = departmentService.getDepartmentByName(name);
        return department.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    //  Thêm khoa mới (có kiểm tra trùng tên)
    @PostMapping
    public ResponseEntity<?> createDepartment(@RequestBody Department department) {
        try {
            department.setCreatedAt(new Timestamp(System.currentTimeMillis()));
            Department newDep = departmentService.createDepartment(department);
            return ResponseEntity.ok(newDep);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
