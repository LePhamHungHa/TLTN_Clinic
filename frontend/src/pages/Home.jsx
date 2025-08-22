import React, { useState } from "react";
import Footer from "../components/Footer";

const Home = () => {
  const [showRegistration, setShowRegistration] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
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
              onClick={() => setShowRegistration(true)}
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

      {/* Registration Form Section */}
      {showRegistration && (
        <section className="container mx-auto px-4 py-8 bg-white rounded-lg shadow-lg">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i> Lưu ý:
            </h3>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Lịch hẹn có hiệu lực sau khi có xác nhận chính thức từ Phòng khám</li>
              <li>Quý khách hàng vui lòng cung cấp thông tin chính xác để được phục vụ tốt nhất</li>
              <li>Quý khách sử dụng dịch vụ đặt hẹn trực tuyến, xin vui lòng đặt trước ít nhất là 24 giờ</li>
              <li>Trong trường hợp khẩn cấp, quý khách vui lòng ĐẾN TRỰC TIẾP Phòng khám</li>
            </ul>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center justify-center">
              <i className="fas fa-edit mr-2"></i> ĐĂNG KÝ KHÁM
            </h2>
            <p className="text-gray-600 mb-6">
              Vui lòng điền thông tin vào form bên dưới để đăng ký khám bệnh theo yêu cầu
            </p>
            <div className="max-w-3xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullname" className="block text-gray-700 font-semibold mb-2">Họ và tên *</label>
                  <input type="text" id="fullname" className="w-full p-3 border rounded-md" required />
                </div>
                <div>
                  <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">Email *</label>
                  <input type="email" id="email" className="w-full p-3 border rounded-md" required />
                </div>
                <div>
                  <label htmlFor="birthdate" className="block text-gray-700 font-semibold mb-2">Ngày sinh *</label>
                  <input type="date" id="birthdate" className="w-full p-3 border rounded-md" required />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-gray-700 font-semibold mb-2">Số điện thoại *</label>
                  <input type="tel" id="phone" className="w-full p-3 border rounded-md" required />
                </div>
                <div>
                  <label htmlFor="gender" className="block text-gray-700 font-semibold mb-2">Giới tính *</label>
                  <select id="gender" className="w-full p-3 border rounded-md" required>
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="address" className="block text-gray-700 font-semibold mb-2">Địa chỉ *</label>
                  <input type="text" id="address" className="w-full p-3 border rounded-md" required />
                </div>
                <div>
                  <label htmlFor="department" className="block text-gray-700 font-semibold mb-2">Chuyên khoa *</label>
                  <select id="department" className="w-full p-3 border rounded-md" required>
                    <option value="">Chọn chuyên khoa</option>
                    <option value="cardiology">Tim mạch</option>
                    <option value="neurology">Thần kinh</option>
                    <option value="orthopedics">Cơ xương khớp</option>
                    <option value="pediatrics">Nhi khoa</option>
                    <option value="dermatology">Da liễu</option>
                    <option value="ophthalmology">Mắt</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="appointmentDate" className="block text-gray-700 font-semibold mb-2">Ngày khám *</label>
                  <input type="date" id="appointmentDate" className="w-full p-3 border rounded-md" required />
                </div>
                <div>
                  <label htmlFor="appointmentTime" className="block text-gray-700 font-semibold mb-2">Buổi khám *</label>
                  <select id="appointmentTime" className="w-full p-3 border rounded-md" required>
                    <option value="">Chọn buổi khám</option>
                    <option value="morning">Sáng (8h - 11h30)</option>
                    <option value="afternoon">Chiều (13h - 16h30)</option>
                    <option value="evening">Tối (17h - 20h)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="symptoms" className="block text-gray-700 font-semibold mb-2">Triệu chứng</label>
                  <input type="text" id="symptoms" className="w-full p-3 border rounded-md" placeholder="Mô tả triệu chứng" />
                </div>
              </div>
              <div className="text-center mt-6">
                <button type="submit" className="bg-blue-900 text-white px-8 py-3 rounded-md hover:bg-blue-800">
                  Đăng ký lịch hẹn
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Home;