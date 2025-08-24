package com.example.clinic_backend.config;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String[] passwords = {"123"};
        for (String pwd : passwords) {
            System.out.println("Password: " + pwd + " -> Hash: " + encoder.encode(pwd));
        }
    }
}