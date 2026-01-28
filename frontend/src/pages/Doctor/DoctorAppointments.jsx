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

  // Ham fetch voi token
  const fetchWithAuth = async (url, options = {}) => {
    const user = JSON.parse(localStorage.getItem("user"));

    let headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (user && user.token) {
      headers.Authorization = "Bearer " + user.token;
    }

    const config = {
      ...options,
      headers: headers,
    };

    const response = await fetch(url, config);

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new Error("Authentication failed");
    }

    return response;
  };

  // Lay thong tin bac si va lich hen
  useEffect(() => {
    const fetchDoctorAppointments = async () => {
      try {
        setLoading(true);
        setError("");

        const user = JSON.parse(localStorage.getItem("user"));
        console.log("Current user:", user);

        if (!user || user.role !== "DOCTOR") {
          navigate("/login");
          return;
        }

        const userId = user.id;
        console.log("User ID:", userId);

        const apiUrl =
          "http://localhost:8080/api/doctor/appointments/" + userId;
        console.log("Calling API:", apiUrl);

        const response = await fetchWithAuth(apiUrl, {
          method: "GET",
        });

        console.log("Response status:", response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("HTTP Error:", errorText);
          throw new Error(
            "HTTP error! status: " + response.status + " - " + errorText,
          );
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("Response is not JSON:", text.substring(0, 500));
          throw new Error("Server tra ve du lieu khong phai JSON.");
        }

        const data = await response.json();
        console.log("API Response:", data);

        if (data.success) {
          const allAppointments = data.appointments || [];
          console.log("Doctor's appointments:", allAppointments);

          setAppointments(allAppointments);
          setCurrentDoctor({
            id: data.doctorId,
            name: data.doctorName || user.fullName || "Bac si",
          });
          setError("");
          console.log("Loaded appointments for doctor ID:", data.doctorId);
        } else {
          throw new Error(data.message || "Loi tu server");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        const errorMessage = err.message || "Loi ket noi den server";
        setError("Loi: " + errorMessage);

        setAppointments([]);

        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
          setCurrentDoctor({
            id: user.id || "unknown",
            name: user.fullName || user.username || "Bac si",
          });
        } else {
          setCurrentDoctor({
            id: "unknown",
            name: "Bac si",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorAppointments();
  }, [navigate]);

  // Ham format date cho filter
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
      console.error("Error in formatDateForFilter:", error);
      return null;
    }
  };

  // Loc lich hen khi filters thay doi
  useEffect(() => {
    filterAppointments();
  }, [appointments, filters]);

  const filterAppointments = () => {
    let filtered = appointments;

    console.log("FILTERING - Total appointments:", appointments.length);
    console.log("Current filters:", filters);

    // Loc theo trang thai
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

    // Loc theo ngay cu the
    if (filters.date) {
      filtered = filtered.filter((apt) => {
        const aptDate = formatDateForFilter(apt.appointmentDate);
        return aptDate === filters.date;
      });
    }

    // Tim kiem
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.fullName?.toLowerCase().includes(searchLower) ||
          apt.phone?.includes(filters.search) ||
          apt.registrationNumber?.includes(filters.search) ||
          apt.department?.toLowerCase().includes(searchLower),
      );
    }

    // Sap xep
    filtered.sort((a, b) => {
      const dateA = new Date(a.appointmentDate);
      const dateB = new Date(b.appointmentDate);
      const dateCompare = dateB - dateA;
      if (dateCompare !== 0) return dateCompare;

      return (a.queueNumber || 999) - (b.queueNumber || 999);
    });

    console.log("FILTER RESULT - Showing:", filtered.length, "appointments");
    setFilteredAppointments(filtered);
  };

  // Format ngay hien thi
  const formatDate = (dateString) => {
    if (!dateString) return "Chua co";
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

  // Format tien
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  // Lay class cho trang thai
  const getStatusClass = (status) => {
    if (status === "CONFIRMED" || status === "APPROVED")
      return "status-waiting";
    if (status === "PENDING" || status === "NEEDS_MANUAL_REVIEW")
      return "status-pending";
    if (status === "COMPLETED") return "status-completed";
    if (status === "CANCELLED" || status === "REJECTED")
      return "status-cancelled";
    if (status === "IN_PROGRESS") return "status-in-progress";
    return "status-pending";
  };

  // Lay ten trang thai tieng Viet
  const getStatusText = (status) => {
    if (status === "CONFIRMED" || status === "APPROVED") return "CHO KHAM";
    if (status === "PENDING") return "CHO XAC NHAN";
    if (status === "COMPLETED") return "DA KHAM";
    if (status === "CANCELLED") return "DA HUY";
    if (status === "NEEDS_MANUAL_REVIEW") return "CHO DUYET";
    if (status === "REJECTED") return "DA TU CHOI";
    if (status === "IN_PROGRESS") return "DANG KHAM";
    return status;
  };

  // Them cac ham tro lai va su dung chung
  const getStatusBadge = (status) => {
    return (
      <span className={`status-badge ${getStatusClass(status)}`}>
        {getStatusText(status)}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    let label = "";
    let className = "";

    if (paymentStatus === "PAID") {
      label = "DA THANH TOAN";
      className = "payment-status-paid";
    } else if (paymentStatus === "UNPAID") {
      label = "CHUA THANH TOAN";
      className = "payment-status-unpaid";
    } else if (paymentStatus === "PENDING") {
      label = "DANG XU LY";
      className = "payment-status-pending";
    } else {
      label = paymentStatus;
      className = "payment-status-default";
    }

    return <span className={`payment-badge ${className}`}>{label}</span>;
  };

  // Tinh toan thong ke
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
        (apt) => apt.status === "CONFIRMED" || apt.status === "APPROVED",
      ).length,
      completed: todayAppointments.filter((apt) => apt.status === "COMPLETED")
        .length,
      pending: appointments.filter(
        (apt) =>
          apt.status === "PENDING" || apt.status === "NEEDS_MANUAL_REVIEW",
      ).length,
    };
  };

  const statsData = calculateStats();

  // Toggle card expand
  const toggleCardExpand = (appointmentId) => {
    if (expandedCard === appointmentId) {
      setExpandedCard(null);
    } else {
      setExpandedCard(appointmentId);
    }
  };

  // Xu ly bat dau kham
  const handleStartExamination = async (appointmentId) => {
    setActionLoading(appointmentId);
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user || !user.token) {
        throw new Error(
          "Khong tim thay thong tin dang nhap. Vui long dang nhap lai.",
        );
      }

      const appointment = appointments.find((apt) => apt.id === appointmentId);
      if (!appointment) {
        throw new Error("Khong tim thay thong tin lich hen");
      }

      console.log("Current user:", user);
      console.log("Current doctor:", currentDoctor);
      console.log("Appointment:", appointment);

      const appointmentDoctorId = appointment.doctorId;

      if (!appointmentDoctorId) {
        throw new Error(
          "Lich hen chua duoc phan cong cho bac si. Vui long lien he quan tri vien.",
        );
      }

      console.log("Using appointment doctor ID:", appointmentDoctorId);

      if (appointment && appointment.queueNumber) {
        alert(
          "DANG GOI SO THU TU: " +
            appointment.queueNumber +
            "\nBENH NHAN: " +
            appointment.fullName +
            "\nVUI LONG DEN PHONG KHAM!",
        );
      }

      const requestBody = {
        doctorId: appointmentDoctorId,
      };

      console.log("Sending request to start examination...");
      console.log("Request body:", requestBody);
      console.log("Using token:", user.token ? "Present" : "Missing");

      const response = await fetchWithAuth(
        "http://localhost:8080/api/doctor/medical-records/" +
          appointmentId +
          "/start",
        {
          method: "POST",
          body: JSON.stringify(requestBody),
        },
      );

      console.log("Start examination response status:", response.status);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            "Truy cap bi tu choi. Vui long kiem tra quyen truy cap hoac dang nhap lai.",
          );
        } else if (response.status === 401) {
          localStorage.removeItem("user");
          navigate("/login");
          throw new Error("Phien dang nhap het han. Vui long dang nhap lai.");
        } else if (response.status === 404) {
          throw new Error("Khong tim thay lich hen.");
        } else {
          const errorText = await response.text();
          console.error("Server error response:", errorText);
          throw new Error("Loi server: " + response.status);
        }
      }

      const result = await response.json();
      console.log("Start examination result:", result);

      if (result.success) {
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === appointmentId
              ? {
                  ...apt,
                  examinationStatus: "IN_PROGRESS",
                  status: "IN_PROGRESS",
                  ...result.appointment,
                }
              : apt,
          ),
        );

        alert("Bat dau kham thanh cong! Chuyen den trang kham benh...");

        navigate("/doctor/examination/" + appointmentId);
      } else {
        throw new Error(result.message || "Khong the bat dau kham");
      }
    } catch (error) {
      console.error("Loi bat dau kham:", error);
      alert("Loi khi bat dau kham: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    setActionLoading(appointmentId);
    try {
      const response = await fetchWithAuth(
        "http://localhost:8080/api/doctor/appointments/" +
          appointmentId +
          "/complete",
        {
          method: "PUT",
        },
      );

      if (response.ok) {
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === appointmentId ? { ...apt, status: "COMPLETED" } : apt,
          ),
        );
        alert("Da danh dau da kham thanh cong!");
      } else {
        throw new Error("Khong the danh dau da kham");
      }
    } catch (error) {
      console.error("Loi danh dau da kham:", error);
      alert("Loi khi danh dau da kham");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsMissed = async (appointmentId) => {
    if (!window.confirm("Xac nhan benh nhan khong di kham?")) {
      return;
    }

    setActionLoading(appointmentId);
    try {
      const response = await fetchWithAuth(
        "http://localhost:8080/api/doctor/medical-records/" +
          appointmentId +
          "/missed",
        {
          method: "PUT",
        },
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
              : apt,
          ),
        );
        alert("Da danh dau khong di kham!");
      } else {
        throw new Error("Khong the danh dau khong di kham");
      }
    } catch (error) {
      console.error("Loi danh dau khong di kham:", error);
      alert("Loi khi danh dau khong di kham");
    } finally {
      setActionLoading(null);
    }
  };

  // Ham chuyen den trang ke don thuoc
  const handlePrescribeMedication = (appointmentId) => {
    navigate("/doctor/prescription/" + appointmentId);
  };

  // Ham kiem tra co nen hien thi nut ke don thuoc khong
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
          <p>Dang tai du lieu lich hen...</p>
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
            <h1>Quan Ly Lich Hen Kham Benh</h1>
            <p>Quan ly va kham benh cho benh nhan</p>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={() => window.location.reload()} title="Lam moi">
            <i className="bi-arrow-clockwise"></i>
            <span>Lam moi</span>
          </button>
          {statsData.waiting > 0 && (
            <div className="pending-badge">
              <span>{statsData.waiting}</span>
              <span>Benh nhan cho kham</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <i className="bi-exclamation-triangle"></i>
          <div>
            <h4>Da xay ra loi!</h4>
            <p>{error}</p>
          </div>
          <button onClick={() => window.location.reload()}>Thu lai</button>
        </div>
      )}

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <i className="bi-people"></i>
          <div>
            <h3>Tong lich hen</h3>
            <p>{statsData.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <i className="bi-calendar-check"></i>
          <div>
            <h3>Hom nay</h3>
            <p>{statsData.today}</p>
          </div>
        </div>
        <div className="stat-card">
          <i className="bi-clock"></i>
          <div>
            <h3>Cho kham</h3>
            <p>{statsData.waiting}</p>
            {statsData.waiting > 0 && (
              <div className="stat-badge">Can kham ngay</div>
            )}
          </div>
        </div>
        <div className="stat-card">
          <i className="bi-check-circle"></i>
          <div>
            <h3>Da kham</h3>
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
          <span>Hom nay</span>
          <span className="tab-count">{statsData.today}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "waiting" ? "active" : ""} ${
            statsData.waiting > 0 ? "has-pending" : ""
          }`}
          onClick={() => setActiveTab("waiting")}
        >
          <i className="bi-clock"></i>
          <span>Cho kham</span>
          <span className="tab-count badge">{statsData.waiting}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          <i className="bi-check-circle"></i>
          <span>Da kham</span>
          <span className="tab-count">{statsData.completed}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <i className="bi-list"></i>
          <span>Tat ca</span>
          <span className="tab-count">{statsData.total}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="status-filter">
            <i className="bi-funnel"></i> Trang thai
          </label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="ALL">Tat ca trang thai</option>
            <option value="TODAY">Hom nay</option>
            <option value="CONFIRMED">Cho kham</option>
            <option value="APPROVED">Da duyet</option>
            <option value="PENDING">Cho xac nhan</option>
            <option value="COMPLETED">Da kham</option>
            <option value="CANCELLED">Da huy</option>
            <option value="IN_PROGRESS">Dang kham</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="date-filter">
            <i className="bi-calendar"></i> Ngay kham
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
            <i className="bi-search"></i> Tim kiem
          </label>
          <div className="search-wrapper">
            <input
              id="search-filter"
              type="text"
              placeholder="Ten, SDT, ma don, khoa..."
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
          <i className="bi-x-circle"></i> Xoa bo loc
        </button>
      </div>

      {/* Appointments List */}
      <div className="appointments-list">
        <div className="list-header">
          <h2>
            <i className="bi-person-lines-fill"></i>
            Danh sach benh nhan
            <span className="count-badge">{filteredAppointments.length}</span>
          </h2>
          <button
            className="refresh-btn"
            onClick={() => window.location.reload()}
          >
            <i className="bi-arrow-clockwise"></i>
            Lam moi
          </button>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="empty-state">
            <i className="bi-person-x"></i>
            <h3>Khong co benh nhan nao</h3>
            <p>Vui long kiem tra lai bo loc hoac ngay kham</p>
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
                        {getStatusBadge(appointment.status)}
                        {getPaymentStatusBadge(
                          appointment.paymentStatus || "UNPAID",
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
                        <i className="bi-telephone"></i> SDT
                      </span>
                      <span className="info-value">
                        {appointment.phone || "Chua co"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        <i className="bi-envelope"></i> Email
                      </span>
                      <span className="info-value">
                        {appointment.email || "Chua co"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        <i className="bi-hospital"></i> Khoa
                      </span>
                      <span className="info-value">
                        {appointment.department || "Chua co"}
                      </span>
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-item">
                      <span className="info-label">
                        <i className="bi-calendar-event"></i> Ngay kham
                      </span>
                      <span className="info-value">
                        {formatDate(appointment.appointmentDate)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        <i className="bi-cash"></i> Phi kham
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
                        <i className="bi-sort-numeric-up"></i> So thu tu
                      </span>
                      <span className="info-value queue-number">
                        {appointment.queueNumber
                          ? "#" + appointment.queueNumber
                          : "Chua co"}
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
                            <i className="bi-clipboard-pulse"></i> TRIEU CHUNG
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
                          <i className="bi-calendar-check"></i> THONG TIN KHAM
                        </h4>
                        <div className="section-divider"></div>
                      </div>
                      <div className="appointment-info">
                        <div>
                          <span>Gio hen:</span>{" "}
                          {appointment.expectedTimeSlot || "Chua co"}
                        </div>
                        {appointment.roomNumber && (
                          <div>
                            <span>Phong kham:</span> {appointment.roomNumber}
                          </div>
                        )}
                        {appointment.dob && (
                          <div>
                            <span>Ngay sinh:</span>{" "}
                            {formatDate(appointment.dob)}
                          </div>
                        )}
                        {appointment.gender && (
                          <div>
                            <span>Gioi tinh:</span> {appointment.gender}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="actions-section">
                      <div className="section-header">
                        <h4 className="section-title">
                          <i className="bi-gear"></i> THAO TAC
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
                                ? "Dang xu ly..."
                                : "Bat dau kham"}
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
                                ? "Dang xu ly..."
                                : "Danh dau da kham"}
                            </button>
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
                                ? "Dang xu ly..."
                                : "Khong di kham"}
                            </button>
                          </>
                        )}

                        {appointment.status === "IN_PROGRESS" && (
                          <button
                            className="action-btn start-exam-btn"
                            onClick={() =>
                              navigate("/doctor/examination/" + appointment.id)
                            }
                          >
                            <i className="bi-heart-pulse"></i>
                            Tiep tuc kham
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
                              Ke don thuoc
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
              <h4>Co benh nhan moi can kham!</h4>
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
                <i className="bi-lightning"></i> Bat dau kham
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
