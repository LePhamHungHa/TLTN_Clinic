package com.example.clinic_backend.service;

import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import com.example.clinic_backend.model.User;
import com.example.clinic_backend.dto.RegisterRequest;
import com.example.clinic_backend.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

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

    public User authenticate(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (passwordEncoder.matches(password, user.getPassword())) {
                return user;
            }
        }
        throw new RuntimeException("Sai username hoặc password");
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
        return userRepository.findByGoogleId(googleId);
    }

    public Optional<User> findByFacebookId(String facebookId) {
        return userRepository.findByFacebookId(facebookId);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public User createOrUpdateUserFromGoogle(String email, String name, String googleId, String picture) {
        Optional<User> existingUser = userRepository.findByEmail(email);
        
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            user.setGoogleId(googleId);
            if (name != null) user.setFullName(name);
            if (picture != null) user.setAvatar(picture);
            return userRepository.save(user);
        } else {
            User user = new User();
            user.setUsername(email);
            user.setEmail(email);
            user.setFullName(name);
            user.setGoogleId(googleId);
            user.setAvatar(picture);
            user.setRole("PATIENT");
            user.setPassword(""); 
            return userRepository.save(user);
        }
    }

    public User createOrUpdateUserFromFacebook(String email, String name, String facebookId) {
        Optional<User> existingUser = userRepository.findByEmail(email);
        
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            user.setFacebookId(facebookId);
            if (name != null) user.setFullName(name);
            return userRepository.save(user);
        } else {
            User user = new User();
            user.setUsername(email);
            user.setEmail(email);
            user.setFullName(name);
            user.setFacebookId(facebookId);
            user.setRole("PATIENT");
            user.setPassword(""); 
            return userRepository.save(user);
        }
    }

    public User findByUsernameOrPhone(String usernameOrPhone) {
    // Nếu dùng JPA Repository, có thể viết query như sau
    return userRepository.findByUsernameOrPhone(usernameOrPhone, usernameOrPhone)
                         .orElse(null);
}
}