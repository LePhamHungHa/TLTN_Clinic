import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Header.css";

const Header = () => {
  const [user, setUser] = useState(null); // Lưu thông tin user
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Trạng thái menu mobile
  const navigate = useNavigate();

  // Load user từ localStorage khi component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    console.log("Header - user trong localStorage:", storedUser);

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("Header - parsed user:", parsedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Lỗi parse user:", e);
        localStorage.removeItem("user"); // Xóa nếu lỗi
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  // Lắng nghe sự kiện thay đổi localStorage (khi login/logout ở tab khác)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem("user");
      console.log("Storage thay đổi:", storedUser);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Xử lý logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setIsMobileMenuOpen(false);
    navigate("/login");
  };

  // Mở/đóng menu mobile
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Tạo menu theo role của user
  const renderMenu = (isMobile = false) => {
    const linkClass = isMobile ? "mobile-nav-link" : "nav-link";
    const links = []; // Mảng chứa các link menu

    // Nếu chưa login (guest)
    if (!user || !user.role) {
      links.push(
        <a
          key="about"
          href="#"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          GIỚI THIỆU
        </a>,
        <a
          key="services"
          href="#"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          DỊCH VỤ
        </a>,
        <a
          key="specialty"
          href="#"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          CHUYÊN KHOA
        </a>,
        <a
          key="doctors"
          href="#"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          ĐỘI NGŨ BÁC SĨ
        </a>,
        <a
          key="news"
          href="#"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          TIN TỨC
        </a>,
        <a
          key="instruct"
          href="#"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          HƯỚNG DẪN KHÁCH HÀNG
        </a>,
        <a
          key="contact"
          href="#"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          LIÊN HỆ
        </a>,
      );

      // Menu cho bệnh nhân
    } else if (user.role === "PATIENT") {
      links.push(
        <Link
          key="p-dashboard"
          to="/patient"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Trang chủ
        </Link>,
        <Link
          key="p-appointments"
          to="/patient/appointments"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Lịch hẹn
        </Link>,
        <Link
          key="p-invoices"
          to="/invoices"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Hóa đơn
        </Link>,
        <Link
          key="p-bmi-tracking"
          to="/patient/health-tracking"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          BMI
        </Link>,
        <Link
          key="p-examination-results"
          to="/patient/medical-examination-results"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Kết quả khám
        </Link>,
        <Link
          key="p-wallet"
          to="/wallet"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Ví điện tử
        </Link>,
        <Link
          key="p-info"
          to="/patient/info"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Thông tin cá nhân
        </Link>,
      );

      // Menu cho bác sĩ
    } else if (user.role === "DOCTOR") {
      links.push(
        <Link
          key="d-dashboard"
          to="/doctor"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Lịch làm việc
        </Link>,
        <Link
          key="d-appointments"
          to="/doctor/appointments"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Quản lý lịch hẹn
        </Link>,
        <Link
          key="d-patient_records"
          to="/doctor/patient_records"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Hồ sơ bệnh án
        </Link>,
        <Link
          key="d-personal_statistics"
          to="/doctor/Personal_statistics"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Thống kê cá nhân
        </Link>,
      );

      // Menu cho admin
    } else if (user.role === "ADMIN") {
      links.push(
        <Link
          key="a-dashboard"
          to="/admin"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Quản lý cơ cấu
        </Link>,
        <Link
          key="a-users"
          to="/admin/users"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Quản lý tài khoản
        </Link>,
        <Link
          key="a-appointments"
          to="/admin/appointments"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Quản lý Lịch hẹn
        </Link>,
        <Link
          key="a-data"
          to="/admin/data"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Quản lý dữ liệu hệ thống
        </Link>,
      );
    }

    return links;
  };

  return (
    <header className="header">
      <div className="container">
        {/* Logo */}
        <div className="logo-section">
          <img src="/img/logo.png" alt="Logo" />
        </div>

        {/* Menu desktop */}
        <nav className={`nav-desktop ${isMobileMenuOpen ? "mobile-open" : ""}`}>
          {renderMenu(false)}
        </nav>

        {/* Nút đăng nhập/đăng xuất desktop */}
        <div className="auth-buttons">
          {user ? (
            <>
              <span className="user-greeting">Xin chào, {user.username}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="login-btn">
                Đăng nhập
              </Link>
              <Link to="/register" className="register-btn">
                Đăng ký
              </Link>
            </>
          )}
        </div>

        {/* Nút menu mobile */}
        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          <i className={`fas ${isMobileMenuOpen ? "fa-times" : "fa-bars"}`}></i>
        </button>

        {/* Menu mobile */}
        <div className={`mobile-menu ${isMobileMenuOpen ? "open" : ""}`}>
          {renderMenu(true)}
          <div className="mobile-auth-buttons">
            {user ? (
              <>
                <span className="mobile-user-greeting">
                  Xin chào, {user.username}
                </span>
                <button className="mobile-logout-btn" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="mobile-login-btn"
                  onClick={toggleMobileMenu}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="mobile-register-btn"
                  onClick={toggleMobileMenu}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
