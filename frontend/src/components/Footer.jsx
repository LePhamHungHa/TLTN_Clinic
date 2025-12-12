import React from "react";
import "../css/Footer.css";
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaFacebook,
  FaYoutube,
  FaTiktok,
  FaComments, // Thay cho Zalo
  FaHospital,
  FaUserMd,
  FaAmbulance,
  FaHeartbeat,
  FaShieldAlt,
  FaCreditCard,
  FaStar,
  FaArrowRight,
  FaPaperPlane,
  FaCheckCircle,
  FaGooglePlay,
  FaApple,
  FaWhatsapp, // Có thể dùng thay cho Zalo
} from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="medical-footer">
      {/* Top Section: Emergency & Quick Links */}
      <div className="footer-top">
        <div className="container">
          <div className="emergency-banner">
            <div className="emergency-content">
              <div className="emergency-icon">
                <FaAmbulance size={40} />
              </div>
              <div className="emergency-text">
                <h3 className="emergency-title">CẤP CỨU 24/7</h3>
                <p className="emergency-number">
                  <FaPhone size={20} />
                  <span>Gọi ngay: 1900 6923</span>
                </p>
                <p className="emergency-sub">Hỗ trợ nhanh chóng - Kịp thời</p>
              </div>
            </div>

            <div className="emergency-actions">
              <button className="btn-emergency">
                <FaPhone size={18} />
                <span>GỌI CẤP CỨU</span>
              </button>
              <button className="btn-book">
                <FaUserMd size={18} />
                <span>ĐẶT LỊCH KHÁM</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            {/* Column 1: Hospital Info */}
            <div className="footer-column">
              <div className="footer-logo">
                <FaHospital size={40} />
                <div className="logo-text">
                  <h3 className="hospital-name">BỆNH VIỆN ĐA KHOA QUỐC TẾ</h3>
                  <p className="hospital-slogan">
                    Chất lượng quốc tế - Tận tâm Việt Nam
                  </p>
                </div>
              </div>

              <div className="contact-info">
                <div className="contact-item">
                  <div className="contact-icon">
                    <FaMapMarkerAlt size={20} />
                  </div>
                  <div className="contact-details">
                    <h4>ĐỊA CHỈ</h4>
                    <p>Số 123 Đường Nguyễn Văn Linh</p>
                    <p>Quận 1, TP. Hồ Chí Minh</p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <FaPhone size={20} />
                  </div>
                  <div className="contact-details">
                    <h4>TỔNG ĐÀI</h4>
                    <p className="hotline">1900 6923</p>
                    <p>Hotline: 0912 345 678</p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <FaEnvelope size={20} />
                  </div>
                  <div className="contact-details">
                    <h4>EMAIL</h4>
                    <p>info@benhvienquocte.vn</p>
                    <p>support@benhvienquocte.vn</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="footer-column">
              <h3 className="column-title">DỊCH VỤ KHÁM BỆNH</h3>
              <ul className="footer-links">
                <li>
                  <FaArrowRight size={14} />
                  <a href="/kham-tong-quat">Khám tổng quát</a>
                </li>
                <li>
                  <FaArrowRight size={14} />
                  <a href="/kham-chuyen-khoa">Khám chuyên khoa</a>
                </li>
                <li>
                  <FaArrowRight size={14} />
                  <a href="/xet-nghiem">Xét nghiệm</a>
                </li>
                <li>
                  <FaArrowRight size={14} />
                  <a href="/chan-doan-hinh-anh">Chẩn đoán hình ảnh</a>
                </li>
                <li>
                  <FaArrowRight size={14} />
                  <a href="/cap-cuu">Cấp cứu 24/7</a>
                </li>
                <li>
                  <FaArrowRight size={14} />
                  <a href="/phau-thuat">Phẫu thuật</a>
                </li>
              </ul>

              <h3 className="column-title mt-6">CHÍNH SÁCH</h3>
              <ul className="footer-links">
                <li>
                  <FaCheckCircle size={14} />
                  <a href="/bao-mat">Bảo mật thông tin</a>
                </li>
                <li>
                  <FaCheckCircle size={14} />
                  <a href="/dieu-khoan">Điều khoản dịch vụ</a>
                </li>
                <li>
                  <FaCheckCircle size={14} />
                  <a href="/bao-hiem">Bảo hiểm y tế</a>
                </li>
              </ul>
            </div>

            {/* Column 3: Working Hours & Map */}
            <div className="footer-column">
              <h3 className="column-title">THỜI GIAN LÀM VIỆC</h3>
              <div className="working-hours">
                <div className="time-item">
                  <div className="time-icon">
                    <FaClock size={20} />
                  </div>
                  <div className="time-details">
                    <h4>KHÁM THƯỜNG</h4>
                    <p>Thứ 2 - Thứ 6: 7:30 - 20:00</p>
                    <p>Thứ 7: 7:30 - 17:00</p>
                    <p>Chủ Nhật: 7:30 - 12:00</p>
                  </div>
                </div>

                <div className="time-item">
                  <div className="time-icon">
                    <FaHeartbeat size={20} />
                  </div>
                  <div className="time-details">
                    <h4>CẤP CỨU</h4>
                    <p>24/7 - Không ngừng nghỉ</p>
                    <p className="emergency-note">(Kể cả ngày lễ, Tết)</p>
                  </div>
                </div>

                <div className="time-item">
                  <div className="time-icon">
                    <FaCreditCard size={20} />
                  </div>
                  <div className="time-details">
                    <h4>THANH TOÁN</h4>
                    <p>Chấp nhận: Visa, Mastercard</p>
                    <p>VNPay, Momo, ZaloPay</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 4: Newsletter & Social */}
            <div className="footer-column">
              <h3 className="column-title">ĐĂNG KÝ NHẬN TIN</h3>
              <div className="newsletter">
                <p className="newsletter-desc">
                  Nhận thông tin sức khỏe hữu ích và ưu đãi mới nhất
                </p>
                <div className="newsletter-form">
                  <input
                    type="email"
                    placeholder="Nhập email của bạn"
                    className="newsletter-input"
                  />
                  <button className="newsletter-btn">
                    <FaPaperPlane size={18} />
                    <span>ĐĂNG KÝ</span>
                  </button>
                </div>
                <p className="newsletter-note">Cam kết không spam</p>
              </div>

              <h3 className="column-title mt-6">KẾT NỐI VỚI CHÚNG TÔI</h3>
              <div className="social-links">
                <a
                  href="#"
                  className="social-link facebook"
                  aria-label="Facebook"
                >
                  <FaFacebook size={24} />
                </a>
                <a
                  href="#"
                  className="social-link youtube"
                  aria-label="YouTube"
                >
                  <FaYoutube size={24} />
                </a>
                <a href="#" className="social-link tiktok" aria-label="TikTok">
                  <FaTiktok size={24} />
                </a>
                <a href="#" className="social-link zalo" aria-label="Zalo">
                  <FaComments size={24} />
                </a>
              </div>

              <div className="app-download">
                <h4 className="app-title">TẢI ỨNG DỤNG</h4>
                <div className="app-badges">
                  <a href="#" className="app-badge app-store">
                    <FaApple size={20} />
                    <div className="app-text">
                      <span>Download on the</span>
                      <strong>App Store</strong>
                    </div>
                  </a>
                  <a href="#" className="app-badge google-play">
                    <FaGooglePlay size={20} />
                    <div className="app-text">
                      <span>GET IT ON</span>
                      <strong>Google Play</strong>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="footer-map">
        <div className="container">
          <div className="map-header">
            <h3 className="map-title">
              <FaMapMarkerAlt size={24} />
              <span>VỊ TRÍ BỆNH VIỆN</span>
            </h3>
            <button className="map-direction">
              <FaArrowRight size={16} />
              <span>CHỈ ĐƯỜNG</span>
            </button>
          </div>
          <div className="map-container">
            <div className="map-wrapper">
              {/* Google Map Embed */}
              <iframe
                title="Địa chỉ"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.214525515988!2d106.78918677590661!3d10.871281657435143!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175276398969f7b%3A0x9672b7efd0893fc4!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBOw7RuZyBMw6JtIFRQLiBI4buTIENow60gTWluaA!5e0!3m2!1svi!2s!4v1765540655461!5m2!1svi!2s"
                width="100%"
                height="300"
                style={{ border: 0, borderRadius: "12px" }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>

              <div className="map-info">
                <div className="info-card">
                  <div className="info-icon">
                    <FaShieldAlt size={20} />
                  </div>
                  <div className="info-content">
                    <h4>ĐẬU XE MIỄN PHÍ</h4>
                    <p>Bãi đỗ rộng rãi - An ninh 24/7</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">
                    <FaStar size={20} />
                  </div>
                  <div className="info-content">
                    <h4>DỄ DÀNG DI CHUYỂN</h4>
                    <p>Gần trạm xe buýt - Trung tâm thành phố</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="footer-bottom">
        <div className="container">
          <div className="bottom-content">
            <div className="copyright">
              <p>
                © {currentYear} Bệnh Viện Đa Khoa Quốc Tế. Tất cả các quyền được
                bảo lưu.
              </p>
              <p>Giấy phép hoạt động: 01234/GP-BYT cấp ngày 01/01/2023</p>
            </div>

            <div className="certifications">
              <div className="cert-badge">
                <FaShieldAlt size={20} />
                <span>ISO 9001:2015</span>
              </div>
              <div className="cert-badge">
                <FaHospital size={20} />
                <span>BỘ Y TẾ CẤP PHÉP</span>
              </div>
              <div className="cert-badge">
                <FaStar size={20} />
                <span>5 SAO DỊCH VỤ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
