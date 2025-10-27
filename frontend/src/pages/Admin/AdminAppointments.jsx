import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../css/AdminAppointments.css";

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    status: "ALL",
    date: "",
    search: "",
  });

  useEffect(() => {
    fetchAppointments();
    fetchStats();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, filters]);

  // Hàm lấy token từ user object trong localStorage
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

      setAppointments(response.data);
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

  const fetchStats = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.get(
        "http://localhost:8080/api/admin/registrations/stats",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setStats(response.data);
    } catch (error) {
      console.error("❌ Lỗi tải thống kê:", error);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    if (filters.status !== "ALL") {
      filtered = filtered.filter((app) => app.status === filters.status);
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
      fetchStats();
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
      fetchStats();
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
      fetchStats();
    } catch (error) {
      alert(
        "❌ Lỗi khi cập nhật trạng thái: " +
          (error.response?.data || error.message)
      );
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      APPROVED: { label: "ĐÃ DUYỆT", class: "status-approved" },
      PENDING: { label: "CHỜ DUYỆT", class: "status-pending" },
      NEEDS_MANUAL_REVIEW: { label: "CẦN XỬ LÝ", class: "status-manual" },
      REJECTED: { label: "ĐÃ TỪ CHỐI", class: "status-rejected" },
    };

    const config = statusConfig[status] || {
      label: status,
      class: "status-default",
    };
    return (
      <span className={`status-badge ${config.class}`}>{config.label}</span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa có";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

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

      {/* Thống kê */}
      <div className="stats-grid">
        <div className="stat-card total">
          <h3>Tổng đơn</h3>
          <p className="stat-number">{appointments.length}</p>
        </div>
        <div className="stat-card approved">
          <h3>Đã duyệt</h3>
          <p className="stat-number">{stats.APPROVED || 0}</p>
        </div>
        <div className="stat-card pending">
          <h3>Chờ xử lý</h3>
          <p className="stat-number">{stats.NEEDS_MANUAL_REVIEW || 0}</p>
        </div>
        <div className="stat-card rejected">
          <h3>Từ chối</h3>
          <p className="stat-number">{stats.REJECTED || 0}</p>
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
          onClick={() => setFilters({ status: "ALL", date: "", search: "" })}
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
                  {getStatusBadge(appointment.status)}
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

                  {appointment.status === "APPROVED" && (
                    <div className="approved-details">
                      <div className="info-row highlight">
                        <span className="label">🕒 Buổi khám:</span>
                        <span>{appointment.assignedSession || "Chưa có"}</span>
                      </div>
                      <div className="info-row highlight">
                        <span className="label">🎯 Số TT:</span>
                        <span className="queue-number">
                          {appointment.queueNumber || "Chưa có"}
                        </span>
                      </div>
                      <div className="info-row highlight">
                        <span className="label">⏰ Khung giờ:</span>
                        <span>{appointment.expectedTimeSlot || "Chưa có"}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">🚪 Phòng:</span>
                        <span>{appointment.roomNumber || "Chưa có"}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">💰 Phí khám:</span>
                        <span>
                          {appointment.examinationFee?.toLocaleString() || "0"}{" "}
                          VND
                        </span>
                      </div>
                    </div>
                  )}

                  {appointment.symptoms && (
                    <div className="symptoms">
                      <span className="label">📝 Triệu chứng:</span>
                      <p>{appointment.symptoms}</p>
                    </div>
                  )}
                </div>

                <div className="card-actions">
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

                  {appointment.status === "APPROVED" && (
                    <div className="approved-info">
                      <span className="success-text">✅ Đã duyệt</span>
                      {appointment.autoApproved && (
                        <span className="auto-badge">🤖 Tự động</span>
                      )}
                    </div>
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
