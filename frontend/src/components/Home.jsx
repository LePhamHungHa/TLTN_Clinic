import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/Home.css";
import {
  FaStethoscope,
  FaUserMd,
  FaHeartbeat,
  FaBrain,
  FaBaby,
  FaTooth,
  FaCalendarCheck,
  FaClock,
  FaAmbulance,
  FaShieldAlt,
  FaArrowRight,
  FaStar,
  FaUsers,
  FaAward,
  FaHospital,
  FaMobileAlt,
  FaCheckCircle,
} from "react-icons/fa";
import {
  MdHealthAndSafety,
  MdLocalHospital,
  MdVerified,
  MdAccessTime,
} from "react-icons/md";

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

  const specialties = [
    {
      icon: <FaHeartbeat />,
      title: "TIM MẠCH",
      desc: "Khám & điều trị bệnh tim",
    },
    { icon: <FaBrain />, title: "THẦN KINH", desc: "Chuyên khoa thần kinh" },
    { icon: <FaBaby />, title: "NHI KHOA", desc: "Chăm sóc trẻ em" },
    { icon: <FaTooth />, title: "RĂNG HÀM MẶT", desc: "Nha khoa thẩm mỹ" },
    {
      icon: <MdLocalHospital />,
      title: "SẢN PHỤ KHOA",
      desc: "Chăm sóc phụ nữ",
    },
    { icon: <FaStethoscope />, title: "NỘI TỔNG QUÁT", desc: "Khám tổng quát" },
  ];

  const services = [
    {
      icon: <FaCalendarCheck />,
      title: "ĐẶT LỊCH ONLINE",
      desc: "Đặt lịch khám 24/7, không cần chờ đợi",
      color: "#3B82F6",
    },
    {
      icon: <FaUserMd />,
      title: "TƯ VẤN TỪ XA",
      desc: "Bác sĩ tư vấn qua video call",
      color: "#10B981",
    },
    {
      icon: <FaAmbulance />,
      title: "CẤP CỨU 24/7",
      desc: "Hỗ trợ khẩn cấp mọi lúc",
      color: "#EF4444",
    },
    {
      icon: <MdHealthAndSafety />,
      title: "KHÁM TỔNG QUÁT",
      desc: "Gói khám sức khỏe toàn diện",
      color: "#8B5CF6",
    },
  ];

  const doctors = [
    {
      image:
        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop",
      name: "BS. Nguyễn Văn Thái",
      specialty: "Chuyên khoa Tim mạch",
      experience: "15 năm",
      rating: 4.9,
    },
    {
      image:
        "https://images.unsplash.com/photo-1594824434340-7e7dfc37cabb?w=400&h=400&fit=crop",
      name: "BS. Hồ Thị Minh Tâm",
      specialty: "Chuyên khoa Nhi",
      experience: "12 năm",
      rating: 4.8,
    },
    {
      image:
        "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w-400&h=400&fit=crop",
      name: "BS. Nguyễn Thành Long",
      specialty: "Chuyên khoa Thần kinh",
      experience: "10 năm",
      rating: 4.9,
    },
    {
      image:
        "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w-400&h=400&fit=crop",
      name: "BS. Lê Trần Phương",
      specialty: "Chuyên khoa Răng Hàm Mặt",
      experience: "8 năm",
      rating: 4.7,
    },
  ];

  const features = [
    {
      icon: <FaShieldAlt />,
      title: "AN TOÀN TUYỆT ĐỐI",
      desc: "Tuân thủ nghiêm ngặt quy trình kiểm soát nhiễm khuẩn",
    },
    {
      icon: <MdVerified />,
      title: "CHẤT LƯỢNG QUỐC TẾ",
      desc: "Trang thiết bị hiện đại, đạt chuẩn JCI",
    },
    {
      icon: <FaUsers />,
      title: "ĐỘI NGŨ CHUYÊN GIA",
      desc: "Bác sĩ đầu ngành, nhiều năm kinh nghiệm",
    },
    {
      icon: <FaClock />,
      title: "TIẾT KIỆM THỜI GIAN",
      desc: "Thủ tục đơn giản, ít phải chờ đợi",
    },
  ];

  const steps = [
    { number: "01", title: "ĐẶT LỊCH", desc: "Chọn dịch vụ & bác sĩ" },
    { number: "02", title: "KHÁM BỆNH", desc: "Khám trực tiếp với bác sĩ" },
    { number: "03", title: "CHẨN ĐOÁN", desc: "Nhận kết quả & tư vấn" },
    { number: "04", title: "THEO DÕI", desc: "Hỗ trợ sau khám 24/7" },
  ];

  return (
    <div className="home-container">
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-overlay">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                <span className="highlight">SỨC KHỎE</span> LÀ TÀI SẢN QUÝ GIÁ
                NHẤT
              </h1>
              <p className="hero-subtitle">
                Bệnh viện đa khoa quốc tế với đội ngũ chuyên gia hàng đầu, trang
                thiết bị hiện đại và dịch vụ chăm sóc tận tâm
              </p>
              <div className="hero-actions">
                <button
                  className="btn-primary btn-hero"
                  onClick={handleRegisterClick}
                >
                  <FaCalendarCheck className="btn-icon" />
                  <span>ĐẶT LỊCH KHÁM NGAY</span>
                </button>
                <button className="btn-secondary btn-hero">
                  <FaMobileAlt className="btn-icon" />
                  <span>TẢI ỨNG DỤNG</span>
                </button>
              </div>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">5000+</div>
                <div className="stat-label">Bệnh nhân hài lòng</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Bác sĩ chuyên gia</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Hỗ trợ khách hàng</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chuyên Khoa */}
      <section className="specialties-section">
        <div className="section-header">
          <h2 className="section-title">CHUYÊN KHOA NỔI BẬT</h2>
          <p className="section-subtitle">
            Chăm sóc sức khỏe toàn diện với các chuyên khoa hàng đầu
          </p>
        </div>
        <div className="specialties-grid">
          {specialties.map((spec, index) => (
            <div className="specialty-card" key={index}>
              <div className="specialty-icon" style={{ color: spec.color }}>
                {spec.icon}
              </div>
              <h3 className="specialty-title">{spec.title}</h3>
              <p className="specialty-desc">{spec.desc}</p>
              <button className="specialty-btn">
                <span>XEM CHI TIẾT</span>
                <FaArrowRight className="arrow-icon" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Dịch Vụ Nổi Bật */}
      <section className="services-section">
        <div className="section-header">
          <h2 className="section-title">DỊCH VỤ ƯU VIỆT</h2>
          <p className="section-subtitle">
            Trải nghiệm dịch vụ y tế chất lượng cao
          </p>
        </div>
        <div className="services-grid">
          {services.map((service, index) => (
            <div className="service-card" key={index}>
              <div
                className="service-icon-wrapper"
                style={{ backgroundColor: `${service.color}15` }}
              >
                <div className="service-icon" style={{ color: service.color }}>
                  {service.icon}
                </div>
              </div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-desc">{service.desc}</p>
              <div
                className="service-badge"
                style={{ backgroundColor: service.color }}
              >
                <FaCheckCircle className="badge-icon" />
                <span>CÓ SẴN</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quy Trình Khám Bệnh */}
      <section className="process-section">
        <div className="section-header">
          <h2 className="section-title">QUY TRÌNH 4 BƯỚC ĐƠN GIẢN</h2>
          <p className="section-subtitle">
            Khám bệnh nhanh chóng và thuận tiện
          </p>
        </div>
        <div className="process-steps">
          {steps.map((step, index) => (
            <div className="step-item" key={index}>
              <div className="step-number">{step.number}</div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="step-connector">
                  <div className="connector-line"></div>
                  <FaArrowRight className="connector-arrow" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Đội Ngũ Bác Sĩ */}
      <section className="doctors-section">
        <div className="section-header">
          <h2 className="section-title">ĐỘI NGŨ CHUYÊN GIA</h2>
          <p className="section-subtitle">
            Gặp gỡ đội ngũ y bác sĩ tận tâm và giàu kinh nghiệm
          </p>
        </div>
        <div className="doctors-grid">
          {doctors.map((doctor, index) => (
            <div className="doctor-card" key={index}>
              <div className="doctor-image">
                <img src={doctor.image} alt={doctor.name} />
                <div className="doctor-rating">
                  <FaStar className="star-icon" />
                  <span>{doctor.rating}</span>
                </div>
              </div>
              <div className="doctor-info">
                <h3 className="doctor-name">{doctor.name}</h3>
                <div className="doctor-specialty">{doctor.specialty}</div>
                <div className="doctor-experience">
                  <MdAccessTime className="exp-icon" />
                  <span>Kinh nghiệm: {doctor.experience}</span>
                </div>
                <button className="doctor-btn">
                  <span>ĐẶT LỊCH KHÁM</span>
                  <FaArrowRight className="arrow-icon" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lý Do Chọn Chúng Tôi */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">TẠI SAO CHỌN CHÚNG TÔI</h2>
          <p className="section-subtitle">
            Cam kết mang đến trải nghiệm chăm sóc sức khỏe tốt nhất
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div className="feature-card" key={index}>
              <div className="feature-icon-wrapper">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <div className="cta-text">
            <h2 className="cta-title">SẴN SÀNG CHĂM SÓC SỨC KHỎE CỦA BẠN?</h2>
            <p className="cta-subtitle">
              Đặt lịch khám ngay hôm nay để nhận tư vấn từ đội ngũ chuyên gia
              hàng đầu
            </p>
          </div>
          <div className="cta-actions">
            <button
              className="btn-primary btn-cta"
              onClick={handleRegisterClick}
            >
              <FaCalendarCheck className="btn-icon" />
              <span>ĐẶT LỊCH KHÁM</span>
            </button>
            <button className="btn-secondary btn-cta">
              <FaAmbulance className="btn-icon" />
              <span>CẦN CẤP CỨU? GỌI 1900 6923</span>
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="section-header">
          <h2 className="section-title">KHÁCH HÀNG NÓI GÌ</h2>
          <p className="section-subtitle">
            Hàng nghìn bệnh nhân đã tin tưởng lựa chọn chúng tôi
          </p>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-content">
              <FaAward className="award-icon" />
              <p className="testimonial-text">
                "Dịch vụ tuyệt vời, bác sĩ tận tâm. Tôi đã khám ở nhiều nơi
                nhưng đây là nơi tôi cảm thấy hài lòng nhất."
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-info">
                <h4>Anh Nguyễn Văn A</h4>
                <p>Khách hàng thường xuyên</p>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-content">
              <FaHospital className="hospital-icon" />
              <p className="testimonial-text">
                "Trang thiết bị hiện đại, nhân viên chuyên nghiệp. Quy trình
                khám bệnh nhanh chóng, tiết kiệm thời gian."
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-info">
                <h4>Chị Trần Thị B</h4>
                <p>Khám tổng quát định kỳ</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
