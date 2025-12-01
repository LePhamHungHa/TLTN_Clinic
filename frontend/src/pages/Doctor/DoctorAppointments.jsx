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
      <div className="doctor-appointments-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu lịch hẹn...</p>
      </div>
    );
  }

  return (
    <div className="doctor-appointments-container">
      {/* Header */}
      <div className="appointments-header">
        <div className="header-main">
          <h1>🩺 Quản Lý Lịch Hẹn Khám Bệnh</h1>
          {currentDoctor && (
            <div className="doctor-info">
              <span className="doctor-name">
                Bác sĩ: <strong>{currentDoctor.name}</strong>
              </span>
              <span className="doctor-id">Mã BS: {currentDoctor.id}</span>
            </div>
          )}
        </div>
        <div className="current-time">
          {new Date().toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Thống kê nhanh */}
      <div className="quick-stats">
        <div className="stat-item total">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <div className="stat-number">{statsData.total}</div>
            <div className="stat-label">Tổng lịch hẹn</div>
          </div>
        </div>
        <div className="stat-item today">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <div className="stat-number">{statsData.today}</div>
            <div className="stat-label">Hôm nay</div>
          </div>
        </div>
        <div className="stat-item waiting">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-number">{statsData.waiting}</div>
            <div className="stat-label">Chờ khám</div>
          </div>
        </div>
        <div className="stat-item completed">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-number">{statsData.completed}</div>
            <div className="stat-label">Đã khám</div>
          </div>
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
          <label>Ngày khám:</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
        </div>

        <div className="filter-group search-group">
          <label>Tìm kiếm:</label>
          <input
            type="text"
            placeholder="Tên, SĐT, mã đơn..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <button
          className="clear-filters"
          onClick={() =>
            setFilters({
              status: "ALL",
              date: "",
              search: "",
            })
          }
        >
          🔄 Xóa lọc
        </button>
      </div>

      {/* Danh sách bệnh nhân */}
      <div className="patients-list">
        <div className="list-header">
          <h2>
            Danh sách bệnh nhân ({filteredAppointments.length})
            {filters.status === "TODAY" && " - Hôm nay"}
            {filters.date && ` - Ngày ${formatDate(filters.date)}`}
            {filters.status !== "ALL" &&
              filters.status !== "TODAY" &&
              ` - ${getStatusText(filters.status)}`}
          </h2>
          <div className="list-actions">
            <button
              className="btn-refresh"
              onClick={() => window.location.reload()}
            >
              🔄 Làm mới
            </button>
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="no-patients">
            <div className="no-patients-icon">👨‍⚕️</div>
            <p>Không có bệnh nhân nào</p>
            <small>Vui lòng kiểm tra lại bộ lọc hoặc ngày khám</small>
          </div>
        ) : (
          <div className="patients-grid">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="patient-card">
                <div className="patient-header">
                  <div className="patient-basic">
                    <div className="patient-name-id">
                      <h3>{appointment.fullName}</h3>
                      <span className="patient-code">
                        #{appointment.registrationNumber || appointment.id}
                      </span>
                    </div>
                    <div className="patient-meta">
                      <span className="patient-age">
                        {appointment.dob
                          ? new Date().getFullYear() -
                            new Date(appointment.dob).getFullYear() +
                            " tuổi"
                          : "Chưa có tuổi"}
                      </span>
                      <span className="patient-gender">
                        {appointment.gender}
                      </span>
                    </div>
                  </div>
                  <div className="status-group">
                    {getStatusBadge(appointment.status)}
                    {getPaymentStatusBadge(
                      appointment.paymentStatus || "UNPAID"
                    )}
                  </div>
                </div>

                <div className="patient-details">
                  <div className="detail-row">
                    <span className="label">📞 SĐT:</span>
                    <span>{appointment.phone || "Chưa có"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">📅 Ngày khám:</span>
                    <span>{formatDate(appointment.appointmentDate)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">🕒 Giờ hẹn:</span>
                    <span>{appointment.expectedTimeSlot || "Chưa có"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">🎯 Số thứ tự:</span>
                    <span className="queue-number">
                      {appointment.queueNumber
                        ? `#${appointment.queueNumber}`
                        : "Chưa có"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">🏥 Khoa:</span>
                    <span>{appointment.department || "Chưa có"}</span>
                  </div>
                  {appointment.symptoms && (
                    <div className="detail-row">
                      <span className="label">📝 Triệu chứng:</span>
                      <span className="symptoms">{appointment.symptoms}</span>
                    </div>
                  )}
                </div>

                <div className="patient-actions">
                  {/* Action cho lịch chờ khám */}
                  {(appointment.status === "CONFIRMED" ||
                    appointment.status === "APPROVED") && (
                    <>
                      <button
                        className="btn-start-exam primary"
                        onClick={() => handleStartExamination(appointment.id)}
                        disabled={actionLoading === appointment.id}
                      >
                        {actionLoading === appointment.id ? "⏳" : "🩺"} Bắt đầu
                        khám
                      </button>
                      <button
                        className="btn-complete"
                        onClick={() =>
                          handleCompleteAppointment(appointment.id)
                        }
                        disabled={actionLoading === appointment.id}
                      >
                        {actionLoading === appointment.id ? "⏳" : "✅"} Đã khám
                      </button>
                      <button
                        className="btn-missed"
                        onClick={() => handleMarkAsMissed(appointment.id)}
                        disabled={actionLoading === appointment.id}
                      >
                        {actionLoading === appointment.id ? "⏳" : "❌"} Chưa
                        khám
                      </button>
                    </>
                  )}

                  {/* Action cho lịch đang khám */}
                  {appointment.status === "IN_PROGRESS" && (
                    <div className="in-progress-actions">
                      <button
                        className="btn-start-exam primary"
                        onClick={() =>
                          navigate(`/doctor/examination/${appointment.id}`)
                        }
                      >
                        🩺 Tiếp tục khám
                      </button>
                    </div>
                  )}

                  {/* Action cho lịch đã khám - HIỆN NÚT KÊ ĐƠN NẾU ĐÃ THANH TOÁN */}
                  {appointment.status === "COMPLETED" && (
                    <div className="completed-actions">
                      {shouldShowPrescribeButton(appointment) ? (
                        <>
                          <span className="completed-text">
                            ✅ ĐÃ KHÁM & THANH TOÁN
                          </span>
                          <button
                            className="btn-prescribe"
                            onClick={() =>
                              handlePrescribeMedication(appointment.id)
                            }
                          >
                            💊 Kê đơn thuốc
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="completed-text">
                            ✅ ĐÃ HOÀN THÀNH KHÁM
                          </span>
                          <div className="payment-required-note">
                            ⏳ Chờ thanh toán để kê đơn
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Action cho lịch đã hủy */}
                  {appointment.status === "CANCELLED" && (
                    <div className="cancelled-actions">
                      <span className="cancelled-text">❌ ĐÃ HỦY LỊCH HẸN</span>
                    </div>
                  )}
                </div>

                {/* Thông tin nhanh */}
                <div className="quick-info">
                  <div className="info-item">
                    <span className="label">Phí khám:</span>
                    <span
                      className={
                        appointment.paymentStatus === "PAID"
                          ? "paid-amount"
                          : "unpaid-amount"
                      }
                    >
                      {formatCurrency(appointment.examinationFee)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Phòng:</span>
                    <span>{appointment.roomNumber || "Chưa có"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorAppointments;
