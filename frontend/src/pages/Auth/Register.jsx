import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../css/Register.css";

// Icons cho phần bệnh viện
import {
  FaHospital,
  FaStethoscope,
  FaCalendarCheck,
  FaFileMedical,
} from "react-icons/fa";
import { MdHealthAndSafety, MdEmergency } from "react-icons/md";
import { GiMedicines } from "react-icons/gi";
import { FaHeartbeat } from "react-icons/fa";

// Icons cho form
import { CiUser } from "react-icons/ci";
import { FaUserTie } from "react-icons/fa6";
import { FaRegAddressCard } from "react-icons/fa";
import { BiLogoGmail } from "react-icons/bi";
import { IoPhonePortraitOutline } from "react-icons/io5";
import { FaRegCalendarAlt } from "react-icons/fa";
import { TbLockPassword } from "react-icons/tb";
import { FaRegEye, FaEyeSlash } from "react-icons/fa";
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
        user,
      );
      console.log("Đăng ký thành công:", res.data);

      // Đăng nhập để lấy token
      const loginRes = await axios.post(
        "http://localhost:8080/api/auth/login",
        {
          username: user.email,
          password: user.password,
        },
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
        "Đăng ký thất bại: " + (error.response?.data?.message || error.message),
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
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="dot"
            style={{
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="medical-bg">
        {[...Array(12)].map((_, i) => (
          <div
            key={`cross-${i}`}
            className="cross"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            <MdHealthAndSafety />
          </div>
        ))}
        {[...Array(8)].map((_, i) => (
          <div
            key={`heart-${i}`}
            className="heart"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            <FaHeartbeat />
          </div>
        ))}
        {[...Array(6)].map((_, i) => (
          <div
            key={`plus-${i}`}
            className="plus"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          >
            <GiMedicines />
          </div>
        ))}
      </div>

      <div className="register-container">
        <div className="register-card slide-in">
          {/* Phần sidebar bệnh viện */}
          <div className="hospital-sidebar">
            <div className="hospital-logo">
              <i className="fas fa-hospital">
                <FaHospital />
              </i>
            </div>
            <h2 className="hospital-name">BỆNH VIỆN ĐA KHOA MEDICAL</h2>
            <p className="hospital-tagline">
              Chăm sóc sức khỏe toàn diện - Vì cộng đồng
            </p>

            <div className="hospital-features">
              <div className="feature">
                <div className="feature-icon">
                  <FaStethoscope />
                </div>
                <div className="feature-text">
                  <h4>Đội ngũ bác sĩ</h4>
                  <p>Chuyên gia đầu ngành</p>
                </div>
              </div>
              <div className="feature">
                <div className="feature-icon">
                  <FaCalendarCheck />
                </div>
                <div className="feature-text">
                  <h4>Đặt lịch nhanh</h4>
                  <p>24/7 trực tuyến</p>
                </div>
              </div>
              <div className="feature">
                <div className="feature-icon">
                  <MdEmergency />
                </div>
                <div className="feature-text">
                  <h4>Cấp cứu 24/7</h4>
                  <p>Hỗ trợ khẩn cấp</p>
                </div>
              </div>
              <div className="feature">
                <div className="feature-icon">
                  <FaFileMedical />
                </div>
                <div className="feature-text">
                  <h4>Hồ sơ điện tử</h4>
                  <p>Lưu trữ an toàn</p>
                </div>
              </div>
            </div>
          </div>

          {/* Phần form đăng ký */}
          <div className="form-section">
            <div className="form-header">
              <h2>
                <i className="fas fa-user-plus">
                  <CiUser />
                </i>
                Đăng ký tài khoản bệnh nhân
              </h2>
              <p>Vui lòng điền đầy đủ thông tin để đăng ký tài khoản</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* Họ và tên */}
                <div className="form-group full-width">
                  <label className="label">
                    <i className="fas fa-user">
                      <FaUserTie />
                    </i>
                    Họ và tên
                    <span className="required">*</span>
                  </label>
                  <div className="input-container">
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

                {/* Số BHYT */}
                <div className="form-group full-width">
                  <label className="label">
                    <i className="fas fa-id-card">
                      <FaRegAddressCard />
                    </i>
                    Số BHYT
                    <span className="required">*</span>
                  </label>
                  <div className="input-container">
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

                {/* Địa chỉ */}
                <div className="form-group full-width">
                  <label className="label">
                    <i className="fas fa-location-dot">
                      <FaLocationDot />
                    </i>
                    Địa chỉ
                    <span className="required">*</span>
                  </label>
                  <div className="input-container">
                    <input
                      type="text"
                      id="address"
                      name="address"
                      required
                      className="input-field"
                      placeholder="123 Đường ABC, Quận X, Thành phố Y"
                      value={user.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="label">
                    <i className="fas fa-envelope">
                      <BiLogoGmail />
                    </i>
                    Email
                    <span className="required">*</span>
                  </label>
                  <div className="input-container">
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

                {/* Số điện thoại */}
                <div className="form-group">
                  <label className="label">
                    <i className="fas fa-phone">
                      <IoPhonePortraitOutline />
                    </i>
                    Số điện thoại
                    <span className="required">*</span>
                  </label>
                  <div className="input-container">
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

                {/* Ngày sinh */}
                <div className="form-group">
                  <label className="label">
                    <i className="fas fa-calendar-alt">
                      <FaRegCalendarAlt />
                    </i>
                    Ngày sinh
                    <span className="required">*</span>
                  </label>
                  <div className="input-container">
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

                {/* Giới tính */}
                <div className="form-group">
                  <label className="label">
                    <i className="fas fa-venus-mars"></i>
                    Giới tính
                    <span className="required">*</span>
                  </label>
                  <div className="gender-options">
                    <div className="gender-option">
                      <input
                        type="radio"
                        id="male"
                        name="gender"
                        value="male"
                        checked={user.gender === "male"}
                        onChange={handleChange}
                      />
                      <label htmlFor="male" className="gender-label">
                        Nam
                      </label>
                    </div>
                    <div className="gender-option">
                      <input
                        type="radio"
                        id="female"
                        name="gender"
                        value="female"
                        checked={user.gender === "female"}
                        onChange={handleChange}
                      />
                      <label htmlFor="female" className="gender-label">
                        Nữ
                      </label>
                    </div>
                    <div className="gender-option">
                      <input
                        type="radio"
                        id="other"
                        name="gender"
                        value="other"
                        checked={user.gender === "other"}
                        onChange={handleChange}
                      />
                      <label htmlFor="other" className="gender-label">
                        Khác
                      </label>
                    </div>
                  </div>
                </div>

                {/* Mật khẩu */}
                <div className="form-group">
                  <label className="label">
                    <i className="fas fa-lock">
                      <TbLockPassword />
                    </i>
                    Mật khẩu
                    <span className="required">*</span>
                  </label>
                  <div className="input-container">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      required
                      className="input-field"
                      placeholder="Nhập mật khẩu"
                      value={user.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility("password")}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaRegEye />}
                    </button>
                  </div>
                </div>

                {/* Xác nhận mật khẩu */}
                <div className="form-group">
                  <label className="label">
                    <i className="fas fa-lock">
                      <TbLockPassword />
                    </i>
                    Xác nhận mật khẩu
                    <span className="required">*</span>
                  </label>
                  <div className="input-container">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      required
                      className="input-field"
                      placeholder="Nhập lại mật khẩu"
                      value={user.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        togglePasswordVisibility("confirmPassword")
                      }
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaRegEye />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Điều khoản */}
              <div className="terms-section">
                <div className="terms-agreement">
                  <div className="checkbox-container">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      checked={user.terms}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="terms-text">
                    Tôi đồng ý với{" "}
                    <a href="#" className="terms-link">
                      điều khoản dịch vụ
                    </a>{" "}
                    và{" "}
                    <a href="#" className="terms-link">
                      chính sách bảo mật
                    </a>{" "}
                    của Bệnh viện Đa khoa Medical
                  </div>
                </div>
              </div>

              {/* Nút đăng ký */}
              <div className="submit-section">
                <button
                  type="submit"
                  className="register-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      Đăng ký tài khoản
                      <i className="button-icon fas fa-arrow-right"></i>
                    </>
                  )}
                </button>
                <div className="login-link">
                  Đã có tài khoản?{" "}
                  <a
                    href="/login"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/login");
                    }}
                  >
                    Đăng nhập tại đây
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal thành công */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3 className="modal-title">Đăng ký thành công!</h3>
            <p className="modal-message">
              Tài khoản của bạn đã được tạo thành công. Bạn có muốn tạo thẻ/ví
              điện tử để thanh toán viện phí không?
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
  );
};

export default Register;
