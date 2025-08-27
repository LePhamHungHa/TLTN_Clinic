import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import '../css/RegisterPatient.css';

const RegisterClinic = () => {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    birthdate: "",
    phone: "",
    gender: "",
    address: "",
    department: "",
    appointmentDate: "",
    appointmentTime: "",
    symptoms: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullname.trim()) newErrors.fullname = "Họ và tên là bắt buộc";
    if (!formData.email.trim()) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    if (!formData.birthdate) newErrors.birthdate = "Ngày sinh là bắt buộc";
    if (!formData.phone.trim()) {
      newErrors.phone = "Số điện thoại là bắt buộc";
    } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }
    if (!formData.gender) newErrors.gender = "Giới tính là bắt buộc";
    if (!formData.address.trim()) newErrors.address = "Địa chỉ là bắt buộc";
    if (!formData.department) newErrors.department = "Chuyên khoa là bắt buộc";
    if (!formData.appointmentDate) newErrors.appointmentDate = "Ngày khám là bắt buộc";
    if (!formData.appointmentTime) newErrors.appointmentTime = "Buổi khám là bắt buộc";
    
    // Ngày khám không được là quá khứ
    if (formData.appointmentDate) {
      const today = new Date();
      const appointmentDate = new Date(formData.appointmentDate);
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        newErrors.appointmentDate = "Ngày khám không thể là ngày trong quá khứ";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Xử lý nhập form
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    
    if (errors[id]) {
      setErrors({ ...errors, [id]: "" });
    }
  };

  // Gửi dữ liệu
  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  const token = localStorage.getItem("token");
