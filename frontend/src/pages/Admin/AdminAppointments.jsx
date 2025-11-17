import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../css/AdminAppointments.css";

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "ALL",
    date: "",
    search: "",
    paymentStatus: "ALL",
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, filters]);

  const getToken = () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        console.error("❌ Không tìm thấy user data");
        return null;
      }
      const user = JSON.parse(userData);
      const token = user?.token;
      if (!token) {
        console.error("❌ Không tìm thấy token");
        return null;
      }
      return token;
    } catch (error) {
      console.error("❌ Lỗi khi lấy token:", error);
      return null;
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = getToken();
      if (!token) {
        alert("⚠️ Vui lòng đăng nhập lại");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        "http://localhost:8080/api/admin/registrations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Thêm thông tin thanh toán vào mỗi appointment
      const appointmentsWithPayment = await Promise.all(
        response.data.map(async (appointment) => {
          try {
            const paymentResponse = await axios.get(
              `http://localhost:8080/api/admin/registrations/${appointment.id}/payment-status`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            // CHUYỂN ĐỔI "Thành công" THÀNH "Đã thanh toán"
            let paymentStatus =
              paymentResponse.data.paymentStatus || "Chưa thanh toán";
            if (paymentStatus === "Thành công") {
              paymentStatus = "Đã thanh toán";
            }

            return {
              ...appointment,
              paymentStatus: paymentStatus,
              paymentAmount: paymentResponse.data.amount,
              paymentDate: paymentResponse.data.paymentDate,
            };
          } catch (error) {
            console.error(
              `Lỗi khi lấy trạng thái thanh toán cho đơn ${appointment.id}:`,
              error
            );
            return {
              ...appointment,
              paymentStatus: "Chưa thanh toán",
              paymentAmount: null,
              paymentDate: null,
            };
          }
        })
      );

      setAppointments(appointmentsWithPayment);
    } catch (error) {
      console.error("❌ Lỗi tải danh sách lịch hẹn:", error);
      if (error.response?.status === 403) {
        alert("❌ Bạn không có quyền ADMIN để truy cập tính năng này");
      } else if (error.response?.status === 401) {
        alert("⚠️ Phiên đăng nhập hết hạn, vui lòng đăng nhập lại");
      } else {
        alert("Không thể tải danh sách lịch hẹn");
      }
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    if (filters.status !== "ALL") {
      filtered = filtered.filter((app) => app.status === filters.status);
    }

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
          app.fullName?.toLowerCase().includes(searchLower) ||
          app.phone?.includes(filters.search) ||
          app.email?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredAppointments(filtered);
  };

  const handleTryApprove = async (appointmentId) => {
    if (!window.confirm("Bạn có chắc muốn thử duyệt đơn này?")) return;

    try {
      const token = getToken();
      if (!token) return;

      await axios.post(
        `http://localhost:8080/api/admin/registrations/${appointmentId}/try-approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("✅ Đã duyệt đơn thành công!");
      fetchAppointments();
    } catch (error) {
      alert(
        `❌ ${
          error.response?.data || "Không thể duyệt đơn. Có thể đã hết slot."
        }`
      );
    }
  };

  const handleReject = async (appointmentId) => {
    const reason = prompt("Nhập lý do từ chối:");
    if (!reason) return;

    try {
      const token = getToken();
      if (!token) return;

      await axios.post(
        `http://localhost:8080/api/admin/registrations/${appointmentId}/reject`,
        reason,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "text/plain",
          },
        }
      );

      alert("✅ Đã từ chối đơn!");
      fetchAppointments();
    } catch (error) {
      alert(
        "❌ Lỗi khi từ chối đơn: " + (error.response?.data || error.message)
      );
    }
  };

  const handleManualReview = async (appointmentId) => {
    try {
      const token = getToken();
      if (!token) return;

      await axios.put(
        `http://localhost:8080/api/admin/registrations/${appointmentId}/manual-review`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("✅ Đã chuyển sang chờ xử lý thủ công!");
      fetchAppointments();
    } catch (error) {
      alert(
        "❌ Lỗi khi cập nhật trạng thái: " +
          (error.response?.data || error.message)
      );
    }
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
      "Thất bại": {
        label: "THẤT BẠI",
        class: "payment-status-failed",
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

  // Tính toán thống kê chính xác
  const calculateStats = () => {
    const total = appointments.length;
    const approved = appointments.filter(
      (app) =>
        app.status === "APPROVED" || app.paymentStatus === "Đã thanh toán"
    ).length;
    const pending = appointments.filter(
      (app) => app.status === "NEEDS_MANUAL_REVIEW" || app.status === "PENDING"
    ).length;
    const paid = appointments.filter(
      (app) => app.paymentStatus === "Đã thanh toán"
    ).length;

    return { total, approved, pending, paid };
  };

  const statsData = calculateStats();

  if (loading) {
    return (
      <div className="admin-appointments-container">
        <div className="loading">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="admin-appointments-container">
      <div className="admin-header">
        <h1>🔄 Quản lý Lịch hẹn Bệnh nhân</h1>
        <p>Quản lý và xử lý các đơn đăng ký khám bệnh</p>
      </div>

      {/* Thống kê - SỬA LẠI ĐỂ TÍNH TOÁN CHÍNH XÁC */}
      <div className="stats-grid">
        <div className="stat-card total">
          <h3>Tổng đơn</h3>
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
      </div>

      {/* Bộ lọc */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Trạng thái:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="ALL">Tất cả</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="NEEDS_MANUAL_REVIEW">Cần xử lý</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Thanh toán:</label>
          <select
            value={filters.paymentStatus}
            onChange={(e) =>
              setFilters({ ...filters, paymentStatus: e.target.value })
            }
          >
            <option value="ALL">Tất cả</option>
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
            placeholder="Tên, SĐT, Email..."
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
          <h2>Danh sách Lịch hẹn ({filteredAppointments.length})</h2>
          <button className="refresh-btn" onClick={fetchAppointments}>
            🔄 Làm mới
          </button>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="no-data">
            <p>📭 Không có lịch hẹn nào phù hợp</p>
          </div>
        ) : (
          <div className="appointments-grid">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="appointment-card">
                <div className="card-header">
                  <h3>{appointment.fullName || "Chưa có tên"}</h3>
                  <div className="status-group">
                    {/* HIỂN THỊ TRẠNG THÁI THỰC TẾ */}
                    {appointment.status === "APPROVED" ||
                    appointment.paymentStatus === "Đã thanh toán" ? (
                      <span className="status-badge status-approved">
                        ĐÃ DUYỆT
                      </span>
                    ) : (
                      <span
                        className={`status-badge status-${
                          appointment.status?.toLowerCase() || "default"
                        }`}
                      >
                        {appointment.status === "PENDING" && "CHỜ DUYỆT"}
                        {appointment.status === "NEEDS_MANUAL_REVIEW" &&
                          "CẦN XỬ LÝ"}
                        {appointment.status === "REJECTED" && "ĐÃ TỪ CHỐI"}
                        {!appointment.status && "CHƯA XÁC ĐỊNH"}
                      </span>
                    )}
                    {getPaymentStatusBadge(appointment.paymentStatus)}
                  </div>
                </div>

                <div className="card-content">
                  <div className="info-row">
                    <span className="label">📞 SĐT:</span>
                    <span>{appointment.phone || "Chưa có"}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">📧 Email:</span>
                    <span>{appointment.email || "Chưa có"}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">🏥 Khoa:</span>
                    <span>{appointment.department || "Chưa có"}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">📅 Ngày khám:</span>
                    <span>{formatDate(appointment.appointmentDate)}</span>
                  </div>

                  <div className="info-row">
                    <span className="label">💰 Phí khám:</span>
                    <span
                      className={
                        appointment.paymentStatus === "Đã thanh toán"
                          ? "paid-amount"
                          : ""
                      }
                    >
                      {appointment.examinationFee?.toLocaleString() || "0"} VND
                    </span>
                  </div>

                  {/* Chỉ hiển thị ngày thanh toán nếu đã thanh toán */}
                  {appointment.paymentStatus === "Đã thanh toán" &&
                    appointment.paymentDate && (
                      <div className="info-row">
                        <span className="label">⏰ Ngày thanh toán:</span>
                        <span>{formatDateTime(appointment.paymentDate)}</span>
                      </div>
                    )}

                  {/* HIỂN THỊ THÔNG TIN BUỔI KHÁM CHO CẢ ĐƠN ĐÃ THANH TOÁN VÀ CHƯA THANH TOÁN */}
                  {(appointment.assignedSession ||
                    appointment.queueNumber ||
                    appointment.expectedTimeSlot ||
                    appointment.roomNumber) && (
                    <>
                      <div className="info-row">
                        <span className="label">🕒 Buổi khám:</span>
                        <span>{appointment.assignedSession || "Chưa có"}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">🎯 Số TT:</span>
                        <span className="queue-number">
                          {appointment.queueNumber || "Chưa có"}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="label">⏰ Khung giờ:</span>
                        <span>{appointment.expectedTimeSlot || "Chưa có"}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">🚪 Phòng:</span>
                        <span>{appointment.roomNumber || "Chưa có"}</span>
                      </div>
                    </>
                  )}

                  {appointment.symptoms && (
                    <div className="symptoms">
                      <span className="label">📝 Triệu chứng:</span>
                      <p>{appointment.symptoms}</p>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  {/* CHỈ HIỂN THỊ "ĐÃ DUYỆT" NẾU THỰC SỰ ĐÃ DUYỆT */}
                  {(appointment.status === "APPROVED" ||
                    appointment.paymentStatus === "Đã thanh toán") && (
                    <div className="approved-info">
                      <span className="success-text">✅ Đã duyệt</span>
                      {appointment.autoApproved && (
                        <span className="auto-badge">🤖 Tự động</span>
                      )}
                    </div>
                  )}

                  {/* Actions chỉ cho các trạng thái cần xử lý */}
                  {appointment.status === "NEEDS_MANUAL_REVIEW" && (
                    <>
                      <button
                        className="btn-approve"
                        onClick={() => handleTryApprove(appointment.id)}
                      >
                        ✅ Thử duyệt
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleReject(appointment.id)}
                      >
                        ❌ Từ chối
                      </button>
                    </>
                  )}

                  {appointment.status === "PENDING" && (
                    <button
                      className="btn-manual"
                      onClick={() => handleManualReview(appointment.id)}
                    >
                      🔄 Chuyển xử lý thủ công
                    </button>
                  )}

                  {appointment.status === "REJECTED" && (
                    <span className="rejected-text">❌ Đã từ chối</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAppointments;
