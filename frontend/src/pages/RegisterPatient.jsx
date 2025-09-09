import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/RegisterPatient.css";

const RegisterClinic = () => {
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const patient = location.state?.patient;

  const [formData, setFormData] = useState({
    fullname: patient?.full_name || "",
    email: patient?.email || "",
    birthdate: patient?.dob || "",
    phone: patient?.phone || "",
    gender: "",
    address: patient?.address || "",
    department: "",
    appointmentDate: "",
    appointmentTime: "",
    symptoms: patient?.symptoms || "",
  });

  

  // Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token || !user.username) {
      navigate("/login", { state: { from: "/register-patient" } });
    }
  }, [navigate]);

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

  
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  
  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!token || !user.username) {
    alert("Bạn cần đăng nhập để đăng ký!");
    navigate("/login", { state: { from: "/register-patient" } });
    return;
  }

  setIsSubmitting(true);

  try {
    const payload = {
    fullName: formData.fullname,
    dob: new Date(formData.birthdate).toISOString().split("T")[0],
    gender: formData.gender,
    phone: formData.phone,
    email: formData.email,
    address: formData.address,
    department: formData.department,
    appointmentDate: formData.appointmentDate,
    appointmentTime: formData.appointmentTime,
    symptoms: formData.symptoms || null,
};

    console.log("Sending payload:", payload);

    const res = await axios.post(
      "http://localhost:8080/api/patient-registrations",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        timeout: 10000,
      }
    );

    alert("Đăng ký thành công! Thông tin đã được lưu vào hệ thống.");
    console.log("Đăng ký thành công:", res.data);

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
      symptoms: "",
    });

  } catch (err) {
    console.error("Lỗi đăng ký:", err);
    if (err.response) {
      const { status, data } = err.response;
      if ([400, 422].includes(status)) {
        alert(`Dữ liệu không hợp lệ: ${data.message || JSON.stringify(data)}`);
      } else if (status === 401) {
        alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        navigate("/login", { state: { from: "/register-patient" } });
      } else if (status === 500) {
        alert("Lỗi server. Vui lòng thử lại sau.");
      } else {
        alert(`Có lỗi xảy ra: ${status} - ${JSON.stringify(data)}`);
      }
    } else if (err.request) {
      alert("Không thể kết nối đến server. Vui lòng kiểm tra backend.");
    } else {
      alert("Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.");
    }
  } finally {
    setIsSubmitting(false);
  }
};


  // Giới hạn ngày đặt lịch từ ngày mai trở đi
  const getMinAppointmentDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  // Render helpers
  const renderInput = (id, label, type = "text", extraProps = {}) => (
    <div className="clinic-form-group">
      <label htmlFor={id} className="clinic-form-label">{label}</label>
      <input
        type={type}
        id={id}
        value={formData[id]}
        onChange={handleChange}
        className={`clinic-form-input ${errors[id] ? "error" : ""}`}
        {...extraProps}
      />
      {errors[id] && <span className="clinic-error-message">{errors[id]}</span>}
    </div>
  );

  const renderSelect = (id, label, options) => (
    <div className="clinic-form-group">
      <label htmlFor={id} className="clinic-form-label">{label}</label>
      <select
        id={id}
        value={formData[id]}
        onChange={handleChange}
        className={`clinic-form-input ${errors[id] ? "error" : ""}`}
      >
        <option value="">Chọn {label.toLowerCase()}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {errors[id] && <span className="clinic-error-message">{errors[id]}</span>}
    </div>
  );

  const renderTextarea = (id, label, placeholder) => (
    <div className="clinic-form-group full-width">
      <label htmlFor={id} className="clinic-form-label">{label}</label>
      <textarea
        id={id}
        value={formData[id]}
        onChange={handleChange}
        className="clinic-form-textarea"
        placeholder={placeholder}
        rows="3"
      />
    </div>
  );

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
              {renderInput("fullname", "Họ và tên *")}
              {renderInput("email", "Email *", "email")}
              {renderInput("birthdate", "Ngày sinh *", "date", { max: new Date().toISOString().split("T")[0] })}
              {renderInput("phone", "Số điện thoại *", "tel")}
              {renderSelect("gender", "Giới tính *", ["Nam", "Nữ", "Khác"])}
              {renderInput("address", "Địa chỉ ")}
              {renderSelect("department", "Chuyên khoa *", ["Tim mạch", "Thần kinh", "Cơ xương khớp", "Nhi khoa", "Da liễu", "Mắt"])}
              {renderInput("appointmentDate", "Ngày khám *", "date", { min: getMinAppointmentDate() })}
              {renderSelect("appointmentTime", "Buổi khám *", ["Sáng (8h - 11h30)", "Chiều (13h - 16h30)", "Tối (17h - 20h)"])}
              {renderTextarea("symptoms", "Triệu chứng", "Mô tả triệu chứng")}
            </div>

            <div className="clinic-form-submit">
              <button
                type="submit"
                className={`clinic-submit-button ${isSubmitting ? "submitting" : ""}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang xử lý..." : "Đăng ký lịch hẹn"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterClinic;
