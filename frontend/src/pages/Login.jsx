import { auth } from "../api/firebase";
import {
  signInWithCredential,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";
import React, { useState, useEffect } from "react";
import { loginUser } from "../api/userAPI";
import { useNavigate, Link } from "react-router-dom";
import "../css/Login.css";
import { FaUserTie } from "react-icons/fa6";
import { IoIosLock } from "react-icons/io";
import { FaFacebookF } from "react-icons/fa";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { LoginSocialFacebook } from "reactjs-social-login";

// secret
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;

const LoginContent = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    createDots();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser({
        username: username.trim(),
        password: password.trim(),
      });

      console.log("LOGIN RESPONSE:", res);

      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res));

      alert("Đăng nhập thành công!");

      if (res.role === "PATIENT") {
        navigate("/patient");
      } else if (res.role === "DOCTOR") {
        navigate("/doctor");
      } else {
        navigate("/admin");
      }
    } catch (error) {
      console.error("Login Error:", error.message);
      alert(`Lỗi đăng nhập: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    setLoading(true);
    try {
      console.log("GOOGLE START");
      const { credential } = response;
      const googleCredential = GoogleAuthProvider.credential(credential);
      const result = await signInWithCredential(auth, googleCredential);
      const firebaseUser = result.user;

      console.log("FIREBASE USER:", {
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
      });

      const backendRes = await fetch(
        "http://localhost:8080/api/auth/social-login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: firebaseUser.email || "guest@gmail.com",
            provider: "google",
            uid: firebaseUser.uid,
            name: firebaseUser.displayName,
            picture: firebaseUser.photoURL,
          }),
        }
      );

      const data = await backendRes.json();
      console.log("BACKEND RESPONSE:", data);
      console.log("STATUS:", backendRes.status);

      if (!backendRes.ok || data.error) {
        throw new Error(data.error || `Lỗi server: HTTP ${backendRes.status}`);
      }

      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("token", data.token);

      console.log("SAVED TO LOCALSTORAGE:", data);
      alert("Đăng nhập Google thành công!");
      navigate("/patient");
    } catch (error) {
      console.error("GOOGLE ERROR:", error);
      alert(
        `Lỗi đăng nhập Google: ${error.message}. Vui lòng kiểm tra kết nối mạng và thử lại.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSuccess = async (response) => {
    setLoading(true);
    try {
      const accessToken = response?.data?.accessToken;
      const credential = FacebookAuthProvider.credential(accessToken);
      const result = await signInWithCredential(auth, credential);
      const firebaseUser = result.user;

      const res = await fetch("/api/auth/social-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: firebaseUser.email || "guest@fb.com",
          provider: "facebook",
          uid: firebaseUser.uid,
          name: firebaseUser.displayName,
          picture: firebaseUser.photoURL,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Lỗi server");

      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("token", data.token);

      alert("Đăng nhập Facebook thành công!");
      navigate("/patient");
    } catch (error) {
      console.error("Facebook Error:", error);
      alert(
        `Lỗi đăng nhập Facebook: ${error.message}. Vui lòng kiểm tra kết nối mạng và thử lại.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error("Google Error:", error);
    alert("Lỗi đăng nhập Google. Vui lòng thử lại.");
    setLoading(false);
  };

  const handleFacebookError = (error) => {
    console.error("Facebook Error:", error);
    alert("Lỗi đăng nhập Facebook. Vui lòng thử lại.");
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="floating-dots"></div>

      <div className="login-container">
        <div className="login-card">
          <div className="card-content">
            <div className="login-header slide-in">
              <div className="avatar">
                <i>
                  <FaUserTie />
                </i>
              </div>
              <h1>Đăng Nhập</h1>
              <p>Chào mừng bạn trở lại</p>
            </div>

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
                    disabled={loading}
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
                    disabled={loading}
                  />
                  <div
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="login-button slide-in delay-3"
                disabled={loading}
              >
                {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
              </button>
            </form>

            <div className="social-login slide-in delay-3">
              <div className="divider">
                <span>Hoặc đăng nhập bằng</span>
              </div>
              <div className="social-buttons">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  size="large"
                  text="sign_in_with"
                  theme="filled_blue"
                  width="280"
                  shape="rectangular"
                  logo_alignment="left"
                />
                <LoginSocialFacebook
                  appId={FACEBOOK_APP_ID}
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
          </div>
        </div>
      </div>
    </div>
  );
};

const Login = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <LoginContent />
  </GoogleOAuthProvider>
);

export default Login;
