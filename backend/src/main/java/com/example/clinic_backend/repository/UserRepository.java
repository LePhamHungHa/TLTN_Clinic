package com.example.clinic_backend.repository;

import com.example.clinic_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Các phương thức tìm kiếm cơ bản
    Optional<User> findByUsername(String username);
    Optional<User> findByPhone(String phone);
    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleId(String googleId);
    Optional<User> findByFacebookId(String facebookId);
    
    // Các phương thức kiểm tra tồn tại
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    
    // Tìm kiếm theo username hoặc phone (dùng cho login)
    Optional<User> findByUsernameOrPhone(String username, String phone);
    
    // Tìm kiếm theo role
    List<User> findByRole(String role);
    
    // Tìm kiếm theo nhiều roles
    List<User> findByRoleIn(List<String> roles);
    
    // Tìm kiếm theo tên (chứa chuỗi)
    @Query("SELECT u FROM User u WHERE u.fullName LIKE %:name%")
    List<User> findByFullNameContaining(@Param("name") String name);
    
    // Tìm kiếm tổng hợp (username, email, fullName)
    @Query("SELECT u FROM User u WHERE u.username LIKE %:keyword% OR u.email LIKE %:keyword% OR u.fullName LIKE %:keyword%")
    List<User> searchUsers(@Param("keyword") String keyword);
    
    // Tìm kiếm nâng cao với nhiều trường
    @Query("SELECT u FROM User u WHERE " +
           "(:username IS NULL OR u.username LIKE %:username%) AND " +
           "(:email IS NULL OR u.email LIKE %:email%) AND " +
           "(:fullName IS NULL OR u.fullName LIKE %:fullName%) AND " +
           "(:role IS NULL OR u.role = :role)")
    List<User> findUsersByCriteria(@Param("username") String username,
                                  @Param("email") String email,
                                  @Param("fullName") String fullName,
                                  @Param("role") String role);
    
    // Đếm số lượng user theo role
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRole(@Param("role") String role);
    
    List<User> findByAvatarIsNotNull();
    List<User> findByAvatarIsNull();
 
}