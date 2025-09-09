import React from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

const Home = () => {
  const navigate = useNavigate();

  const handleRegisterClick = () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token || !user.username) {
    navigate("/login", { state: { from: "/register-patient" } });
  } else {
    navigate("/register-patient", { state: { userId: user.id } }); 
  }
};

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
              Chăm sóc sức khỏe toàn diện
            </h1>
            <p className="text-gray-600 mb-6">
              Đặt lịch khám nhanh chóng, quản lý hồ sơ bệnh án dễ dàng và kết nối trực tiếp với bác sĩ của bạn.
            </p>
            <button 
              className="bg-blue-900 text-white px-6 py-3 rounded-md hover:bg-blue-800"
              onClick={handleRegisterClick}
            >
              Đăng ký khám
            </button>
          </div>
          <div className="md:w-1/2">
            <img 
              src="https://umcclinic.com.vn/Data/Sites/1/Banner/tmh_pc.png" 
              alt="Doctor" 
              className="w-full rounded-lg"
            />
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Home;
