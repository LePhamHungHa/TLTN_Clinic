import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import axios from "axios";
import "../../css/AdminAppointments.css";

// Audio component cho âm thanh thông báo
const NotificationSound = forwardRef((props, ref) => {
  const audioRef = useRef(null);

  useImperativeHandle(ref, () => ({
    playSound: () => {
      if (audioRef.current) {
        console.log("🔊 Đang phát nhạc thông báo...");
        audioRef.current.currentTime = 1.0;
        audioRef.current.volume = 1;

        const stopTimeout = setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
        }, 3000);

        audioRef.current
          .play()
          .then(() => console.log("✅ Nhạc đang phát"))
          .catch((e) => {
            console.log("❌ Lỗi phát nhạc:", e);
            clearTimeout(stopTimeout);
            playFallbackSound();
          });

        audioRef.current.onended = () => {
          clearTimeout(stopTimeout);
          console.log("Kiểm tra âm thanh kết thúc");
        };
      }
    },
  }));

  return (
    <audio ref={audioRef} preload="auto">
      <source src="/img/sounds/notification.mp3" type="audio/mpeg" />
      <source src="/img/sounds/notification.wav" type="audio/wav" />
    </audio>
  );
});

// Fallback âm thanh nếu file không tồn tại
const playFallbackSound = () => {
  try {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Âm thanh fallback đơn giản
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.log("❌ Lỗi fallback âm thanh:", error);
  }
};

