import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../../css/RegisterPatient.css";

// Icons cho giao diện bệnh viện
import {
  FaHospital,
  FaStethoscope,
  FaCalendarCheck,
  FaFileMedical,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBirthdayCake,
  FaVenusMars,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { MdHealthAndSafety, MdEmergency } from "react-icons/md";
import { GiMedicines } from "react-icons/gi";

const RegisterClinic = () => {
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);
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
    symptoms: patient?.symptoms || "",
    doctorId: patient?.doctor_id || "",
    timeSlot: patient?.time_slot || "",
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
      if (!formData.department) return;

      try {
        const params = { department: formData.department };
        const res = await axios.get("http://localhost:8080/api/doctors", {
          params,
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          timeout: 10000,
        });
        setDoctors(res.data || []);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách bác sĩ:", err);
      }
    };
    fetchDoctors();
  }, [formData.department]);

  // Lấy danh sách slot khi chọn bác sĩ và ngày
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!formData.doctorId || !formData.appointmentDate) return;

      try {
        const res = await axios.get("http://localhost:8080/api/doctor-slots", {
          params: {
            doctorId: formData.doctorId,
            appointmentDate: formData.appointmentDate,
          },
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setTimeSlots(res.data || []);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách khung giờ:", err);
      }
    };
    fetchTimeSlots();
  }, [formData.doctorId, formData.appointmentDate]);

  // Cập nhật selectedDoctor khi chọn bác sĩ
  useEffect(() => {
    if (formData.doctorId) {
      const doctor = doctors.find((d) => d.id == formData.doctorId);
      setSelectedDoctor(doctor);
    } else {
      setSelectedDoctor(null);
    }
  }, [formData.doctorId, doctors]);

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
      // Reset bác sĩ và khung giờ khi đổi khoa
      setFormData((prev) => ({ ...prev, doctorId: "", timeSlot: "" }));
      setTimeSlots([]);
      setSelectedDoctor(null);
    }

    if (id === "doctorId" || id === "appointmentDate") {
      // Reset khung giờ khi đổi bác sĩ hoặc ngày
      setFormData((prev) => ({ ...prev, timeSlot: "" }));
    }

    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const handleTimeSlotSelect = (slot) => {
    if (slot.currentPatients >= slot.maxPatients) {
      alert("Khung giờ này đã hết slot. Vui lòng chọn khung giờ khác.");
      return;
    }
    setFormData((prev) => ({ ...prev, timeSlot: slot.timeSlot }));
    if (errors.timeSlot) setErrors((prev) => ({ ...prev, timeSlot: "" }));
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
      const payload = {
        fullName: formData.fullname,
        dob: new Date(formData.birthdate).toISOString().split("T")[0],
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        department: formData.department,
        appointmentDate: formData.appointmentDate,
        symptoms: formData.symptoms || null,
        doctorId: formData.doctorId || null,
        timeSlot: formData.timeSlot || null,
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
        },
      );

      console.log("✅ Backend response:", res.data);

      const result = res.data;
      setRegistrationResult(result);

      if (result.status === "APPROVED") {
        setShowPaymentMethod(true);
      } else if (result.status === "NEEDS_MANUAL_REVIEW") {
        if (!formData.doctorId) {
          alert(
            "✅ Đơn của bạn đã được ghi nhận! Chúng tôi sẽ liên hệ với bạn trong vòng 24h để xác nhận lịch hẹn.",
          );
        } else {
          alert(
            "⏳ Đơn của bạn đã được ghi nhận. Hiện tại khung giờ này đã đầy, chúng tôi sẽ xem xét và liên hệ lại với bạn trong vòng 24h.",
          );
        }
        navigate("/appointments");
      } else {
        alert(
          "📝 Đơn của bạn đang được xử lý. Vui lòng kiểm tra email để biết kết quả.",
        );
        navigate("/appointments");
      }
    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      if (err.response) {
        const { status, data } = err.response;
        console.error("Backend error response:", data);

        if ([400, 422].includes(status)) {
          alert(
            `Dữ liệu không hợp lệ: ${
              typeof data === "string" ? data : JSON.stringify(data)
            }`,
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
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và backend.",
        );
      } else {
        alert("Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentMethodSelect = (method) => {
    if (method === "online") {
      navigate("/payment", {
        state: {
          patientRegistrationId: registrationResult.id,
          amount: registrationResult.examinationFee || 150000,
          fullname: formData.fullname,
          phone: formData.phone,
          registrationNumber: registrationResult.registrationNumber,
        },
      });
    } else if (method === "direct") {
      alert(
        `🎉 Đăng ký thành công!\n\n📋 Thông tin lịch hẹn:\n• Số thứ tự: ${registrationResult.queueNumber}\n• Bác sĩ: ${selectedDoctor?.fullName}\n• Phòng: ${selectedDoctor?.roomNumber}\n• Khung giờ: ${formData.timeSlot}\n• Mã phiếu: ${registrationResult.registrationNumber}\n\n💳 Phương thức thanh toán: Thanh toán trực tiếp tại bệnh viện\n\nVui lòng đến trước giờ hẹn 15 phút để làm thủ tục.`,
      );

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
        symptoms: "",
        doctorId: "",
        timeSlot: "",
      });

      setShowPaymentMethod(false);
      setRegistrationResult(null);
      setSelectedDoctor(null);
      setTimeSlots([]);
    }
  };

  const getMinAppointmentDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <div className="clinic-registration-page">
      <div className="medical-bg">
        {[...Array(12)].map((_, i) => (
          <div
            key={`cross-${i}`}
            className="cross"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            <MdHealthAndSafety />
          </div>
        ))}
        {[...Array(8)].map((_, i) => (
          <div
            key={`heart-${i}`}
            className="heart"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            <FaStethoscope />
          </div>
        ))}
      </div>

      <div className="clinic-registration-container">
        <div className="clinic-registration-card">
          {/* Header với logo bệnh viện */}
          <div className="clinic-registration-header">
            <div className="hospital-logo">
              <FaHospital />
            </div>
            <div className="clinic-header-content">
              <h1 className="clinic-registration-title">ĐĂNG KÝ KHÁM BỆNH</h1>
              <p className="clinic-header-subtitle">
                Bệnh viện Đa khoa Medical - Chăm sóc sức khỏe toàn diện
              </p>
            </div>
          </div>

          {/* Thông báo quan trọng */}
          <div className="clinic-notice-box">
            <h3 className="clinic-notice-title">
              <FaFileMedical /> Lưu ý quan trọng:
            </h3>
            <div className="notice-items">
              <div className="notice-item">
                <MdHealthAndSafety />
                <span>
                  Lịch hẹn có hiệu lực sau khi có xác nhận chính thức từ Bệnh
                  viện.
                </span>
              </div>
              <div className="notice-item">
                <FaUser />
                <span>
                  Vui lòng cung cấp thông tin chính xác để được phục vụ tốt
                  nhất.
                </span>
              </div>
              <div className="notice-item">
                <FaCalendarCheck />
                <span>Đặt lịch trước ít nhất 24 giờ.</span>
              </div>
              <div className="notice-item">
                <FaStethoscope />
                <span>Mỗi khung giờ có tối đa 10 bệnh nhân.</span>
              </div>
              <div className="notice-item">
                <MdEmergency />
                <span>
                  Giờ làm việc: 7:00 - 17:00 (Nghỉ trưa: 12:00 - 13:00)
                </span>
              </div>
            </div>
          </div>

          {/* Phần form đăng ký */}
          <div className="clinic-form-section">
            <h2 className="clinic-form-title">
              <FaUser /> Thông tin bệnh nhân
            </h2>

            <form onSubmit={handleSubmit} className="clinic-form">
              <div className="clinic-form-grid">
                {/* Họ và tên */}
                <div className="clinic-form-group">
                  <label className="clinic-form-label" htmlFor="fullname">
                    <FaUser /> Họ và tên *
                  </label>
                  <div className="input-container">
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
                  </div>
                  {errors.fullname && (
                    <span className="clinic-error-message">
                      {errors.fullname}
                    </span>
                  )}
                </div>

                {/* Email */}
                <div className="clinic-form-group">
                  <label className="clinic-form-label" htmlFor="email">
                    <FaEnvelope /> Email *
                  </label>
                  <div className="input-container">
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`clinic-form-input ${
                        errors.email ? "error" : ""
                      }`}
                      placeholder="example@email.com"
                    />
                  </div>
                  {errors.email && (
                    <span className="clinic-error-message">{errors.email}</span>
                  )}
                </div>

                {/* Ngày sinh */}
                <div className="clinic-form-group">
                  <label className="clinic-form-label" htmlFor="birthdate">
                    <FaBirthdayCake /> Ngày sinh *
                  </label>
                  <div className="input-container">
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
                  </div>
                  {errors.birthdate && (
                    <span className="clinic-error-message">
                      {errors.birthdate}
                    </span>
                  )}
                </div>

                {/* Số điện thoại */}
                <div className="clinic-form-group">
                  <label className="clinic-form-label" htmlFor="phone">
                    <FaPhone /> Số điện thoại *
                  </label>
                  <div className="input-container">
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`clinic-form-input ${
                        errors.phone ? "error" : ""
                      }`}
                      placeholder="0901234567"
                    />
                  </div>
                  {errors.phone && (
                    <span className="clinic-error-message">{errors.phone}</span>
                  )}
                </div>

                {/* Giới tính */}
                <div className="clinic-form-group">
                  <label className="clinic-form-label" htmlFor="gender">
                    <FaVenusMars /> Giới tính *
                  </label>
                  <div className="input-container">
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
                  </div>
                  {errors.gender && (
                    <span className="clinic-error-message">
                      {errors.gender}
                    </span>
                  )}
                </div>

                {/* Địa chỉ */}
                <div className="clinic-form-group">
                  <label className="clinic-form-label" htmlFor="address">
                    <FaMapMarkerAlt /> Địa chỉ *
                  </label>
                  <div className="input-container">
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
                  </div>
                  {errors.address && (
                    <span className="clinic-error-message">
                      {errors.address}
                    </span>
                  )}
                </div>

                {/* Chuyên khoa */}
                <div className="clinic-form-group full-width">
                  <label className="clinic-form-label" htmlFor="department">
                    <GiMedicines /> Chuyên khoa *
                  </label>
                  <div className="input-container">
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
                  </div>
                  {selectedDepartment && (
                    <div className="department-description">
                      <strong>📝 Mô tả khoa:</strong>
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
                <div className="clinic-form-group full-width">
                  <label className="clinic-form-label" htmlFor="doctorId">
                    <FaStethoscope /> Chọn bác sĩ
                  </label>
                  <div className="input-container">
                    <select
                      id="doctorId"
                      value={formData.doctorId}
                      onChange={handleChange}
                      className="clinic-form-input"
                      disabled={!formData.department}
                    >
                      <option value="">-- Không chọn bác sĩ cụ thể --</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fullName} - {d.degree} - {d.position} -{" "}
                          {d.specialty} - Phòng {d.roomNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Hiển thị thông báo khi không chọn bác sĩ */}
                  {!formData.doctorId && formData.department && (
                    <div className="doctor-selection-info">
                      <p>
                        ℹ️ Bạn có thể chọn bác sĩ khám cho bạn (Bỏ qua nếu bạn
                        không muốn).
                      </p>
                    </div>
                  )}

                  {/* Hiển thị thông tin chi tiết bác sĩ khi chọn */}
                  {selectedDoctor && (
                    <div className="doctor-detail-info">
                      <h4>👨‍⚕️ Thông tin bác sĩ:</h4>
                      <div className="doctor-detail-grid">
                        <div>
                          <strong>Họ tên:</strong> {selectedDoctor.fullName}
                        </div>
                        <div>
                          <strong>Học vị:</strong> {selectedDoctor.degree}
                        </div>
                        <div>
                          <strong>Chức vụ:</strong> {selectedDoctor.position}
                        </div>
                        <div>
                          <strong>Chuyên khoa:</strong>{" "}
                          {selectedDoctor.specialty}
                        </div>
                        <div>
                          <strong>Phòng:</strong> {selectedDoctor.roomNumber}
                        </div>
                        <div>
                          <strong>Tầng:</strong> {selectedDoctor.floor}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ngày khám */}
                <div className="clinic-form-group">
                  <label
                    className="clinic-form-label"
                    htmlFor="appointmentDate"
                  >
                    <FaCalendarCheck /> Ngày khám *
                  </label>
                  <div className="input-container">
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
                  </div>
                  {errors.appointmentDate && (
                    <span className="clinic-error-message">
                      {errors.appointmentDate}
                    </span>
                  )}
                </div>

                {/* Khung giờ - Chỉ hiển thị khi có chọn bác sĩ */}
                {formData.doctorId && (
                  <div className="clinic-form-group full-width">
                    <label className="clinic-form-label">
                      ⏰ Chọn khung giờ khám
                    </label>

                    <div className="time-slots-container">
                      {timeSlots.length > 0 ? (
                        <div className="time-slots-grid">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot.timeSlot}
                              type="button"
                              className={`time-slot-btn ${
                                formData.timeSlot === slot.timeSlot
                                  ? "selected"
                                  : ""
                              } ${
                                slot.currentPatients >= slot.maxPatients
                                  ? "full"
                                  : ""
                              } ${slot.currentPatients >= 8 ? "warning" : ""}`}
                              onClick={() => handleTimeSlotSelect(slot)}
                              disabled={
                                slot.currentPatients >= slot.maxPatients
                              }
                            >
                              <div className="time-slot-time">
                                {slot.timeSlot}
                              </div>
                              <div className="time-slot-info">
                                {slot.currentPatients}/{slot.maxPatients} bệnh
                                nhân
                              </div>
                              {slot.currentPatients >= slot.maxPatients && (
                                <div className="slot-full">HẾT CHỖ</div>
                              )}
                              {slot.currentPatients >= 8 &&
                                slot.currentPatients < 10 && (
                                  <div className="slot-warning">
                                    SẮP HẾT CHỖ
                                  </div>
                                )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        formData.doctorId &&
                        formData.appointmentDate && (
                          <div className="no-slots-message">
                            Đang tải khung giờ...
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Triệu chứng */}
                <div className="clinic-form-group full-width">
                  <label className="clinic-form-label" htmlFor="symptoms">
                    📋 Triệu chứng
                  </label>
                  <div className="input-container">
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
              </div>

              <div className="clinic-form-submit">
                <button
                  type="submit"
                  className={`clinic-submit-button ${
                    isSubmitting ? "submitting" : ""
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="spinner"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    "📅 Đăng ký lịch hẹn"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Popup chọn phương thức thanh toán */}
      {showPaymentMethod && (
        <div className="payment-method-modal">
          <div className="payment-method-content">
            <h3>💳 Chọn phương thức thanh toán</h3>

            <div className="payment-method-options">
              <button
                className="payment-option-btn online-payment"
                onClick={() => handlePaymentMethodSelect("online")}
              >
                <div className="payment-icon">💳</div>
                <div className="payment-info">
                  <h4>Thanh toán Online</h4>
                  <p>Thanh toán ngay qua VNPAY</p>
                </div>
              </button>

              <button
                className="payment-option-btn direct-payment"
                onClick={() => handlePaymentMethodSelect("direct")}
              >
                <div className="payment-icon">🏥</div>
                <div className="payment-info">
                  <h4>Thanh toán trực tiếp</h4>
                  <p>Thanh toán tại bệnh viện khi đến khám</p>
                </div>
              </button>
            </div>

            <div className="registration-summary">
              <h4>📋 Thông tin đăng ký:</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <strong>Họ tên:</strong> {formData.fullname}
                </div>
                <div className="summary-item">
                  <strong>Ngày khám:</strong> {formData.appointmentDate}
                </div>
                <div className="summary-item">
                  <strong>Khung giờ:</strong> {formData.timeSlot}
                </div>
                <div className="summary-item">
                  <strong>Bác sĩ:</strong> {selectedDoctor?.fullName}
                </div>
                <div className="summary-item">
                  <strong>Phòng:</strong> {selectedDoctor?.roomNumber}
                </div>
                <div className="summary-item">
                  <strong>Số thứ tự:</strong> {registrationResult?.queueNumber}
                </div>
                <div className="summary-item">
                  <strong>Mã phiếu:</strong>{" "}
                  {registrationResult?.registrationNumber}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterClinic;