if (!token) {
  alert("Bạn cần đăng nhập trước khi đăng ký khám!");
  navigate("/login", { state: { from: "/register-patient" } }); 
  return;
}

  setIsSubmitting(true);

  try {
    const payload = {
      ...formData,
      dob: new Date(formData.birthdate).toISOString().split("T")[0] // gửi về cột `dob` trong CSDL
    };

    const res = await axios.post(
      "http://localhost:5000/api/patients/register",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Đăng ký thành công:", res.data);
    alert("Đăng ký thành công! Bạn sẽ nhận được email xác nhận.");

    setFormData({
      fullname: "",
      email: "",
      birthdate: "",
      phone: "",
      gender: "",
      address: "",
      department: "",
      appointmentDate: "",
      appointmentTime: "",
      symptoms: ""
    });

  } catch (err) {
    console.error("Lỗi đăng ký:", err);
    alert("Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.");
  } finally {
    setIsSubmitting(false);
  }
};

  // Ngày tối thiểu cho lịch hẹn (ngày mai)
  const getMinAppointmentDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="clinic-registration-container">
      <div className="clinic-registration-card">
        <h1 className="clinic-registration-title">ĐĂNG KÝ KHÁM</h1>
        
        <div className="clinic-notice-box">
          <h3 className="clinic-notice-title">Lưu ý:</h3>
          <p>Lịch hẹn có hiệu lực sau khi có xác nhận chính thức từ Phòng khám.</p>
          <p>Quý khách vui lòng cung cấp thông tin chính xác để được phục vụ tốt nhất.</p>
          <p>Vui lòng đặt lịch trước ít nhất 24 giờ.</p>
          <p>Trong trường hợp khẩn cấp, hãy đến trực tiếp phòng khám hoặc bệnh viện gần nhất.</p>
        </div>

        <div className="clinic-form-section">
          <h2 className="clinic-form-title">ĐĂNG KÝ KHÁM</h2>
          <form onSubmit={handleSubmit} className="clinic-form">
            <div className="clinic-form-grid">
              
              {/* Họ tên */}
              <div className="clinic-form-group">
                <label htmlFor="fullname" className="clinic-form-label">Họ và tên *</label>
                <input
                  type="text"
                  id="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  className={`clinic-form-input ${errors.fullname ? 'error' : ''}`}
                />
                {errors.fullname && <span className="clinic-error-message">{errors.fullname}</span>}
              </div>

              {/* Email */}
              <div className="clinic-form-group">
                <label htmlFor="email" className="clinic-form-label">Email *</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`clinic-form-input ${errors.email ? 'error' : ''}`}
                />
                {errors.email && <span className="clinic-error-message">{errors.email}</span>}
              </div>

              {/* Ngày sinh */}
              <div className="clinic-form-group">
                <label htmlFor="birthdate" className="clinic-form-label">Ngày sinh *</label>
                <input
                  type="date"
                  id="birthdate"
                  value={formData.birthdate}
                  onChange={handleChange}
                  className={`clinic-form-input ${errors.birthdate ? 'error' : ''}`}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.birthdate && <span className="clinic-error-message">{errors.birthdate}</span>}
              </div>

              {/* Số điện thoại */}
              <div className="clinic-form-group">
                <label htmlFor="phone" className="clinic-form-label">Số điện thoại *</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`clinic-form-input ${errors.phone ? 'error' : ''}`}
                />
                {errors.phone && <span className="clinic-error-message">{errors.phone}</span>}
              </div>

              {/* Giới tính */}
              <div className="clinic-form-group">
                <label htmlFor="gender" className="clinic-form-label">Giới tính *</label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`clinic-form-input ${errors.gender ? 'error' : ''}`}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
                {errors.gender && <span className="clinic-error-message">{errors.gender}</span>}
              </div>

              {/* Địa chỉ */}
              <div className="clinic-form-group">
                <label htmlFor="address" className="clinic-form-label">Địa chỉ *</label>
                <input
                  type="text"
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`clinic-form-input ${errors.address ? 'error' : ''}`}
                />
                {errors.address && <span className="clinic-error-message">{errors.address}</span>}
              </div>

              {/* Chuyên khoa */}
              <div className="clinic-form-group">
                <label htmlFor="department" className="clinic-form-label">Chuyên khoa *</label>
                <select
                  id="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`clinic-form-input ${errors.department ? 'error' : ''}`}
                >
                  <option value="">Chọn chuyên khoa</option>
                  <option value="Tim mạch">Tim mạch</option>
                  <option value="Thần kinh">Thần kinh</option>
                  <option value="Cơ xương khớp">Cơ xương khớp</option>
                  <option value="Nhi khoa">Nhi khoa</option>
                  <option value="Da liễu">Da liễu</option>
                  <option value="Mắt">Mắt</option>
                </select>
                {errors.department && <span className="clinic-error-message">{errors.department}</span>}
              </div>

              {/* Ngày khám */}
              <div className="clinic-form-group">
                <label htmlFor="appointmentDate" className="clinic-form-label">Ngày khám *</label>
                <input
                  type="date"
                  id="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  className={`clinic-form-input ${errors.appointmentDate ? 'error' : ''}`}
                  min={getMinAppointmentDate()}
                />
                {errors.appointmentDate && <span className="clinic-error-message">{errors.appointmentDate}</span>}
              </div>

              {/* Buổi khám */}
              <div className="clinic-form-group">
                <label htmlFor="appointmentTime" className="clinic-form-label">Buổi khám *</label>
                <select
                  id="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleChange}
                  className={`clinic-form-input ${errors.appointmentTime ? 'error' : ''}`}
                >
                  <option value="">Chọn buổi khám</option>
                  <option value="Sáng">Sáng (8h - 11h30)</option>
                  <option value="Chiều">Chiều (13h - 16h30)</option>
                  <option value="Tối">Tối (17h - 20h)</option>
                </select>
                {errors.appointmentTime && <span className="clinic-error-message">{errors.appointmentTime}</span>}
              </div>

              {/* Triệu chứng */}
              <div className="clinic-form-group full-width">
                <label htmlFor="symptoms" className="clinic-form-label">Triệu chứng</label>
                <textarea
                  id="symptoms"
                  value={formData.symptoms}
                  onChange={handleChange}
                  className="clinic-form-textarea"
                  placeholder="Mô tả triệu chứng"
                  rows="3"
                />
              </div>
            </div>

            <div className="clinic-form-submit">
              <button 
                type="submit" 
                className={`clinic-submit-button ${isSubmitting ? 'submitting' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Đăng ký lịch hẹn'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterClinic;