// Component thông báo đã sửa
const NewAppointmentNotification = ({
  notification,
  onClose,
  onQuickApprove,
  onApprove,
  onReject,
}) => {
  if (!notification) return null;

  return (
    <div className="notification-overlay">
      <div className="notification-popup">
        <div className="notification-header">
          <h3>🎉 CÓ ĐƠN ĐĂNG KÝ MỚI</h3>
          <button className="notification-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="notification-content">
          <div className="notification-patient">
            <strong>Bệnh nhân:</strong> {notification.fullName}
          </div>
          <div className="notification-details">
            <p>
              <strong>📞 SĐT:</strong> {notification.phone}
            </p>
            <p>
              <strong>🏥 Khoa:</strong> {notification.department}
            </p>
            <p>
              <strong>📅 Ngày khám:</strong>{" "}
              {new Date(notification.appointmentDate).toLocaleDateString(
                "vi-VN"
              )}
            </p>
            {notification.symptoms && (
              <p>
                <strong>📝 Triệu chứng:</strong>{" "}
                {notification.symptoms.substring(0, 100)}...
              </p>
            )}
          </div>
          <div className="notification-time">
            {new Date(notification.createdAt).toLocaleTimeString("vi-VN")}
          </div>
        </div>
        <div className="notification-actions">
          <button
            className="btn-quick-approve"
            onClick={() => onQuickApprove(notification)}
          >
            ⚡ Duyệt nhanh
          </button>
          <button
            className="btn-approve"
            onClick={() => onApprove(notification)}
          >
            ✅ Duyệt đơn
          </button>
          <button
            className="btn-reject"
            onClick={() => onReject(notification.id)}
          >
            ❌ Từ chối
          </button>
        </div>
      </div>
    </div>
  );
};

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

  // State cho thông báo
  const [newAppointmentNotification, setNewAppointmentNotification] =
    useState(null);
  const [showNotification, setShowNotification] = useState(false);

  // Refs
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
  }, [appointments, filters]);

  // Phát âm thanh thông báo
  const playNotificationSound = () => {
    if (notificationSoundRef.current) {
      notificationSoundRef.current.playSound();
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

      // PHÁT HIỆN ĐƠN MỚI CẦN XỬ LÝ
      if (appointmentsWithPayment.length > appointments.length) {
        const newAppointments = appointmentsWithPayment.slice(
          appointments.length
        );
        const newPendingAppointments = newAppointments.filter(
          (app) =>
            app.status === "NEEDS_MANUAL_REVIEW" || app.status === "PENDING"
        );

        // CHỈ HIỆN THÔNG BÁO NẾU CÓ ĐƠN MỚI VÀ CHƯA CÓ THÔNG BÁO NÀO ĐANG HIỆN
        if (newPendingAppointments.length > 0 && !showNotification) {
          const latestNewAppointment = newPendingAppointments[0];

          // KIỂM TRA XEM ĐƠN NÀY ĐÃ TỪNG ĐƯỢC THÔNG BÁO CHƯA
          if (
            !newAppointmentNotification ||
            newAppointmentNotification.id !== latestNewAppointment.id
          ) {
            setNewAppointmentNotification(latestNewAppointment);
            setShowNotification(true);
            playNotificationSound();

            // Tự động ẩn thông báo sau 15 giây
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      APPROVED: { label: "ĐÃ DUYỆT", class: "status-approved" },
      NEEDS_MANUAL_REVIEW: { label: "CẦN XỬ LÝ", class: "status-pending" },
      PENDING: { label: "CHỜ DUYỆT", class: "status-pending" },
      REJECTED: { label: "ĐÃ TỪ CHỐI", class: "status-rejected" },
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
      "Đã thanh toán": { label: "ĐÃ THANH TOÁN", class: "payment-status-paid" },
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

  const handleCloseNotification = () => {
    setShowNotification(false);
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
      {/* Component âm thanh */}
      <NotificationSound ref={notificationSoundRef} />

      {/* Thông báo đơn mới - CHỈ HIỆN KHI CÓ ĐƠN MỚI THỰC SỰ */}
      {showNotification && (
        <NewAppointmentNotification
          notification={newAppointmentNotification}
          onClose={handleCloseNotification}
          onQuickApprove={handleQuickApprove}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      <div className="admin-header">
        <h1>🔄 Quản lý Lịch hẹn Bệnh nhân</h1>
        <p>Quản lý và xử lý các đơn đăng ký khám bệnh</p>
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
        <div className="stat-card unpaid-stats">
          <h3>Chờ thanh toán</h3>
          <p className="stat-number">{statsData.unpaid}</p>
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
            placeholder="Tên, SĐT, Email, Khoa..."
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
          <div className="header-actions">
            <button className="refresh-btn" onClick={fetchAppointments}>
              🔄 Làm mới
            </button>
          </div>
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
                } ${appointment.isNew ? "new-appointment" : ""}`}
                id={`appointment-${appointment.id}`}
              >
                {/* Card Header - Luôn hiển thị */}
                <div className="card-header">
                  <div className="card-main-info">
                    <h3>
                      {appointment.fullName || "Chưa có tên"} - #{" "}
                      {appointment.id}
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
                      <span className="label">📞 SĐT:</span>
                      <span>{appointment.phone || "Chưa có"}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">📧 Email:</span>
                      <span>{appointment.email || "Chưa có"}</span>
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

                    {/* HIỂN THỊ BÁC SĨ NGAY TRONG BASIC INFO NẾU CÓ */}
                    {appointment.doctorId && (
                      <div className="info-item full-width">
                        <span className="label">👨‍⚕️ Bác sĩ:</span>
                        <div className="doctor-info-compact">
                          <strong>
                            {appointment.doctor?.fullName || "Đã phân công"}
                          </strong>
                          {(appointment.doctor?.degree ||
                            appointment.doctor?.position) && (
                            <div className="doctor-credentials-compact">
                              {appointment.doctor?.degree && (
                                <span className="doctor-degree">
                                  {appointment.doctor.degree}
                                </span>
                              )}
                              <p> - </p>
                              {appointment.doctor?.position && (
                                <span className="doctor-position">
                                  {appointment.doctor.position}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details - Chỉ hiển thị khi expanded */}
                {expandedCard === appointment.id && (
                  <div className="card-expanded-details">
                    <div className="details-section">
                      <h4>Thông tin chi tiết</h4>
                      <div className="details-grid">
                        <div className="detail-item">
                          <span className="label">👤 Họ tên:</span>
                          <span>{appointment.fullName || "Chưa có"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">📞 Điện thoại:</span>
                          <span>{appointment.phone || "Chưa có"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">📧 Email:</span>
                          <span>{appointment.email || "Chưa có"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">🏥 Khoa khám:</span>
                          <span>{appointment.department || "Chưa có"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Thông tin buổi khám cho đơn đã duyệt */}
                    {appointment.status === "APPROVED" && (
                      <div className="details-section approved-section">
                        <h4>Thông tin buổi khám</h4>
                        <div className="appointment-details">
                          {appointment.assignedSession && (
                            <div className="detail-row">
                              <span className="label">🕒 Buổi khám:</span>
                              <span>{appointment.assignedSession}</span>
                            </div>
                          )}
                          {appointment.queueNumber && (
                            <div className="detail-row">
                              <span className="label">🎯 Số thứ tự:</span>
                              <span className="queue-number">
                                {appointment.queueNumber}
                              </span>
                            </div>
                          )}
                          {appointment.expectedTimeSlot && (
                            <div className="detail-row">
                              <span className="label">
                                ⏰ Khung giờ dự kiến:
                              </span>
                              <span>{appointment.expectedTimeSlot}</span>
                            </div>
                          )}
                          {appointment.roomNumber && (
                            <div className="detail-row">
                              <span className="label">🚪 Phòng khám:</span>
                              <span>{appointment.roomNumber}</span>
                            </div>
                          )}
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

                    {/* Action Buttons */}
                    <div className="card-actions">
                      {(appointment.status === "APPROVED" ||
                        appointment.paymentStatus === "Đã thanh toán") && (
                        <div className="approved-info">
                          <span className="success-text">✅ Đã duyệt</span>
                          {appointment.autoApproved && (
                            <span className="auto-badge">🤖 Tự động</span>
                          )}
                        </div>
                      )}

                      {appointment.status === "NEEDS_MANUAL_REVIEW" && (
                        <div className="approval-actions">
                          <button
                            className="btn-quick-approve"
                            onClick={() => handleQuickApprove(appointment)}
                            title="Duyệt nhanh với bác sĩ và khung giờ ngẫu nhiên"
                          >
                            ⚡ Duyệt nhanh
                          </button>
                          <button
                            className="btn-approve"
                            onClick={() => handleApprove(appointment)}
                            title="Chọn bác sĩ và khung giờ cụ thể"
                          >
                            ✅ Duyệt đơn
                          </button>
                          <button
                            className="btn-reject"
                            onClick={() => handleReject(appointment.id)}
                          >
                            ❌ Từ chối
                          </button>
                        </div>
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

                    {/* Notes */}
                    <div className="appointment-notes">
                      <p>
                        💡 <strong>Thông tin quản lý:</strong> Đơn khám #{" "}
                        {appointment.id}
                      </p>
                      {appointment.status === "APPROVED" && (
                        <p>
                          ✅ <strong>Trạng thái:</strong> Lịch hẹn đã được xác
                          nhận
                        </p>
                      )}
                      {appointment.status === "NEEDS_MANUAL_REVIEW" && (
                        <p>
                          ⚠️ <strong>Yêu cầu:</strong> Cần xử lý thủ công - phân
                          công bác sĩ và khung giờ
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

      {/* Modal duyệt đơn */}
      {showApproveModal && (
        <div className="modal-overlay">
          <div className="modal-content approve-modal">
            <div className="modal-header">
              <h3>✅ Duyệt Đơn Khám</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedDoctorId(null);
                  setSelectedTimeSlot("");
                  setAvailableTimeSlots([]);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="appointment-info">
                <h4>Thông tin đơn:</h4>
                <p>
                  <strong>Bệnh nhân:</strong> {selectedAppointment?.fullName}
                </p>
                <p>
                  <strong>Khoa:</strong> {selectedAppointment?.department}
                </p>
                <p>
                  <strong>Ngày khám:</strong>{" "}
                  {formatDate(selectedAppointment?.appointmentDate)}
                </p>
              </div>

              <div className="approval-options">
                <div className="doctor-selection">
                  <label>Chọn bác sĩ:</label>
                  <select
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
                        {doctor.specialty && ` - ${doctor.specialty}`}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDoctorId && (
                  <div className="time-slot-selection">
                    <label>Chọn khung giờ:</label>
                    {loadingSlots ? (
                      <div className="loading-slots">Đang tải khung giờ...</div>
                    ) : availableTimeSlots.length > 0 ? (
                      <div className="time-slots-grid">
                        {availableTimeSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
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
                      <div className="no-slots">
                        ❌ Không có khung giờ nào khả dụng
                      </div>
                    )}
                  </div>
                )}

                {selectedDoctorId && selectedTimeSlot && (
                  <button
                    className="btn-confirm-approve"
                    onClick={handleConfirmApprove}
                  >
                    ✅ Xác nhận duyệt đơn
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppointments;
