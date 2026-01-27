package com.example.clinic_backend.service;

import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.clinic_backend.model.User;
import com.example.clinic_backend.dto.RegisterRequest;
import com.example.clinic_backend.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    
    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // ========== CÁC PHƯƠNG THỨC QUẢN LÝ NGƯỜI DÙNG ==========
    
    // Lấy tất cả người dùng
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    // Lấy người dùng theo ID
    public Optional<User> getUserById(Long userId) {
        return userRepository.findById(userId);
    }
    
    // Tạo người dùng mới
    public User createUser(User user) {
        // Kiểm tra username đã tồn tại chưa
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username đã tồn tại");
        }
        
        // Mã hóa password nếu có
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        
        // Đảm bảo role không null
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("PATIENT");
        }
        
        return userRepository.save(user);
    }
    
    // Cập nhật người dùng
    @Transactional
    public User updateUser(Long userId, User userDetails) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));
        
        // Cập nhật các trường (chỉ cập nhật các trường không null)
        if (userDetails.getUsername() != null && !userDetails.getUsername().isEmpty()) {
            // Kiểm tra username mới không trùng với người dùng khác
            Optional<User> existingUser = userRepository.findByUsername(userDetails.getUsername());
            if (existingUser.isPresent() && !existingUser.get().getId().equals(userId)) {
                throw new RuntimeException("Username đã được sử dụng bởi người dùng khác");
            }
            user.setUsername(userDetails.getUsername());
        }
        
        if (userDetails.getEmail() != null) {
            user.setEmail(userDetails.getEmail());
        }
        
        if (userDetails.getPhone() != null) {
            user.setPhone(userDetails.getPhone());
        }
        
        if (userDetails.getFullName() != null) {
            user.setFullName(userDetails.getFullName());
        }
        
        if (userDetails.getRole() != null) {
            user.setRole(userDetails.getRole());
        }
        
        if (userDetails.getAvatar() != null) {
            user.setAvatar(userDetails.getAvatar());
        }
        
        return userRepository.save(user);
    }
    
    // Xóa người dùng
    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("Không tìm thấy người dùng với ID: " + userId);
        }
        userRepository.deleteById(userId);
    }
    
    // Tìm người dùng theo username
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    // ========== CÁC PHƯƠNG THỨC TÌM KIẾM & LỌC ==========
    
    // Tìm người dùng theo role
    public List<User> getUsersByRole(String role) {
        return userRepository.findByRole(role);
    }
    
    // Tìm kiếm người dùng
    public List<User> searchUsers(String keyword) {
        return userRepository.searchUsers(keyword);
    }
    
    // Lấy người dùng theo tên
    public List<User> findByFullNameContaining(String name) {
        return userRepository.findByFullNameContaining(name);
    }
    
    // ========== CÁC PHƯƠNG THỨC XÁC THỰC ==========
    
    // Method authenticate for login
    public User authenticate(String usernameOrPhone, String password) {
        log.info("🔐 Authenticating user: {}", usernameOrPhone);
        
        Optional<User> userOpt = userRepository.findByUsernameOrPhone(usernameOrPhone, usernameOrPhone);
        if (userOpt.isEmpty()) {
            log.error("❌ User not found: {}", usernameOrPhone);
            throw new RuntimeException("Sai username hoặc password");
        }
        
        User user = userOpt.get();
        
        // Kiểm tra mật khẩu
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            if (!passwordEncoder.matches(password, user.getPassword())) {
                log.error("❌ Incorrect password for user: {}", usernameOrPhone);
                throw new RuntimeException("Sai username hoặc password");
            }
        } else {
            // Social login user không có password
            log.warn("⚠️ User has no password (social login): {}", usernameOrPhone);
        }
        
        // Đảm bảo có role
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("PATIENT");
            user = save(user);
            log.info("✅ Auto-assigned PATIENT role to: {}", usernameOrPhone);
        }
        
        log.info("✅ Authentication successful: {}", usernameOrPhone);
        return user;
    }

    // Đăng ký người dùng mới
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
        log.info("🔐 CHANGE PASSWORD for user: {}", username);
        
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
        
        log.info("✅ PASSWORD CHANGED SUCCESSFULLY for user: {}", username);
    }

    // ========== CÁC PHƯƠNG THỨC TÌM KIẾM ==========
    
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
        if (googleId == null || googleId.trim().isEmpty()) {
            return Optional.empty();
        }
        return userRepository.findByGoogleId(googleId);
    }

    public Optional<User> findByFacebookId(String facebookId) {
        if (facebookId == null || facebookId.trim().isEmpty()) {
            return Optional.empty();
        }
        return userRepository.findByFacebookId(facebookId);
    }

    public User save(User user) {
        return userRepository.save(user);
    }
    
    // Kiểm tra username đã tồn tại
    public boolean usernameExists(String username) {
        return userRepository.existsByUsername(username);
    }
    
    // Kiểm tra email đã tồn tại
    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email);
    }
    
    // Kiểm tra số điện thoại đã tồn tại
    public boolean phoneExists(String phone) {
        return userRepository.existsByPhone(phone);
    }

    // ========== CÁC PHƯƠNG THỨC SOCIAL LOGIN ==========
    
    @Transactional
    public User createOrUpdateUserFromGoogle(String email, String name, String uid, String picture) {
        log.info("🔧 createOrUpdateUserFromGoogle: email={}, name={}, uid={}", email, name, uid);
        
        // Kiểm tra email null hoặc rỗng
        if (email == null || email.trim().isEmpty()) {
            log.error("❌ ERROR: Email is null or empty");
            throw new IllegalArgumentException("Email không được để trống");
        }

        try {
            // 1. Tìm theo Google ID trước
            if (uid != null && !uid.trim().isEmpty()) {
                Optional<User> existingByGoogleId = findByGoogleId(uid);
                if (existingByGoogleId.isPresent()) {
                    User user = existingByGoogleId.get();
                    log.info("✅ Found existing user by Google ID: {}", user.getId());
                    return user;
                }
            }
            
            // 2. Tìm theo Email
            Optional<User> existingByEmail = findByEmail(email);
            if (existingByEmail.isPresent()) {
                User user = existingByEmail.get();
                log.info("✅ Found existing user by email: {}", user.getId());
                
                // Cập nhật Google ID nếu chưa có
                if (uid != null && !uid.trim().isEmpty() && 
                    (user.getGoogleId() == null || user.getGoogleId().isEmpty())) {
                    user.setGoogleId(uid);
                    user = save(user);
                    log.info("✅ Updated Google ID for user: {}", user.getId());
                }
                return user;
            }
            
            // 3. Tạo user mới
            log.info("🆕 Creating new Google user");
            User user = new User();
            user.setUsername(email);
            user.setEmail(email);
            user.setFullName(name != null && !name.trim().isEmpty() ? name : "Google User");
            user.setGoogleId(uid != null && !uid.trim().isEmpty() ? uid : null);
            user.setAvatar(picture != null && !picture.trim().isEmpty() ? picture : null);
            user.setRole("PATIENT");
            user.setPassword("");
            
            User savedUser = save(user);
            log.info("✅ Created new Google user: {}", savedUser.getId());
            return savedUser;
            
        } catch (Exception e) {
            log.error("❌ GOOGLE SERVICE ERROR: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi khi tạo hoặc cập nhật người dùng Google: " + e.getMessage());
        }
    }

    @Transactional
    public User createOrUpdateUserFromFacebook(String email, String name, String uid) {
        log.info("🔧 createOrUpdateUserFromFacebook: email={}, name={}, uid={}", email, name, uid);
        
        // Kiểm tra email null hoặc rỗng
        if (email == null || email.trim().isEmpty()) {
            log.error("❌ ERROR: Email is null or empty");
            throw new IllegalArgumentException("Email không được để trống");
        }

        try {
            // 1. Tìm theo Facebook ID trước
            if (uid != null && !uid.trim().isEmpty()) {
                Optional<User> existingByFbId = findByFacebookId(uid);
                if (existingByFbId.isPresent()) {
                    User user = existingByFbId.get();
                    log.info("✅ Found existing user by Facebook ID: {}", user.getId());
                    return user;
                }
            }
            
            // 2. Tìm theo Email
            Optional<User> existingByEmail = findByEmail(email);
            if (existingByEmail.isPresent()) {
                User user = existingByEmail.get();
                log.info("✅ Found existing user by email: {}", user.getId());
                
                // Cập nhật Facebook ID nếu chưa có
                if (uid != null && !uid.trim().isEmpty() && 
                    (user.getFacebookId() == null || user.getFacebookId().isEmpty())) {
                    user.setFacebookId(uid);
                    user = save(user);
                    log.info("✅ Updated Facebook ID for user: {}", user.getId());
                }
                return user;
            }
            
            // 3. Tạo user mới
            log.info("🆕 Creating new Facebook user");
            User user = new User();
            user.setUsername(email);
            user.setEmail(email);
            user.setFullName(name != null && !name.trim().isEmpty() ? name : "Facebook User");
            user.setFacebookId(uid != null && !uid.trim().isEmpty() ? uid : null);
            user.setRole("PATIENT");
            user.setPassword("");
            
            User savedUser = save(user);
            log.info("✅ Created new Facebook user: {}", savedUser.getId());
            return savedUser;
            
        } catch (Exception e) {
            log.error("❌ FACEBOOK SERVICE ERROR: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi khi tạo hoặc cập nhật người dùng Facebook: " + e.getMessage());
        }
    }
    
    // ========== CÁC PHƯƠNG THỨC THỐNG KÊ ==========
    
    public long countUsers() {
        return userRepository.count();
    }
    
    public long countUsersByRole(String role) {
        return userRepository.findByRole(role).size();
    }
}