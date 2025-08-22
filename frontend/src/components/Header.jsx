import React from "react";
import { Link } from "react-router-dom";
import '../css/Header.css';

const Header = () => {
  const user = JSON.parse(localStorage.getItem("user")) || null;

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <header className="bg-blue-900 text-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <i className="fas fa-hospital-alt text-3xl"></i>
          <span className="text-xl font-bold">Phòng khám Bệnh viện Đại học Y Dược 1</span>
        </div>
        <nav className="hidden md:flex space-x-6">
          <Link to="/" className="hover:text-blue-300">TRANG CHỦ</Link>
          <a href="#" className="hover:text-blue-300">GIỚI THIỆU</a>
          <a href="#" className="hover:text-blue-300">DỊCH VỤ</a>
          <a href="#" className="hover:text-blue-300">CHUYÊN KHOA</a>
          <a href="#" className="hover:text-blue-300">ĐỘI NGŨ BÁC SĨ</a>
          <a href="#" className="hover:text-blue-300">TIN TỨC</a>
          <a href="#" className="hover:text-blue-300">HƯỚNG DẪN KHÁCH HÀNG</a>
          <a href="#" className="hover:text-blue-300">LIÊN HỆ</a>
        </nav>
        <div className="flex space-x-3">
          {user ? (
            <>
              <span className="px-4 py-2">Xin chào, {user.username}</span>
              <button 
                className="border-2 border-white px-4 py-2 rounded-md hover:bg-blue-800"
                onClick={handleLogout}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="border-2 border-white px-4 py-2 rounded-md hover:bg-blue-800"
              >
                Đăng nhập
              </Link>
              <Link 
                to="/register" 
                className="bg-yellow-400 text-blue-900 px-4 py-2 rounded-md hover:bg-yellow-500"
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