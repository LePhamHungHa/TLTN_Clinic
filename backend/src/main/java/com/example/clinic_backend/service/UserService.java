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

    // Lấy tất cả user
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    // Tìm user theo id
    public Optional<User> getUserById(Long userId) {
        return userRepository.findById(userId);
    }
    
    // Tạo user mới
    public User createUser(User user) {
        // Kiểm tra xem username đã có ai dùng chưa
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username đã tồn tại");
        }
        
        // Mã hóa password
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        
        // Mặc định là bệnh nhân nếu không có role
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("PATIENT");
        }
        
        return userRepository.save(user);
    }
    
    // Cập nhật thông tin user
    @Transactional
    public User updateUser(Long userId, User userDetails) {
        // Tìm user cần update
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy user ID: " + userId));
        
        // Update username nếu có
        if (userDetails.getUsername() != null && !userDetails.getUsername().isEmpty()) {
            // Check xem username mới có trùng không
            Optional<User> existingUser = userRepository.findByUsername(userDetails.getUsername());
            if (existingUser.isPresent() && !existingUser.get().getId().equals(userId)) {
                throw new RuntimeException("Username đã có người khác dùng");
            }
            user.setUsername(userDetails.getUsername());
        }
        
        // Update các trường khác
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
    
    // Xóa user
    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("Không tìm thấy user ID: " + userId);
        }
        userRepository.deleteById(userId);
    }
    
    // Tìm user theo username
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    // Lấy user theo role
    public List<User> getUsersByRole(String role) {
        return userRepository.findByRole(role);
    }
    
    // Tìm kiếm user
    public List<User> searchUsers(String keyword) {
        return userRepository.searchUsers(keyword);
    }
    
    // Tìm user theo tên
    public List<User> findByFullNameContaining(String name) {
        return userRepository.findByFullNameContaining(name);
    }
    
    // Đăng nhập
    public User authenticate(String usernameOrPhone, String password) {
        log.info("Đăng nhập user: {}", usernameOrPhone);
        
        // Tìm user bằng username hoặc phone
        Optional<User> userOpt = userRepository.findByUsernameOrPhone(usernameOrPhone, usernameOrPhone);
        if (userOpt.isEmpty()) {
            log.error("Không tìm thấy user: {}", usernameOrPhone);
            throw new RuntimeException("Sai username hoặc password");
        }
        
        User user = userOpt.get();
        
        // Kiểm tra password
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            if (!passwordEncoder.matches(password, user.getPassword())) {
                log.error("Password sai: {}", usernameOrPhone);
                throw new RuntimeException("Sai username hoặc password");
            }
        } else {
            // User social login không có password
            log.warn("User social login không có password: {}", usernameOrPhone);
        }
        
        // Gán role PATIENT nếu chưa có
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("PATIENT");
            user = save(user);
            log.info("Gán role PATIENT cho: {}", usernameOrPhone);
        }
        
        log.info("Đăng nhập thành công: {}", usernameOrPhone);
        return user;
    }

    // Đăng ký user mới
    public User registerUser(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username đã tồn tại");
        }
        
        // Mã hóa password
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
        log.info("Đổi password cho user: {}", username);
        
        // Tìm user
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        // Check password hiện tại
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại sai");
        }

        // Check password mới có giống cũ không
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new RuntimeException("Mật khẩu mới không được giống cũ");
        }

        // Check độ dài password mới
        if (newPassword.length() < 6) {
            throw new RuntimeException("Mật khẩu mới phải >= 6 ký tự");
        }

        // Lưu password mới
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        log.info("Đổi password thành công: {}", username);
    }

    // Tìm user bằng số điện thoại
    public User findByPhoneNumber(String phone) {
        return userRepository.findByPhone(phone).orElse(null);
    }

    public Optional<User> findByUsernameOptional(String username) {
        return userRepository.findByUsername(username);
    }

    // Tìm user bằng email
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // Tìm user bằng Google ID
    public Optional<User> findByGoogleId(String googleId) {
        if (googleId == null || googleId.trim().isEmpty()) {
            return Optional.empty();
        }
        return userRepository.findByGoogleId(googleId);
    }

    // Tìm user bằng Facebook ID
    public Optional<User> findByFacebookId(String facebookId) {
        if (facebookId == null || facebookId.trim().isEmpty()) {
            return Optional.empty();
        }
        return userRepository.findByFacebookId(facebookId);
    }

    // Lưu user
    public User save(User user) {
        return userRepository.save(user);
    }
    
    // Check username đã tồn tại chưa
    public boolean usernameExists(String username) {
        return userRepository.existsByUsername(username);
    }
    
    // Check email đã tồn tại chưa
    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email);
    }
    
    // Check phone đã tồn tại chưa
    public boolean phoneExists(String phone) {
        return userRepository.existsByPhone(phone);
    }

    // Tạo hoặc update user từ Google login
    // Nếu đã có user với Google ID thì lấy ra
    // Nếu chưa có thì tạo mới
    @Transactional
    public User createOrUpdateUserFromGoogle(String email, String name, String uid, String picture) {
        log.info("Google login: email={}, name={}", email, name);
        
        // Check email
        if (email == null || email.trim().isEmpty()) {
            log.error("Email bị trống");
            throw new IllegalArgumentException("Email không được trống");
        }

        try {
            // 1. Tìm bằng Google ID trước
            if (uid != null && !uid.trim().isEmpty()) {
                Optional<User> existingByGoogleId = findByGoogleId(uid);
                if (existingByGoogleId.isPresent()) {
                    User user = existingByGoogleId.get();
                    log.info("Tìm thấy user bằng Google ID: {}", user.getId());
                    return user;
                }
            }
            
            // 2. Tìm bằng email
            Optional<User> existingByEmail = findByEmail(email);
            if (existingByEmail.isPresent()) {
                User user = existingByEmail.get();
                log.info("Tìm thấy user bằng email: {}", user.getId());
                
                // Update Google ID nếu chưa có
                if (uid != null && !uid.trim().isEmpty() && 
                    (user.getGoogleId() == null || user.getGoogleId().isEmpty())) {
                    user.setGoogleId(uid);
                    user = save(user);
                    log.info("Đã thêm Google ID cho user: {}", user.getId());
                }
                return user;
            }
            
            // 3. Tạo user mới
            log.info("Tạo user Google mới");
            User user = new User();
            user.setUsername(email);
            user.setEmail(email);
            user.setFullName(name != null && !name.trim().isEmpty() ? name : "Google User");
            user.setGoogleId(uid != null && !uid.trim().isEmpty() ? uid : null);
            user.setAvatar(picture != null && !picture.trim().isEmpty() ? picture : null);
            user.setRole("PATIENT");
            user.setPassword(""); // Google login không cần password
            
            User savedUser = save(user);
            log.info("Đã tạo user mới: {}", savedUser.getId());
            return savedUser;
            
        } catch (Exception e) {
            log.error("Lỗi Google login: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi Google login: " + e.getMessage());
        }
    }

    // Tạo hoặc update user từ Facebook login
    @Transactional
    public User createOrUpdateUserFromFacebook(String email, String name, String uid) {
        log.info("Facebook login: email={}, name={}", email, name);
        
        if (email == null || email.trim().isEmpty()) {
            log.error("Email bị trống");
            throw new IllegalArgumentException("Email không được trống");
        }

        try {
            // 1. Tìm bằng Facebook ID
            if (uid != null && !uid.trim().isEmpty()) {
                Optional<User> existingByFbId = findByFacebookId(uid);
                if (existingByFbId.isPresent()) {
                    User user = existingByFbId.get();
                    log.info("Tìm thấy user bằng Facebook ID: {}", user.getId());
                    return user;
                }
            }
            
            // 2. Tìm bằng email
            Optional<User> existingByEmail = findByEmail(email);
            if (existingByEmail.isPresent()) {
                User user = existingByEmail.get();
                log.info("Tìm thấy user bằng email: {}", user.getId());
                
                // Update Facebook ID nếu chưa có
                if (uid != null && !uid.trim().isEmpty() && 
                    (user.getFacebookId() == null || user.getFacebookId().isEmpty())) {
                    user.setFacebookId(uid);
                    user = save(user);
                    log.info("Đã thêm Facebook ID cho user: {}", user.getId());
                }
                return user;
            }
            
            // 3. Tạo user mới
            log.info("Tạo user Facebook mới");
            User user = new User();
            user.setUsername(email);
            user.setEmail(email);
            user.setFullName(name != null && !name.trim().isEmpty() ? name : "Facebook User");
            user.setFacebookId(uid != null && !uid.trim().isEmpty() ? uid : null);
            user.setRole("PATIENT");
            user.setPassword(""); // Facebook login không cần password
            
            User savedUser = save(user);
            log.info("Đã tạo user mới: {}", savedUser.getId());
            return savedUser;
            
        } catch (Exception e) {
            log.error("Lỗi Facebook login: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi Facebook login: " + e.getMessage());
        }
    }
    
    // Đếm tổng số user
    public long countUsers() {
        return userRepository.count();
    }
    
    // Đếm số user theo role
    public long countUsersByRole(String role) {
        return userRepository.findByRole(role).size();
    }
}