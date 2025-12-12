import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/DoctorAppointments.css";

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "ALL",
    date: "",
    search: "",
  });
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [newAppointment] = useState(null);
  const [activeTab, setActiveTab] = useState("today");
  const navigate = useNavigate();

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

  // Lấy thông tin bác sĩ và lịch hẹn
  useEffect(() => {
    const fetchDoctorAppointments = async () => {
      try {
        setLoading(true);
        setError("");

        const user = JSON.parse(localStorage.getItem("user"));
        console.log("👤 Current user:", user);

        if (!user || user.role !== "DOCTOR") {
          navigate("/login");
          return;
        }

        const userId = user.id;
        console.log("🩺 User ID (from users table):", userId);

        const apiUrl = `http://localhost:8080/api/doctor/appointments/${userId}`;
        console.log("🌐 Calling API with user ID:", apiUrl);

        const response = await fetchWithAuth(apiUrl, {
          method: "GET",
        });

        console.log(
          "📡 Response status:",
          response.status,
          response.statusText
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ HTTP Error:", errorText);
          throw new Error(
            `HTTP error! status: ${response.status} - ${errorText}`
          );
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("❌ Response is not JSON:", text.substring(0, 500));
          throw new Error("Server trả về dữ liệu không phải JSON.");
        }

        const data = await response.json();
        console.log("📦 API Response:", data);

        if (data.success) {
          const allAppointments = data.appointments || [];
          console.log("🎯 Doctor's appointments:", allAppointments);

          setAppointments(allAppointments);
          setCurrentDoctor({
            id: data.doctorId,
            name: data.doctorName || user.fullName || "Bác sĩ",
          });
          setError("");
          console.log("✅ Loaded appointments for doctor ID:", data.doctorId);
        } else {
          throw new Error(data.message || "Lỗi từ server");
        }
      } catch (err) {
        console.error("💥 Fetch error:", err);
        const errorMessage = err.message || "Lỗi kết nối đến server";
        setError(`Lỗi: ${errorMessage}`);

        setAppointments([]);

        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
          setCurrentDoctor({
            id: user.id || "unknown",
            name: user.fullName || user.username || "Bác sĩ",
          });
        } else {
          setCurrentDoctor({
            id: "unknown",
            name: "Bác sĩ",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorAppointments();
  }, [navigate]);

  // Hàm format date cho filter (chuẩn hóa thành YYYY-MM-DD)
  const formatDateForFilter = (dateString) => {
    if (!dateString) return null;
    try {
      if (
        typeof dateString === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateString)
      ) {
        return dateString;
      }
      if (typeof dateString === "string" && dateString.includes("T")) {
        return dateString.split("T")[0];
      }
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    } catch (error) {
      console.error("❌ Error in formatDateForFilter:", error);
      return null;
    }
  };

  // Lọc lịch hẹn khi filters thay đổi
  useEffect(() => {
    filterAppointments();
  }, [appointments, filters]);

  const filterAppointments = () => {
    let filtered = appointments;

    console.log("🔄 FILTERING - Total appointments:", appointments.length);
    console.log("🔄 Current filters:", filters);

    // Lọc theo trạng thái
    if (filters.status !== "ALL") {
      if (filters.status === "TODAY") {
        const today = new Date().toISOString().split("T")[0];
        filtered = filtered.filter((apt) => {
          const aptDate = formatDateForFilter(apt.appointmentDate);
          return aptDate === today;
        });
      } else {
        filtered = filtered.filter((apt) => apt.status === filters.status);
      }
    }

    // Lọc theo ngày cụ thể (CHỈ KHI CÓ CHỌN NGÀY)
    if (filters.date) {
      filtered = filtered.filter((apt) => {
        const aptDate = formatDateForFilter(apt.appointmentDate);
        return aptDate === filters.date;
      });
    }

    // Tìm kiếm
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.fullName?.toLowerCase().includes(searchLower) ||
          apt.phone?.includes(filters.search) ||
          apt.registrationNumber?.includes(filters.search) ||
          apt.department?.toLowerCase().includes(searchLower)
      );
    }

    // Sắp xếp: theo ngày gần nhất và số thứ tự
    filtered.sort((a, b) => {
      const dateA = new Date(a.appointmentDate);
      const dateB = new Date(b.appointmentDate);
      const dateCompare = dateB - dateA;
      if (dateCompare !== 0) return dateCompare;

      return (a.queueNumber || 999) - (b.queueNumber || 999);
    });

    console.log("✅ FILTER RESULT - Showing:", filtered.length, "appointments");
    setFilteredAppointments(filtered);
  };

  // Format ngày hiển thị
  const formatDate = (dateString) => {
    if (!dateString) return "Chưa có";
    try {
      let date;
      if (
        typeof dateString === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateString)
      ) {
        date = new Date(dateString + "T00:00:00");
      } else if (typeof dateString === "string" && dateString.includes("T")) {
        date = new Date(dateString);
      } else {
        date = new Date(dateString);
      }
      return date.toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  // Format tiền
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  // Lấy class cho trạng thái
  const getStatusClass = (status) => {
    const statusMap = {
      CONFIRMED: "status-waiting",
      APPROVED: "status-waiting",
      PENDING: "status-pending",
      COMPLETED: "status-completed",
      CANCELLED: "status-cancelled",
      NEEDS_MANUAL_REVIEW: "status-pending",
      REJECTED: "status-cancelled",
      IN_PROGRESS: "status-in-progress",
    };
    return statusMap[status] || "status-pending";
  };

  // Lấy tên trạng thái tiếng Việt
  const getStatusText = (status) => {
    const statusMap = {
      CONFIRMED: "CHỜ KHÁM",
      APPROVED: "CHỜ KHÁM",
      PENDING: "CHỜ XÁC NHẬN",
      COMPLETED: "ĐÃ KHÁM",
      CANCELLED: "ĐÃ HỦY",
      NEEDS_MANUAL_REVIEW: "CHỜ DUYỆT",
      REJECTED: "ĐÃ TỪ CHỐI",
      IN_PROGRESS: "ĐANG KHÁM",
    };
    return statusMap[status] || status;
  };

  // Thêm các hàm trở lại và sử dụng chúng
  const getStatusBadge = (status) => {
    return (
      <span className={`status-badge ${getStatusClass(status)}`}>
        {getStatusText(status)}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const paymentConfig = {
      PAID: {
        label: "ĐÃ THANH TOÁN",
        class: "payment-status-paid",
      },
      UNPAID: {
        label: "CHƯA THANH TOÁN",
        class: "payment-status-unpaid",
      },
      PENDING: {
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

  // Tính toán thống kê
  const calculateStats = () => {
    const today = new Date().toISOString().split("T")[0];

    const todayAppointments = appointments.filter((apt) => {
      const aptDate = formatDateForFilter(apt.appointmentDate);
      return aptDate === today;
    });

    return {
      total: appointments.length,
      today: todayAppointments.length,
      waiting: todayAppointments.filter(
        (apt) => apt.status === "CONFIRMED" || apt.status === "APPROVED"
      ).length,
      completed: todayAppointments.filter((apt) => apt.status === "COMPLETED")
        .length,
      pending: appointments.filter(
        (apt) =>
          apt.status === "PENDING" || apt.status === "NEEDS_MANUAL_REVIEW"
      ).length,
    };
  };

  const statsData = calculateStats();

  // Toggle card expand
  const toggleCardExpand = (appointmentId) => {
    setExpandedCard((prev) => (prev === appointmentId ? null : appointmentId));
  };

  // Xử lý bắt đầu khám - ĐÃ SỬA LỖI FOREIGN KEY
  const handleStartExamination = async (appointmentId) => {
    setActionLoading(appointmentId);
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user || !user.token) {
        throw new Error(
          "Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại."
        );
      }

      const appointment = appointments.find((apt) => apt.id === appointmentId);
      if (!appointment) {
        throw new Error("Không tìm thấy thông tin lịch hẹn");
      }

      console.log("👤 Current user:", user);
      console.log("🩺 Current doctor:", currentDoctor);
      console.log("📅 Appointment:", appointment);

      // 🔥 SỬ DỤNG DOCTOR_ID TỪ APPOINTMENT, KHÔNG PHẢI TỪ USER
      const appointmentDoctorId = appointment.doctorId;

      if (!appointmentDoctorId) {
        throw new Error(
          "Lịch hẹn chưa được phân công cho bác sĩ. Vui lòng liên hệ quản trị viên."
        );
      }

      console.log("🎯 Using appointment doctor ID:", appointmentDoctorId);

      // Đọc số thứ tự trước khi bắt đầu khám
      if (appointment && appointment.queueNumber) {
        alert(
          `📢 ĐANG GỌI SỐ THỨ TỰ: ${appointment.queueNumber}\nBỆNH NHÂN: ${appointment.fullName}\nVUI LÒNG ĐẾN PHÒNG KHÁM!`
        );
      }

      // Chuẩn bị request body - SỬ DỤNG DOCTOR_ID TỪ APPOINTMENT
      const requestBody = {
        doctorId: appointmentDoctorId,
      };

      console.log("🌐 Sending request to start examination...");
      console.log("📤 Request body:", requestBody);
      console.log("🔐 Using token:", user.token ? "Present" : "Missing");

      // Gọi API bắt đầu khám với fetchWithAuth
      const response = await fetchWithAuth(
        `http://localhost:8080/api/doctor/medical-records/${appointmentId}/start`,
        {
          method: "POST",
          body: JSON.stringify(requestBody),
        }
      );

      console.log("🩺 Start examination response status:", response.status);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            "Truy cập bị từ chối. Vui lòng kiểm tra quyền truy cập hoặc đăng nhập lại."
          );
        } else if (response.status === 401) {
          localStorage.removeItem("user");
          navigate("/login");
          throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        } else if (response.status === 404) {
          throw new Error("Không tìm thấy lịch hẹn.");
        } else {
          const errorText = await response.text();
          console.error("❌ Server error response:", errorText);
          throw new Error(`Lỗi server: ${response.status}`);
        }
      }

      const result = await response.json();
      console.log("🩺 Start examination result:", result);

      if (result.success) {
        // Cập nhật local state với DTO data
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === appointmentId
              ? {
                  ...apt,
                  examinationStatus: "IN_PROGRESS",
                  status: "IN_PROGRESS",
                  // Cập nhật thêm thông tin từ DTO nếu cần
                  ...result.appointment,
                }
              : apt
          )
        );

        alert("✅ Bắt đầu khám thành công! Chuyển đến trang khám bệnh...");

        // Chuyển hướng đến trang khám bệnh
        navigate(`/doctor/examination/${appointmentId}`);
      } else {
        throw new Error(result.message || "Không thể bắt đầu khám");
      }
    } catch (error) {
      console.error("❌ Lỗi bắt đầu khám:", error);
      alert(`❌ Lỗi khi bắt đầu khám: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    setActionLoading(appointmentId);
    try {
      const response = await fetchWithAuth(
        `http://localhost:8080/api/doctor/appointments/${appointmentId}/complete`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === appointmentId ? { ...apt, status: "COMPLETED" } : apt
          )
        );
        alert("✅ Đã đánh dấu đã khám thành công!");
      } else {
        throw new Error("Không thể đánh dấu đã khám");
      }
    } catch (error) {
      console.error("❌ Lỗi đánh dấu đã khám:", error);
      alert("❌ Lỗi khi đánh dấu đã khám");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsMissed = async (appointmentId) => {
    if (!window.confirm("Xác nhận bệnh nhân không đi khám?")) {
      return;
    }

    setActionLoading(appointmentId);
    try {
      const response = await fetchWithAuth(
        `http://localhost:8080/api/doctor/medical-records/${appointmentId}/missed`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === appointmentId
              ? {
                  ...apt,
                  examinationStatus: "MISSED",
                  status: "CANCELLED",
                }
              : apt
          )
        );
        alert("✅ Đã đánh dấu không đi khám!");
      } else {
        throw new Error("Không thể đánh dấu không đi khám");
      }
    } catch (error) {
      console.error("❌ Lỗi đánh dấu không đi khám:", error);
      alert("❌ Lỗi khi đánh dấu không đi khám");
    } finally {
      setActionLoading(null);
    }
  };

  // Hàm chuyển đến trang kê đơn thuốc
  const handlePrescribeMedication = (appointmentId) => {
    navigate(`/doctor/prescription/${appointmentId}`);
  };

  // Hàm kiểm tra có nên hiển thị nút kê đơn thuốc không
  const shouldShowPrescribeButton = (appointment) => {
    return (
      appointment.status === "COMPLETED" && appointment.paymentStatus === "PAID"
    );
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu lịch hẹn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-appointments-container">
      {/* Header */}
      <div className="admin-header">
        <div className="header-title">
          <i className="bi-heart-pulse"></i>
          <div>
            <h1>Quản Lý Lịch Hẹn Khám Bệnh</h1>
            <p>Quản lý và khám bệnh cho bệnh nhân</p>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={() => window.location.reload()} title="Làm mới">
            <i className="bi-arrow-clockwise"></i>
            <span>Làm mới</span>
          </button>
          {statsData.waiting > 0 && (
            <div className="pending-badge">
              <span>{statsData.waiting}</span>
              <span>Bệnh nhân chờ khám</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <i className="bi-exclamation-triangle"></i>
          <div>
            <h4>Đã xảy ra lỗi!</h4>
            <p>{error}</p>
          </div>
          <button onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      )}

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <i className="bi-people"></i>
          <div>
            <h3>Tổng lịch hẹn</h3>
            <p>{statsData.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <i className="bi-calendar-check"></i>
          <div>
            <h3>Hôm nay</h3>
            <p>{statsData.today}</p>
          </div>
        </div>
        <div className="stat-card">
          <i className="bi-clock"></i>
          <div>
            <h3>Chờ khám</h3>
            <p>{statsData.waiting}</p>
            {statsData.waiting > 0 && (
              <div className="stat-badge">Cần khám ngay</div>
            )}
          </div>
        </div>
        <div className="stat-card">
          <i className="bi-check-circle"></i>
          <div>
            <h3>Đã khám</h3>
            <p>{statsData.completed}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "today" ? "active" : ""} ${
            statsData.today > 0 ? "has-pending" : ""
          }`}
          onClick={() => setActiveTab("today")}
        >
          <i className="bi-calendar-day"></i>
          <span>Hôm nay</span>
          <span className="tab-count">{statsData.today}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "waiting" ? "active" : ""} ${
            statsData.waiting > 0 ? "has-pending" : ""
          }`}
          onClick={() => setActiveTab("waiting")}
        >
          <i className="bi-clock"></i>
          <span>Chờ khám</span>
          <span className="tab-count badge">{statsData.waiting}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          <i className="bi-check-circle"></i>
          <span>Đã khám</span>
          <span className="tab-count">{statsData.completed}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <i className="bi-list"></i>
          <span>Tất cả</span>
          <span className="tab-count">{statsData.total}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="status-filter">
            <i className="bi-funnel"></i> Trạng thái
          </label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="TODAY">Hôm nay</option>
            <option value="CONFIRMED">Chờ khám</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="COMPLETED">Đã khám</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="IN_PROGRESS">Đang khám</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="date-filter">
            <i className="bi-calendar"></i> Ngày khám
          </label>
          <input
            id="date-filter"
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
        </div>

        <div className="filter-group filter-search">
          <label htmlFor="search-filter">
            <i className="bi-search"></i> Tìm kiếm
          </label>
          <div className="search-wrapper">
            <input
              id="search-filter"
              type="text"
              placeholder="Tên, SĐT, mã đơn, khoa..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
            {filters.search && (
              <button
                className="clear-search-btn"
                onClick={() => setFilters({ ...filters, search: "" })}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <button
          className="clear-filters-btn"
          onClick={() =>
            setFilters({
              status: "ALL",
              date: "",
              search: "",
            })
          }
        >
          <i className="bi-x-circle"></i> Xóa bộ lọc
        </button>
      </div>

      {/* Appointments List */}
      <div className="appointments-list">
        <div className="list-header">
          <h2>
            <i className="bi-person-lines-fill"></i>
            Danh sách bệnh nhân
            <span className="count-badge">{filteredAppointments.length}</span>
          </h2>
          <button
            className="refresh-btn"
            onClick={() => window.location.reload()}
          >
            <i className="bi-arrow-clockwise"></i>
            Làm mới
          </button>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="empty-state">
            <i className="bi-person-x"></i>
            <h3>Không có bệnh nhân nào</h3>
            <p>Vui lòng kiểm tra lại bộ lọc hoặc ngày khám</p>
          </div>
        ) : (
          <div className="appointments">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className={`appointment-card ${
                  expandedCard === appointment.id ? "expanded" : ""
                }`}
              >
                <div
                  className="card-header"
                  onClick={() => toggleCardExpand(appointment.id)}
                >
                  <div className="patient-info">
                    <i className="bi-person-circle"></i>
                    <div>
                      <h3>
                        {appointment.fullName}
                        <span className="appointment-id">
                          #{appointment.registrationNumber || appointment.id}
                        </span>
                      </h3>
                      <div className="status-container">
                        {/* Sử dụng getStatusBadge và getPaymentStatusBadge */}
                        {getStatusBadge(appointment.status)}
                        {getPaymentStatusBadge(
                          appointment.paymentStatus || "UNPAID"
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="expand-toggle">
                    <i
                      className={`bi-chevron-${
                        expandedCard === appointment.id ? "up" : "down"
                      }`}
                    ></i>
                  </button>
                </div>

                <div className="quick-info">
                  <div className="info-row">
                    <div className="info-item">
                      <span className="info-label">
                        <i className="bi-telephone"></i> SĐT
                      </span>
                      <span className="info-value">
                        {appointment.phone || "Chưa có"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        <i className="bi-envelope"></i> Email
                      </span>
                      <span className="info-value">
                        {appointment.email || "Chưa có"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        <i className="bi-hospital"></i> Khoa
                      </span>
                      <span className="info-value">
                        {appointment.department || "Chưa có"}
                      </span>
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-item">
                      <span className="info-label">
                        <i className="bi-calendar-event"></i> Ngày khám
                      </span>
                      <span className="info-value">
                        {formatDate(appointment.appointmentDate)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        <i className="bi-cash"></i> Phí khám
                      </span>
                      <span
                        className={`info-value fee-${
                          appointment.paymentStatus === "PAID"
                            ? "paid"
                            : "unpaid"
                        }`}
                      >
                        {formatCurrency(appointment.examinationFee)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        <i className="bi-sort-numeric-up"></i> Số thứ tự
                      </span>
                      <span className="info-value queue-number">
                        {appointment.queueNumber
                          ? `#${appointment.queueNumber}`
                          : "Chưa có"}
                      </span>
                    </div>
                  </div>
                </div>

                {expandedCard === appointment.id && (
                  <div className="expanded-details">
                    {appointment.symptoms && (
                      <div className="detail-section symptoms-section">
                        <div className="section-header">
                          <h4 className="section-title">
                            <i className="bi-clipboard-pulse"></i> TRIỆU CHỨNG
                          </h4>
                          <div className="section-divider"></div>
                        </div>
                        <div className="symptoms-content">
                          <p>{appointment.symptoms}</p>
                        </div>
                      </div>
                    )}

                    <div className="detail-section appointment-section">
                      <div className="section-header">
                        <h4 className="section-title">
                          <i className="bi-calendar-check"></i> THÔNG TIN KHÁM
                        </h4>
                        <div className="section-divider"></div>
                      </div>
                      <div className="appointment-info">
                        <div>
                          <span>Giờ hẹn:</span>{" "}
                          {appointment.expectedTimeSlot || "Chưa có"}
                        </div>
                        {appointment.roomNumber && (
                          <div>
                            <span>Phòng khám:</span> {appointment.roomNumber}
                          </div>
                        )}
                        {appointment.dob && (
                          <div>
                            <span>Ngày sinh:</span>{" "}
                            {formatDate(appointment.dob)}
                          </div>
                        )}
                        {appointment.gender && (
                          <div>
                            <span>Giới tính:</span> {appointment.gender}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="actions-section">
                      <div className="section-header">
                        <h4 className="section-title">
                          <i className="bi-gear"></i> THAO TÁC
                        </h4>
                        <div className="section-divider"></div>
                      </div>
                      <div className="actions-content">
                        {(appointment.status === "CONFIRMED" ||
                          appointment.status === "APPROVED") && (
                          <>
                            <button
                              className="action-btn start-exam-btn"
                              onClick={() =>
                                handleStartExamination(appointment.id)
                              }
                              disabled={actionLoading === appointment.id}
                            >
                              {actionLoading === appointment.id ? (
                                <i className="bi-hourglass-split"></i>
                              ) : (
                                <i className="bi-heart-pulse"></i>
                              )}
                              {actionLoading === appointment.id
                                ? "Đang xử lý..."
                                : "Bắt đầu khám"}
                            </button>
                            <button
                              className="action-btn complete-btn"
                              onClick={() =>
                                handleCompleteAppointment(appointment.id)
                              }
                              disabled={actionLoading === appointment.id}
                            >
                              {actionLoading === appointment.id ? (
                                <i className="bi-hourglass-split"></i>
                              ) : (
                                <i className="bi-check-circle"></i>
                              )}
                              {actionLoading === appointment.id
                                ? "Đang xử lý..."
                                : "Đánh dấu đã khám"}
                            </button>
                            {/* Thêm nút đánh dấu không đi khám */}
                            <button
                              className="action-btn missed-btn"
                              onClick={() => handleMarkAsMissed(appointment.id)}
                              disabled={actionLoading === appointment.id}
                            >
                              {actionLoading === appointment.id ? (
                                <i className="bi-hourglass-split"></i>
                              ) : (
                                <i className="bi-x-circle"></i>
                              )}
                              {actionLoading === appointment.id
                                ? "Đang xử lý..."
                                : "Không đi khám"}
                            </button>
                          </>
                        )}

                        {appointment.status === "IN_PROGRESS" && (
                          <button
                            className="action-btn start-exam-btn"
                            onClick={() =>
                              navigate(`/doctor/examination/${appointment.id}`)
                            }
                          >
                            <i className="bi-heart-pulse"></i>
                            Tiếp tục khám
                          </button>
                        )}

                        {appointment.status === "COMPLETED" &&
                          shouldShowPrescribeButton(appointment) && (
                            <button
                              className="action-btn prescribe-btn"
                              onClick={() =>
                                handlePrescribeMedication(appointment.id)
                              }
                            >
                              <i className="bi-capsule"></i>
                              Kê đơn thuốc
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Toast */}
      {showNotification && newAppointment && (
        <div className="notification-toast">
          <div className="toast-header">
            <div className="toast-icon">
              <i className="bi-bell-fill"></i>
            </div>
            <div className="toast-title">
              <h4>Có bệnh nhân mới cần khám!</h4>
            </div>
            <button
              className="toast-close"
              onClick={() => setShowNotification(false)}
            >
              <i className="bi-x"></i>
            </button>
          </div>
          <div className="toast-body">
            <p className="toast-patient">
              <strong>{newAppointment.fullName}</strong>
            </p>
            <div className="toast-details">
              <p>
                <i className="bi-hospital"></i> {newAppointment.department}
              </p>
              <p>
                <i className="bi-calendar"></i>{" "}
                {formatDate(newAppointment.appointmentDate)}
              </p>
            </div>
            <div className="toast-actions">
              <button
                className="toast-btn quick"
                onClick={() => {
                  handleStartExamination(newAppointment.id);
                  setShowNotification(false);
                }}
              >
                <i className="bi-lightning"></i> Bắt đầu khám
              </button>
              <button
                className="toast-btn close"
                onClick={() => setShowNotification(false)}
              >
                <i className="bi-eye"></i> Xem sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
