package com.example.clinic_backend.service;

import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.clinic_backend.model.User;
import com.example.clinic_backend.dto.RegisterRequest;
import com.example.clinic_backend.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // Method authenticate for login
    public User authenticate(String usernameOrPhone, String password) {
        Optional<User> userOpt = userRepository.findByUsernameOrPhone(usernameOrPhone, usernameOrPhone);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (passwordEncoder.matches(password, user.getPassword()) || user.getPassword().isEmpty()) {
                if (user.getRole() == null || user.getRole().isEmpty()) {
                    user.setRole("PATIENT");
                    user = save(user);
                    System.out.println("AUTO SET PATIENT: " + usernameOrPhone);
                }
                return user;
            }
        }
        throw new RuntimeException("Sai username hoặc password");
    }

    public User registerUser(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username đã tồn tại");
        }
        String encodedPassword = request.getPassword() != null && !request.getPassword().isEmpty()
                ? passwordEncoder.encode(request.getPassword())
                : "";
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(encodedPassword);
        user.setRole(request.getRole() != null ? request.getRole() : "PATIENT");
        user.setPhone(request.getPhone());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        return userRepository.save(user);
    }

     // Đổi mật khẩu
    @Transactional
    public void changePassword(String username, String currentPassword, String newPassword) {
        System.out.println("🔐 CHANGE PASSWORD for user: " + username);
        
        // Tìm user
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        // Kiểm tra mật khẩu hiện tại
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không đúng");
        }

        // Kiểm tra mật khẩu mới không trùng với mật khẩu cũ
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new RuntimeException("Mật khẩu mới không được trùng với mật khẩu cũ");
        }

        // Kiểm tra độ dài mật khẩu mới
        if (newPassword.length() < 6) {
            throw new RuntimeException("Mật khẩu mới phải có ít nhất 6 ký tự");
        }

        // Mã hóa và lưu mật khẩu mới
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        System.out.println(" PASSWORD CHANGED SUCCESSFULLY for user: " + username);
    }

    public User findByPhoneNumber(String phone) {
        return userRepository.findByPhone(phone).orElse(null);
    }

    public Optional<User> findByUsernameOptional(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findByGoogleId(String googleId) {
        if (googleId == null) return Optional.empty();
        return userRepository.findByGoogleId(googleId);
    }

    public Optional<User> findByFacebookId(String facebookId) {
        if (facebookId == null) return Optional.empty();
        return userRepository.findByFacebookId(facebookId);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    @Transactional
    public User createOrUpdateUserFromGoogle(String email, String name, String uid, String picture) {
        System.out.println("🔧 createOrUpdateUserFromGoogle: email=" + email + ", uid=" + uid);
        
        // Kiểm tra email null hoặc rỗng
        if (email == null || email.trim().isEmpty()) {
            System.err.println("ERROR: Email is null or empty");
            throw new IllegalArgumentException("Email không được để trống");
        }

        try {
            Optional<User> existingUser = findByEmail(email);
            if (!existingUser.isPresent() && uid != null && !uid.trim().isEmpty()) {
                existingUser = findByGoogleId(uid);
            }

            if (existingUser.isPresent()) {
                User user = existingUser.get();
                System.out.println("UPDATE GOOGLE USER: " + email);
                if (name != null && !name.trim().isEmpty()) {
                    user.setFullName(name);
                }
                if (picture != null && !picture.trim().isEmpty()) {
                    user.setAvatar(picture);
                }
                if (uid != null && !uid.trim().isEmpty()) {
                    user.setGoogleId(uid);
                }
                if (user.getRole() == null || user.getRole().isEmpty()) {
                    user.setRole("PATIENT");
                    System.out.println("SET ROLE TO PATIENT FOR EXISTING USER: " + email);
                }
                return save(user);
            } else {
                System.out.println("CREATE NEW GOOGLE USER: " + email);
                User user = new User();
                user.setUsername(email);
                user.setEmail(email);
                user.setFullName(name != null && !name.trim().isEmpty() ? name : "Google User");
                user.setGoogleId(uid != null && !uid.trim().isEmpty() ? uid : null);
                user.setAvatar(picture != null && !picture.trim().isEmpty() ? picture : null);
                user.setRole("PATIENT");
                user.setPassword("");
                return save(user);
            }
        } catch (Exception e) {
            System.err.println("GOOGLE SERVICE ERROR: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Lỗi khi tạo hoặc cập nhật người dùng Google: " + e.getMessage());
        }
    }

    @Transactional
    public User createOrUpdateUserFromFacebook(String email, String name, String uid) {
        System.out.println("🔧 createOrUpdateUserFromFacebook: email=" + email + ", uid=" + uid);
        
        if (email == null || email.trim().isEmpty()) {
            System.err.println("ERROR: Email is null or empty");
            throw new IllegalArgumentException("Email không được để trống");
        }

        try {
            Optional<User> existingUser = findByEmail(email);
            if (!existingUser.isPresent() && uid != null && !uid.trim().isEmpty()) {
                existingUser = findByFacebookId(uid);
            }

            if (existingUser.isPresent()) {
                User user = existingUser.get();
                System.out.println(" UPDATE FB USER: " + email);
                if (name != null && !name.trim().isEmpty()) {
                    user.setFullName(name);
                }
                if (uid != null && !uid.trim().isEmpty()) {
                    user.setFacebookId(uid);
                }
                if (user.getRole() == null || user.getRole().isEmpty()) {
                    user.setRole("PATIENT");
                    System.out.println("SET ROLE TO PATIENT FOR EXISTING USER: " + email);
                }
                return save(user);
            } else {
                System.out.println("CREATE NEW FB USER: " + email);
                User user = new User();
                user.setUsername(email);
                user.setEmail(email);
                user.setFullName(name != null && !name.trim().isEmpty() ? name : "Facebook User");
                user.setFacebookId(uid != null && !uid.trim().isEmpty() ? uid : null);
                user.setRole("PATIENT");
                user.setPassword("");
                return save(user);
            }
        } catch (Exception e) {
            System.err.println("FB SERVICE ERROR: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Lỗi khi tạo hoặc cập nhật người dùng Facebook: " + e.getMessage());
        }
    }
}