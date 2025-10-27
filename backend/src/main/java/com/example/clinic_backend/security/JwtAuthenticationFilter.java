package com.example.clinic_backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        
        String header = request.getHeader("Authorization");
        
        // Chỉ debug cho API admin để tránh log nhiều
        if (request.getRequestURI().contains("/api/admin/")) {
            System.out.println("🔐 JWT Filter - Admin Request: " + request.getRequestURI());
        }
        
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            try {
                if (jwtUtil.validateToken(token)) {
                    String username = jwtUtil.extractUsername(token);
                    String role = jwtUtil.extractRole(token);
                    
                    // Đảm bảo role có prefix ROLE_
                    List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + role)
                    );

                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(username, null, authorities);

                    SecurityContextHolder.getContext().setAuthentication(auth);
                    
                    // Chỉ log cho admin requests
                    if (request.getRequestURI().contains("/api/admin/")) {
                        System.out.println("✅ JWT Filter - Admin auth set for: " + username + " with role: " + role);
                    }
                }
            } catch (Exception e) {
                System.err.println("❌ JWT Filter - Error processing token: " + e.getMessage());
                SecurityContextHolder.clearContext();
            }
        }
        
        filterChain.doFilter(request, response);
    }
}