// src/pages/Login.jsx
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
import { useToast } from "../hooks/useToast";

// secret
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;

const LoginContent = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

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
      toast.error("Vui lòng nhập đầy đủ thông tin!");
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

      toast.success("Đăng nhập thành công! 🎉");

      // Tự động chuyển hướng sau 1 giây
      setTimeout(() => {
        if (res.role === "PATIENT") {
          navigate("/patient");
        } else if (res.role === "DOCTOR") {
          navigate("/doctor");
        } else {
          navigate("/admin");
        }
      }, 1000);
    } catch (error) {
      console.error("Login Error:", error.message);
      toast.error(`Lỗi đăng nhập: ${error.message}`);
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
        photoURL: firebaseUser.photoURL,
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
            name: firebaseUser.displayName || firebaseUser.email,
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
      toast.success("Đăng nhập Google thành công! 🎉");

      setTimeout(() => {
        navigate("/patient");
      }, 1000);
    } catch (error) {
      console.error("GOOGLE ERROR:", error);
      toast.error(`Lỗi đăng nhập Google: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSuccess = async (response) => {
    setLoading(true);
    try {
      const accessToken = response?.data?.accessToken;
      console.log("FACEBOOK ACCESS TOKEN:", accessToken);

      const credential = FacebookAuthProvider.credential(accessToken);
      const result = await signInWithCredential(auth, credential);
      const firebaseUser = result.user;

      console.log("FACEBOOK USER:", {
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      });

      const res = await fetch("http://localhost:8080/api/auth/social-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: firebaseUser.email || "guest@fb.com",
          provider: "facebook",
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email,
          picture: firebaseUser.photoURL,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Lỗi server");

      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("token", data.token);

      toast.success("Đăng nhập Facebook thành công! 🎉");

      setTimeout(() => {
        navigate("/patient");
      }, 1000);
    } catch (error) {
      console.error("Facebook Error:", error);

      // Xử lý các lỗi cụ thể với toast
      if (error.code === "auth/account-exists-with-different-credential") {
        toast.error(
          "Email này đã được đăng ký với phương thức đăng nhập khác."
        );
      } else if (error.code === "auth/popup-blocked") {
        toast.error("Popup đăng nhập đã bị chặn. Vui lòng cho phép popup.");
      } else if (error.code === "auth/popup-closed-by-user") {
        toast.error("Bạn đã đóng cửa sổ đăng nhập.");
      } else {
        toast.error(`Lỗi đăng nhập Facebook: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error("Google Error:", error);
    toast.error("Lỗi đăng nhập Google. Vui lòng thử lại.");
    setLoading(false);
  };

  const handleFacebookError = (error) => {
    console.error("Facebook Error:", error);
    toast.error("Lỗi đăng nhập Facebook. Vui lòng thử lại.");
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
