import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../../css/RegisterPatient.css";

const RegisterClinic = () => {
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const patient = location.state?.patient;

  const [formData, setFormData] = useState({
    fullname: patient?.full_name || "",
    email: patient?.email || "",
    birthdate: patient?.dob || "",
    phone: patient?.phone || "",
    gender: patient?.gender || "",
    address: patient?.address || "",
    department: patient?.department || "",
    appointmentDate: patient?.appointment_date || "",
    appointmentTime: patient?.appointment_time || "",
    symptoms: patient?.symptoms || "",
    doctorId: patient?.doctor_id || "",
  });

  // Kiểm tra đăng nhập
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token || !user.username) {
      navigate("/login", { state: { from: "/register-patient" } });
    }
  }, [navigate]);

  // Lấy danh sách khoa
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/departments", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setDepartments(res.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách khoa:", error);
      }
    };
    fetchDepartments();
  }, []);

  // Lấy danh sách bác sĩ theo khoa
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const params = {};
        if (formData.department) params.department = formData.department;
        const res = await axios.get("http://localhost:8080/api/doctors", {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          timeout: 10000,
        });
        setDoctors(res.data || []);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách bác sĩ:", err);
      }
    };
    fetchDoctors();
  }, [formData.department]);

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
    if (!formData.appointmentDate)
      newErrors.appointmentDate = "Ngày khám là bắt buộc";
    if (!formData.appointmentTime)
      newErrors.appointmentTime = "Buổi khám là bắt buộc";
    if (!formData.doctorId) newErrors.doctorId = "Vui lòng chọn bác sĩ";

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

    if (id === "department") {
      const dept = departments.find((d) => d.departmentName === value);
      setSelectedDepartment(dept || null);
    }

    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    console.log("🔍 Frontend - FormData:", formData);

    if (!token || !user.username) {
      alert("Bạn cần đăng nhập để đăng ký!");
      navigate("/login", { state: { from: "/register-patient" } });
      return;
    }

    setIsSubmitting(true);

    try {
      // SỬA QUAN TRỌNG: Dùng camelCase thay vì snake_case
      const payload = {
        fullName: formData.fullname, // Đổi full_name -> fullName
        dob: new Date(formData.birthdate).toISOString().split("T")[0],
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        department: formData.department,
        appointmentDate: formData.appointmentDate, // Đổi appointment_date -> appointmentDate
        appointmentTime: formData.appointmentTime, // Đổi appointment_time -> appointmentTime
        symptoms: formData.symptoms || null,
        doctorId: formData.doctorId || null, // Đổi doctor_id -> doctorId
      };

      console.log("📤 Frontend - Payload being sent:", payload);

      const res = await axios.post(
        "http://localhost:8080/api/patient-registrations",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );

      console.log("✅ Backend response:", res.data);
      alert("Đăng ký thành công! Thông tin đã được lưu vào hệ thống.");

      navigate("/payment", {
        state: {
          patientId: res.data.id,
          amount: 200000,
          fullname: formData.fullname,
          phone: formData.phone,
        },
      });

      // Reset form
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
        doctorId: "",
      });
    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      if (err.response) {
        const { status, data } = err.response;
        console.error("Backend error response:", data);

        if ([400, 422].includes(status)) {
          alert(
            `Dữ liệu không hợp lệ: ${
              typeof data === "string" ? data : JSON.stringify(data)
            }`
          );
        } else if (status === 401) {
          alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
          navigate("/login", { state: { from: "/register-patient" } });
        } else if (status === 500) {
          alert("Lỗi server. Vui lòng thử lại sau.");
        } else {
          alert(`Có lỗi xảy ra: ${status} - ${JSON.stringify(data)}`);
        }
      } else if (err.request) {
        alert(
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và backend."
        );
      } else {
        alert("Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMinAppointmentDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <div className="clinic-registration-container">
      <div className="clinic-registration-card">
        <h1 className="clinic-registration-title">ĐĂNG KÝ KHÁM</h1>

        <div className="clinic-notice-box">
          <h3 className="clinic-notice-title">Lưu ý:</h3>
          <p>
            Lịch hẹn có hiệu lực sau khi có xác nhận chính thức từ Phòng khám.
          </p>
          <p>Vui lòng cung cấp thông tin chính xác để được phục vụ tốt nhất.</p>
          <p>Đặt lịch trước ít nhất 24 giờ.</p>
        </div>

        <div className="clinic-form-section">
          <h2 className="clinic-form-title">Thông tin bệnh nhân</h2>
          <form onSubmit={handleSubmit} className="clinic-form">
            <div className="clinic-form-grid">
              {/* Họ tên */}
              <div className="clinic-form-group">
                <label htmlFor="fullname">Họ và tên *</label>
                <input
                  id="fullname"
                  type="text"
                  value={formData.fullname}
                  onChange={handleChange}
                  className={`clinic-form-input ${
                    errors.fullname ? "error" : ""
                  }`}
                  placeholder="Nhập họ và tên đầy đủ"
                />
                {errors.fullname && (
                  <span className="clinic-error-message">
                    {errors.fullname}
                  </span>
                )}
              </div>

              {/* Email */}
              <div className="clinic-form-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`clinic-form-input ${errors.email ? "error" : ""}`}
                  placeholder="example@email.com"
                />
                {errors.email && (
                  <span className="clinic-error-message">{errors.email}</span>
                )}
              </div>

              {/* Ngày sinh */}
              <div className="clinic-form-group">
                <label htmlFor="birthdate">Ngày sinh *</label>
                <input
                  id="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={handleChange}
                  className={`clinic-form-input ${
                    errors.birthdate ? "error" : ""
                  }`}
                  max={new Date().toISOString().split("T")[0]}
                />
                {errors.birthdate && (
                  <span className="clinic-error-message">
                    {errors.birthdate}
                  </span>
                )}
              </div>

              {/* Số điện thoại */}
              <div className="clinic-form-group">
                <label htmlFor="phone">Số điện thoại *</label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`clinic-form-input ${errors.phone ? "error" : ""}`}
                  placeholder="0901234567"
                />
                {errors.phone && (
                  <span className="clinic-error-message">{errors.phone}</span>
                )}
              </div>

              {/* Giới tính */}
              <div className="clinic-form-group">
                <label htmlFor="gender">Giới tính *</label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`clinic-form-input ${
                    errors.gender ? "error" : ""
                  }`}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
                {errors.gender && (
                  <span className="clinic-error-message">{errors.gender}</span>
                )}
              </div>

              {/* Địa chỉ */}
              <div className="clinic-form-group">
                <label htmlFor="address">Địa chỉ *</label>
                <input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  className={`clinic-form-input ${
                    errors.address ? "error" : ""
                  }`}
                  placeholder="Nhập địa chỉ đầy đủ"
                />
                {errors.address && (
                  <span className="clinic-error-message">{errors.address}</span>
                )}
              </div>

              {/* Chuyên khoa */}
              <div className="clinic-form-group full-width">
                <label htmlFor="department">Chuyên khoa *</label>
                <select
                  id="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`clinic-form-input ${
                    errors.department ? "error" : ""
                  }`}
                >
                  <option value="">-- Chọn khoa --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.departmentName}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
                {selectedDepartment && (
                  <div className="department-description">
                    <strong>Mô tả:</strong>
                    <p>{selectedDepartment.description}</p>
                  </div>
                )}
                {errors.department && (
                  <span className="clinic-error-message">
                    {errors.department}
                  </span>
                )}
              </div>

              {/* Bác sĩ */}
              <div className="clinic-form-group">
                <label htmlFor="doctorId">Chọn bác sĩ *</label>
                <select
                  id="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  className={`clinic-form-input ${
                    errors.doctorId ? "error" : ""
                  }`}
                >
                  <option value="">Chọn bác sĩ</option>
                  {doctors.map((d) => {
                    const info = [d.fullName, d.degree, d.position]
                      .filter(Boolean)
                      .join(" - ");

                    return (
                      <option key={d.id} value={d.id}>
                        {info}
                      </option>
                    );
                  })}
                </select>

                {errors.doctorId && (
                  <span className="clinic-error-message">
                    {errors.doctorId}
                  </span>
                )}
              </div>

              {/* Ngày khám */}
              <div className="clinic-form-group">
                <label htmlFor="appointmentDate">Ngày khám *</label>
                <input
                  id="appointmentDate"
                  type="date"
                  min={getMinAppointmentDate()}
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  className={`clinic-form-input ${
                    errors.appointmentDate ? "error" : ""
                  }`}
                />
                {errors.appointmentDate && (
                  <span className="clinic-error-message">
                    {errors.appointmentDate}
                  </span>
                )}
              </div>

              {/* Buổi khám */}
              <div className="clinic-form-group">
                <label htmlFor="appointmentTime">Buổi khám *</label>
                <select
                  id="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleChange}
                  className={`clinic-form-input ${
                    errors.appointmentTime ? "error" : ""
                  }`}
                >
                  <option value="">Chọn buổi khám</option>
                  <option value="Sáng (8h - 11h30)">Sáng (8h - 11h30)</option>
                  <option value="Chiều (13h - 16h30)">
                    Chiều (13h - 16h30)
                  </option>
                  <option value="Tối (17h - 20h)">Tối (17h - 20h)</option>
                </select>
                {errors.appointmentTime && (
                  <span className="clinic-error-message">
                    {errors.appointmentTime}
                  </span>
                )}
              </div>

              {/* Triệu chứng */}
              <div className="clinic-form-group full-width">
                <label htmlFor="symptoms">Triệu chứng</label>
                <textarea
                  id="symptoms"
                  value={formData.symptoms}
                  onChange={handleChange}
                  placeholder="Mô tả triệu chứng của bạn (nếu có)..."
                  rows="3"
                  className="clinic-form-textarea"
                />
              </div>
            </div>

            <div className="clinic-form-submit">
              <button
                type="submit"
                className={`clinic-submit-button ${
                  isSubmitting ? "submitting" : ""
                }`}
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
