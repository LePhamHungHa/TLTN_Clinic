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

  // HÀM MỚI: Lấy đơn thuốc theo medicalRecordId
  const fetchPrescription = async (medicalRecordId) => {
    if (!medicalRecordId) {
      console.error("❌ No medical record ID provided");
      return;
    }

    try {
      setPrescriptionLoading(true);
      setPrescription([]);
      setTotalAmount(0);

      console.log(
        "💊 Fetching prescription for medical record:",
        medicalRecordId
      );

      const response = await fetchWithAuth(
        `http://localhost:8080/api/doctor/prescriptions/${medicalRecordId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📦 Prescription data:", data);

      if (data.success) {
        setPrescription(data.prescription || []);
        setTotalAmount(data.totalAmount || 0);
        console.log(
          `✅ Found ${
            data.prescription?.length || 0
          } prescription items, total: ${data.totalAmount}`
        );
      } else {
        console.error("❌ Prescription API Error:", data.message);
        setError("Không thể lấy đơn thuốc: " + data.message);
      }
    } catch (err) {
      console.error("🚨 Fetch prescription error:", err);
      setError("Không thể kết nối đến server để lấy đơn thuốc");
    } finally {
      setPrescriptionLoading(false);
    }
  };

  // HÀM MỚI: Xem đơn thuốc
  const handleViewPrescription = (record) => {
    console.log("💊 Viewing prescription for record:", record);
    setSelectedRecord(record);
    fetchPrescription(record.id); // Dùng record.id (medical record ID)
    setShowPrescriptionModal(true);
  };

  // HÀM MỚI: Đóng modal
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
      record.patientPhone?.includes(searchTerm)
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

  // MODAL COMPONENT
  const PrescriptionModal = () => {
    if (!showPrescriptionModal || !selectedRecord) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content prescription-modal">
          <div className="modal-header">
            <h2>
              <i className="fas fa-prescription-bottle-alt"></i> ĐƠN THUỐC
            </h2>
            <button
              className="modal-close-btn"
              onClick={handleClosePrescriptionModal}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="modal-body">
            {/* Thông tin bệnh nhân */}
            <div className="patient-info-section">
              <h3>Thông tin bệnh nhân</h3>
              <div className="patient-details-grid">
                <div className="patient-detail-item">
                  <strong>Họ tên:</strong> {selectedRecord.patientName}
                </div>
                <div className="patient-detail-item">
                  <strong>SĐT:</strong> {selectedRecord.patientPhone}
                </div>
                <div className="patient-detail-item">
                  <strong>Giới tính:</strong>{" "}
                  {getGenderDisplay(selectedRecord.patientGender)}
                </div>
                <div className="patient-detail-item">
                  <strong>Ngày sinh:</strong>{" "}
                  {formatDate(selectedRecord.patientDob)}
                </div>
                <div className="patient-detail-item">
                  <strong>Ngày khám:</strong>{" "}
                  {formatDate(selectedRecord.examinationDate)}
                </div>
                <div className="patient-detail-item">
                  <strong>Chẩn đoán:</strong> {selectedRecord.finalDiagnosis}
                </div>
              </div>
            </div>

            {/* Danh sách thuốc */}
            <div className="prescription-list-section">
              <div className="section-header">
                <h3>
                  <i className="fas fa-capsules"></i> Danh sách thuốc (
                  {prescription.length} loại)
                </h3>
              </div>

              {prescriptionLoading ? (
                <div className="loading-prescription">
                  <div className="spinner-small"></div>
                  <p>Đang tải đơn thuốc...</p>
                </div>
              ) : prescription.length === 0 ? (
                <div className="no-prescription">
                  <i className="fas fa-box-open"></i>
                  <p>Chưa có đơn thuốc cho lần khám này</p>
                </div>
              ) : (
                <>
                  <div className="prescription-table-container">
                    <table className="prescription-table">
                      <thead>
                        <tr>
                          <th>STT</th>
                          <th>Tên thuốc</th>
                          <th>Liều dùng</th>
                          <th>Tần suất</th>
                          <th>Thời gian</th>
                          <th>Số lượng</th>
                          <th>Đơn giá</th>
                          <th>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescription.map((medicine, index) => (
                          <tr key={medicine.id}>
                            <td>{index + 1}</td>
                            <td>
                              <div className="medicine-name">
                                <strong>{medicine.medicineName}</strong>
                                {medicine.instructions && (
                                  <div className="medicine-instructions">
                                    <small>
                                      <i className="fas fa-info-circle"></i>{" "}
                                      {medicine.instructions}
                                    </small>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>{medicine.dosage || "N/A"}</td>
                            <td>{medicine.frequency || "N/A"}</td>
                            <td>{medicine.duration || "N/A"}</td>
                            <td>{medicine.quantity || 0}</td>
                            <td>
                              {medicine.unitPrice?.toLocaleString("vi-VN") || 0}{" "}
                              đ
                            </td>
                            <td>
                              <strong>
                                {medicine.totalPrice?.toLocaleString("vi-VN") ||
                                  0}{" "}
                                đ
                              </strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Tổng tiền */}
                  <div className="prescription-total">
                    <div className="total-amount">
                      <span className="total-label">TỔNG TIỀN:</span>
                      <span className="total-value">
                        {totalAmount.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  </div>

                  {/* Hướng dẫn sử dụng tổng hợp */}
                  <div className="prescription-instructions">
                    <h4>
                      <i className="fas fa-sticky-note"></i> Hướng dẫn sử dụng:
                    </h4>
                    <div className="instructions-content">
                      {selectedRecord.treatmentPlan ||
                        "Tuân thủ đúng liều lượng và thời gian sử dụng thuốc. Tái khám đúng hẹn nếu có bất thường."}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn-print"
              onClick={() => window.print()}
              disabled={prescription.length === 0}
            >
              <i className="fas fa-print"></i> In đơn thuốc
            </button>
            <button
              className="btn-close"
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
        {/* {doctorId && (
          <div className="debug-info">
            Doctor ID: {doctorId} | User ID: {user?.id} | Tổng bản ghi:{" "}
            {medicalRecords.length}
          </div>
        )} */}
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
                          title="Xem đơn thuốc"
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
