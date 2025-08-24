import React, { useState } from "react";
import { registerUser } from "../api/userAPI";
import { useNavigate } from "react-router-dom";
import "../css/Register.css";

const Register = () => {
  const [user, setUser] = useState({
    fullname: "",
    email: "",
    phone: "",
    birthday: "",
    gender: "male",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUser({ ...user, [name]: type === "checkbox" ? checked : value });
  };

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user.password !== user.confirmPassword) {
      alert("Mật khẩu không khớp! Vui lòng nhập lại.");
      return;
    }
    if (user.password.length < 8) {
      alert("Mật khẩu phải có ít nhất 8 ký tự!");
      return;
    }
    if (!user.terms) {
      alert("Vui lòng đồng ý với điều khoản dịch vụ!");
      return;
    }

    try {
      const res = await registerUser({
        username: user.email, // Giả sử backend dùng email làm username
        password: user.password,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        birthday: user.birthday,
        gender: user.gender,
      });
      if (res.id) {
        setShowModal(true);
      } else {
        alert("Đăng ký thất bại: " + (res.error || "Lỗi không xác định"));
      }
    } catch (error) {
      console.error("Lỗi đăng ký:", error.message);
      alert(`Lỗi đăng ký: ${error.message}`);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setUser({
      fullname: "",
      email: "",
      phone: "",
      birthday: "",
      gender: "male",
      password: "",
      confirmPassword: "",
      terms: false,
    });
    navigate("/login");
  };

  return (
    <div className="register-page">
      <div className="floating-dots">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="dot"
            style={{
              width: `${Math.random() * 20 + 10}px`,
              height: `${Math.random() * 20 + 10}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>
      <div className="register-container">
        <div className="register-card slide-in">
          <div className="header">
            <div className="avatar">
              <i className="fas fa-hospital-user"></i>
            </div>
            <h1 className="header-title">Đăng ký tài khoản</h1>
            <p className="header-subtitle">Hệ thống đăng ký khám bệnh trực tuyến</p>
          </div>
          <div className="card-content">
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label htmlFor="fullname" className="label">
                  Họ và tên
                </label>
                <div className="input-container">
                  <i className="fas fa-user input-icon"></i>
                  <input
                    type="text"
                    id="fullname"
                    name="fullname"
                    required
                    className="input-field"
                    placeholder="Nguyễn Văn A"
                    value={user.fullname}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="email" className="label">
                  Email
                </label>
                <div className="input-container">
                  <i className="fas fa-envelope input-icon"></i>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="input-field"
                    placeholder="example@email.com"
                    value={user.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="phone" className="label">
                  Số điện thoại
                </label>
                <div className="input-container">
                  <i className="fas fa-phone input-icon"></i>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    className="input-field"
                    placeholder="0987 654 321"
                    value={user.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="birthday" className="label">
                  Ngày sinh
                </label>
                <div className="input-container">
                  <i className="fas fa-calendar-alt input-icon"></i>
                  <input
                    type="date"
                    id="birthday"
                    name="birthday"
                    required
                    className="input-field"
                    value={user.birthday}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Giới tính</label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={user.gender === "male"}
                      onChange={handleChange}
                      className="radio-input"
                    />
                    <span className="ml-2 text-gray-700">Nam</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={user.gender === "female"}
                      onChange={handleChange}
                      className="radio-input"
                    />
                    <span className="ml-2 text-gray-700">Nữ</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="other"
                      checked={user.gender === "other"}
                      onChange={handleChange}
                      className="radio-input"
                    />
                    <span className="ml-2 text-gray-700">Khác</span>
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="password" className="label">
                  Mật khẩu
                </label>
                <div className="input-container">
                  <i className="fas fa-lock input-icon"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    required
                    className="input-field"
                    placeholder="••••••••"
                    value={user.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility("password")}
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>
                </div>
                <p className="password-hint">Mật khẩu tối thiểu 8 ký tự</p>
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword" className="label">
                  Xác nhận mật khẩu
                </label>
                <div className="input-container">
                  <i className="fas fa-lock input-icon"></i>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    className="input-field"
                    placeholder="••••••••"
                    value={user.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility("confirmPassword")}
                  >
                    <i className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>
                </div>
              </div>
              <div className="terms-container">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={user.terms}
                  onChange={handleChange}
                  className="checkbox-input"
                />
                <label htmlFor="terms" className="terms-label">
                  Tôi đồng ý với{" "}
                  <a href="#" className="terms-link">
                    điều khoản dịch vụ
                  </a>{" "}
                  và{" "}
                  <a href="#" className="terms-link">
                    chính sách bảo mật
                  </a>
                </label>
              </div>
              <button
                type="submit"
                className="register-button"
              >
                Đăng ký tài khoản
              </button>
            </form>
            <div className="social-login">
              <div className="divider">
                <span>Hoặc đăng ký với</span>
              </div>
              <div className="social-buttons">
                <button className="social-button facebook">
                  <i className="fab fa-facebook-f"></i>
                </button>
                <button className="social-button google">
                  <i className="fab fa-google"></i>
                </button>
                <button className="social-button github">
                  <i className="fab fa-github"></i>
                </button>
              </div>
            </div>
            <div className="register-link">
              <p>
                Đã có tài khoản?{" "}
                <a href="/login" className="link">
                  Đăng nhập ngay
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      {showModal && (
        <div className="modal">
          <div className="modal-content slide-in">
            <div className="modal-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3 className="modal-title">Đăng ký thành công!</h3>
            <p className="modal-message">
              Tài khoản của bạn đã được tạo. Vui lòng kiểm tra email để xác thực.
            </p>
            <button
              onClick={closeModal}
              className="modal-button"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;