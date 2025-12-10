import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../../css/AdminAppointments.css";

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [filters, setFilters] = useState({
    status: "ALL",
    date: "",
    search: "",
    paymentStatus: "ALL",
  });
  const [expandedCard, setExpandedCard] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [newAppointmentNotification, setNewAppointmentNotification] =
    useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [statsData, setStatsData] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    paid: 0,
    unpaid: 0,
  });

  const notificationSoundRef = useRef(null);

  useEffect(() => {
    fetchAppointments();
    const pollInterval = setInterval(() => {
      fetchAppointments();
    }, 5000);

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, filters, activeTab]);

  const playNotificationSound = () => {
    if (notificationSoundRef.current) {
      notificationSoundRef.current.play();
    }
  };

  const getToken = () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        console.error("Không tìm thấy user data");
        return null;
      }

      const user = JSON.parse(userData);
      const token = user?.token;

      if (!token) {
        console.error("Không tìm thấy token");
        return null;
      }

      return token;
    } catch (error) {
      console.error("Lỗi khi lấy token:", error);
      return null;
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = getToken();
      if (!token) {
        setErrorMessage("Vui lòng đăng nhập lại");
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

      const calculateStats = () => {
        const total = appointmentsWithPayment.length;
        const approved = appointmentsWithPayment.filter(
          (app) => app.status === "APPROVED"
        ).length;
        const pending = appointmentsWithPayment.filter(
          (app) =>
            app.status === "NEEDS_MANUAL_REVIEW" || app.status === "PENDING"
        ).length;
        const paid = appointmentsWithPayment.filter(
          (app) => app.paymentStatus === "Đã thanh toán"
        ).length;
        const unpaid = appointmentsWithPayment.filter(
          (app) =>
            app.paymentStatus === "Chưa thanh toán" && app.status === "APPROVED"
        ).length;

        setStatsData({ total, approved, pending, paid, unpaid });
      };

      calculateStats();

      if (appointmentsWithPayment.length > appointments.length) {
        const newAppointments = appointmentsWithPayment.slice(
          appointments.length
        );
        const newPendingAppointments = newAppointments.filter(
          (app) =>
            app.status === "NEEDS_MANUAL_REVIEW" || app.status === "PENDING"
        );

        if (newPendingAppointments.length > 0 && !showNotification) {
          const latestNewAppointment = newPendingAppointments[0];

          if (
            !newAppointmentNotification ||
            newAppointmentNotification.id !== latestNewAppointment.id
          ) {
            setNewAppointmentNotification(latestNewAppointment);
            setShowNotification(true);
            playNotificationSound();

            setTimeout(() => {
              setShowNotification(false);
            }, 15000);
          }
        }
      }

      setAppointments(appointmentsWithPayment);
      setErrorMessage(null);
    } catch (error) {
      console.error("Lỗi tải danh sách lịch hẹn:", error);
      if (error.response?.status === 403) {
        setErrorMessage("Bạn không có quyền ADMIN để truy cập tính năng này");
      } else if (error.response?.status === 401) {
        setErrorMessage("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại");
      } else {
        setErrorMessage("Không thể tải danh sách lịch hẹn");
      }
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    if (activeTab !== "all") {
      switch (activeTab) {
        case "pending":
          filtered = filtered.filter(
            (app) =>
              app.status === "NEEDS_MANUAL_REVIEW" || app.status === "PENDING"
          );
          break;
        case "approved":
          filtered = filtered.filter((app) => app.status === "APPROVED");
          break;
        case "rejected":
          filtered = filtered.filter((app) => app.status === "REJECTED");
          break;
        case "paid":
          filtered = filtered.filter(
            (app) => app.paymentStatus === "Đã thanh toán"
          );
          break;
        case "unpaid":
          filtered = filtered.filter(
            (app) => app.paymentStatus === "Chưa thanh toán"
          );
          break;
      }
    }

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
          app.email?.toLowerCase().includes(searchLower) ||
          app.department?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredAppointments(filtered);
  };

  const handleApprove = async (appointment) => {
    setSelectedAppointment(appointment);
    setLoadingDoctors(true);
    setSelectedDoctorId(null);
    setSelectedTimeSlot("");
    setAvailableTimeSlots([]);

    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.get(
        `http://localhost:8080/api/admin/doctors/by-department`,
        {
          params: { department: appointment.department },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setAvailableDoctors(response.data);
      setShowApproveModal(true);
    } catch (error) {
      alert("Lỗi khi lấy danh sách bác sĩ: " + error.message);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleQuickApprove = async (appointment) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn duyệt đơn của ${appointment.fullName} với bác sĩ và khung giờ ngẫu nhiên?`
      )
    ) {
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert("Vui lòng đăng nhập lại");
        return;
      }

      await axios.post(
        `http://localhost:8080/api/admin/registrations/${appointment.id}/quick-approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Đã duyệt đơn thành công với bác sĩ và khung giờ ngẫu nhiên!");
      fetchAppointments();
      setShowNotification(false);
    } catch (error) {
      console.error("Lỗi khi duyệt đơn nhanh:", error);
      if (error.response?.status === 403) {
        alert("Bạn không có quyền thực hiện hành động này");
      } else {
        alert(
          "Lỗi khi duyệt đơn nhanh: " +
            (error.response?.data?.message || error.message)
        );
      }
    }
  };

  const handleDoctorSelect = async (doctorId) => {
    setSelectedDoctorId(doctorId);
    setSelectedTimeSlot("");
    setLoadingSlots(true);

    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.get(
        `http://localhost:8080/api/admin/doctors/${doctorId}/available-slots`,
        {
          params: {
            appointmentDate: selectedAppointment?.appointmentDate,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setAvailableTimeSlots(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy khung giờ khả dụng:", error);
      setAvailableTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!selectedAppointment || !selectedDoctorId || !selectedTimeSlot) {
      alert("Vui lòng chọn bác sĩ và khung giờ");
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert("Vui lòng đăng nhập lại");
        return;
      }

      await axios.post(
        `http://localhost:8080/api/admin/registrations/${selectedAppointment.id}/approve-with-assignment`,
        null,
        {
          params: {
            doctorId: selectedDoctorId,
            timeSlot: selectedTimeSlot,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Đã duyệt đơn thành công!");
      setShowApproveModal(false);
      setSelectedDoctorId(null);
      setSelectedTimeSlot("");
      setAvailableTimeSlots([]);
      fetchAppointments();
      setShowNotification(false);
    } catch (error) {
      console.error("Lỗi khi duyệt đơn:", error);
      if (error.response?.status === 403) {
        alert("Bạn không có quyền thực hiện hành động này");
      } else {
        alert(
          "Lỗi khi duyệt đơn: " +
            (error.response?.data?.message || error.message)
        );
      }
    }
  };

  const handleReject = async (appointmentId) => {
    const reason = prompt("Nhập lý do từ chối:");
    if (!reason) return;

    try {
      const token = getToken();
      if (!token) {
        alert("Vui lòng đăng nhập lại");
        return;
      }

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

      alert("Đã từ chối đơn!");
      fetchAppointments();
      setShowNotification(false);
    } catch (error) {
      console.error("Lỗi khi từ chối đơn:", error);
      if (error.response?.status === 403) {
        alert("Bạn không có quyền thực hiện hành động này");
      } else {
        alert(
          "Lỗi khi từ chối đơn: " +
            (error.response?.data?.message || error.message)
        );
      }
    }
  };

  const handleManualReview = async (appointmentId) => {
    try {
      const token = getToken();
      if (!token) {
        alert("Vui lòng đăng nhập lại");
        return;
      }

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

      alert("Đã chuyển sang chờ xử lý thủ công!");
      fetchAppointments();
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      if (error.response?.status === 403) {
        alert("Bạn không có quyền thực hiện hành động này");
      } else {
        alert(
          "Lỗi khi cập nhật trạng thái: " +
            (error.response?.data?.message || error.message)
        );
      }
    }
  };

  const toggleCardExpand = (appointmentId) => {
    setExpandedCard(expandedCard === appointmentId ? null : appointmentId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa có";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Chưa có";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="admin-appointments-container">
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner-container">
              <div className="spinner"></div>
            </div>
            <p className="loading-text">Đang tải dữ liệu lịch hẹn...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-appointments-container">
      {/* Header với Navigation */}
      <div className="admin-header-section">
        <div className="header-main">
          <div className="header-title">
            <div className="header-icon">
              <i className="bi-calendar-check"></i>
            </div>
            <div>
              <h1>Quản lý Lịch hẹn</h1>
              <p className="header-subtitle">
                Quản lý và xử lý các đơn đăng ký khám bệnh
              </p>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="refresh-header-btn"
              onClick={fetchAppointments}
              title="Làm mới dữ liệu"
            >
              <i className="bi-arrow-clockwise"></i>
              <span>Làm mới</span>
            </button>

            {statsData.pending > 0 && (
              <div className="pending-badge">
                <span className="badge-count">{statsData.pending}</span>
                <span>Đơn chờ xử lý</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="error-alert">
          <div className="alert-content">
            <i className="bi-exclamation-triangle"></i>
            <div className="alert-message">
              <h4>Đã xảy ra lỗi!</h4>
              <p>{errorMessage}</p>
            </div>
            <button className="retry-btn" onClick={fetchAppointments}>
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-section">
        <div className="stats-grid">
          {/* Tổng đơn */}
          <div className="stat-card stat-total">
            <div className="stat-icon">
              <i className="bi-people"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-title">Tổng đơn</h3>
              <p className="stat-value">{statsData.total}</p>
            </div>
          </div>

          {/* Đã duyệt */}
          <div className="stat-card stat-approved">
            <div className="stat-icon">
              <i className="bi-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-title">Đã duyệt</h3>
              <p className="stat-value">{statsData.approved}</p>
            </div>
          </div>

          {/* Chờ xử lý */}
          <div className="stat-card stat-pending">
            <div className="stat-icon">
              <i className="bi-clock"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-title">Chờ xử lý</h3>
              <p className="stat-value">{statsData.pending}</p>
              {statsData.pending > 0 && (
                <div className="stat-badge">Cần xử lý</div>
              )}
            </div>
          </div>

          {/* Đã thanh toán */}
          <div className="stat-card stat-paid">
            <div className="stat-icon">
              <i className="bi-credit-card"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-title">Đã thanh toán</h3>
              <p className="stat-value">{statsData.paid}</p>
            </div>
          </div>

          {/* Chờ thanh toán */}
          <div className="stat-card stat-unpaid">
            <div className="stat-icon">
              <i className="bi-cash"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-title">Chờ thanh toán</h3>
              <p className="stat-value">{statsData.unpaid}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Section - Tabs & Filters */}
      <div className="control-section">
        {/* Tabs Navigation */}
        <div className="tabs-container">
          <div className="tabs-nav">
            <button
              className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              <i className="bi-list"></i>
              <span>Tất cả</span>
              <span className="tab-count">{appointments.length}</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              <i className="bi-clock"></i>
              <span>Chờ xử lý</span>
              <span className="tab-count badge">{statsData.pending}</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "approved" ? "active" : ""}`}
              onClick={() => setActiveTab("approved")}
            >
              <i className="bi-check-circle"></i>
              <span>Đã duyệt</span>
              <span className="tab-count">{statsData.approved}</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "paid" ? "active" : ""}`}
              onClick={() => setActiveTab("paid")}
            >
              <i className="bi-credit-card"></i>
              <span>Đã thanh toán</span>
              <span className="tab-count">{statsData.paid}</span>
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="filters-container">
          <div className="filter-group">
            <label htmlFor="status-filter">
              <i className="bi-funnel"></i>
              Trạng thái
            </label>
            <select
              id="status-filter"
              className="filter-select"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="NEEDS_MANUAL_REVIEW">Cần xử lý</option>
              <option value="REJECTED">Đã từ chối</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="payment-filter">
              <i className="bi-cash-coin"></i>
              Thanh toán
            </label>
            <select
              id="payment-filter"
              className="filter-select"
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
            <label htmlFor="date-filter">
              <i className="bi-calendar"></i>
              Ngày khám
            </label>
            <input
              type="date"
              id="date-filter"
              className="filter-date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>

          <div className="filter-group filter-search">
            <label htmlFor="search-filter">
              <i className="bi-search"></i>
              Tìm kiếm
            </label>
            <div className="search-wrapper">
              <input
                type="text"
                id="search-filter"
                className="search-input"
                placeholder="Tên, SĐT, Email, Khoa..."
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
                  <i className="bi-x"></i>
                </button>
              )}
            </div>
          </div>

          <button
            className="clear-filters-btn"
            onClick={() =>
              setFilters({
                status: "ALL",
                paymentStatus: "ALL",
                date: "",
                search: "",
              })
            }
          >
            <i className="bi-x-circle"></i>
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="appointments-section">
        <div className="section-header">
          <h2>
            <i className="bi-list-check"></i>
            Danh sách Lịch hẹn
            <span className="count-badge">{filteredAppointments.length}</span>
          </h2>
          <div className="header-actions">
            <button
              className="action-btn refresh-btn"
              onClick={fetchAppointments}
            >
              <i className="bi-arrow-clockwise"></i>
              Làm mới
            </button>
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="bi-calendar-x"></i>
            </div>
            <h3>Không có lịch hẹn nào</h3>
            <p>
              {appointments.length === 0
                ? "Chưa có đơn đăng ký khám nào"
                : "Không tìm thấy kết quả phù hợp với bộ lọc"}
            </p>
            {appointments.length === 0 && (
              <button className="primary-btn" onClick={fetchAppointments}>
                <i className="bi-arrow-clockwise"></i>
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
                } ${
                  appointment.status === "NEEDS_MANUAL_REVIEW"
                    ? "highlight"
                    : ""
                }`}
              >
                {/* Card Header */}
                <div className="card-header">
                  <div className="patient-info">
                    <div className="patient-avatar">
                      <i className="bi-person-circle"></i>
                    </div>
                    <div className="patient-details">
                      <h3 className="patient-name">
                        {appointment.fullName || "Chưa có tên"}
                        <span className="appointment-id">
                          ID: #{appointment.id}
                        </span>
                      </h3>
                      <div className="status-container">
                        <span
                          className={`status-badge status-${appointment.status.toLowerCase()}`}
                        >
                          {appointment.status === "APPROVED"
                            ? "ĐÃ DUYỆT"
                            : appointment.status === "NEEDS_MANUAL_REVIEW"
                            ? "CẦN XỬ LÝ"
                            : appointment.status === "PENDING"
                            ? "CHỜ DUYỆT"
                            : appointment.status === "REJECTED"
                            ? "ĐÃ TỪ CHỐI"
                            : appointment.status}
                        </span>
                        <span
                          className={`payment-status payment-${
                            appointment.paymentStatus === "Đã thanh toán"
                              ? "paid"
                              : "unpaid"
                          }`}
                        >
                          <i
                            className={`bi-${
                              appointment.paymentStatus === "Đã thanh toán"
                                ? "check-circle"
                                : "clock"
                            }`}
                          ></i>
                          {appointment.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="expand-toggle"
                    onClick={() => toggleCardExpand(appointment.id)}
                  >
                    <i
                      className={`bi-chevron-${
                        expandedCard === appointment.id ? "up" : "down"
                      }`}
                    ></i>
                  </button>
                </div>

                {/* Quick Info */}
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
                          appointment.paymentStatus === "Đã thanh toán"
                            ? "paid"
                            : "unpaid"
                        }`}
                      >
                        {appointment.examinationFee?.toLocaleString() || "0"}{" "}
                        VND
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details - Updated to match your form */}
                {expandedCard === appointment.id && (
                  <div className="expanded-details">
                    {/* Symptoms */}
                    {appointment.symptoms && (
                      <div className="detail-section symptoms-section">
                        <div className="section-header">
                          <h4 className="section-title">
                            <i className="bi-clipboard-pulse"></i>
                            TRIỆU CHỨNG
                          </h4>
                          <div className="section-divider"></div>
                        </div>
                        <div className="symptoms-content">
                          <p>{appointment.symptoms}</p>
                        </div>
                      </div>
                    )}

                    {/* Appointment Information */}
                    <div className="detail-section appointment-section">
                      <div className="section-header">
                        <h4 className="section-title">
                          <i className="bi-calendar-check"></i>
                          THÔNG TIN BUỔI KHÁM
                        </h4>
                        <div className="section-divider"></div>
                      </div>

                      <div className="appointment-grid">
                        {/* Department */}
                        <div className="appointment-item">
                          <span className="appointment-label">Khoa khám:</span>
                          <span className="appointment-value">
                            {appointment.department || "Chưa có"}
                          </span>
                        </div>

                        {/* Doctor Information */}
                        {appointment.doctorId && (
                          <div className="doctor-subsection">
                            <div className="subsection-header">
                              <h5 className="subsection-title">
                                <i className="bi-person-badge"></i>
                                BÁC SĨ PHÂN CÔNG
                              </h5>
                              <div className="subsection-divider"></div>
                            </div>
                            <div className="doctor-details">
                              <div className="doctor-detail">
                                <span className="doctor-bullet">•</span>
                                <span className="doctor-label">
                                  Tên bác sĩ:
                                </span>
                                <span className="doctor-value doctor-name">
                                  {appointment.doctor?.fullName ||
                                    "Chưa phân công"}
                                </span>
                              </div>
                              {appointment.doctor?.degree && (
                                <div className="doctor-detail">
                                  <span className="doctor-bullet">•</span>
                                  <span className="doctor-label">Học vị:</span>
                                  <span className="doctor-value doctor-degree">
                                    {appointment.doctor.degree}
                                  </span>
                                </div>
                              )}
                              {appointment.doctor?.position && (
                                <div className="doctor-detail">
                                  <span className="doctor-bullet">•</span>
                                  <span className="doctor-label">Chức vụ:</span>
                                  <span className="doctor-value doctor-position">
                                    {appointment.doctor.position}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Appointment Details - ĐÃ SỬA LẠI */}
                        <div className="appointment-details-subsection">
                          <div className="subsection-header">
                            <h5 className="subsection-title">
                              <i className="bi-clock-history"></i>
                              BUỔI KHÁM CHI TIẾT
                            </h5>
                            <div className="subsection-divider"></div>
                          </div>

                          <div className="appointment-details-grid">
                            {appointment.assignedSession && (
                              <div className="appointment-detail detail-buoi-kham">
                                <span className="detail-label">
                                  <i className="bi-clock"></i>
                                  Buổi khám
                                </span>
                                <span className="detail-value">
                                  {appointment.assignedSession}
                                </span>
                              </div>
                            )}

                            {appointment.expectedTimeSlot && (
                              <div className="appointment-detail detail-khung-gio">
                                <span className="detail-label">
                                  <i className="bi-alarm"></i>
                                  Khung giờ
                                </span>
                                <span className="detail-value">
                                  {appointment.expectedTimeSlot}
                                </span>
                              </div>
                            )}

                            {appointment.queueNumber && (
                              <div className="appointment-detail detail-so-thu-tu">
                                <span className="detail-label">
                                  <i className="bi-123"></i>
                                  Số thứ tự
                                </span>
                                <div className="queue-number-wrapper">
                                  <span className="queue-number">
                                    {appointment.queueNumber}
                                  </span>
                                </div>
                              </div>
                            )}

                            {appointment.roomNumber && (
                              <div className="appointment-detail detail-phong-kham">
                                <span className="detail-label">
                                  <i className="bi-door-closed"></i>
                                  Phòng khám
                                </span>
                                <span className="detail-value">
                                  {appointment.roomNumber}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Information */}
                    {appointment.paymentStatus === "Đã thanh toán" &&
                      appointment.paymentDate && (
                        <div className="detail-section payment-section">
                          <div className="section-header">
                            <h4 className="section-title">
                              <i className="bi-credit-card"></i>
                              THANH TOÁN
                            </h4>
                            <div className="section-divider"></div>
                          </div>
                          <div className="payment-details">
                            <div className="payment-detail">
                              <span className="payment-label">
                                Ngày thanh toán:
                              </span>
                              <span className="payment-value">
                                {formatDateTime(appointment.paymentDate)}
                              </span>
                            </div>
                            {appointment.paymentAmount && (
                              <div className="payment-detail">
                                <span className="payment-label">Số tiền:</span>
                                <span className="payment-value amount">
                                  {appointment.paymentAmount.toLocaleString()}{" "}
                                  VND
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Status Section */}
                    <div className="status-section">
                      <div className="section-header">
                        <h4 className="section-title">
                          <i className="bi-info-circle"></i>
                          TRẠNG THÁI
                        </h4>
                        <div className="section-divider"></div>
                      </div>

                      <div className="status-content">
                        {appointment.status === "APPROVED" && (
                          <div className="approved-status">
                            <div className="status-main">
                              <i className="bi-check-circle-fill"></i>
                              <span className="status-text">ĐÃ DUYỆT</span>
                              {appointment.autoApproved && (
                                <span className="auto-badge">🤖 Tự động</span>
                              )}
                            </div>
                          </div>
                        )}

                        {appointment.status === "NEEDS_MANUAL_REVIEW" && (
                          <div className="pending-status">
                            <div className="status-main">
                              <i className="bi-exclamation-triangle-fill"></i>
                              <span className="status-text">CẦN XỬ LÝ</span>
                            </div>
                            <div className="status-actions">
                              <button
                                className="action-btn quick-approve-btn"
                                onClick={() => handleQuickApprove(appointment)}
                              >
                                <i className="bi-lightning"></i>
                                Duyệt nhanh
                              </button>
                              <button
                                className="action-btn approve-btn"
                                onClick={() => handleApprove(appointment)}
                              >
                                <i className="bi-check-circle"></i>
                                Duyệt đơn
                              </button>
                              <button
                                className="action-btn reject-btn"
                                onClick={() => handleReject(appointment.id)}
                              >
                                <i className="bi-x-circle"></i>
                                Từ chối
                              </button>
                            </div>
                          </div>
                        )}

                        {appointment.status === "PENDING" && (
                          <div className="pending-status">
                            <div className="status-main">
                              <i className="bi-clock-fill"></i>
                              <span className="status-text">CHỜ DUYỆT</span>
                            </div>
                            <button
                              className="action-btn manual-review-btn"
                              onClick={() => handleManualReview(appointment.id)}
                            >
                              <i className="bi-person-lines-fill"></i>
                              Chuyển xử lý thủ công
                            </button>
                          </div>
                        )}

                        {appointment.status === "REJECTED" && (
                          <div className="rejected-status">
                            <i className="bi-x-circle-fill"></i>
                            <span className="status-text">ĐÃ TỪ CHỐI</span>
                          </div>
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

      {/* Approve Modal */}
      {showApproveModal && selectedAppointment && (
        <div className="modal-overlay">
          <div className="approve-modal">
            <div className="modal-header">
              <div className="modal-title">
                <i className="bi-check-circle-fill"></i>
                <h3>Duyệt Đơn Khám</h3>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowApproveModal(false)}
              >
                <i className="bi-x"></i>
              </button>
            </div>

            <div className="modal-body">
              {/* Appointment Summary */}
              <div className="appointment-summary">
                <div className="summary-item">
                  <span className="summary-label">Bệnh nhân:</span>
                  <span className="summary-value">
                    {selectedAppointment.fullName}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Khoa:</span>
                  <span className="summary-value">
                    {selectedAppointment.department}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Ngày khám:</span>
                  <span className="summary-value">
                    {formatDate(selectedAppointment.appointmentDate)}
                  </span>
                </div>
              </div>

              {/* Doctor Selection */}
              <div className="selection-group">
                <label className="selection-label">
                  <i className="bi-person-badge"></i>
                  Chọn bác sĩ
                </label>
                <select
                  className="doctor-select"
                  value={selectedDoctorId || ""}
                  onChange={(e) => handleDoctorSelect(e.target.value)}
                  disabled={loadingDoctors}
                >
                  <option value="">-- Chọn bác sĩ --</option>
                  {availableDoctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.fullName}
                      {doctor.degree && ` - ${doctor.degree}`}
                      {doctor.position && ` (${doctor.position})`}
                      {doctor.roomNumber && ` - Phòng ${doctor.roomNumber}`}
                    </option>
                  ))}
                </select>
                {loadingDoctors && (
                  <div className="loading-indicator">
                    <div className="loading-spinner"></div>
                    <span>Đang tải danh sách bác sĩ...</span>
                  </div>
                )}
              </div>

              {/* Time Slot Selection */}
              {selectedDoctorId && (
                <div className="selection-group">
                  <label className="selection-label">
                    <i className="bi-clock"></i>
                    Chọn khung giờ
                  </label>
                  {loadingSlots ? (
                    <div className="loading-indicator">
                      <div className="loading-spinner"></div>
                      <span>Đang tải khung giờ...</span>
                    </div>
                  ) : availableTimeSlots.length > 0 ? (
                    <div className="time-slots">
                      {availableTimeSlots.map((slot) => (
                        <button
                          key={slot}
                          className={`time-slot-btn ${
                            selectedTimeSlot === slot ? "selected" : ""
                          }`}
                          onClick={() => setSelectedTimeSlot(slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="no-slots-message">
                      <i className="bi-calendar-x"></i>
                      <span>Không có khung giờ nào khả dụng</span>
                    </div>
                  )}
                </div>
              )}

              {/* Confirm Button */}
              {selectedDoctorId && selectedTimeSlot && (
                <div className="modal-actions">
                  <button
                    className="confirm-btn"
                    onClick={handleConfirmApprove}
                  >
                    <i className="bi-check-circle-fill"></i>
                    Xác nhận duyệt đơn
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Appointment Notification */}
      {showNotification && newAppointmentNotification && (
        <div className="notification-toast">
          <div className="toast-header">
            <div className="toast-icon">
              <i className="bi-bell-fill"></i>
            </div>
            <div className="toast-title">
              <h4>Có đơn khám mới cần xử lý!</h4>
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
              <strong>{newAppointmentNotification.fullName}</strong>
            </p>
            <div className="toast-details">
              <p>
                <i className="bi-hospital"></i>
                {newAppointmentNotification.department}
              </p>
              <p>
                <i className="bi-calendar"></i>
                {formatDate(newAppointmentNotification.appointmentDate)}
              </p>
            </div>
            <div className="toast-actions">
              <button
                className="toast-btn primary"
                onClick={() => {
                  handleQuickApprove(newAppointmentNotification);
                  setShowNotification(false);
                }}
              >
                <i className="bi-lightning"></i>
                Duyệt nhanh
              </button>
              <button
                className="toast-btn secondary"
                onClick={() => {
                  toggleCardExpand(newAppointmentNotification.id);
                  setShowNotification(false);
                }}
              >
                <i className="bi-eye"></i>
                Xem chi tiết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Sound */}
      <audio ref={notificationSoundRef} style={{ display: "none" }}>
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
};

export default AdminAppointments;
