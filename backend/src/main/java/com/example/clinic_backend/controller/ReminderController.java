// package com.example.clinic_backend.controller;

// import com.example.clinic_backend.service.AutoApprovalService;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

// import java.time.LocalDateTime;
// import java.util.HashMap;
// import java.util.Map;

// @RestController
// @RequestMapping("/api/reminder")
// public class ReminderController {
    
//     @Autowired
//     private AutoApprovalService autoApprovalService;
    
//     @GetMapping("/config")
//     public ResponseEntity<?> getReminderConfig() {
//         return ResponseEntity.ok(autoApprovalService.getReminderConfig());
//     }
    
//     @PostMapping("/trigger")
//     public ResponseEntity<?> triggerReminders() {
//         System.out.println("🧪 MANUAL TRIGGER - Reminders endpoint called at " + LocalDateTime.now());
//         try {
//             autoApprovalService.triggerReminderTest();
//             return ResponseEntity.ok(Map.of(
//                 "message", "Reminder test triggered successfully",
//                 "timestamp", LocalDateTime.now()
//             ));
//         } catch (Exception e) {
//             System.err.println("❌ Manual trigger failed: " + e.getMessage());
//             e.printStackTrace();
//             return ResponseEntity.status(500).body(Map.of(
//                 "error", "Trigger failed: " + e.getMessage()
//             ));
//         }
//     }
    
//     @PostMapping("/test-time-check")
//     public ResponseEntity<?> testTimeCheck() {
//         System.out.println("🧪 MANUAL TRIGGER - Time check test called at " + LocalDateTime.now());
//         try {
//             autoApprovalService.triggerTimeCheckTest();
//             return ResponseEntity.ok(Map.of(
//                 "message", "Time check test completed",
//                 "timestamp", LocalDateTime.now()
//             ));
//         } catch (Exception e) {
//             System.err.println("❌ Time check test failed: " + e.getMessage());
//             e.printStackTrace();
//             return ResponseEntity.status(500).body(Map.of(
//                 "error", "Time check test failed: " + e.getMessage()
//             ));
//         }
//     }
    
//     @GetMapping("/status")
//     public ResponseEntity<?> getReminderStatus() {
//         try {
//             Map<String, Object> status = new HashMap<>();
//             status.put("currentTime", LocalDateTime.now().toString());
//             status.put("config", autoApprovalService.getReminderConfig());
//             status.put("systemTime", java.time.LocalTime.now().toString());
            
//             return ResponseEntity.ok(status);
//         } catch (Exception e) {
//             System.err.println("❌ Status check failed: " + e.getMessage());
//             e.printStackTrace();
//             return ResponseEntity.status(500).body(Map.of(
//                 "error", "Status check failed: " + e.getMessage()
//             ));
//         }
//     }
// }