import React from "react";
// import '../css/Footer.css';

const Footer = () => {
  return (
    <footer className="bg-blue-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <p className="text-xl font-bold">
            <i className="fas fa-phone-alt mr-2"></i> TỔNG ĐÀI TƯ VẤN: 1900 6923
          </p>
        </div>
        <div className="flex flex-col md:flex-row justify-center gap-8">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold mb-3">PHÒNG KHÁM BỆNH VIỆN ĐẠI HỌC Y DƯỢC 1</h3>
            <p>Điều trị chuyên nghiệp - Nâng tầm Y Việt</p>
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold mb-3">GIỜ LÀM VIỆC</h3>
            <p>Thứ 2 - Thứ 7: 7h30 - 20h</p>
            <p>Chủ Nhật: 7h30 - 17h</p>
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold mb-3">ĐỊA CHỈ</h3>
            <p>123 Đường Nguyễn Văn Linh, Quận 1, TP. HCM</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;