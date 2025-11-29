import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../../css/MedicalRecords.css";

const MedicalRecords = () => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [doctorId, setDoctorId] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));

  // Fetch interceptor để xử lý lỗi authentication
  const fetchWithAuth = async (url, options = {}) => {
    const user = JSON.parse(localStorage.getItem("user"));

    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        ...(user && user.token
          ? { Authorization: `Bearer ${user.token}` }
          : {}),
      },
    };

    const response = await fetch(url, config);

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new Error("Authentication failed");
    }

    return response;
  };

  // Lấy doctorId từ appointments trước
  const fetchDoctorId = async () => {
    try {
      console.log("🩺 Getting doctor ID for user:", user?.id);

      const response = await fetchWithAuth(
        `http://localhost:8080/api/doctor/appointments/${user.id}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📦 Doctor appointments response:", data);

      if (data.success && data.doctorId) {
        console.log("✅ Found doctor ID:", data.doctorId);
        return data.doctorId;
      } else {
        throw new Error("Không tìm thấy doctor ID");
      }
    } catch (err) {
      console.error("❌ Error fetching doctor ID:", err);
      throw err;
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);

        // Bước 1: Lấy doctorId từ appointments API
        const doctorId = await fetchDoctorId();
        setDoctorId(doctorId);

        // Bước 2: Lấy medical records bằng doctorId
        await fetchMedicalRecords(doctorId);
      } catch (err) {
        console.error("💥 Initialization error:", err);
        setError("Không thể tải dữ liệu: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      initializeData();
    }
  }, [currentPage]);

  const fetchMedicalRecords = async (doctorId) => {
    try {
      console.log("🔍 Fetching medical records for doctor ID:", doctorId);

      const response = await fetchWithAuth(
        `http://localhost:8080/api/doctor/medical-records/doctor/${doctorId}?page=${currentPage}&size=10`
      );

      console.log("📡 Medical records response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📦 Medical records data:", data);

      if (data.success) {
        console.log("✅ Medical records received:", data.medicalRecords);

        // LỌC CHỈ LẤY CÁC RECORDS ĐÃ HOÀN THÀNH
        const completedRecords =
          data.medicalRecords?.filter(
            (record) => record.examinationStatus === "COMPLETED"
          ) || [];

        setMedicalRecords(completedRecords);
        setTotalPages(data.totalPages || 0);

        console.log("✅ Completed records:", completedRecords.length);
      } else {
        console.error("❌ API Error:", data.message);
        setError(data.message || "Có lỗi xảy ra khi tải dữ liệu");
      }
    } catch (err) {
      console.error("🚨 Fetch medical records error:", err);
      setError("Không thể kết nối đến server");
    }
  };

  const filteredRecords = medicalRecords.filter(
    (record) =>
      record.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.finalDiagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.patientPhone?.includes(searchTerm)
  );

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // SỬA LẠI HÀM XỬ LÝ GIỚI TÍNH
  const getGenderDisplay = (gender) => {
    if (!gender) return "N/A";

    const genderLower = gender.toString().toLowerCase();

    if (
      genderLower === "nam" ||
      genderLower === "male" ||
      genderLower === "m"
    ) {
      return "Nam";
    } else if (
      genderLower === "nữ" ||
      genderLower === "female" ||
      genderLower === "f"
    ) {
      return "Nữ";
    } else {
      return gender;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      COMPLETED: { class: "status-completed", text: "ĐÃ HOÀN THÀNH" },
      IN_PROGRESS: { class: "status-in-progress", text: "ĐANG KHÁM" },
      MISSED: { class: "status-missed", text: "KHÔNG ĐẾN KHÁM" },
    };

    const config = statusConfig[status] || {
      class: "status-default",
      text: status,
    };
    return (
      <span className={`status-badge ${config.class}`}>{config.text}</span>
    );
  };

  // HÀM XỬ LÝ KHI XEM CHI TIẾT
  const handleViewDetail = (record) => {
    console.log("🔍 Viewing record details:", record);
    // Điều hướng đến trang chi tiết
  };

  if (loading) {
    return (
      <div className="medical-records-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu hồ sơ bệnh án...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="medical-records-container">
      <div className="medical-records-header">
        <h1>HỒ SƠ BỆNH ÁN</h1>
        <p>Danh sách các hồ sơ bệnh án bạn đã khám</p>
        {doctorId && (
          <div className="debug-info">
            Doctor ID: {doctorId} | User ID: {user?.id} | Tổng bản ghi:{" "}
            {medicalRecords.length}
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button
            onClick={() => window.location.reload()}
            className="retry-btn"
          >
            Thử lại
          </button>
        </div>
      )}

      <div className="medical-records-content">
        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên bệnh nhân, chẩn đoán hoặc số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <i className="fas fa-search search-icon"></i>
          </div>
          <div className="records-count">
            Tổng số: {filteredRecords.length} hồ sơ
          </div>
          <button
            onClick={() => {
              setCurrentPage(0);
              fetchMedicalRecords(doctorId);
            }}
            className="refresh-btn"
          >
            <i className="fas fa-sync-alt"></i> Làm mới
          </button>
        </div>

        <div className="records-table-container">
          <table className="records-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Thông tin bệnh nhân</th>
                <th>Ngày khám</th>
                <th>Triệu chứng</th>
                <th>Chẩn đoán</th>
                <th>Kế hoạch điều trị</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">
                    {searchTerm
                      ? "Không tìm thấy hồ sơ phù hợp"
                      : "Chưa có hồ sơ bệnh án nào"}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => (
                  <tr key={record.id} className="record-row">
                    <td>{index + 1 + currentPage * 10}</td>
                    <td>
                      <div className="patient-info">
                        <strong>{record.patientName || "N/A"}</strong>
                        <div className="patient-details">
                          <span>📞 {record.patientPhone || "N/A"}</span>
                          <span>
                            👤 {getGenderDisplay(record.patientGender)}
                          </span>
                          {record.patientDob && (
                            <span>
                              🎂{" "}
                              {new Date().getFullYear() -
                                new Date(record.patientDob).getFullYear()}{" "}
                              tuổi
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="date-info">
                        <div>{formatDate(record.examinationDate)}</div>
                        {record.appointmentDate && (
                          <div className="appointment-date">
                            Hẹn: {formatDate(record.appointmentDate)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="symptoms">
                        {record.chiefComplaint ||
                          record.symptoms ||
                          "Không có thông tin"}
                      </div>
                    </td>
                    <td>
                      <div className="diagnosis">
                        {record.finalDiagnosis ||
                          record.preliminaryDiagnosis ||
                          "Chưa chẩn đoán"}
                      </div>
                    </td>
                    <td>
                      <div className="treatment-plan">
                        {record.treatmentPlan
                          ? record.treatmentPlan.length > 100
                            ? `${record.treatmentPlan.substring(0, 100)}...`
                            : record.treatmentPlan
                          : "Chưa có kế hoạch"}
                      </div>
                    </td>
                    <td>{getStatusBadge(record.examinationStatus)}</td>
                    <td>
                      <div className="action-buttons">
                        <Link
                          to={`/doctor/examination/${record.appointmentId}`}
                          className="btn-view-detail"
                          onClick={() => handleViewDetail(record)}
                        >
                          <i className="fas fa-eye"></i>
                          Chi tiết
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="pagination-btn"
            >
              <i className="fas fa-chevron-left"></i> Trước
            </button>

            <span className="page-info">
              Trang {currentPage + 1} / {totalPages}
            </span>

            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="pagination-btn"
            >
              Sau <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalRecords;
