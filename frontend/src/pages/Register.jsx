import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../css/Register.css";
import { CiUser } from "react-icons/ci";
import { FaUserTie } from "react-icons/fa6";
import { FaRegAddressCard } from "react-icons/fa";
import { BiLogoGmail } from "react-icons/bi";
import { IoPhonePortraitOutline } from "react-icons/io5";
import { FaRegCalendarAlt } from "react-icons/fa";
import { TbLockPassword } from "react-icons/tb";
import { FaRegEye } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";

const Register = () => {
  const [user, setUser] = useState({
    fullname: "",
    email: "",
    phone: "",
    birthday: "",
    gender: "male",
    address: "",
    bhyt: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
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

    // Kiểm tra mật khẩu khớp
    if (user.password !== user.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    // Kiểm tra điều khoản
    if (!user.terms) {
      alert("Vui lòng đồng ý với điều khoản dịch vụ!");
      return;
    }

    setLoading(true);

    try {
      // Đăng ký tài khoản
      const res = await axios.post(
        "http://localhost:8080/api/auth/register",
        user
      );
      console.log("Đăng ký thành công:", res.data);

      // Đăng nhập để lấy token
      const loginRes = await axios.post(
        "http://localhost:8080/api/auth/login",
        {
          username: user.email,
          password: user.password,
        }
      );

      if (loginRes.data?.token) {
        localStorage.setItem("token", loginRes.data.token);
        console.log("Token lưu vào localStorage:", loginRes.data.token);

        // Lưu thông tin user cơ bản nếu có
        if (loginRes.data.id) {
          localStorage.setItem("patientId", loginRes.data.id);
        }
      }

      // Reset form
      setUser({
        fullname: "",
        email: "",
        phone: "",
        birthday: "",
        gender: "male",
        address: "",
        bhyt: "",
        password: "",
        confirmPassword: "",
        terms: false,
      });

      // Mở modal thành công
      setShowModal(true);
    } catch (error) {
      console.error("Đăng ký thất bại:", error);
      alert(
        "Đăng ký thất bại: " + (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleCreateCard = () => {
    closeModal();
    navigate("/create-card");
  };

  const handleGoToLogin = () => {
    closeModal();
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
          <div className="header" style={{ textAlign: "center" }}>
            <div className="avatar" style={{ margin: "0 auto 1rem" }}>
              <i className="fas fa-hospital-user">
                <CiUser />
              </i>
            </div>
            <h1 className="header-title">Đăng ký tài khoản</h1>
            <p className="header-subtitle">
              Hệ thống đăng ký khám bệnh trực tuyến
            </p>
          </div>

          <div className="card-content">
            <form onSubmit={handleSubmit} className="form">
              {/* Các trường form giữ nguyên */}
              <div className="form-group">
                <label htmlFor="fullname" className="label">
                  Họ và tên
                </label>
                <div className="input-container">
                  <i className="fas fa-user input-icon">
                    <FaUserTie />
                  </i>
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
                <label htmlFor="bhyt" className="label">
                  Số BHYT
                </label>
                <div className="input-container">
                  <i className="fas fa-id-card input-icon">
                    <FaRegAddressCard />
                  </i>
                  <input
                    type="text"
                    id="bhyt"
                    name="bhyt"
                    required
                    className="input-field"
                    placeholder="VD: HC123456789"
                    value={user.bhyt}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address" className="label">
                  Địa chỉ
                </label>
                <div className="input-container">
                  <i className="fas fa-address input-icon">
                    <FaLocationDot />
                  </i>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    required
                    className="input-field"
                    placeholder="123 Đường ABC Quận X"
                    value={user.address}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email" className="label">
                  Email
                </label>
                <div className="input-container">
                  <i className="fas fa-envelope input-icon">
                    <BiLogoGmail />
                  </i>
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
                  <i className="fas fa-phone input-icon">
                    <IoPhonePortraitOutline />
                  </i>
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
                  <i className="fas fa-calendar-alt input-icon">
                    <FaRegCalendarAlt />
                  </i>
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
                <div
                  className="gender-options"
                  style={{ display: "flex", gap: "1rem" }}
                >
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={user.gender === "male"}
                      onChange={handleChange}
                      className="radio-input"
                    />
                    <span className="gender-label">Nam</span>
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
                    <span className="gender-label">Nữ</span>
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
                    <span className="gender-label">Khác</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="label">
                  Mật khẩu
                </label>
                <div className="input-container">
                  <i className="fas fa-lock input-icon">
                    <TbLockPassword />
                  </i>
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
                    <i
                      className={`fas ${
                        showPassword ? "fa-eye-slash" : "fa-eye"
                      }`}
                    >
                      <FaRegEye />
                    </i>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="label">
                  Xác nhận mật khẩu
                </label>
                <div className="input-container">
                  <i className="fas fa-lock input-icon">
                    <TbLockPassword />
                  </i>
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
                    <i
                      className={`fas ${
                        showConfirmPassword ? "fa-eye-slash" : "fa-eye"
                      }`}
                    >
                      <FaRegEye />
                    </i>
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
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Đăng ký tài khoản"}
              </button>
            </form>

            {/* Modal */}
            {showModal && (
              <div className="modal">
                <div className="modal-content slide-in">
                  <div className="modal-icon">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <h3 className="modal-title">Đăng ký thành công!</h3>
                  <p className="modal-message">
                    Bạn có muốn tạo thẻ/ ví điện tử để thanh toán viện phí
                    không?
                  </p>
                  <div className="modal-actions">
                    <button
                      onClick={handleGoToLogin}
                      className="modal-button secondary"
                    >
                      Không, để sau
                    </button>
                    <button
                      onClick={handleCreateCard}
                      className="modal-button primary"
                    >
                      Có, tôi muốn tạo thẻ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
