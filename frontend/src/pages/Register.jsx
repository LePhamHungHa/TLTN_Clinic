import React, { useState } from "react";
import { registerUser } from "../api/userAPI";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [user, setUser] = useState({ username: "", password: "", email: "" });
  const navigate = useNavigate();

  const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await registerUser(user);
    if (res.id) {
      alert("Đăng ký thành công!");
      navigate("/login");
    } else alert("Đăng ký thất bại");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">Đăng ký</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-gray-700 font-semibold mb-2">Tên đăng nhập</label>
              <input 
                id="username"
                name="username"
                className="w-full p-3 border rounded-md" 
                placeholder="Username" 
                value={user.username} 
                onChange={handleChange} 
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">Email</label>
              <input 
                id="email"
                name="email"
                type="email"
                className="w-full p-3 border rounded-md" 
                placeholder="Email" 
                value={user.email} 
                onChange={handleChange} 
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-gray-700 font-semibold mb-2">Mật khẩu</label>
              <input 
                id="password"
                name="password"
                type="password" 
                className="w-full p-3 border rounded-md" 
                placeholder="Password" 
                value={user.password} 
                onChange={handleChange} 
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-900 text-white px-6 py-3 rounded-md hover:bg-blue-800"
            >
              Đăng ký
            </button>
          </form>
          <p className="mt-4 text-center text-gray-600">
            Đã có tài khoản?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Đăng nhập ngay
            </a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;