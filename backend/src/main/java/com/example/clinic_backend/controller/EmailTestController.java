// package com.example.clinic_backend.controller;

// import com.example.clinic_backend.service.EmailService;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

// import java.time.LocalDateTime;
// import java.util.HashMap;
// import java.util.Map;

// @RestController
// @RequestMapping("/api/email")
// public class EmailTestController {
    
//     @Autowired
//     private EmailService emailService;
    
//     @PostMapping("/test-reminders")
//     public ResponseEntity<?> testReminders() {
//         try {
//             emailService.manualSendReminders();
//             return ResponseEntity.ok(Map.of(
//                 "message", "Manual reminder test completed",
//                 "timestamp", LocalDateTime.now().toString()
//             ));
//         } catch (Exception e) {
//             return ResponseEntity.status(500).body(Map.of(
//                 "error", "Test failed: " + e.getMessage()
//             ));
//         }
//     }
    
//     @PostMapping("/force-reminders")
//     public ResponseEntity<?> forceReminders() {
//         try {
//             emailService.forceSendReminders();
//             return ResponseEntity.ok(Map.of(
//                 "message", "Force reminders completed",
//                 "timestamp", LocalDateTime.now().toString()
//             ));
//         } catch (Exception e) {
//             return ResponseEntity.status(500).body(Map.of(
//                 "error", "Force failed: " + e.getMessage()
//             ));
//         }
//     }
    
//     @GetMapping("/time-config")
//     public ResponseEntity<?> getTimeConfig() {
//         Map<String, Object> config = new HashMap<>();
//         config.put("reminderStartTime", "07:00");
//         config.put("reminderEndTime", "21:00");
//         config.put("currentTime", java.time.LocalTime.now().toString());
//         config.put("withinTimeWindow", emailService.isWithinReminderTimeWindow());
        
//         return ResponseEntity.ok(config);
//     }
// }