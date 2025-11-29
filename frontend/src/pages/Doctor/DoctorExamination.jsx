import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../css/DoctorExamination.css";

const DoctorExamination = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    chiefComplaint: "",
    historyOfIllness: "",
    physicalExamination: "",
    vitalSigns: {
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      respiratoryRate: "",
      height: "",
      weight: "",
    },
    preliminaryDiagnosis: "",
    finalDiagnosis: "",
    treatmentPlan: "",
    medications: [],
    labTests: [],
    advice: "",
    followUpDate: "",
    followUpNotes: "",
  });

  // Lấy thông tin khám bệnh
  useEffect(() => {
    const fetchExaminationData = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem("user"));

        const response = await fetch(
          `http://localhost:8080/api/doctor/medical-records/${appointmentId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Không thể tải thông tin khám bệnh");
        }

        const result = await response.json();

        if (result.success) {
          setAppointment(result.appointment);
          setMedicalRecord(result.medicalRecord);

          // Nếu có medical record, điền dữ liệu vào form
          if (result.medicalRecord) {
            setFormData({
              chiefComplaint: result.medicalRecord.chiefComplaint || "",
              historyOfIllness: result.medicalRecord.historyOfIllness || "",
              physicalExamination:
                result.medicalRecord.physicalExamination || "",
              vitalSigns: {
                bloodPressure:
                  result.medicalRecord.vitalSigns?.bloodPressure || "",
                heartRate: result.medicalRecord.vitalSigns?.heartRate || "",
                temperature: result.medicalRecord.vitalSigns?.temperature || "",
                respiratoryRate:
                  result.medicalRecord.vitalSigns?.respiratoryRate || "",
                height: result.medicalRecord.vitalSigns?.height || "",
                weight: result.medicalRecord.vitalSigns?.weight || "",
              },
              preliminaryDiagnosis:
                result.medicalRecord.preliminaryDiagnosis || "",
              finalDiagnosis: result.medicalRecord.finalDiagnosis || "",
              treatmentPlan: result.medicalRecord.treatmentPlan || "",
              medications: result.medicalRecord.medications || [],
              labTests: result.medicalRecord.labTests || [],
              advice: result.medicalRecord.advice || "",
              followUpDate: result.medicalRecord.followUpDate || "",
              followUpNotes: result.medicalRecord.followUpNotes || "",
            });
          }
        } else {
          throw new Error(
            result.message || "Không tìm thấy thông tin khám bệnh"
          );
        }
      } catch (err) {
        console.error("❌ Lỗi tải thông tin khám:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExaminationData();
  }, [appointmentId]);

  // Xử lý thay đổi form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Xử lý thay đổi vital signs
  const handleVitalSignsChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      vitalSigns: {
        ...prev.vitalSigns,
        [name]: value,
      },
    }));
  };

  // NÚT DUY NHẤT: Lưu kết quả và hoàn thành khám
  const handleSaveAndComplete = async () => {
    if (
      !window.confirm(
        "Xác nhận lưu kết quả khám và hoàn thành? Sau khi hoàn thành không thể sửa đổi."
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      const user = JSON.parse(localStorage.getItem("user"));

      // Chuẩn bị dữ liệu medical record
      const medicalRecordData = {
        appointmentId: parseInt(appointmentId),
        doctorId: appointment.doctorId,
        chiefComplaint: formData.chiefComplaint,
        historyOfIllness: formData.historyOfIllness,
        physicalExamination: formData.physicalExamination,
        vitalSigns: JSON.stringify(formData.vitalSigns),
        preliminaryDiagnosis: formData.preliminaryDiagnosis,
        finalDiagnosis: formData.finalDiagnosis,
        treatmentPlan: formData.treatmentPlan,
        medications: JSON.stringify(formData.medications),
        labTests: JSON.stringify(formData.labTests),
        advice: formData.advice,
        followUpDate: formData.followUpDate,
        followUpNotes: formData.followUpNotes,
        examinationStatus: "COMPLETED", // Trực tiếp set thành COMPLETED
      };

      console.log("📤 Gửi dữ liệu medical record:", medicalRecordData);

      // Gọi API để lưu medical record với trạng thái COMPLETED
      const response = await fetch(
        `http://localhost:8080/api/doctor/medical-records/${appointmentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(medicalRecordData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Lỗi response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("📥 Kết quả lưu medical record:", result);

      if (result.success) {
        alert("✅ Đã lưu kết quả khám và hoàn thành!");
        navigate("/doctor/appointments");
      } else {
        throw new Error(result.message || "Lỗi khi lưu kết quả khám");
      }
    } catch (err) {
      console.error("❌ Lỗi lưu và hoàn thành khám:", err);

      // Hiển thị thông báo lỗi chi tiết
      if (err.message.includes("Query did not return a unique result")) {
        alert(
          "❌ Lỗi: Có nhiều hồ sơ khám cho lịch hẹn này. Vui lòng liên hệ quản trị viên."
        );
      } else {
        alert(`❌ Lỗi: ${err.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="doctor-examination-container">
        <div className="examination-content-wrapper">
          <div className="examination-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải thông tin khám bệnh...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doctor-examination-container">
        <div className="examination-content-wrapper">
          <div className="examination-error">
            <div className="error-icon">❌</div>
            <h3>Lỗi</h3>
            <p>{error}</p>
            <button onClick={() => navigate("/doctor/appointments")}>
              ← Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-examination-container">
      <div className="examination-content-wrapper">
        {/* Header */}
        <div className="examination-header">
          <button
            className="btn-back"
            onClick={() => navigate("/doctor/appointments")}
          >
            ← Quay lại
          </button>
          <h1>🩺 Khám Bệnh</h1>
          <div className="patient-info-header">
            <h2>{appointment?.fullName}</h2>
            <div className="patient-meta">
              <span>Mã BN: {appointment?.registrationNumber}</span>
              <span>Số thứ tự: #{appointment?.queueNumber}</span>
              <span>Phòng: {appointment?.roomNumber}</span>
              {medicalRecord && (
                <span
                  className={`status-${medicalRecord.examinationStatus?.toLowerCase()}`}
                >
                  Trạng thái:{" "}
                  {medicalRecord.examinationStatus === "COMPLETED"
                    ? "ĐÃ HOÀN THÀNH"
                    : "ĐANG KHÁM"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Thông tin bệnh nhân */}
        <div className="patient-info-card">
          <h3>📋 Thông Tin Bệnh Nhân</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Tuổi:</label>
              <span>
                {appointment?.dob
                  ? new Date().getFullYear() -
                    new Date(appointment.dob).getFullYear() +
                    " tuổi"
                  : "Chưa có"}
              </span>
            </div>
            <div className="info-item">
              <label>Giới tính:</label>
              <span>{appointment?.gender}</span>
            </div>
            <div className="info-item">
              <label>SĐT:</label>
              <span>{appointment?.phone}</span>
            </div>
            <div className="info-item">
              <label>Triệu chứng:</label>
              <span className="symptoms">
                {appointment?.symptoms || "Chưa có"}
              </span>
            </div>
          </div>
        </div>

        {/* Form khám bệnh */}
        <div className="examination-form">
          {/* Lý Do Khám & Tiền Sử */}
          <div className="form-section">
            <h3>📝 Lý Do Khám & Tiền Sử</h3>
            <div className="form-group">
              <label>Lý do khám chính:</label>
              <textarea
                name="chiefComplaint"
                value={formData.chiefComplaint}
                onChange={handleInputChange}
                placeholder="Mô tả lý do khám chính..."
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Tiền sử bệnh:</label>
              <textarea
                name="historyOfIllness"
                value={formData.historyOfIllness}
                onChange={handleInputChange}
                placeholder="Mô tả tiền sử bệnh..."
                rows="3"
              />
            </div>
          </div>

          {/* Dấu Hiệu Sinh Tồn */}
          <div className="form-section">
            <h3>📊 Dấu Hiệu Sinh Tồn</h3>
            <div className="vital-signs-grid">
              <div className="form-group">
                <label>Huyết áp (mmHg):</label>
                <input
                  type="text"
                  name="bloodPressure"
                  value={formData.vitalSigns.bloodPressure}
                  onChange={handleVitalSignsChange}
                  placeholder="120/80"
                />
              </div>
              <div className="form-group">
                <label>Nhịp tim (bpm):</label>
                <input
                  type="number"
                  name="heartRate"
                  value={formData.vitalSigns.heartRate}
                  onChange={handleVitalSignsChange}
                  placeholder="72"
                />
              </div>
              <div className="form-group">
                <label>Nhiệt độ (°C):</label>
                <input
                  type="number"
                  name="temperature"
                  value={formData.vitalSigns.temperature}
                  onChange={handleVitalSignsChange}
                  placeholder="37.0"
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Nhịp thở (lần/phút):</label>
                <input
                  type="number"
                  name="respiratoryRate"
                  value={formData.vitalSigns.respiratoryRate}
                  onChange={handleVitalSignsChange}
                  placeholder="16"
                />
              </div>
              <div className="form-group">
                <label>Chiều cao (cm):</label>
                <input
                  type="number"
                  name="height"
                  value={formData.vitalSigns.height}
                  onChange={handleVitalSignsChange}
                  placeholder="170"
                />
              </div>
              <div className="form-group">
                <label>Cân nặng (kg):</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.vitalSigns.weight}
                  onChange={handleVitalSignsChange}
                  placeholder="65"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Khám Lâm Sàng */}
          <div className="form-section">
            <h3>🔍 Khám Lâm Sàng</h3>
            <div className="form-group">
              <label>Khám thực thể:</label>
              <textarea
                name="physicalExamination"
                value={formData.physicalExamination}
                onChange={handleInputChange}
                placeholder="Kết quả khám thực thể..."
                rows="4"
              />
            </div>
          </div>

          {/* Chẩn Đoán */}
          <div className="form-section">
            <h3>🏥 Chẩn Đoán</h3>
            <div className="form-group">
              <label>Chẩn đoán sơ bộ:</label>
              <textarea
                name="preliminaryDiagnosis"
                value={formData.preliminaryDiagnosis}
                onChange={handleInputChange}
                placeholder="Chẩn đoán sơ bộ..."
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Chẩn đoán xác định:</label>
              <textarea
                name="finalDiagnosis"
                value={formData.finalDiagnosis}
                onChange={handleInputChange}
                placeholder="Chẩn đoán xác định..."
                rows="3"
              />
            </div>
          </div>

          {/* Điều Trị */}
          <div className="form-section">
            <h3>💊 Điều Trị</h3>
            <div className="form-group">
              <label>Kế hoạch điều trị:</label>
              <textarea
                name="treatmentPlan"
                value={formData.treatmentPlan}
                onChange={handleInputChange}
                placeholder="Kế hoạch điều trị..."
                rows="4"
              />
            </div>
          </div>

          {/* Tư Vấn & Theo Dõi */}
          <div className="form-section">
            <h3>💡 Tư Vấn & Theo Dõi</h3>
            <div className="form-group">
              <label>Lời khuyên:</label>
              <textarea
                name="advice"
                value={formData.advice}
                onChange={handleInputChange}
                placeholder="Lời khuyên cho bệnh nhân..."
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Ngày tái khám:</label>
              <input
                type="date"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Ghi chú tái khám:</label>
              <textarea
                name="followUpNotes"
                value={formData.followUpNotes}
                onChange={handleInputChange}
                placeholder="Ghi chú cho lần tái khám..."
                rows="2"
              />
            </div>
          </div>

          {/* NÚT DUY NHẤT */}
          <div className="examination-actions">
            <button
              className="btn-save-complete"
              onClick={handleSaveAndComplete}
              disabled={saving}
            >
              {saving ? "⏳ Đang xử lý..." : "💾 Lưu & Hoàn thành"}
            </button>
          </div>

          {/* Thông báo lỗi duplicate */}
          {error && error.includes("Query did not return a unique result") && (
            <div
              className="error-message"
              style={{
                background: "#ffeaa7",
                padding: "15px",
                borderRadius: "8px",
                border: "2px solid #fdcb6e",
                marginTop: "20px",
              }}
            >
              <h4>⚠️ Cảnh báo: Lỗi dữ liệu trùng lặp</h4>
              <p>
                Có nhiều hồ sơ khám cho lịch hẹn này. Vui lòng liên hệ quản trị
                viên.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorExamination;
