package com.example.clinic_backend.service;

import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import com.example.clinic_backend.model.User;
import com.example.clinic_backend.dto.RegisterRequest;
import com.example.clinic_backend.dto.LoginRequest;
import com.example.clinic_backend.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public User registerUser(RegisterRequest request) {
    String encodedPassword = passwordEncoder.encode(request.getPassword());
    User user = new User();
    user.setUsername(request.getUsername());
    user.setPassword(encodedPassword);
    return userRepository.save(user);
}

public Optional<User> loginUser(LoginRequest request) {
    Optional<User> userOpt = userRepository.findByUsername(request.getUsername());
    if(userOpt.isPresent() && passwordEncoder.matches(request.getPassword(), userOpt.get().getPassword())) {
        return userOpt;
    }
    return Optional.empty();
}
}
