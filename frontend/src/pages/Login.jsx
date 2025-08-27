import React, { useState, useEffect } from "react";
import { loginUser } from "../api/userAPI";
import { useNavigate, Link } from "react-router-dom";
import "../css/Login.css";
import { CiUser } from "react-icons/ci";
import { FaUserTie } from "react-icons/fa6";
import { IoIosLock } from "react-icons/io";
import { FaFacebookF } from "react-icons/fa";
import { FaGoogle } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    createDots();
  }, []);

  const createDots = () => {
    const container = document.querySelector('.floating-dots');
    if (!container) return;
    
    // Xóa các dot cũ nếu có
    container.innerHTML = '';
    
    const dotCount = 20;
    
    for (let i = 0; i < dotCount; i++) {
      const dot = document.createElement('div');
      dot.classList.add('dot');
      
      // Random kích thước
      const size = Math.random() * 10 + 5;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      
      // Random vị trí
      dot.style.left = `${Math.random() * 100}%`;
      dot.style.top = `${Math.random() * 100}%`;
      
      // Random độ mờ
      dot.style.opacity = Math.random() * 0.6 + 0.2;
      
      // Random thời gian animation
      const duration = Math.random() * 15 + 10;
      dot.style.animationDuration = `${duration}s`;
      
      // Random delay
      dot.style.animationDelay = `${Math.random() * 5}s`;
      
      container.appendChild(dot);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    console.log("Gửi yêu cầu đăng nhập:", { username: trimmedUsername, password: trimmedPassword });
    const res = await loginUser({ username: trimmedUsername, password: trimmedPassword });
    console.log("Phản hồi đăng nhập:", res);

    if (res && res.username && res.role) {
      alert("Đăng nhập thành công!");
      localStorage.setItem("user", JSON.stringify(res));

      // Điều hướng theo role
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSocialLogin = (provider) => {
    alert(`Đăng nhập với ${provider} chưa được triển khai.`);
  };

  return (
    <div className="login-page">
      <div className="floating-dots"></div>
      
      <div className="login-container">
        <div className="login-card">
          <div className="card-content">
            <div className="login-header slide-in">
              <div className="avatar">
                <i className="fas fa-user"><CiUser /></i>
              </div>
              <h1>Đăng Nhập</h1>
              <p>Chào mừng bạn trở lại</p>
            </div>
            
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group slide-in delay-1">
                <label htmlFor="username">Tên đăng nhập</label>
                <div className="input-container">
                  <div className="input-icon">
                    <i className="fas fa-user"><FaUserTie /></i>
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
                    <i className="fas fa-lock"><IoIosLock /></i>
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
                  <div className="password-toggle" onClick={togglePasswordVisibility}>
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
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
                
                <a href="#" className="forgot-password">Quên mật khẩu?</a>
              </div>
              
              <button type="submit" className="login-button slide-in delay-3">
                Đăng Nhập
              </button>
            </form>
            
            <div className="social-login slide-in delay-3">
              <div className="divider">
                <span>Hoặc đăng nhập bằng</span>
              </div>
              
              <div className="social-buttons">
                <button 
                  type="button" 
                  className="social-button facebook"
                  onClick={() => handleSocialLogin('Facebook')}
                >
                  <i className="fab fa-facebook-f"><FaFacebookF /></i>
                </button>
                <button 
                  type="button" 
                  className="social-button google"
                  onClick={() => handleSocialLogin('Google')}
                >
                  <i className="fab fa-google"><FaGoogle /></i>
                </button>
                <button 
                  type="button" 
                  className="social-button github"
                  onClick={() => handleSocialLogin('GitHub')}
                >
                  <i className="fab fa-github"><FaGithub /></i>
                </button>
              </div>
            </div>
            
            <div className="register-link slide-in delay-3">
              <p>
                Chưa có tài khoản?{" "}
                <Link to="/register">Đăng ký ngay</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;