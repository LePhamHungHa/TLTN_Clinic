import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../../css/MedicalRecords.css";

function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [doctorId, setDoctorId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [prescriptionList, setPrescriptionList] = useState([]);
  const [loadingPrescription, setLoadingPrescription] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  const user = JSON.parse(localStorage.getItem("user"));

  const apiCall = async (url, options = {}) => {
    const userData = JSON.parse(localStorage.getItem("user"));

    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        ...(userData && userData.token
          ? { Authorization: "Bearer " + userData.token }
          : {}),
      },
    };

    const result = await fetch(url, config);

    if (result.status === 401 || result.status === 403) {
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new Error("Xác thực thất bại");
    }

    return result;
  };

  const getDoctorIdFromAppointments = async () => {
    try {
      console.log("Lấy doctor ID cho user:", user?.id);

      const response = await apiCall(
        `http://localhost:8080/api/doctor/appointments/${user.id}`,
        {
          method: "GET",
        },
      );

      if (response.status !== 200) {
        throw new Error("HTTP " + response.status);
      }

      const data = await response.json();

      if (data.success && data.doctorId) {
        console.log("Tìm thấy doctor ID:", data.doctorId);
        return data.doctorId;
      } else {
        throw new Error("Không tìm thấy doctor ID");
      }
    } catch (err) {
      console.error("Lỗi lấy doctor ID:", err);
      throw err;
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);

        const doctorId = await getDoctorIdFromAppointments();
        setDoctorId(doctorId);

        await loadMedicalRecords(doctorId);
      } catch (err) {
        console.error("Lỗi khởi tạo:", err);
        setError("Không thể tải dữ liệu: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      initData();
    }
  }, [page]);

  const loadMedicalRecords = async (doctorId) => {
    try {
      console.log("Lấy hồ sơ bệnh án cho doctor ID:", doctorId);

      const response = await apiCall(
        `http://localhost:8080/api/doctor/medical-records/doctor/${doctorId}?page=${page}&size=10`,
      );

      console.log("Trạng thái response:", response.status);

      if (response.status !== 200) {
        throw new Error("HTTP " + response.status);
      }

      const data = await response.json();

      if (data.success) {
        const completedRecords =
          data.medicalRecords?.filter(
            (record) => record.examinationStatus === "COMPLETED",
          ) || [];

        setRecords(completedRecords);
        setTotalPages(data.totalPages || 0);
      } else {
        console.error("Lỗi API:", data.message);
        setError(data.message || "Có lỗi xảy ra khi tải dữ liệu");
      }
    } catch (err) {
      console.error("Lỗi lấy hồ sơ bệnh án:", err);
      setError("Không thể kết nối đến server");
    }
  };

  const loadPrescriptionHistory = async (recordId) => {
    if (!recordId) {
      console.error("Không có medical record ID");
      return;
    }

    try {
      setLoadingPrescription(true);
      setPrescriptionList([]);
      setTotalPrice(0);

      console.log("Lấy lịch sử đơn thuốc cho:", recordId);

      const response = await apiCall(
        `http://localhost:8080/api/doctor/prescriptions/history/${recordId}`,
      );

      if (response.status !== 200) {
        throw new Error("HTTP " + response.status);
      }

      const data = await response.json();

      if (data.success) {
        setPrescriptionList(data.history || []);

        const total = (data.history || []).reduce(
          (sum, item) => sum + parseFloat(item.totalPrice || 0),
          0,
        );
        setTotalPrice(total);
      } else {
        console.error("Lỗi API lịch sử đơn thuốc:", data.message);
        setError("Không thể lấy lịch sử đơn thuốc: " + data.message);
      }
    } catch (err) {
      console.error("Lỗi lấy lịch sử đơn thuốc:", err);
      setError("Không thể kết nối đến server để lấy lịch sử đơn thuốc");
    } finally {
      setLoadingPrescription(false);
    }
  };

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

    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {});
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewPrescription = (record) => {
    console.log("Xem lịch sử đơn thuốc:", record);
    setSelectedRecord(record);
    loadPrescriptionHistory(record.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRecord(null);
    setPrescriptionList([]);
    setTotalPrice(0);
  };

  const filteredRecords = records.filter(
    (record) =>
      record.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      record.finalDiagnosis?.toLowerCase().includes(search.toLowerCase()) ||
      record.patientPhone?.includes(search),
  );

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getGenderText = (gender) => {
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

  const getStatusDisplay = (status) => {
    const statusMap = {
      COMPLETED: { class: "status-completed", text: "ĐÃ HOÀN THÀNH" },
      IN_PROGRESS: { class: "status-in-progress", text: "ĐANG KHÁM" },
      MISSED: { class: "status-missed", text: "KHÔNG ĐẾN KHÁM" },
    };

    const config = statusMap[status] || {
      class: "status-default",
      text: status,
    };
    return (
      <span className={`status-badge ${config.class}`}>{config.text}</span>
    );
  };

  const PrescriptionModal = () => {
    if (!showModal || !selectedRecord) return null;

    const groupedPrescription = groupMedicationByDate(prescriptionList);

    return (
      <div className="modal-overlay">
        <div className="modal-content medication-history-modal">
          <div className="modal-header">
            <h3>Lịch sử sử dụng thuốc</h3>
            <button className="close-button" onClick={closeModal}>
              Đóng
            </button>
          </div>

          <div className="modal-body">
            {loadingPrescription ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : prescriptionList.length === 0 ? (
              <div className="empty-state">
                <h4>Chưa có lịch sử sử dụng thuốc</h4>
                <p>Bệnh nhân chưa từng được kê đơn thuốc trong hồ sơ này</p>
              </div>
            ) : (
              <>
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

                <div className="history-list">
                  {Object.entries(groupedPrescription).map(([dateKey, day]) => (
                    <div key={dateKey} className="history-day">
                      <div className="history-day-header">
                        <span className="date-label">{day.date}</span>
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

                {prescriptionList.length > 0 && (
                  <div className="history-summary">
                    <div className="summary-row">
                      <span className="summary-label">
                        Tổng số thuốc đã kê:
                      </span>
                      <span className="summary-value">
                        {prescriptionList.length} loại
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Tổng chi phí:</span>
                      <span className="summary-value total-cost">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button className="close-modal-button" onClick={closeModal}>
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
            className="retry-button"
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="records-count">
            Tổng số: {filteredRecords.length} hồ sơ
          </div>
          <button
            onClick={() => {
              setPage(0);
              loadMedicalRecords(doctorId);
            }}
            className="refresh-button"
          >
            Làm mới
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
                    {search
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
                          <span>{record.patientPhone || "N/A"}</span>
                          <span>{getGenderText(record.patientGender)}</span>
                          {record.patientDob && (
                            <span>
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
                    <td>{getStatusDisplay(record.examinationStatus)}</td>
                    <td>
                      <div className="action-buttons">
                        <Link
                          to={`/doctor/examination/${record.appointmentId}`}
                          className="view-detail-button"
                        >
                          Chi tiết
                        </Link>
                        <button
                          className="view-prescription-button"
                          onClick={() => handleViewPrescription(record)}
                          title="Xem lịch sử đơn thuốc"
                        >
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

        {totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="pagination-button"
            >
              Trước
            </button>

            <span className="page-info">
              Trang {page + 1} / {totalPages}
            </span>

            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="pagination-button"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MedicalRecords;
