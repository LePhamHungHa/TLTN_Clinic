import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/AppointmentsPage.css";

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [filters, setFilters] = useState({
    status: "ALL",
    paymentStatus: "ALL", // 🆕 Thêm filter payment status
    date: "",
    search: "",
  });
  const [expandedCard, setExpandedCard] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, filters]);

  const fetchAppointments = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");

      if (!user?.email || !token) {
        setErrorMessage("Vui lòng đăng nhập để xem lịch hẹn");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `http://localhost:8080/api/patient-registrations/by-email?email=${encodeURIComponent(
          user.email
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const appointmentsWithPayment = await Promise.all(
        response.data.map(async (appointment) => {
          let paymentStatus = "Chưa thanh toán";
          let paymentAmount = appointment.examinationFee || 0;
          let paymentDate = null;

          try {
            const paymentResponse = await axios.get(
              `http://localhost:8080/api/vnpay/public/registrations/${appointment.id}/payment-status`,
              { timeout: 5000 }
            );

            paymentStatus =
              paymentResponse.data.paymentStatus || "Chưa thanh toán";

            if (paymentStatus === "Thành công" || paymentStatus === "SUCCESS") {
              paymentStatus = "Đã thanh toán";
            } else if (
              paymentStatus === "Đang chờ xử lý" ||
              paymentStatus === "PENDING"
            ) {
              paymentStatus = "Đang chờ xử lý";
            } else {
              paymentStatus = "Chưa thanh toán";
            }

            paymentAmount = paymentResponse.data.amount || paymentAmount;
            paymentDate = paymentResponse.data.paymentDate;
          } catch (error) {
            console.error(`Payment API failed for ${appointment.id}:`, error);
            paymentStatus = "Chưa thanh toán";
          }

          return {
            ...appointment,
            paymentStatus: paymentStatus,
            paymentAmount: paymentAmount,
            paymentDate: paymentDate,
          };
        })
      );

      setAppointments(appointmentsWithPayment);
      setErrorMessage(null);
    } catch (err) {
      console.error("❌ Lỗi tải lịch hẹn:", err);
      if (err.response?.status === 403) {
        setErrorMessage("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      } else if (err.response?.status === 404) {
        setErrorMessage("Không tìm thấy lịch hẹn nào.");
      } else if (err.response?.status === 500) {
        setErrorMessage("Lỗi server. Vui lòng thử lại sau.");
      } else {
        setErrorMessage(
          "Không thể tải danh sách lịch hẹn. Vui lòng thử lại sau."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    // Filter theo trạng thái đơn
    if (filters.status !== "ALL") {
      filtered = filtered.filter((app) => app.status === filters.status);
    }

    // 🆕 Filter theo trạng thái thanh toán
    if (filters.paymentStatus !== "ALL") {
      filtered = filtered.filter(
        (app) => app.paymentStatus === filters.paymentStatus
      );
    }

    if (filters.date) {
      filtered = filtered.filter((app) => app.appointmentDate === filters.date);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.department?.toLowerCase().includes(searchLower) ||
          app.symptoms?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredAppointments(filtered);
  };

  const handlePayment = (appointment) => {
    navigate("/payment", {
      state: {
        patientRegistrationId: appointment.id,
        registrationId: appointment.id,
        fullname: appointment.fullName,
        phone: appointment.phone,
        amount: appointment.examinationFee || 200000,
        department: appointment.department,
        appointmentDate: appointment.appointmentDate,
      },
    });
  };

  const toggleCardExpand = (appointmentId) => {
    setExpandedCard(expandedCard === appointmentId ? null : appointmentId);
  };

  const getDoctorInfo = (appointment) => {
    if (appointment.doctor) {
      const doctor = appointment.doctor;
      let info = doctor.fullName;

      if (doctor.degree) {
        info += ` - ${doctor.degree}`;
      }
      if (doctor.position) {
        info += ` (${doctor.position})`;
      }

      return info;
    }
    return "Chưa chỉ định bác sĩ";
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      APPROVED: {
        label: "ĐÃ DUYỆT",
        class: "status-approved",
      },
      NEEDS_MANUAL_REVIEW: {
        label: "CẦN XỬ LÝ",
        class: "status-pending",
      },
      PENDING: {
        label: "CHỜ DUYỆT",
        class: "status-pending",
      },
      REJECTED: {
        label: "ĐÃ TỪ CHỐI",
        class: "status-rejected",
      },
    };

    const config = statusConfig[status] || {
      label: status || "CHỜ DUYỆT",
      class: "status-default",
    };

    return (
      <span className={`status-badge ${config.class}`}>{config.label}</span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const paymentConfig = {
      "Đã thanh toán": {
        label: "ĐÃ THANH TOÁN",
        class: "payment-status-paid",
      },
      "Chưa thanh toán": {
        label: "CHƯA THANH TOÁN",
        class: "payment-status-unpaid",
      },
      "Đang chờ xử lý": {
        label: "ĐANG XỬ LÝ",
        class: "payment-status-pending",
      },
    };

    const config = paymentConfig[paymentStatus] || {
      label: paymentStatus,
      class: "payment-status-default",
    };

    return (
      <span className={`payment-badge ${config.class}`}>{config.label}</span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa có";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "Chưa có";
    return new Date(dateTimeString).toLocaleString("vi-VN");
  };

  const calculateStats = () => {
    const total = appointments.length;
    const approved = appointments.filter(
      (app) => app.status === "APPROVED"
    ).length;
    const pending = appointments.filter(
      (app) => app.status === "NEEDS_MANUAL_REVIEW" || app.status === "PENDING"
    ).length;
    const paid = appointments.filter(
      (app) => app.paymentStatus === "Đã thanh toán"
    ).length;
    const unpaid = appointments.filter(
      (app) =>
        app.paymentStatus === "Chưa thanh toán" && app.status === "APPROVED"
    ).length;

    return { total, approved, pending, paid, unpaid };
  };

  const statsData = calculateStats();

  if (loading) {
    return (
      <div className="appointments-container">
        <div className="loading">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h1>📅 Lịch hẹn Khám bệnh của tôi</h1>
        <p>Quản lý và theo dõi các lịch hẹn khám bệnh của bạn</p>
      </div>

      {errorMessage && (
        <div className="error-message">
          <p>{errorMessage}</p>
          <button onClick={fetchAppointments} className="retry-button">
            Thử lại
          </button>
        </div>
      )}

      {/* Thống kê */}
      <div className="stats-grid">
        <div className="stat-card total">
          <h3>Tổng lịch hẹn</h3>
          <p className="stat-number">{statsData.total}</p>
        </div>
        <div className="stat-card approved">
          <h3>Đã duyệt</h3>
          <p className="stat-number">{statsData.approved}</p>
        </div>
        <div className="stat-card pending">
          <h3>Chờ xử lý</h3>
          <p className="stat-number">{statsData.pending}</p>
        </div>
        <div className="stat-card payment-stats">
          <h3>Đã thanh toán</h3>
          <p className="stat-number">{statsData.paid}</p>
        </div>
        <div className="stat-card unpaid-stats">
          <h3>Chờ thanh toán</h3>
          <p className="stat-number">{statsData.unpaid}</p>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Trạng thái đơn:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="NEEDS_MANUAL_REVIEW">Cần xử lý</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
        </div>

        {/* 🆕 Filter trạng thái thanh toán */}
        <div className="filter-group">
          <label>Trạng thái thanh toán:</label>
          <select
            value={filters.paymentStatus}
            onChange={(e) =>
              setFilters({ ...filters, paymentStatus: e.target.value })
            }
          >
            <option value="ALL">Tất cả thanh toán</option>
            <option value="Đã thanh toán">Đã thanh toán</option>
            <option value="Chưa thanh toán">Chưa thanh toán</option>
            <option value="Đang chờ xử lý">Đang xử lý</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Ngày khám:</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <label>Tìm kiếm:</label>
          <input
            type="text"
            placeholder="Khoa, triệu chứng..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <button
          className="clear-filters"
          onClick={() =>
            setFilters({
              status: "ALL",
              paymentStatus: "ALL",
              date: "",
              search: "",
            })
          }
        >
          Xóa bộ lọc
        </button>
      </div>

      {/* Danh sách lịch hẹn */}
      <div className="appointments-list">
        <div className="list-header">
          <h2>
            Danh sách Lịch hẹn ({filteredAppointments.length})
            {filters.paymentStatus !== "ALL" && ` - ${filters.paymentStatus}`}
            {filters.status !== "ALL" && ` - ${filters.status}`}
          </h2>
          <button className="refresh-btn" onClick={fetchAppointments}>
            🔄 Làm mới
          </button>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="no-data">
            <p>
              📭{" "}
              {appointments.length === 0
                ? "Không có lịch hẹn nào"
                : "Không có lịch hẹn nào phù hợp"}
            </p>
            {appointments.length === 0 && (
              <button onClick={fetchAppointments} className="retry-button">
                Kiểm tra lại
              </button>
            )}
          </div>
        ) : (
          <div className="appointments-grid">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className={`appointment-card ${
                  expandedCard === appointment.id ? "expanded" : ""
                }`}
                id={`appointment-${appointment.id}`}
              >
                {/* Card Header - Luôn hiển thị */}
                <div className="card-header">
                  <div className="card-main-info">
                    <h3>
                      Đơn #{appointment.registrationNumber || appointment.id}
                    </h3>
                    <div className="status-group">
                      {getStatusBadge(appointment.status)}
                      {getPaymentStatusBadge(appointment.paymentStatus)}
                    </div>
                  </div>
                  <button
                    className="expand-btn"
                    onClick={() => toggleCardExpand(appointment.id)}
                  >
                    {expandedCard === appointment.id ? "▼" : "▶"}
                  </button>
                </div>

                {/* Basic Info - Luôn hiển thị */}
                <div className="card-basic-info">
                  <div className="basic-info-grid">
                    <div className="info-item">
                      <span className="label">👤 Bệnh nhân:</span>
                      <span>{appointment.fullName || "Chưa có"}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">🏥 Khoa:</span>
                      <span>{appointment.department || "Chưa có"}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">📅 Ngày khám:</span>
                      <span>{formatDate(appointment.appointmentDate)}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">💰 Phí khám:</span>
                      <span
                        className={
                          appointment.paymentStatus === "Đã thanh toán"
                            ? "paid-amount"
                            : "unpaid-amount"
                        }
                      >
                        {appointment.examinationFee?.toLocaleString() || "0"}{" "}
                        VND
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details - Chỉ hiển thị khi expanded */}
                {expandedCard === appointment.id && (
                  <div className="card-expanded-details">
                    <div className="details-section">
                      <h4>Thông tin chi tiết</h4>
                      <div className="details-grid">
                        <div className="detail-item">
                          <span className="label">📞 SĐT:</span>
                          <span>{appointment.phone || "Chưa có"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">📧 Email:</span>
                          <span>{appointment.email || "Chưa có"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">👨‍⚕️ Bác sĩ:</span>
                          <span className="doctor-info">
                            <strong>{getDoctorInfo(appointment)}</strong>
                            {appointment.doctor?.specialty && (
                              <div className="doctor-specialty">
                                {appointment.doctor.specialty}
                              </div>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Thông tin buổi khám cho đơn đã duyệt */}
                    {appointment.status === "APPROVED" && (
                      <div className="details-section approved-section">
                        <h4>Thông tin buổi khám</h4>
                        <div className="appointment-details">
                          <div className="detail-row">
                            <span className="label">🕒 Buổi khám:</span>
                            <span>
                              {appointment.assignedSession || "Chưa có"}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="label">🎯 Số thứ tự:</span>
                            <span className="queue-number">
                              {appointment.queueNumber || "Chưa có"}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="label">⏰ Khung giờ dự kiến:</span>
                            <span>
                              {appointment.expectedTimeSlot || "Chưa có"}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="label">🚪 Phòng khám:</span>
                            <span>{appointment.roomNumber || "Chưa có"}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ngày thanh toán nếu đã thanh toán */}
                    {appointment.paymentStatus === "Đã thanh toán" &&
                      appointment.paymentDate && (
                        <div className="details-section">
                          <div className="detail-row">
                            <span className="label">⏰ Ngày thanh toán:</span>
                            <span>
                              {formatDateTime(appointment.paymentDate)}
                            </span>
                          </div>
                        </div>
                      )}

                    {/* Triệu chứng */}
                    {appointment.symptoms && (
                      <div className="details-section">
                        <h4>📝 Triệu chứng</h4>
                        <div className="symptoms-content">
                          <p>{appointment.symptoms}</p>
                        </div>
                      </div>
                    )}

                    {/* Nút thanh toán */}
                    {appointment.status === "APPROVED" &&
                      appointment.paymentStatus === "Chưa thanh toán" && (
                        <div className="payment-action">
                          <button
                            className="btn-pay-now expanded"
                            onClick={() => handlePayment(appointment)}
                          >
                            💳 Thanh toán ngay
                          </button>
                        </div>
                      )}

                    {/* Notes */}
                    <div className="appointment-notes">
                      <p>
                        💡 <strong>Lưu ý:</strong> Vui lòng đến trước 15 phút để
                        làm thủ tục
                      </p>
                      {appointment.status === "APPROVED" && (
                        <p>
                          ✅ <strong>Trạng thái:</strong> Lịch hẹn đã được xác
                          nhận
                          {appointment.paymentStatus === "Chưa thanh toán" &&
                            " - Vui lòng thanh toán phí khám trước khi đến"}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
