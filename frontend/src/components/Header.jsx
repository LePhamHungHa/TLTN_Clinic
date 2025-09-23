import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Header.css";

const Header = () => {
  const user = JSON.parse(localStorage.getItem("user")) || null;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Menu theo role
  const renderMenu = (isMobile = false) => {
    const linkClass = isMobile ? "mobile-nav-link" : "nav-link";
    const links = [];

    // links.push(
    //   <Link key="home" to="/" className={linkClass} onClick={isMobile ? toggleMobileMenu : undefined}>
    //     TRANG CHỦ
    //   </Link>
    // );

    if (user?.role === "PATIENT") {
      links.push(
        <Link
          key="p-dashboard"
          to="/patient"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Dashboard
        </Link>
      );
      links.push(
        <Link
          key="p-appointments"
          to="/patient/appointments"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Lịch hẹn
        </Link>
      );

      links.push(
        <Link
          key="p-wallet"
          to="/wallet"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Ví điện tử
        </Link>
      );

      links.push(
        <a
          key="about"
          href="#"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          GIỚI THIỆU
        </a>
      );
      links.push(
        <a
          key="services"
          href="#"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          DỊCH VỤ
        </a>
      );
      links.push(
        <a
          key="contact"
          href="#"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          LIÊN HỆ
        </a>
      );
    }

    if (user?.role === "DOCTOR") {
      links.push(
        <Link
          key="d-dashboard"
          to="/doctor"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Lịch làm việc
        </Link>
      );
      links.push(
        <Link
          key="d-patients"
          to="/doctor/patients"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Quản lý bệnh nhân
        </Link>
      );
      links.push(
        <Link
          key="d-appointments"
          to="/doctor/appointments"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Quản lý lịch hẹn
        </Link>
      );
      links.push(
        <Link
          key="d-patient_records"
          to="/doctor/patient_records"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Hồ sơ bệnh án
        </Link>
      );
      links.push(
        <Link
          key="d-personal_statistics"
          to="/doctor/Personal_statistics"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Thống kê cá nhân
        </Link>
      );
    }

    if (user?.role === "ADMIN") {
      links.push(
        <Link
          key="a-dashboard"
          to="/admin"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Quản lý cơ cấu
        </Link>
      );
      links.push(
        <Link
          key="a-users"
          to="/admin/users"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Quản lý người dùng
        </Link>
      );
      links.push(
        <Link
          key="a-appointments"
          to="/admin/appointments"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Quản lý lịch hệ thống
        </Link>
      );
      links.push(
        <Link
          key="a-data"
          to="/admin/data"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          Quản lý dữ liệu hệ thống
        </Link>
      );
    }

    // Menu chung

    // Menu dành cho khách (chưa đăng nhập hoặc không có role)
    if (!user || !user.role) {
      links.push(
        <a
          key="about"
          href="#"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          GIỚI THIỆU
        </a>
      );
      links.push(
        <a
          key="services"
          href="#"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          DỊCH VỤ
        </a>
      );
      links.push(
        <a
          key="specialty"
          href="#"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          CHUYÊN KHOA
        </a>
      );
      links.push(
        <a
          key="doctors"
          href="#"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          ĐỘI NGŨ BÁC SĨ
        </a>
      );
      links.push(
        <a
          key="news"
          href="#"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          TIN TỨC
        </a>
      );
      links.push(
        <a
          key="instruct"
          href="#"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          HƯỚNG DẪN KHÁCH HÀNG
        </a>
      );
      links.push(
        <a
          key="contact"
          href="#"
          className={linkClass}
          onClick={isMobile ? toggleMobileMenu : undefined}
        >
          LIÊN HỆ
        </a>
      );
    }

    return links;
  };

  return (
    <header className="header">
      <div className="container">
        <div className="logo-section">
          <img src="/img/logo.png" alt="Logo" />
        </div>

        {/* Menu Desktop */}
        <nav className={`nav-desktop ${isMobileMenuOpen ? "mobile-open" : ""}`}>
          {renderMenu(false)}
        </nav>

        {/* Auth buttons */}
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

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          <i className={`fas ${isMobileMenuOpen ? "fa-times" : "fa-bars"}`}></i>
        </button>
      </div>

      {/* Mobile Menu */}
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
    </header>
  );
};

export default Header;
