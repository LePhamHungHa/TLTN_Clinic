package com.example.clinic_backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
    // DÙNG LẠI SECRET KEY CŨ để token hiện tại vẫn hợp lệ
    private static final String SECRET_KEY = "this-is-a-very-secret-key-please-change-it-1234567890"; 
    private static final long EXPIRATION_TIME = 86400000; // 24 giờ

    private final Key key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes());

    public String generateToken(String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (JwtException e) {
            System.err.println("JWT extractUsername error: " + e.getMessage());
            throw e;
        }
    }

    public String extractRole(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .get("role", String.class);
        } catch (JwtException e) {
            System.err.println("JWT extractRole error: " + e.getMessage());
            throw e;
        }
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
            System.out.println("✅ JWT Token validated successfully");
            return true;
        } catch (ExpiredJwtException e) {
            System.err.println("❌ JWT Token expired: " + e.getMessage());
            return false;
        } catch (MalformedJwtException e) {
            System.err.println("❌ JWT Token malformed: " + e.getMessage());
            return false;
        } catch (SecurityException e) {
            System.err.println("❌ JWT Signature invalid: " + e.getMessage());
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            System.err.println("❌ JWT validation error: " + e.getMessage());
            return false;
        }
    }
}