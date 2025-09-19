import { initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import React, { useState, useEffect } from "react";
import { loginUser } from "../api/userAPI";
import { useNavigate, Link } from "react-router-dom";
import "../css/Login.css";
import { CiUser } from "react-icons/ci";
import { FaUserTie } from "react-icons/fa6";
import { IoIosLock } from "react-icons/io";
import { FaFacebookF } from "react-icons/fa";
import { FiPhone } from "react-icons/fi";
import { GoogleLogin } from "@react-oauth/google";
import { LoginSocialFacebook } from "reactjs-social-login";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import OtpInput from "react-otp-input";
import { jwtDecode } from "jwt-decode";

// ================== Firebase Config ==================
const firebaseConfig = {
  apiKey: "", // nhớ xóa key này khi public code
  authDomain: "clinicweb-8fa34.firebaseapp.com",
  projectId: "clinicweb-8fa34",
  storageBucket: "clinicweb-8fa34.firebasestorage.app",
  messagingSenderId: "112307862186",
  appId: "1:112307862186:web:442234250282e98d25aed3",
  measurementId: "G-FNPZEELB26",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ================== Component ==================
const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State cho Phone Login
  const [phoneLogin, setPhoneLogin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    createDots();
  }, []);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const createDots = () => {
    const container = document.querySelector(".floating-dots");
    if (!container) return;
    container.innerHTML = "";
    const dotCount = 20;
    for (let i = 0; i < dotCount; i++) {
      const dot = document.createElement("div");
      dot.classList.add("dot");
      const size = Math.random() * 10 + 5;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.left = `${Math.random() * 100}%`;
      dot.style.top = `${Math.random() * 100}%`;
      dot.style.opacity = Math.random() * 0.6 + 0.2;
      const duration = Math.random() * 15 + 10;
      dot.style.animationDuration = `${duration}s`;
      dot.style.animationDelay = `${Math.random() * 5}s`;
      container.appendChild(dot);
    }
  };

  // ===== Login Username / Password =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser({
        username: username.trim(),
        password: password.trim(),
      });

      if (res && res.username && res.role) {
        alert("Đăng nhập thành công!");
        const token = res.token || `fake-token-${res.username}`;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(res));

        if (res.role === "PATIENT") navigate("/patient");
        else if (res.role === "DOCTOR") navigate("/doctor");
        else if (res.role === "ADMIN") navigate("/admin");
        else navigate("/");
      } else {
        alert("Phản hồi không hợp lệ từ server!");
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error.message);
      alert(`Lỗi đăng nhập: ${error.message}`);
    }
  };

  // ===== Login Phone / OTP =====
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: (response) => {
            console.log("reCAPTCHA verified:", response);
          },
        }
      );
    }
  };

  const sendOtp = async () => {
    if (!phoneNumber) {
      alert("Vui lòng nhập số điện thoại");
      return;
    }
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );
      setConfirmationResult(result);
      setOtpSent(true);
      setCountdown(90);
      alert("Mã OTP đã được gửi!");
    } catch (error) {
      console.error("Lỗi khi gửi OTP:", error);
      alert("Lỗi khi gửi OTP: " + error.message);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      alert("Vui lòng nhập đủ mã OTP");
      return;
    }
    try {
      const result = await confirmationResult.confirm(otp);
      const firebaseUser = result.user;
      console.log("Firebase xác thực:", firebaseUser.phoneNumber);

      const res = await fetch("http://localhost:8080/api/auth/phone-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: firebaseUser.phoneNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data));
        alert("Đăng nhập thành công!");

        if (data.role === "PATIENT") navigate("/patient");
        else if (data.role === "DOCTOR") navigate("/doctor");
        else if (data.role === "ADMIN") navigate("/admin");
        else navigate("/");
      } else {
        alert(data.error || "Có lỗi xảy ra khi đồng bộ DB");
      }
    } catch (error) {
      alert("OTP không đúng: " + error.message);
    }
  };

  const resendOtp = () => {
    if (countdown === 0) {
      sendOtp();
    }
  };

  // ===== Social Login =====
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Google decoded:", decoded);

      const res = await fetch("http://localhost:8080/api/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: decoded.email,
          name: decoded.name,
          googleId: decoded.sub,
          picture: decoded.picture,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Đăng nhập Google thành công!");
        localStorage.setItem("user", JSON.stringify(data));
        localStorage.setItem("token", data.token);

        if (data.role === "PATIENT") navigate("/patient");
        else if (data.role === "DOCTOR") navigate("/doctor");
        else if (data.role === "ADMIN") navigate("/admin");
        else navigate("/");
      } else {
        alert(data.error || "Đăng nhập Google thất bại!");
      }
    } catch (err) {
      console.error("Google login error:", err);
      alert("Google login error: " + err.message);
    }
  };

  const handleGoogleError = () => {
    alert("Đăng nhập Google thất bại!");
  };

  const handleFacebookSuccess = async (response) => {
    try {
      const { data } = response;
      // Kiểm tra email
      if (!data.email) {
        alert("Facebook không trả về email. Vui lòng dùng phương thức khác!");
        return;
      }

      const res = await fetch("http://localhost:8080/api/auth/facebook-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          accessToken: data.accessToken,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        alert("Đăng nhập Facebook thành công!");
        localStorage.setItem("user", JSON.stringify(result));
        localStorage.setItem("token", result.token);

        if (result.role === "PATIENT") navigate("/patient");
        else if (result.role === "DOCTOR") navigate("/doctor");
        else if (result.role === "ADMIN") navigate("/admin");
        else navigate("/");
      } else {
        alert(result.error || "Đăng nhập Facebook thất bại!");
      }
    } catch (error) {
      console.error("Facebook login error:", error);
      alert("Facebook login error: " + error.message);
    }
  };

  const handleFacebookError = (error) => {
    console.error("Facebook login error:", error);
    alert("Đăng nhập Facebook thất bại!");
  };

  // ===== Forgot password =====
  const handleForgotSubmit = (e) => {
    e.preventDefault();
    alert(`Đã gửi yêu cầu đặt lại mật khẩu cho: ${resetEmail}`);
    setIsResetting(true);
    setResetEmail("");
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
    alert("Đổi mật khẩu thành công! Giờ bạn có thể đăng nhập lại.");
    setIsForgot(false);
    setIsResetting(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  // ================== JSX ==================
  return (
    <div className="login-page">
      <div className="floating-dots"></div>
      <div id="recaptcha-container"></div>

      <div className="login-container">
        <div className="login-card">
          <div className="card-content">
            <div className="login-header slide-in">
              <div className="avatar">
                <i>
                  <CiUser />
                </i>
              </div>
              <h1>
                {phoneLogin
                  ? "Đăng nhập bằng SĐT"
                  : isForgot
                  ? isResetting
                    ? "Đặt lại mật khẩu"
                    : "Quên mật khẩu"
                  : "Đăng Nhập"}
              </h1>
              <p>
                {phoneLogin
                  ? "Nhập số điện thoại để nhận mã OTP"
                  : isForgot
                  ? isResetting
                    ? "Nhập mật khẩu mới của bạn"
                    : "Nhập email để đặt lại mật khẩu"
                  : "Chào mừng bạn trở lại"}
              </p>
            </div>

            {/* Toggle buttons */}
            {!isForgot && !phoneLogin && (
              <div className="login-toggle slide-in delay-1">
                <button
                  type="button"
                  className="toggle-button"
                  onClick={() => setPhoneLogin(true)}
                >
                  <FiPhone /> Đăng nhập bằng số điện thoại
                </button>
              </div>
            )}
            {phoneLogin && (
              <div className="back-to-login slide-in">
                <button
                  type="button"
                  className="back-button"
                  onClick={() => {
                    setPhoneLogin(false);
                    setOtpSent(false);
                    setPhoneNumber("");
                    setOtp("");
                  }}
                >
                  ← Quay lại đăng nhập thường
                </button>
              </div>
            )}

            {/* ===== FORM Phone ===== */}
            {phoneLogin && (
              <form
                onSubmit={
                  otpSent
                    ? verifyOtp
                    : (e) => {
                        e.preventDefault();
                        sendOtp();
                      }
                }
                className="phone-login-form"
              >
                {!otpSent ? (
                  <>
                    <div className="form-group slide-in delay-1">
                      <label>Số điện thoại</label>
                      <div className="input-container">
                        <div className="input-icon">
                          <FiPhone />
                        </div>
                        <PhoneInput
                          international
                          defaultCountry="VN"
                          value={phoneNumber}
                          onChange={setPhoneNumber}
                          placeholder="Nhập số điện thoại"
                          className="phone-input"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="login-button slide-in delay-2"
                    >
                      Gửi mã OTP
                    </button>
                  </>
                ) : (
                  <>
                    <div className="form-group slide-in delay-1">
                      <label>Mã OTP</label>
                      <div className="otp-container">
                        <OtpInput
                          value={otp}
                          onChange={setOtp}
                          numInputs={6}
                          renderInput={(props) => <input {...props} />}
                          containerStyle="otp-input-container"
                          inputStyle="otp-input"
                          focusStyle="otp-input-focus"
                        />
                      </div>
                      <div className="otp-actions">
                        <button
                          type="button"
                          className="resend-button"
                          onClick={resendOtp}
                          disabled={countdown > 0}
                        >
                          {countdown > 0
                            ? `Gửi lại sau ${countdown}s`
                            : "Gửi lại mã OTP"}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="login-button slide-in delay-2"
                    >
                      Xác thực
                    </button>
                  </>
                )}
              </form>
            )}

            {/* ===== FORM Username/Password ===== */}
            {!isForgot && !phoneLogin && (
              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group slide-in delay-1">
                  <label htmlFor="username">Tên đăng nhập</label>
                  <div className="input-container">
                    <div className="input-icon">
                      <FaUserTie />
                    </div>
                    <input
                      type="text"
                      id="username"
                      placeholder="Nhập tên đăng nhập"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>
                <div className="form-group slide-in delay-2">
                  <label htmlFor="password">Mật khẩu</label>
                  <div className="input-container">
                    <div className="input-icon">
                      <IoIosLock />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <div
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </div>
                  </div>
                </div>
                <div className="form-options slide-in delay-1">
                  <div className="remember-me">
                    <input
                      type="checkbox"
                      id="remember-me"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                    />
                    <label htmlFor="remember-me">Ghi nhớ đăng nhập</label>
                  </div>
                  <button
                    type="button"
                    className="forgot-password"
                    onClick={() => setIsForgot(true)}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <button type="submit" className="login-button slide-in delay-3">
                  Đăng Nhập
                </button>
              </form>
            )}

            {/* ===== FORM Quên mật khẩu ===== */}
            {isForgot && !isResetting && (
              <form onSubmit={handleForgotSubmit} className="forgot-form">
                <div className="form-group slide-in delay-1">
                  <label>Email</label>
                  <div className="input-container">
                    <div className="input-icon">
                      <CiUser />
                    </div>
                    <input
                      type="email"
                      placeholder="Nhập email của bạn"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="forgot-actions slide-in delay-2">
                  <button type="submit" className="submit-btn">
                    Gửi yêu cầu
                  </button>
                  <button
                    type="button"
                    className="back-btn"
                    onClick={() => setIsForgot(false)}
                  >
                    Quay lại
                  </button>
                </div>
              </form>
            )}

            {isForgot && isResetting && (
              <form onSubmit={handleResetPassword} className="reset-form">
                <div className="form-group slide-in delay-1">
                  <label>Mật khẩu mới</label>
                  <div className="input-container">
                    <div className="input-icon">
                      <IoIosLock />
                    </div>
                    <input
                      type="password"
                      placeholder="Nhập mật khẩu mới"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group slide-in delay-2">
                  <label>Xác nhận mật khẩu</label>
                  <div className="input-container">
                    <div className="input-icon">
                      <IoIosLock />
                    </div>
                    <input
                      type="password"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="forgot-actions slide-in delay-3">
                  <button type="submit" className="submit-btn">
                    Đổi mật khẩu
                  </button>
                  <button
                    type="button"
                    className="back-btn"
                    onClick={() => {
                      setIsForgot(false);
                      setIsResetting(false);
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}

            {/* ===== Social Login ===== */}
            {!isForgot && !phoneLogin && (
              <>
                <div className="social-login slide-in delay-3">
                  <div className="divider">
                    <span>Hoặc đăng nhập bằng</span>
                  </div>
                  <div className="social-buttons">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                    />
                    <LoginSocialFacebook
                      appId="649463591534890"
                      onResolve={handleFacebookSuccess}
                      onReject={handleFacebookError}
                    >
                      <button type="button" className="social-button facebook">
                        <FaFacebookF />
                      </button>
                    </LoginSocialFacebook>
                  </div>
                </div>
                <div className="register-link slide-in delay-3">
                  <p>
                    Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
