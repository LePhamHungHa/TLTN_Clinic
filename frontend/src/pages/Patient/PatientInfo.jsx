// src/pages/PatientInfo.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../css/PatientInfo.css";

const PatientInfo = () => {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:8080/api/patients/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPatient(response.data);
      } catch (error) {
        console.error("Lỗi khi tải thông tin bệnh nhân:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatient({ ...patient, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patient || !patient.id) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:8080/api/patients/${patient.id}`,
        patient,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("✅ Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      setMessage("❌ Cập nhật thất bại!");
    }
  };

  if (loading) return <p>Đang tải dữ liệu...</p>;
  if (!patient) return <p>Không tìm thấy thông tin bệnh nhân.</p>;

  return (
    <div className="patient-info-container">
      <h2>Thông tin bệnh nhân</h2>
      {message && <p className="status-message">{message}</p>}

      <form onSubmit={handleSubmit} className="patient-form">
        <div className="form-group">
          <label>Họ và tên</label>
          <input
            type="text"
            name="fullName"
            value={patient.fullName || ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Ngày sinh</label>
          <input
            type="date"
            name="dob"
            value={patient.dob || ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Số điện thoại</label>
          <input
            type="text"
            name="phone"
            value={patient.phone || ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Địa chỉ</label>
          <input
            type="text"
            name="address"
            value={patient.address || ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={patient.email || ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Triệu chứng</label>
          <input
            type="text"
            name="symptoms"
            value={patient.symptoms || ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>BHYT</label>
          <input
            type="text"
            name="bhyt"
            value={patient.bhyt || ""}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="save-btn">
          Lưu thay đổi
        </button>
      </form>
    </div>
  );
};

export default PatientInfo;
