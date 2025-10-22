package com.example.clinic_backend.controller;

import com.example.clinic_backend.model.User;
import com.example.clinic_backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request, 
                                          Authentication authentication) {
        try {
            String username = authentication.getName();
            
            System.out.println("🔐 CHANGE PASSWORD REQUEST for user: " + username);
            
            userService.changePassword(username, request.getCurrentPassword(), request.getNewPassword());
            
            System.out.println("✅ PASSWORD CHANGED SUCCESSFULLY for user: " + username);
            return ResponseEntity.ok().body(Map.of("message", "Đổi mật khẩu thành công"));
            
        } catch (RuntimeException e) {
            System.err.println("❌ PASSWORD CHANGE ERROR: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ SERVER ERROR: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Lỗi server"));
        }
    }

    // DTO cho đổi mật khẩu
    public static class ChangePasswordRequest {
        private String currentPassword;
        private String newPassword;

        // Getters and Setters
        public String getCurrentPassword() {
            return currentPassword;
        }

        public void setCurrentPassword(String currentPassword) {
            this.currentPassword = currentPassword;
        }

        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }
}