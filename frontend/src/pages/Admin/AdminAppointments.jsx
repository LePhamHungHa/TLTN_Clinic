import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../../css/AdminAppointments.css";

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
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
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [newAppointmentNotification, setNewAppointmentNotification] =
    useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [lastAppointmentCount, setLastAppointmentCount] = useState(0);

  const notificationSoundRef = useRef(null);
  const pageRef = useRef(1); // Lưu trang hiện tại trong ref

  const getToken = useCallback(() => {
    const userData = localStorage.getItem("user");
    if (!userData) return null;
    try {
      return JSON.parse(userData)?.token || null;
    } catch {
      return null;
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        setErrorMessage("Vui lòng đăng nhập lại");
        return;
      }

      const response = await axios.get(
        "http://localhost:8080/api/admin/registrations",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const appointmentsWithPayment = await Promise.all(
        response.data.map(async (appointment) => {
          try {
            const paymentResponse = await axios.get(
              `http://localhost:8080/api/admin/registrations/${appointment.id}/payment-status`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            let paymentStatus =
              paymentResponse.data.paymentStatus || "Chưa thanh toán";
            if (paymentStatus === "Thành công") paymentStatus = "Đã thanh toán";

            return {
              ...appointment,
              paymentStatus,
              paymentAmount: paymentResponse.data.amount,
              paymentDate: paymentResponse.data.paymentDate,
            };
          } catch {
            return {
              ...appointment,
              paymentStatus: "Chưa thanh toán",
              paymentAmount: null,
              paymentDate: null,
            };
          }
        })
      );

      // Kiểm tra đơn mới cần xử lý
      if (appointmentsWithPayment.length > lastAppointmentCount) {
        const newAppointments =
          appointmentsWithPayment.slice(lastAppointmentCount);
        const newPending = newAppointments.filter(
          (app) =>
            app.status === "NEEDS_MANUAL_REVIEW" || app.status === "PENDING"
        );

        if (newPending.length > 0) {
          const latestNewAppointment = newPending[0];
          setNewAppointmentNotification(latestNewAppointment);
          setShowNotification(true);

          // Phát âm thanh thông báo
          if (notificationSoundRef.current) {
            notificationSoundRef.current.currentTime = 0;
            notificationSoundRef.current.play().catch(console.error);
          }

          // Auto hide sau 15 giây
          setTimeout(() => {
            setShowNotification(false);
          }, 15000);
        }

        setLastAppointmentCount(appointmentsWithPayment.length);
      }

      setAppointments(appointmentsWithPayment);
      setErrorMessage(null);
    } catch (error) {
      console.error("Lỗi tải danh sách:", error);
      setErrorMessage(
        error.response?.status === 403
          ? "Không có quyền truy cập"
          : error.response?.status === 401
          ? "Phiên đăng nhập hết hạn"
          : "Không thể tải danh sách lịch hẹn"
      );
    } finally {
      setLoading(false);
    }
  }, [getToken, lastAppointmentCount]);

  // Tính toán filtered appointments
  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    if (activeTab !== "all") {
      const filtersMap = {
        pending: (app) =>
          app.status === "NEEDS_MANUAL_REVIEW" || app.status === "PENDING",
        approved: (app) => app.status === "APPROVED",
        rejected: (app) => app.status === "REJECTED",
        paid: (app) => app.paymentStatus === "Đã thanh toán",
        unpaid: (app) => app.paymentStatus === "Chưa thanh toán",
      };
      filtered = filtered.filter(filtersMap[activeTab] || (() => true));
    }

    if (filters.status !== "ALL")
      filtered = filtered.filter((app) => app.status === filters.status);
    if (filters.paymentStatus !== "ALL")
      filtered = filtered.filter(
        (app) => app.paymentStatus === filters.paymentStatus
      );
    if (filters.date)
      filtered = filtered.filter((app) => app.appointmentDate === filters.date);
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

    return filtered;
  }, [appointments, activeTab, filters]);

  // Paginated appointments
  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAppointments.slice(start, start + itemsPerPage);
  }, [filteredAppointments, currentPage]);

  // Stats
  const statsData = useMemo(() => {
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
  }, [appointments]);

  // Lấy danh sách đơn cần xử lý
  const pendingAppointments = useMemo(() => {
    return appointments.filter(
      (app) => app.status === "NEEDS_MANUAL_REVIEW" || app.status === "PENDING"
    );
  }, [appointments]);

  // Effects
  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 10000);
    return () => clearInterval(interval);
  }, [fetchAppointments]);

  // Sửa logic reset trang - chỉ reset khi filters hoặc activeTab thay đổi
  useEffect(() => {
    // Lưu trang hiện tại vào ref trước khi reset
    pageRef.current = currentPage;

    // Chỉ reset về trang 1 khi filters hoặc tab thay đổi
    setCurrentPage(1);
  }, [filters, activeTab]);

  // Kiểm tra trang hiện tại có hợp lệ không khi filteredAppointments thay đổi
  useEffect(() => {
    const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

    // Nếu không có dữ liệu, reset về trang 1
    if (filteredAppointments.length === 0) {
      setCurrentPage(1);
      return;
    }

    // Nếu trang hiện tại không hợp lệ (lớn hơn tổng số trang), điều chỉnh về trang cuối
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredAppointments, currentPage, itemsPerPage]);

  // Handlers
  const handleApprove = async (appointment) => {
    setSelectedAppointment(appointment);
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
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAvailableDoctors(response.data);
      setShowApproveModal(true);
    } catch {
      alert("Lỗi khi lấy danh sách bác sĩ");
    }
  };

  const handleQuickApprove = async (appointment) => {
    if (
      !window.confirm(
        `Duyệt đơn của ${appointment.fullName} với bác sĩ ngẫu nhiên?`
      )
    )
      return;

    try {
      const token = getToken();
      if (!token) return alert("Vui lòng đăng nhập lại");

      await axios.post(
        `http://localhost:8080/api/admin/registrations/${appointment.id}/quick-approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Đã duyệt đơn thành công!");
      fetchAppointments();
      setShowNotification(false);
    } catch {
      alert("Lỗi khi duyệt đơn nhanh");
    }
  };

  const handleBatchApprove = async () => {
    if (pendingAppointments.length === 0) {
      alert("Không có đơn nào cần duyệt!");
      return;
    }

    if (
      !window.confirm(
        `Bạn có chắc muốn duyệt nhanh tất cả ${pendingAppointments.length} đơn chờ xử lý?`
      )
    )
      return;

    try {
      const token = getToken();
      if (!token) return alert("Vui lòng đăng nhập lại");

      let successCount = 0;
      let failCount = 0;

      for (const appointment of pendingAppointments) {
        try {
          await axios.post(
            `http://localhost:8080/api/admin/registrations/${appointment.id}/quick-approve`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          successCount++;
        } catch (error) {
          console.error(`Lỗi khi duyệt đơn ${appointment.id}:`, error);
          failCount++;
        }
      }

      alert(
        `Đã duyệt ${successCount} đơn thành công! ${
          failCount > 0 ? `(${failCount} đơn thất bại)` : ""
        }`
      );
      fetchAppointments();
      setShowNotification(false);
    } catch {
      alert("Lỗi khi duyệt hàng loạt đơn");
    }
  };

  const handleReject = async (appointmentId) => {
    const reason = prompt("Nhập lý do từ chối:");
    if (!reason) return;

    try {
      const token = getToken();
      if (!token) return alert("Vui lòng đăng nhập lại");

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
    } catch {
      alert("Lỗi khi từ chối đơn");
    }
  };

  const handleDoctorSelect = async (doctorId) => {
    setSelectedDoctorId(doctorId);
    setSelectedTimeSlot("");

    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.get(
        `http://localhost:8080/api/admin/doctors/${doctorId}/available-slots`,
        {
          params: { appointmentDate: selectedAppointment?.appointmentDate },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAvailableTimeSlots(response.data);
    } catch {
      setAvailableTimeSlots([]);
    }
  };

  const handleConfirmApprove = async () => {
    if (!selectedAppointment || !selectedDoctorId || !selectedTimeSlot) {
      alert("Vui lòng chọn bác sĩ và khung giờ");
      return;
    }

    try {
      const token = getToken();
      if (!token) return alert("Vui lòng đăng nhập lại");

      await axios.post(
        `http://localhost:8080/api/admin/registrations/${selectedAppointment.id}/approve-with-assignment`,
        null,
        {
          params: { doctorId: selectedDoctorId, timeSlot: selectedTimeSlot },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Đã duyệt đơn thành công!");
      setShowApproveModal(false);
      fetchAppointments();
      setShowNotification(false);
    } catch {
      alert("Lỗi khi duyệt đơn");
    }
  };

  const toggleCardExpand = (appointmentId) => {
    setExpandedCard((prev) => (prev === appointmentId ? null : appointmentId));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    pageRef.current = page; // Cập nhật ref
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa có";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Chưa có";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-appointments-container">
      {/* Header */}
      <div className="admin-header">
        <div className="header-title">
          <i className="bi-calendar-check"></i>
          <div>
            <h1>Quản lý Lịch hẹn</h1>
            <p>Quản lý và xử lý các đơn đăng ký khám bệnh</p>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={fetchAppointments} title="Làm mới">
            <i className="bi-arrow-clockwise"></i>
            <span>Làm mới</span>
          </button>
          {statsData.pending > 0 && (
            <div className="pending-badge">
              <span>{statsData.pending}</span>
              <span>Đơn chờ xử lý</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="error-alert">
          <i className="bi-exclamation-triangle"></i>
          <div>
            <h4>Đã xảy ra lỗi!</h4>
            <p>{errorMessage}</p>
          </div>
          <button onClick={fetchAppointments}>Thử lại</button>
        </div>
      )}

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <i className="bi-people"></i>
          <div>
            <h3>Tổng đơn</h3>
            <p>{statsData.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <i className="bi-check-circle"></i>
          <div>
            <h3>Đã duyệt</h3>
            <p>{statsData.approved}</p>
          </div>
        </div>
        <div className="stat-card">
          <i className="bi-clock"></i>
          <div>
            <h3>Chờ xử lý</h3>
            <p>{statsData.pending}</p>
            {statsData.pending > 0 && (
              <div className="stat-badge">Cần xử lý</div>
            )}
          </div>
        </div>
        <div className="stat-card">
          <i className="bi-credit-card"></i>
          <div>
            <h3>Đã thanh toán</h3>
            <p>{statsData.paid}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <i className="bi-list"></i>
          <span>Tất cả</span>
          <span className="tab-count">{appointments.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "pending" ? "active" : ""} ${
            statsData.pending > 0 ? "has-pending" : ""
          }`}
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

      {/* Batch Approve Button */}
      {activeTab === "pending" && pendingAppointments.length > 0 && (
        <div className="batch-approve-section">
          <button className="batch-approve-btn" onClick={handleBatchApprove}>
            <i className="bi-check-all"></i>
            Duyệt nhanh tất cả ({pendingAppointments.length}) đơn chờ xử lý
          </button>
          <small className="batch-approve-note">
            <i className="bi-info-circle"></i> Tất cả đơn sẽ được gán bác sĩ và
            khung giờ ngẫu nhiên
          </small>
        </div>
      )}

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
            <option value="APPROVED">Đã duyệt</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="NEEDS_MANUAL_REVIEW">Cần xử lý</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="payment-filter">
            <i className="bi-cash-coin"></i> Thanh toán
          </label>
          <select
            id="payment-filter"
            value={filters.paymentStatus}
            onChange={(e) =>
              setFilters({ ...filters, paymentStatus: e.target.value })
            }
          >
            <option value="ALL">Tất cả thanh toán</option>
            <option value="Đã thanh toán">Đã thanh toán</option>
            <option value="Chưa thanh toán">Chưa thanh toán</option>
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
              paymentStatus: "ALL",
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
            <i className="bi-list-check"></i>
            Danh sách Lịch hẹn
            {/* <span className="count-badge">{filteredAppointments.length}</span> */}
          </h2>
          <button className="refresh-btn" onClick={fetchAppointments}>
            <i className="bi-arrow-clockwise"></i>
            Làm mới
          </button>
        </div>

        {paginatedAppointments.length === 0 ? (
          <div className="empty-state">
            <i className="bi-calendar-x"></i>
            <h3>Không có lịch hẹn nào</h3>
            <p>
              {appointments.length === 0
                ? "Chưa có đơn đăng ký"
                : "Không tìm thấy kết quả"}
            </p>
          </div>
        ) : (
          <>
            <div className="appointments">
              {paginatedAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  isExpanded={expandedCard === appointment.id}
                  onToggleExpand={toggleCardExpand}
                  onQuickApprove={handleQuickApprove}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  formatDate={formatDate}
                  formatDateTime={formatDateTime}
                />
              ))}
            </div>

            {/* Pagination */}
            {filteredAppointments.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(
                  filteredAppointments.length / itemsPerPage
                )}
                totalItems={filteredAppointments.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedAppointment && (
        <ApproveModal
          selectedAppointment={selectedAppointment}
          availableDoctors={availableDoctors}
          selectedDoctorId={selectedDoctorId}
          availableTimeSlots={availableTimeSlots}
          selectedTimeSlot={selectedTimeSlot}
          onDoctorSelect={handleDoctorSelect}
          onTimeSlotSelect={setSelectedTimeSlot}
          onConfirm={handleConfirmApprove}
          onClose={() => setShowApproveModal(false)}
          formatDate={formatDate}
        />
      )}

      {/* Notification */}
      {showNotification && newAppointmentNotification && (
        <NotificationToast
          notification={newAppointmentNotification}
          onClose={() => setShowNotification(false)}
          onQuickApprove={() => {
            handleQuickApprove(newAppointmentNotification);
            setShowNotification(false);
          }}
          onApprove={() => {
            handleApprove(newAppointmentNotification);
            setShowNotification(false);
          }}
          formatDate={formatDate}
        />
      )}

      {/* Audio element cho thông báo */}
      <audio
        ref={notificationSoundRef}
        preload="auto"
        style={{ display: "none" }}
      >
        <source src="/notification.mp3" type="audio/mpeg" />
        <source src="/notification.wav" type="audio/wav" />
        <source src="/notification.ogg" type="audio/ogg" />
        Trình duyệt của bạn không hỗ trợ thẻ audio.
      </audio>
    </div>
  );
};

// Sub Components
const AppointmentCard = React.memo(
  ({
    appointment,
    isExpanded,
    onToggleExpand,
    onQuickApprove,
    onApprove,
    onReject,
    formatDate,
    formatDateTime,
  }) => {
    const getStatusText = (status) => {
      const statusMap = {
        APPROVED: "ĐÃ DUYỆT",
        NEEDS_MANUAL_REVIEW: "CẦN XỬ LÝ",
        PENDING: "CHỜ DUYỆT",
        REJECTED: "ĐÃ TỪ CHỐI",
      };
      return statusMap[status] || status;
    };

    return (
      <div
        className={`appointment-card ${isExpanded ? "expanded" : ""} ${
          appointment.status === "NEEDS_MANUAL_REVIEW" ? "highlight" : ""
        }`}
      >
        <div
          className="card-header"
          onClick={() => onToggleExpand(appointment.id)}
        >
          <div className="patient-info">
            <i className="bi-person-circle"></i>
            <div>
              <h3>
                {appointment.fullName || "Chưa có tên"}{" "}
                <span className="appointment-id">ID: #{appointment.id}</span>
              </h3>
              <div className="status-container">
                <span
                  className={`status-badge status-${appointment.status.toLowerCase()}`}
                >
                  {getStatusText(appointment.status)}
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
          <button className="expand-toggle">
            <i className={`bi-chevron-${isExpanded ? "up" : "down"}`}></i>
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
                  appointment.paymentStatus === "Đã thanh toán"
                    ? "paid"
                    : "unpaid"
                }`}
              >
                {appointment.examinationFee?.toLocaleString() || "0"} VND
              </span>
            </div>
          </div>
        </div>

        {isExpanded && (
          <ExpandedDetails
            appointment={appointment}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            onQuickApprove={onQuickApprove}
            onApprove={onApprove}
            onReject={onReject}
          />
        )}
      </div>
    );
  }
);

const ExpandedDetails = React.memo(
  ({
    appointment,
    // formatDate,
    formatDateTime,
    onQuickApprove,
    onApprove,
    onReject,
  }) => {
    return (
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
              <i className="bi-calendar-check"></i> THÔNG TIN BUỔI KHÁM
            </h4>
            <div className="section-divider"></div>
          </div>
          <div className="appointment-info">
            <div>
              <span>Khoa khám:</span> {appointment.department}
            </div>
            {appointment.doctor && (
              <>
                <h5>
                  <i className="bi-person-badge"></i> BÁC SĨ PHÂN CÔNG
                </h5>
                <div>
                  <span>Tên:</span> {appointment.doctor.fullName}
                </div>
                {appointment.doctor.degree && (
                  <div>
                    <span>Học vị:</span> {appointment.doctor.degree}
                  </div>
                )}
                {appointment.doctor.position && (
                  <div>
                    <span>Chức vụ:</span> {appointment.doctor.position}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {appointment.paymentStatus === "Đã thanh toán" &&
          appointment.paymentDate && (
            <div className="detail-section payment-section">
              <div className="section-header">
                <h4 className="section-title">
                  <i className="bi-credit-card"></i> THANH TOÁN
                </h4>
                <div className="section-divider"></div>
              </div>
              <div className="payment-info">
                <div>
                  <span>Ngày thanh toán:</span>{" "}
                  {formatDateTime(appointment.paymentDate)}
                </div>
                {appointment.paymentAmount && (
                  <div>
                    <span>Số tiền:</span>{" "}
                    {appointment.paymentAmount.toLocaleString()} VND
                  </div>
                )}
              </div>
            </div>
          )}

        <div className="status-section">
          <div className="section-header">
            <h4 className="section-title">
              <i className="bi-info-circle"></i> TRẠNG THÁI
            </h4>
            <div className="section-divider"></div>
          </div>
          <div className="status-content">
            {appointment.status === "APPROVED" && (
              <div className="approved-status">
                <i className="bi-check-circle-fill"></i>
                <span className="status-text">ĐÃ DUYỆT</span>
                {appointment.autoApproved && (
                  <span className="auto-badge">🤖 Tự động</span>
                )}
              </div>
            )}

            {appointment.status === "NEEDS_MANUAL_REVIEW" && (
              <div className="needs-review-status">
                <div className="status-main">
                  <i className="bi-exclamation-triangle-fill"></i>
                  <span className="status-text">CẦN XỬ LÝ</span>
                </div>
                <div className="status-actions">
                  <button
                    className="action-btn quick-approve-btn"
                    onClick={() => onQuickApprove(appointment)}
                  >
                    <i className="bi-lightning"></i> Duyệt nhanh
                  </button>
                  <button
                    className="action-btn approve-btn"
                    onClick={() => onApprove(appointment)}
                  >
                    <i className="bi-check-circle"></i> Duyệt đơn
                  </button>
                  <button
                    className="action-btn reject-btn"
                    onClick={() => onReject(appointment.id)}
                  >
                    <i className="bi-x-circle"></i> Từ chối
                  </button>
                </div>
              </div>
            )}

            {appointment.status === "PENDING" && (
              <div className="pending-status">
                <i className="bi-clock-fill"></i>
                <span className="status-text">CHỜ DUYỆT</span>
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
    );
  }
);

const Pagination = React.memo(
  ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) => {
    const visiblePages = () => {
      const pages = [];
      const maxVisible = 5;
      let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages, start + maxVisible - 1);

      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) pages.push(i);
      return pages;
    };

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Hiển thị{" "}
          <span className="fw-bold">
            {startItem}-{endItem}
          </span>{" "}
          trên <span className="fw-bold">{totalItems}</span> đơn
        </div>
        <div className="pagination-controls">
          <button
            className={`page-btn ${currentPage === 1 ? "disabled" : ""}`}
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <i className="bi-chevron-left"></i>
          </button>

          {visiblePages()[0] > 1 && (
            <>
              <button className="page-btn" onClick={() => onPageChange(1)}>
                1
              </button>
              {visiblePages()[0] > 2 && <span className="page-dots">...</span>}
            </>
          )}

          {visiblePages().map((page) => (
            <button
              key={page}
              className={`page-btn ${currentPage === page ? "active" : ""}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}

          {visiblePages()[visiblePages().length - 1] < totalPages && (
            <>
              {visiblePages()[visiblePages().length - 1] < totalPages - 1 && (
                <span className="page-dots">...</span>
              )}
              <button
                className="page-btn"
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            className={`page-btn ${
              currentPage === totalPages ? "disabled" : ""
            }`}
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <i className="bi-chevron-right"></i>
          </button>
        </div>
      </div>
    );
  }
);

const ApproveModal = React.memo(
  ({
    selectedAppointment,
    availableDoctors,
    selectedDoctorId,
    availableTimeSlots,
    selectedTimeSlot,
    onDoctorSelect,
    onTimeSlotSelect,
    onConfirm,
    onClose,
    formatDate,
  }) => {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="approve-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">
              <i className="bi-check-circle-fill"></i>
              <h3>Duyệt Đơn Khám</h3>
            </div>
            <button className="modal-close" onClick={onClose}>
              <i className="bi-x"></i>
            </button>
          </div>

          <div className="modal-body">
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

            <div className="selection-group">
              <label className="selection-label">
                <i className="bi-person-badge"></i> Chọn bác sĩ
              </label>
              <select
                className="doctor-select"
                value={selectedDoctorId || ""}
                onChange={(e) => onDoctorSelect(e.target.value)}
              >
                <option value="">-- Chọn bác sĩ --</option>
                {availableDoctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.fullName}
                    {doctor.degree && ` - ${doctor.degree}`}
                    {doctor.position && ` (${doctor.position})`}
                  </option>
                ))}
              </select>
            </div>

            {selectedDoctorId && (
              <div className="selection-group">
                <label className="selection-label">
                  <i className="bi-clock"></i> Chọn khung giờ
                </label>
                {availableTimeSlots.length > 0 ? (
                  <div className="time-slots">
                    {availableTimeSlots.map((slot) => (
                      <button
                        key={slot}
                        className={`time-slot-btn ${
                          selectedTimeSlot === slot ? "selected" : ""
                        }`}
                        onClick={() => onTimeSlotSelect(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="no-slots-message">
                    <i className="bi-calendar-x"></i>
                    <span>Không có khung giờ khả dụng</span>
                  </div>
                )}
              </div>
            )}

            {selectedDoctorId && selectedTimeSlot && (
              <div className="modal-actions">
                <button className="confirm-btn" onClick={onConfirm}>
                  <i className="bi-check-circle-fill"></i> Xác nhận duyệt đơn
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

const NotificationToast = React.memo(
  ({ notification, onClose, onQuickApprove, onApprove, formatDate }) => {
    return (
      <div className="notification-toast">
        <div className="toast-header">
          <div className="toast-icon">
            <i className="bi-bell-fill"></i>
          </div>
          <div className="toast-title">
            <h4>Có đơn khám mới cần xử lý!</h4>
          </div>
          <button className="toast-close" onClick={onClose}>
            <i className="bi-x"></i>
          </button>
        </div>
        <div className="toast-body">
          <p className="toast-patient">
            <strong>{notification.fullName}</strong>
          </p>
          <div className="toast-details">
            <p>
              <i className="bi-hospital"></i> {notification.department}
            </p>
            <p>
              <i className="bi-calendar"></i>{" "}
              {formatDate(notification.appointmentDate)}
            </p>
          </div>
          <div className="toast-actions">
            <button className="toast-btn quick" onClick={onQuickApprove}>
              <i className="bi-lightning"></i> Duyệt nhanh
            </button>
            <button className="toast-btn approve" onClick={onApprove}>
              <i className="bi-check-circle"></i> Duyệt đơn
            </button>
            <button className="toast-btn close" onClick={onClose}>
              <i className="bi-eye"></i> Xem sau
            </button>
          </div>
        </div>
      </div>
    );
  }
);

export default AdminAppointments;
