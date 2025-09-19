import React from "react";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";
import "../css/Home.css";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";

// data trượt

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Chăm sóc sức khỏe toàn diện</h1>
            <p>
              Đặt lịch khám nhanh chóng, quản lý hồ sơ bệnh án dễ dàng và kết
              nối trực tiếp với bác sĩ của bạn.
            </p>
            <button className="btn-primary" onClick={handleRegisterClick}>
              Đăng ký khám ngay
            </button>
          </div>
          <div className="hero-image">
            <img
              src="https://umcclinic.com.vn/Data/Sites/1/Banner/tmh_pc.png"
              alt="Doctor"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">5000+</span>
            <span className="stat-label">Bệnh nhân hài lòng</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">50+</span>
            <span className="stat-label">Bác sĩ chuyên môn</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">15+</span>
            <span className="stat-label">Năm kinh nghiệm</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Hỗ trợ khách hàng</span>
          </div>
        </div>
      </section>

      {/* Services & Specialties Section */}
      <section className="services-specialties">
        <div className="content-wrapper">
          {/* Left: Services */}
          <div className="services-left">
            <h2 className="section-heading">DỊCH VỤ</h2>
            <div className="services-grid">
              <div className="service-item">
                <img
                  src="https://umcclinic.com.vn/Data/Sites/1/News/206/goi-kham-suc-khoe-tong-quat-va-tam-soat-ung-thu-1.jpg"
                  alt="Tổng quát & Tầm soát ung thư"
                />
                <h3>KHÁM SỨC KHỎE TỔNG QUÁT VÀ TẦM SOÁT UNG THƯ</h3>
              </div>
              <div className="service-item">
                <img
                  src="https://umcclinic.com.vn/Data/Sites/1/News/209/g%C3%B3i-kh%C3%A1m-s%E1%BB%A9c-kh%E1%BB%8Fe-t%E1%BB%95ng-qu%C3%A1t-n%C3%A2ng-cao.jpg"
                  alt="Gói khám nâng cao"
                />
                <h3>GÓI KHÁM SỨC KHỎE TỔNG QUÁT NÂNG CAO</h3>
              </div>
              <div className="service-item">
                <img
                  src="https://umcclinic.com.vn/Data/Sites/1/News/208/g%C3%B3i-kh%C3%A1m-s%E1%BB%A9c-kh%E1%BB%8Fe-t%E1%BB%95ng-qu%C3%A1t-c%C6%A1-b%E1%BA%A3n.jpg"
                  alt="Gói khám cơ bản"
                />
                <h3>GÓI KHÁM SỨC KHỎE TỔNG QUÁT CƠ BẢN</h3>
              </div>
              <div className="service-item">
                <img
                  src="https://umcclinic.com.vn/Data/Sites/1/News/210/g%C3%B3i-kh%C3%A1m-s%E1%BB%A9c-kh%E1%BB%8Fe-t%E1%BB%95ng-qu%C3%A1t-chuy%C3%AAn-s%C3%A2u.jpg"
                  alt="Gói khám chuyên sâu"
                />
                <h3>GÓI KHÁM SỨC KHỎE TỔNG QUÁT CHUYÊN SÂU</h3>
              </div>

              {/* nút diều hướng */}
              <div className="specialty-arrows">
                <button>
                  <i className="arrow-left">
                    <MdKeyboardDoubleArrowLeft />
                  </i>
                </button>
                <button>
                  <i className="arrow-right">
                    <MdKeyboardDoubleArrowRight />
                  </i>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Specialties */}
          <div className="specialties-right">
            <h2 className="section-heading">CHUYÊN KHOA</h2>
            <div className="specialty-list">
              <div className="specialty-item">
                <div className="specialty-icon-wrapper">
                  <i className="fas fa-x-ray"></i>
                </div>
                <div className="specialty-content">
                  <h4>CHẨN ĐOÁN HÌNH ẢNH</h4>
                  <span>Xem thêm</span>
                </div>
              </div>
              <div className="specialty-item">
                <div className="specialty-icon-wrapper">
                  <i className="fas fa-bone"></i>
                </div>
                <div className="specialty-content">
                  <h4>CƠ - XƯƠNG - KHỚP</h4>
                  <span>Xem thêm</span>
                </div>
              </div>
              <div className="specialty-item">
                <div className="specialty-icon-wrapper">
                  <i className="fas fa-child"></i>
                </div>
                <div className="specialty-content">
                  <h4>NHI KHOA</h4>
                  <span>Xem thêm</span>
                </div>
              </div>
              <div className="specialty-item">
                <div className="specialty-icon-wrapper">
                  <i className="fas fa-female"></i>
                </div>
                <div className="specialty-content">
                  <h4>SẢN - PHỤ KHOA</h4>
                  <span>Xem thêm</span>
                </div>
              </div>
              <div className="specialty-item">
                <div className="specialty-icon-wrapper">
                  <i className="fas fa-ear-alt"></i>
                </div>
                <div className="specialty-content">
                  <h4>TAI - MŨI - HỌNG</h4>
                  <span>Xem thêm</span>
                </div>
              </div>
            </div>

            {/* nút diều hướng */}
            <div className="specialty-arrows">
              <button>
                <i className="arrow-left">
                  <MdKeyboardDoubleArrowLeft />
                </i>
              </button>
              <button>
                <i className="arrow-right">
                  <MdKeyboardDoubleArrowRight />
                </i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services">
        <div className="section-title">
          <h2>Dịch vụ nổi bật</h2>
          <p>
            Chúng tôi cung cấp các dịch vụ chăm sóc sức khỏe chất lượng cao với
            đội ngũ bác sĩ chuyên môn giỏi
          </p>
        </div>
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon">
              <i className="fas fa-heartbeat"></i>
            </div>
            <h3>Khám tim mạch</h3>
            <p>
              Khám và điều trị các bệnh lý về tim mạch với trang thiết bị hiện
              đại và bác sĩ chuyên khoa giàu kinh nghiệm.
            </p>
          </div>
          <div className="service-card">
            <div className="service-icon">
              <i className="fas fa-brain"></i>
            </div>
            <h3>Thần kinh</h3>
            <p>
              Chẩn đoán và điều trị các bệnh lý về thần kinh với phác đồ điều
              trị tiên tiến và hiệu quả.
            </p>
          </div>
          <div className="service-card">
            <div className="service-icon">
              <i className="fas fa-baby"></i>
            </div>
            <h3>Nhi khoa</h3>
            <p>
              Chăm sóc sức khỏe toàn diện cho trẻ em với bác sĩ chuyên khoa và
              môi trường thân thiện.
            </p>
          </div>
          <div className="service-card">
            <div className="service-icon">
              <i className="fas fa-teeth"></i>
            </div>
            <h3>Nha khoa</h3>
            <p>
              Dịch vụ nha khoa chất lượng cao với công nghệ hiện đại, đem lại nụ
              cười rạng rỡ cho bạn.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="section-title">
          <h2>Tại sao chọn chúng tôi</h2>
          <p>
            UMC Clinic mang đến cho bạn trải nghiệm chăm sóc sức khỏe khác biệt
            và hoàn hảo
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-user-md"></i>
            </div>
            <div className="feature-content">
              <h3>Bác sĩ chuyên môn cao</h3>
              <p>
                Đội ngũ bác sĩ giàu kinh nghiệm, được đào tạo bài bản trong và
                ngoài nước, tận tâm với nghề.
              </p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-hospital"></i>
            </div>
            <div className="feature-content">
              <h3>Cơ sở vật chất hiện đại</h3>
              <p>
                Trang thiết bị y tế tiên tiến, phòng khám tiện nghi và thoải
                mái, đạt tiêu chuẩn quốc tế.
              </p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="feature-content">
              <h3>Tiết kiệm thời gian</h3>
              <p>
                Đặt lịch hẹn trực tuyến, ít phải chờ đợi và thủ tục nhanh chóng,
                tiện lợi mọi lúc mọi nơi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section className="doctors">
        <div className="section-title">
          <h2>Đội ngũ bác sĩ</h2>
          <p>
            Gặp gỡ đội ngũ y bác sĩ tận tâm và giàu kinh nghiệm của chúng tôi
          </p>
        </div>
        <div className="doctors-grid">
          <div className="doctor-card">
            <div className="doctor-image">
              <img
                src="https://umcclinic.com.vn/Data/Sites/1/News/224/bsnguyenvanthai.jpg"
                alt="Bác sĩ Nguyễn Văn Thái"
              />
            </div>
            <div className="doctor-info">
              <h3>BS. Nguyễn Văn Thái</h3>
              <div className="doctor-specialty">Chuyên khoa Tim mạch</div>
              <p>
                Với hơn 15 năm kinh nghiệm trong lĩnh vực tim mạch, từng công
                tác tại nhiều bệnh viện lớn.
              </p>
            </div>
          </div>
          <div className="doctor-card">
            <div className="doctor-image">
              <img
                src="https://umcclinic.com.vn/Data/Sites/1/News/221/bshothiminhtam.jpg"
                alt="Bác sĩ Hồ Thị Minh Tâm"
              />
            </div>
            <div className="doctor-info">
              <h3>BS. Hồ Thị Minh Tâm</h3>
              <div className="doctor-specialty">Chuyên khoa Nhi</div>
              <p>
                Chuyên gia với hơn 12 năm kinh nghiệm trong nhi khoa, được đào
                tạo chuyên sâu tại nước ngoài.
              </p>
            </div>
          </div>
          <div className="doctor-card">
            <div className="doctor-image">
              <img
                src="https://umcclinic.com.vn/Data/Sites/1/News/223/bsnguyenthanhlong.jpg"
                alt="Bác sĩ Nguyễn Thành Long"
              />
            </div>
            <div className="doctor-info">
              <h3>BS. Nguyễn Thành Long</h3>
              <div className="doctor-specialty">Chuyên khoa Thần kinh</div>
              <p>
                Chuyên gia đầu ngành trong lĩnh vực thần kinh học, có nhiều
                nghiên cứu được công bố quốc tế.
              </p>
            </div>
          </div>
          <div className="doctor-card">
            <div className="doctor-image">
              <img
                src="https://umcclinic.com.vn/Data/Sites/1/News/222/bsletranphuong.jpg"
                alt="Bác sĩ Lê Trần Phương"
              />
            </div>
            <div className="doctor-info">
              <h3>BS. Lê Trần Phương</h3>
              <div className="doctor-specialty">Chuyên khoa Răng Hàm Mặt</div>
              <p>
                Chuyên gia với nhiều năm kinh nghiệm trong nha khoa thẩm mỹ,
                được nhiều khách hàng tin tưởng.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
