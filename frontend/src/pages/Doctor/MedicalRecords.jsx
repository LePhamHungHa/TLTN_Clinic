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
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [prescription, setPrescription] = useState([]);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

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
        },
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
        `http://localhost:8080/api/doctor/medical-records/doctor/${doctorId}?page=${currentPage}&size=10`,
      );

      console.log("📡 Medical records response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📦 Medical records data:", data);

      if (data.success) {
        console.log("Medical records received:", data.medicalRecords);

        // LỌC CHỈ LẤY CÁC RECORDS ĐÃ HOÀN THÀNH
        const completedRecords =
          data.medicalRecords?.filter(
            (record) => record.examinationStatus === "COMPLETED",
          ) || [];

        setMedicalRecords(completedRecords);
        setTotalPages(data.totalPages || 0);

        console.log("Completed records:", completedRecords.length);
      } else {
        console.error("API Error:", data.message);
        setError(data.message || "Có lỗi xảy ra khi tải dữ liệu");
      }
    } catch (err) {
      console.error("Fetch medical records error:", err);
      setError("Không thể kết nối đến server");
    }
  };

  // HÀM: Lấy lịch sử đơn thuốc theo medicalRecordId
  const fetchPrescriptionHistory = async (medicalRecordId) => {
    if (!medicalRecordId) {
      console.error("No medical record ID provided");
      return;
    }

    try {
      setPrescriptionLoading(true);
      setPrescription([]);
      setTotalAmount(0);

      console.log(
        "💊 Fetching prescription history for medical record:",
        medicalRecordId,
      );

      const response = await fetchWithAuth(
        `http://localhost:8080/api/doctor/prescriptions/history/${medicalRecordId}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📦 Prescription history data:", data);

      if (data.success) {
        setPrescription(data.history || []);

        // Tính tổng tiền
        const total = (data.history || []).reduce(
          (sum, item) => sum + parseFloat(item.totalPrice || 0),
          0,
        );
        setTotalAmount(total);

        console.log(
          `✅ Found ${data.history?.length || 0} prescription history items`,
        );
      } else {
        console.error("❌ Prescription history API Error:", data.message);
        setError("Không thể lấy lịch sử đơn thuốc: " + data.message);
      }
    } catch (err) {
      console.error("🚨 Fetch prescription history error:", err);
      setError("Không thể kết nối đến server để lấy lịch sử đơn thuốc");
    } finally {
      setPrescriptionLoading(false);
    }
  };

  // HÀM: Xử lý nhóm thuốc theo ngày
  const groupMedicationByDate = (medicationList) => {
    if (!medicationList || medicationList.length === 0) return {};

    const grouped = {};

    medicationList.forEach((item) => {
      if (!item.createdAt) return;

      const date = new Date(item.createdAt);
      const dateKey = date.toISOString().split("T")[0];
      const formattedDate = date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: formattedDate,
          fullDate: item.createdAt,
          items: [],
          totalCost: 0,
          totalItems: 0,
        };
      }

      grouped[dateKey].items.push(item);
      grouped[dateKey].totalCost += parseFloat(item.totalPrice || 0);
      grouped[dateKey].totalItems += 1;
    });

    // Sắp xếp theo ngày giảm dần
    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {});
  };

  // HÀM: Định dạng tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // HÀM: Xem đơn thuốc
  const handleViewPrescription = (record) => {
    console.log("💊 Viewing prescription history for record:", record);
    setSelectedRecord(record);
    fetchPrescriptionHistory(record.id);
    setShowPrescriptionModal(true);
  };

  // HÀM: Đóng modal
  const handleClosePrescriptionModal = () => {
    setShowPrescriptionModal(false);
    setSelectedRecord(null);
    setPrescription([]);
    setTotalAmount(0);
  };

  const filteredRecords = medicalRecords.filter(
    (record) =>
      record.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.finalDiagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.patientPhone?.includes(searchTerm),
  );

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

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

  // MODAL COMPONENT - ĐƠN GIẢN NHƯ TRANG TRƯỚC
  const PrescriptionModal = () => {
    if (!showPrescriptionModal || !selectedRecord) return null;

    const groupedPrescription = groupMedicationByDate(prescription);

    return (
      <div className="modal-overlay">
        <div className="modal-content medication-history-modal">
          <div className="modal-header">
            <h3>📋 Lịch sử sử dụng thuốc</h3>
            <button
              className="btn-close"
              onClick={handleClosePrescriptionModal}
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
            {prescriptionLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : prescription.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h4>Chưa có lịch sử sử dụng thuốc</h4>
                <p>Bệnh nhân chưa từng được kê đơn thuốc trong hồ sơ này</p>
              </div>
            ) : (
              <>
                {/* Thông tin bệnh nhân */}
                <div className="patient-info-card">
                  <div className="patient-info-row">
                    <span className="label">Bệnh nhân:</span>
                    <span className="value">{selectedRecord.patientName}</span>
                  </div>
                  <div className="patient-info-row">
                    <span className="label">Mã HS:</span>
                    <span className="value">{selectedRecord.id}</span>
                  </div>
                  <div className="patient-info-row">
                    <span className="label">Tổng số đơn:</span>
                    <span className="value">
                      {Object.keys(groupedPrescription).length} lần kê đơn
                    </span>
                  </div>
                </div>

                {/* Danh sách lịch sử */}
                <div className="history-list">
                  {Object.entries(groupedPrescription).map(([dateKey, day]) => (
                    <div key={dateKey} className="history-day">
                      <div className="history-day-header">
                        <span className="date-label">📅 {day.date}</span>
                        <span className="item-count">
                          ({day.items.length} loại thuốc)
                        </span>
                      </div>

                      <div className="history-items">
                        {day.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="history-item">
                            <div className="medicine-name">
                              {item.medicineName}
                              {item.strength && ` (${item.strength})`}
                            </div>

                            <div className="medicine-details">
                              <div className="detail-row">
                                <span className="detail-label">Liều dùng:</span>
                                <span className="detail-value">
                                  {item.dosage}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Tần suất:</span>
                                <span className="detail-value">
                                  {item.frequency}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Thời gian:</span>
                                <span className="detail-value">
                                  {item.duration}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Số lượng:</span>
                                <span className="detail-value">
                                  {item.quantity} {item.unit}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Giá:</span>
                                <span className="detail-value price">
                                  {formatCurrency(
                                    parseFloat(item.totalPrice || 0),
                                  )}
                                </span>
                              </div>
                              {item.instructions && (
                                <div className="detail-row">
                                  <span className="detail-label">
                                    Hướng dẫn:
                                  </span>
                                  <span className="detail-value instructions">
                                    {item.instructions}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tóm tắt */}
                {prescription.length > 0 && (
                  <div className="history-summary">
                    <div className="summary-row">
                      <span className="summary-label">
                        Tổng số thuốc đã kê:
                      </span>
                      <span className="summary-value">
                        {prescription.length} loại
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Tổng chi phí:</span>
                      <span className="summary-value total-cost">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button
              className="btn-close-modal"
              onClick={handleClosePrescriptionModal}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
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
      <PrescriptionModal />

      <div className="medical-records-header">
        <h1>HỒ SƠ BỆNH ÁN</h1>
        <p>Danh sách các hồ sơ bệnh án bạn đã khám</p>
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
                filteredRecords.map((record) => (
                  <tr key={record.id} className="record-row">
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
                            Tái khám: {formatDate(record.appointmentDate)}
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
                        >
                          <i className="fas fa-eye"></i>
                          Chi tiết
                        </Link>
                        <button
                          className="btn-view-prescription"
                          onClick={() => handleViewPrescription(record)}
                          title="Xem lịch sử đơn thuốc"
                        >
                          <i className="fas fa-prescription-bottle-alt"></i>
                          Đơn thuốc
                        </button>
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
