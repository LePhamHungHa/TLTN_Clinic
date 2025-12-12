import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import QRCode from "react-qr-code";
import {
  FaCalendar,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaHospital,
  FaDollarSign,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaDownload,
  FaShareAlt,
  FaTimes,
  FaChevronDown,
  FaChevronRight,
  FaSearch,
  FaFilter,
  FaRedo,
  FaFileAlt,
  FaCreditCard,
  FaQrcode,
  FaPrint,
  FaQuestionCircle,
  FaBell,
  FaUsers,
  FaChartLine,
  FaEye,
  FaInfoCircle,
  FaHome,
  FaPhoneAlt,
  FaExclamationTriangle,
  FaShieldAlt,
  FaUserCheck,
  FaClipboardList,
  FaReceipt,
  FaMobileAlt,
  FaCommentAlt,
  FaExternalLinkAlt,
  FaArrowRight,
  FaSpinner,
  FaAngleLeft,
  FaAngleRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaListUl,
} from "react-icons/fa";
import "../../css/AppointmentsPage.css";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [filters, setFilters] = useState({
    status: "ALL",
    paymentStatus: "ALL",
    date: "",
    search: "",
  });
  const [expandedCard, setExpandedCard] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRData, setSelectedQRData] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();

  const getToken = useCallback(() => {
    const userData = localStorage.getItem("user");
    console.log("User data từ localStorage:", userData);
    if (!userData) return null;
    try {
      return JSON.parse(userData)?.token || null;
    } catch {
      return null;
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = getToken();

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
          timeout: 15000,
        }
      );

      const appointmentsWithPayment = await Promise.all(
        response.data.map(async (appointment) => {
          let paymentStatus = "Chưa thanh toán";
          let paymentAmount = appointment.examinationFee || 0;
          let paymentDate = null;
          let paymentMethod = null;

          try {
            const paymentResponse = await axios.get(
              `http://localhost:8080/api/payments/status/${appointment.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                timeout: 8000,
              }
            );

            if (paymentResponse.data.success) {
              const paymentData = paymentResponse.data;
              if (paymentData.paymentStatus === "PAID") {
                paymentStatus = "Đã thanh toán";
                paymentMethod = paymentData.paymentMethod || "VNPAY";
              }
              paymentAmount = paymentData.amount || paymentAmount;
              paymentDate = paymentData.paymentDate;
            }
          } catch {
            if (appointment.paymentStatus === "PAID") {
              paymentStatus = "Đã thanh toán";
            }
          }

          return {
            ...appointment,
            paymentStatus,
            paymentAmount,
            paymentDate,
            paymentMethod,
          };
        })
      );

      // Sort appointments by date (newest first)
      const sortedAppointments = appointmentsWithPayment.sort((a, b) => {
        return (
          new Date(b.appointmentDate || b.createdAt) -
          new Date(a.appointmentDate || a.createdAt)
        );
      });

      setAppointments(sortedAppointments);
      setErrorMessage(null);
    } catch (error) {
      console.error("Lỗi tải lịch hẹn:", error);
      if (error.response?.status === 403) {
        setErrorMessage("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      } else if (error.response?.status === 404) {
        setErrorMessage("Không tìm thấy lịch hẹn nào.");
      } else {
        setErrorMessage(
          "Không thể tải danh sách lịch hẹn. Vui lòng thử lại sau."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, [fetchAppointments]);

  const filteredAppointments = useMemo(() => {
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
          app.department?.toLowerCase().includes(searchLower) ||
          app.symptoms?.toLowerCase().includes(searchLower) ||
          app.fullName?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [appointments, filters]);

  // Calculate pagination data
  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAppointments.slice(startIndex, endIndex);
  }, [filteredAppointments, currentPage, itemsPerPage]);

  // Calculate total pages
  useEffect(() => {
    const total = Math.ceil(filteredAppointments.length / itemsPerPage);
    setTotalPages(total || 1);

    // Reset to first page if current page is out of bounds
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [filteredAppointments, itemsPerPage, currentPage]);

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

  const generateQRData = (appointment) => {
    const removeAccents = (str) => {
      if (!str) return "";
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
    };

    const qrText = `MEDICAL_CHECKIN
ID:${appointment.registrationNumber || appointment.id}
NAME:${removeAccents(appointment.fullName)}
DEPT:${removeAccents(appointment.department)}
DATE:${formatDateForQR(appointment.appointmentDate)}
STATUS:${getStatusForQR(appointment.status)}`;

    return qrText;
  };

  const formatDateForQR = (dateString) => {
    if (!dateString) return "NULL";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const getStatusForQR = (status) => {
    const statusMap = {
      APPROVED: "DA_DUYET",
      PENDING: "CHO_DUYET",
      NEEDS_MANUAL_REVIEW: "CHUA_DUYET",
      REJECTED: "DA_TU_CHOI",
      COMPLETED: "DA_HOAN_THANH",
      CANCELLED: "DA_HUY",
    };
    return statusMap[status] || status;
  };

  const handleShowQR = (appointment) => {
    const qrData = generateQRData(appointment);
    setSelectedQRData({
      data: qrData,
      appointment: appointment,
    });
    setShowQRModal(true);
  };

  const downloadQRCode = () => {
    setDownloading(true);
    setTimeout(() => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = 600;
        canvas.height = 800;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, "#3b82f6");
        gradient.addColorStop(1, "#1d4ed8");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, 120);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 32px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🏥 Mã QR Check-in", canvas.width / 2, 50);

        ctx.font = "bold 18px 'Segoe UI', Arial, sans-serif";
        ctx.fillText("Bệnh viện Đa khoa Quốc tế", canvas.width / 2, 80);

        ctx.fillStyle = "#1f2937";
        ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("THÔNG TIN LỊCH HẸN", 40, 160);

        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(40, 175);
        ctx.lineTo(canvas.width - 40, 175);
        ctx.stroke();

        ctx.font = "18px 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = "#4b5563";

        const details = [
          `📋 Đơn #: ${
            selectedQRData.appointment.registrationNumber ||
            selectedQRData.appointment.id
          }`,
          `👤 Bệnh nhân: ${selectedQRData.appointment.fullName}`,
          `🏥 Khoa: ${selectedQRData.appointment.department}`,
          `📅 Ngày khám: ${formatDate(
            selectedQRData.appointment.appointmentDate
          )}`,
          `✅ Trạng thái: ${getStatusDisplay(
            selectedQRData.appointment.status
          )}`,
        ];

        details.forEach((detail, index) => {
          ctx.fillText(detail, 40, 210 + index * 40);
        });

        const svg = document.getElementById("qrcode-svg");
        if (svg) {
          const svgData = new XMLSerializer().serializeToString(svg);
          const img = new Image();

          img.onload = () => {
            const qrSize = 280;
            const qrX = (canvas.width - qrSize) / 2;
            const qrY = 400;

            ctx.fillStyle = "#f9fafb";
            ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

            ctx.strokeStyle = "#d1d5db";
            ctx.lineWidth = 2;
            ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

            ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

            ctx.fillStyle = "#f97316";
            ctx.font = "bold 20px 'Segoe UI', Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("📍 HƯỚNG DẪN SỬ DỤNG", canvas.width / 2, 720);

            ctx.fillStyle = "#6b7280";
            ctx.font = "16px 'Segoe UI', Arial, sans-serif";
            ctx.fillText(
              "Quét mã QR này tại quầy lễ tân để check-in",
              canvas.width / 2,
              750
            );
            ctx.fillText(
              "Vui lòng đến trước 15 phút để làm thủ tục",
              canvas.width / 2,
              775
            );

            const pngUrl = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `qr-checkin-${selectedQRData.appointment.registrationNumber}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            setDownloading(false);
          };

          img.src = "data:image/svg+xml;base64," + btoa(svgData);
        } else {
          setDownloading(false);
        }
      } catch (error) {
        console.error("Lỗi tạo QR image:", error);
        setDownloading(false);
      }
    }, 100);
  };

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Check-in - ${selectedQRData.appointment.fullName}`,
          text: `Mã QR check-in lịch hẹn khám\nKhoa: ${
            selectedQRData.appointment.department
          }\nNgày: ${formatDate(selectedQRData.appointment.appointmentDate)}`,
        });
      } catch {
        alert("Chia sẻ đã bị hủy");
      }
    } else {
      const shareText = `QR Check-in - ${
        selectedQRData.appointment.fullName
      }\nKhoa: ${selectedQRData.appointment.department}\nNgày: ${formatDate(
        selectedQRData.appointment.appointmentDate
      )}`;
      alert(
        `Chia sẻ thông tin:\n${shareText}\n\nVui lòng tải QR code về và chia sẻ thủ công.`
      );
    }
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      APPROVED: "ĐÃ DUYỆT",
      PENDING: "CHỜ DUYỆT",
      NEEDS_MANUAL_REVIEW: "CHƯA DUYỆT",
      REJECTED: "ĐÃ TỪ CHỐI",
      COMPLETED: "ĐÃ HOÀN THÀNH",
      CANCELLED: "ĐÃ HỦY",
      IN_PROGRESS: "ĐANG KHÁM",
      WAITING: "ĐANG CHỜ",
    };
    return statusMap[status] || status;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      APPROVED: {
        label: "ĐÃ DUYỆT",
        class: "status-approved",
        icon: <FaCheckCircle size={14} />,
      },
      NEEDS_MANUAL_REVIEW: {
        label: "CHƯA DUYỆT",
        class: "status-pending",
        icon: <FaClock size={14} />,
      },
      PENDING: {
        label: "CHỜ DUYỆT",
        class: "status-pending",
        icon: <FaClock size={14} />,
      },
      REJECTED: {
        label: "ĐÃ TỪ CHỐI",
        class: "status-rejected",
        icon: <FaTimes size={14} />,
      },
      COMPLETED: {
        label: "ĐÃ HOÀN THÀNH",
        class: "status-completed",
        icon: <FaCheckCircle size={14} />,
      },
      CANCELLED: {
        label: "ĐÃ HỦY",
        class: "status-cancelled",
        icon: <FaTimes size={14} />,
      },
      IN_PROGRESS: {
        label: "ĐANG KHÁM",
        class: "status-in-progress",
        icon: <FaChartLine size={14} />,
      },
      WAITING: {
        label: "ĐANG CHỜ",
        class: "status-waiting",
        icon: <FaClock size={14} />,
      },
    };

    const config = statusConfig[status] || {
      label: getStatusDisplay(status),
      class: "status-default",
      icon: <FaFileAlt size={14} />,
    };

    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon}
        <span>{config.label}</span>
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const paymentConfig = {
      "Đã thanh toán": {
        label: "ĐÃ THANH TOÁN",
        class: "payment-status-paid",
        icon: <FaCheckCircle size={14} />,
      },
      "Chưa thanh toán": {
        label: "CHƯA THANH TOÁN",
        class: "payment-status-unpaid",
        icon: <FaExclamationCircle size={14} />,
      },
      "Đang chờ xử lý": {
        label: "ĐANG XỬ LÝ",
        class: "payment-status-pending",
        icon: <FaClock size={14} />,
      },
    };

    const config = paymentConfig[paymentStatus] || {
      label: paymentStatus,
      class: "payment-status-default",
      icon: <FaInfoCircle size={14} />,
    };

    return (
      <span className={`payment-badge ${config.class}`}>
        {config.icon}
        <span>{config.label}</span>
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa có";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "Chưa có";
    return new Date(dateTimeString).toLocaleString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSessionLabelFromAppointment = (appointment) => {
    const timeString =
      appointment.expectedTimeSlot || appointment.assignedSession;
    if (!timeString) return "Chưa có";

    const hourMatch = timeString.match(/(\d{1,2})(?::\d{2})?/);
    let hour = null;
    if (hourMatch) {
      hour = parseInt(hourMatch[1], 10);
    }

    if (hour !== null && !isNaN(hour)) {
      if (hour >= 7 && hour < 12) return "Sáng";
      if (hour >= 12 && hour < 13) return "Trưa";
      if (hour >= 13 && hour < 17) return "Chiều";
      if (hour >= 17 && hour < 22) return "Tối";
      return "Ngoài giờ";
    }

    const s = (appointment.assignedSession || "").toLowerCase();
    if (s.includes("sáng")) return "Sáng";
    if (s.includes("trưa")) return "Trưa";
    if (s.includes("chiều")) return "Chiều";
    if (s.includes("tối") || s.includes("toi")) return "Tối";

    return appointment.assignedSession || "Chưa có";
  };

  const shouldShowPaymentButton = (appointment) => {
    const allowedStatuses = ["APPROVED", "COMPLETED", "IN_PROGRESS", "WAITING"];
    return (
      appointment.paymentStatus !== "Đã thanh toán" &&
      allowedStatuses.includes(appointment.status)
    );
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

  // Pagination handlers
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of appointments section
      const appointmentsSection = document.querySelector(
        ".appointments-section"
      );
      if (appointmentsSection) {
        appointmentsSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleItemsPerPageChange = (e) => {
    const value = parseInt(e.target.value);
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const halfMaxPages = Math.floor(maxPagesToShow / 2);
      let startPage = Math.max(currentPage - halfMaxPages, 1);
      let endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(endPage - maxPagesToShow + 1, 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

  if (loading) {
    return (
      <div className="patient-appointments-container">
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner-large">
              <FaSpinner className="animate-spin" size={48} />
            </div>
            <p className="loading-text">Đang tải lịch hẹn của bạn...</p>
            <p className="loading-subtext">Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-appointments-container">
      {/* Header với hướng dẫn */}
      <div className="patient-header">
        <div className="header-content">
          <div className="header-icon-wrapper">
            <FaCalendar size={40} />
          </div>
          <h1 className="header-title">LỊCH HẸN KHÁM BỆNH CỦA TÔI</h1>
          <p className="header-subtitle">
            Quản lý và theo dõi tất cả các lịch hẹn khám bệnh của bạn
          </p>
        </div>

        {showInstructions && (
          <div className="instructions-card">
            <div className="instructions-header">
              <div className="instruction-title">
                <FaInfoCircle size={20} />
                <h3>HƯỚNG DẪN SỬ DỤNG</h3>
              </div>
              <button
                className="close-instructions"
                onClick={() => setShowInstructions(false)}
                aria-label="Đóng hướng dẫn"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="instructions-content">
              <div className="instruction-item">
                <div className="instruction-number">1</div>
                <div className="instruction-text">
                  <strong>Xem lịch hẹn:</strong> Nhấn vào từng lịch hẹn để xem
                  chi tiết
                </div>
              </div>
              <div className="instruction-item">
                <div className="instruction-number">2</div>
                <div className="instruction-text">
                  <strong>Thanh toán:</strong> Nhấn nút "THANH TOÁN" khi lịch
                  hẹn đã được duyệt
                </div>
              </div>
              <div className="instruction-item">
                <div className="instruction-number">3</div>
                <div className="instruction-text">
                  <strong>Check-in:</strong> Sử dụng mã QR để check-in tại quầy
                  lễ tân
                </div>
              </div>
              <div className="instruction-item">
                <div className="instruction-number">4</div>
                <div className="instruction-text">
                  <strong>Lọc & Phân trang:</strong> Sử dụng bộ lọc và phân
                  trang để tìm lịch hẹn nhanh chóng
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thông báo lỗi */}
      {errorMessage && (
        <div className="error-message-card">
          <div className="error-icon">
            <FaExclamationTriangle size={40} />
          </div>
          <div className="error-content">
            <h4>CÓ LỖI XẢY RA</h4>
            <p>{errorMessage}</p>
          </div>
          <button className="retry-button-large" onClick={fetchAppointments}>
            <FaRedo size={18} />
            THỬ LẠI
          </button>
        </div>
      )}

      {/* Thống kê nhanh */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FaFileAlt size={32} />
          </div>
          <div className="stat-content">
            <h3>Tổng số lịch hẹn</h3>
            <p className="stat-number">{statsData.total}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaCheckCircle size={32} />
          </div>
          <div className="stat-content">
            <h3>Đã duyệt</h3>
            <p className="stat-number">{statsData.approved}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaClock size={32} />
          </div>
          <div className="stat-content">
            <h3>Chờ xử lý</h3>
            <p className="stat-number">{statsData.pending}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaDollarSign size={32} />
          </div>
          <div className="stat-content">
            <h3>Đã thanh toán</h3>
            <p className="stat-number">{statsData.paid}</p>
          </div>
        </div>
      </div>

      {/* Bộ lọc đơn giản */}
      <div className="simple-filters">
        <div className="filters-title">
          <FaSearch size={24} />
          <h2>TÌM LỊCH HẸN</h2>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="status-filter">
              <FaFilter size={18} />
              <span>Trạng thái</span>
            </label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="filter-select"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="NEEDS_MANUAL_REVIEW">Cần xử lý</option>
              <option value="REJECTED">Đã từ chối</option>
              <option value="COMPLETED">Đã hoàn thành</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="payment-filter">
              <FaCreditCard size={18} />
              <span>Thanh toán</span>
            </label>
            <select
              id="payment-filter"
              value={filters.paymentStatus}
              onChange={(e) =>
                setFilters({ ...filters, paymentStatus: e.target.value })
              }
              className="filter-select"
            >
              <option value="ALL">Tất cả thanh toán</option>
              <option value="Đã thanh toán">Đã thanh toán</option>
              <option value="Chưa thanh toán">Chưa thanh toán</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="date-filter">
              <FaCalendar size={18} />
              <span>Ngày khám</span>
            </label>
            <input
              id="date-filter"
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="filter-input"
            />
          </div>
        </div>

        <div className="search-box">
          <div className="search-icon">
            <FaSearch size={20} />
          </div>
          <input
            type="text"
            placeholder="Tìm theo khoa, triệu chứng, tên bệnh nhân..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="search-input"
          />
          {filters.search && (
            <button
              className="clear-search"
              onClick={() => setFilters({ ...filters, search: "" })}
              aria-label="Xóa tìm kiếm"
            >
              <FaTimes size={20} />
            </button>
          )}
        </div>

        {(filters.status !== "ALL" ||
          filters.paymentStatus !== "ALL" ||
          filters.date ||
          filters.search) && (
          <button
            className="clear-filters-button"
            onClick={() =>
              setFilters({
                status: "ALL",
                paymentStatus: "ALL",
                date: "",
                search: "",
              })
            }
          >
            <FaTimes size={18} />
            XÓA BỘ LỌC
          </button>
        )}
      </div>

      {/* Danh sách lịch hẹn với phân trang */}
      <div className="appointments-section">
        <div className="section-header">
          <div className="section-title">
            <FaFileAlt size={24} />
            <h2>
              DANH SÁCH LỊCH HẸN
              <span className="appointment-count">
                {" "}
                ({filteredAppointments.length} lịch hẹn)
              </span>
            </h2>
          </div>

          <div className="section-controls">
            {/* Items per page selector */}
            <div className="items-per-page-selector">
              <label htmlFor="items-per-page">
                <FaListUl size={16} />
                <span>Hiển thị:</span>
              </label>
              <select
                id="items-per-page"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="items-per-page-select"
              >
                <option value={5}>5 lịch hẹn</option>
                <option value={10}>10 lịch hẹn</option>
                <option value={20}>20 lịch hẹn</option>
                <option value={50}>50 lịch hẹn</option>
              </select>
            </div>

            <button className="refresh-button" onClick={fetchAppointments}>
              <FaRedo size={18} />
              <span>LÀM MỚI</span>
            </button>
          </div>
        </div>

        {/* Pagination info */}
        <div className="pagination-info">
          <div className="pagination-stats">
            <span className="current-range">
              Hiển thị <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> -{" "}
              <strong>
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredAppointments.length
                )}
              </strong>{" "}
              của <strong>{filteredAppointments.length}</strong> lịch hẹn
            </span>
          </div>

          {/* Pagination controls - top */}
          {filteredAppointments.length > itemsPerPage && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              getPageNumbers={getPageNumbers}
              position="top"
            />
          )}
        </div>

        {paginatedAppointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaFileAlt size={80} />
            </div>
            <h3>KHÔNG CÓ LỊCH HẸN NÀO</h3>
            <p>
              {appointments.length === 0
                ? "Bạn chưa có lịch hẹn khám bệnh nào"
                : "Không tìm thấy lịch hẹn phù hợp với bộ lọc"}
            </p>
            {appointments.length === 0 && (
              <button
                className="new-appointment-button"
                onClick={() => navigate("/new-appointment")}
              >
                <FaCalendar size={20} />
                <span>ĐẶT LỊCH HẸN MỚI</span>
              </button>
            )}
          </div>
        ) : (
          <div className="appointments-list">
            {paginatedAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                isExpanded={expandedCard === appointment.id}
                onToggleExpand={toggleCardExpand}
                onShowQR={handleShowQR}
                onPayment={handlePayment}
                getStatusBadge={getStatusBadge}
                getPaymentStatusBadge={getPaymentStatusBadge}
                getSessionLabelFromAppointment={getSessionLabelFromAppointment}
                formatDate={formatDate}
                formatDateTime={formatDateTime}
                getDoctorInfo={getDoctorInfo}
                shouldShowPaymentButton={shouldShowPaymentButton}
                getStatusDisplay={getStatusDisplay}
              />
            ))}
          </div>
        )}

        {/* Pagination controls - bottom */}
        {filteredAppointments.length > itemsPerPage && (
          <div className="pagination-bottom">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              getPageNumbers={getPageNumbers}
              position="bottom"
            />

            {/* Quick page jump */}
            <div className="page-jump">
              <label htmlFor="page-jump-input">Đến trang:</label>
              <input
                id="page-jump-input"
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= totalPages) {
                    handlePageChange(page);
                  }
                }}
                className="page-jump-input"
              />
              <span className="total-pages">/ {totalPages}</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal QR Code */}
      {showQRModal && selectedQRData && (
        <QRModal
          selectedQRData={selectedQRData}
          downloading={downloading}
          onDownload={downloadQRCode}
          onShare={shareQRCode}
          onClose={() => setShowQRModal(false)}
          formatDate={formatDate}
          getStatusDisplay={getStatusDisplay}
        />
      )}

      {/* Hỗ trợ nhanh */}
      <div className="quick-help">
        <div className="help-header">
          <FaPhoneAlt size={24} />
          <h3>CẦN HỖ TRỢ?</h3>
        </div>
        <p>
          Gọi tổng đài: <strong>1900 1234</strong> (Miễn phí)
        </p>
        <p className="help-time">Thời gian: 7:00 - 22:00 hàng ngày</p>
        <button className="help-button" onClick={() => navigate("/help")}>
          <FaQuestionCircle size={20} />
          <span>XEM HƯỚNG DẪN CHI TIẾT</span>
        </button>
      </div>
    </div>
  );
};

// Pagination Controls Component
const PaginationControls = React.memo(
  ({
    currentPage,
    totalPages,
    onPageChange,
    // getPageNumbers,
    position,
  }) => {
    const pageNumbers = useMemo(() => {
      const numbers = [];
      const maxPagesToShow = 5;

      if (totalPages <= maxPagesToShow) {
        for (let i = 1; i <= totalPages; i++) {
          numbers.push(i);
        }
      } else {
        const halfMaxPages = Math.floor(maxPagesToShow / 2);
        let startPage = Math.max(currentPage - halfMaxPages, 1);
        let endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

        if (endPage - startPage + 1 < maxPagesToShow) {
          startPage = Math.max(endPage - maxPagesToShow + 1, 1);
        }

        for (let i = startPage; i <= endPage; i++) {
          numbers.push(i);
        }
      }

      return numbers;
    }, [currentPage, totalPages]);

    return (
      <div className={`pagination-controls ${position}`}>
        <button
          className="pagination-button first"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Đến trang đầu"
        >
          <FaAngleDoubleLeft size={16} />
        </button>

        <button
          className="pagination-button prev"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Trang trước"
        >
          <FaAngleLeft size={16} />
          <span>Trước</span>
        </button>

        <div className="page-numbers">
          {pageNumbers.map((page) => (
            <button
              key={page}
              className={`page-number ${currentPage === page ? "active" : ""}`}
              onClick={() => onPageChange(page)}
              aria-label={`Trang ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          className="pagination-button next"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Trang sau"
        >
          <span>Sau</span>
          <FaAngleRight size={16} />
        </button>

        <button
          className="pagination-button last"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Đến trang cuối"
        >
          <FaAngleDoubleRight size={16} />
        </button>
      </div>
    );
  }
);

// Sub Components
const AppointmentCard = React.memo(
  ({
    appointment,
    isExpanded,
    onToggleExpand,
    onShowQR,
    onPayment,
    getStatusBadge,
    getPaymentStatusBadge,
    formatDate,
    formatDateTime,
    getDoctorInfo,
    shouldShowPaymentButton,
    getStatusDisplay,
    getSessionLabelFromAppointment,
  }) => {
    return (
      <div className={`appointment-card ${isExpanded ? "expanded" : ""}`}>
        {/* Header Card */}
        <div
          className="card-header"
          onClick={() => onToggleExpand(appointment.id)}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={`Xem chi tiết lịch hẹn ${appointment.id}`}
        >
          <div className="header-left">
            <div className="appointment-number">
              <div className="number-icon">
                <FaFileAlt size={20} />
              </div>
              <div className="number-text">
                Đơn #{appointment.registrationNumber || appointment.id}
              </div>
            </div>
            <div className="patient-name">
              <div className="name-icon">
                <FaUser size={18} />
              </div>
              <div className="name-text">
                {appointment.fullName || "Chưa có tên"}
              </div>
            </div>
          </div>

          <div className="header-right">
            <div className="status-container">
              {getStatusBadge(appointment.status)}
              {getPaymentStatusBadge(appointment.paymentStatus)}
            </div>
            <button
              className="expand-button"
              aria-label={isExpanded ? "Thu gọn" : "Xem chi tiết"}
            >
              {isExpanded ? (
                <>
                  <FaChevronDown size={18} />
                  <span className="expand-text">Thu gọn</span>
                </>
              ) : (
                <>
                  <FaChevronRight size={18} />
                  <span className="expand-text">Xem chi tiết</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Thông tin cơ bản */}
        <div className="basic-info">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">
                <FaPhone size={14} />
                <span>Điện thoại</span>
              </div>
              <div className="info-value phone">
                {appointment.phone || "Chưa có"}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">
                <FaEnvelope size={14} />
                <span>Email</span>
              </div>
              <div className="info-value email">
                {appointment.email || "Chưa có"}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">
                <FaDollarSign size={14} />
                <span>Phí khám</span>
              </div>
              <div
                className={`info-value ${
                  appointment.paymentStatus === "Đã thanh toán"
                    ? "paid"
                    : "unpaid"
                }`}
              >
                {appointment.examinationFee?.toLocaleString() || "0"} VND
              </div>
            </div>
          </div>
        </div>

        {/* Chi tiết mở rộng */}
        {isExpanded && (
          <div className="expanded-details">
            {/* Triệu chứng */}
            {appointment.symptoms && (
              <div className="detail-section symptoms">
                <h4 className="section-title">
                  <FaClipboardList size={18} />
                  <span>TRIỆU CHỨNG</span>
                </h4>
                <div className="section-content">
                  <div className="symptoms-text">{appointment.symptoms}</div>
                </div>
              </div>
            )}

            {/* Thông tin buổi khám */}
            <div className="detail-section appointment-info">
              <h4 className="section-title">
                <FaHospital size={18} />
                <span>THÔNG TIN BUỔI KHÁM</span>
              </h4>
              <div className="appointment-details-container">
                <div className="basic-appointment-info">
                  <div className="info-row">
                    <span className="info-label">Khoa khám:</span>
                    <span className="info-value highlight">
                      {appointment.department}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Ngày khám:</span>
                    <span className="info-value highlight">
                      {formatDate(appointment.appointmentDate)}
                    </span>
                  </div>

                  {/* Thông tin bác sĩ */}
                  {appointment.doctor && (
                    <div className="doctor-info-card">
                      <div className="doctor-header">
                        <div className="doctor-icon">
                          <FaUserCheck size={20} />
                        </div>
                        <h5>BÁC SĨ PHỤ TRÁCH</h5>
                      </div>
                      <div className="doctor-content">
                        <div className="doctor-detail">
                          <span className="doctor-label">Tên bác sĩ:</span>
                          <span className="doctor-name">
                            {getDoctorInfo(appointment)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chi tiết buổi khám */}
                  {appointment.status === "APPROVED" && (
                    <div className="appointment-details-card">
                      <div className="details-header">
                        <div className="details-icon">
                          <FaCheckCircle size={20} />
                        </div>
                        <h5>CHI TIẾT BUỔI KHÁM</h5>
                      </div>
                      <div className="details-grid">
                        {(appointment.assignedSession ||
                          appointment.expectedTimeSlot) && (
                          <div className="detail-card">
                            <div className="detail-icon">
                              <FaClock size={24} />
                            </div>
                            <div className="detail-content">
                              <div className="detail-title">Buổi khám</div>
                              <div className="detail-value">
                                {getSessionLabelFromAppointment(appointment)}
                              </div>
                            </div>
                          </div>
                        )}
                        {appointment.expectedTimeSlot && (
                          <div className="detail-card">
                            <div className="detail-icon">
                              <FaClock size={24} />
                            </div>
                            <div className="detail-content">
                              <div className="detail-title">Khung giờ</div>
                              <div className="detail-value">
                                {appointment.expectedTimeSlot}
                              </div>
                            </div>
                          </div>
                        )}
                        {appointment.queueNumber && (
                          <div className="detail-card">
                            <div className="detail-icon">
                              <FaFileAlt size={24} />
                            </div>
                            <div className="detail-content">
                              <div className="detail-title">Số thứ tự</div>
                              <div className="detail-value queue">
                                {appointment.queueNumber}
                              </div>
                            </div>
                          </div>
                        )}
                        {appointment.roomNumber && (
                          <div className="detail-card">
                            <div className="detail-icon">
                              <FaHome size={24} />
                            </div>
                            <div className="detail-content">
                              <div className="detail-title">Phòng khám</div>
                              <div className="detail-value room">
                                {appointment.roomNumber}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Thông tin thanh toán */}
            {appointment.paymentStatus === "Đã thanh toán" &&
              appointment.paymentDate && (
                <div className="detail-section payment">
                  <h4 className="section-title">
                    <FaReceipt size={18} />
                    <span>THÔNG TIN THANH TOÁN</span>
                  </h4>
                  <div className="payment-details-card">
                    <div className="payment-info-grid">
                      <div className="payment-item">
                        <span className="payment-label">Ngày thanh toán:</span>
                        <span className="payment-value">
                          {formatDateTime(appointment.paymentDate)}
                        </span>
                      </div>
                      {appointment.paymentAmount && (
                        <div className="payment-item">
                          <span className="payment-label">Số tiền:</span>
                          <span className="payment-value amount">
                            {appointment.paymentAmount.toLocaleString()} VND
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* Hành động */}
            <div className="actions-section">
              <div className="current-status-display">
                <div className="status-badge-large">
                  <span className="status-label">TRẠNG THÁI:</span>
                  <span
                    className={`status-value ${appointment.status.toLowerCase()}`}
                  >
                    {getStatusDisplay(appointment.status)}
                  </span>
                </div>
                {appointment.paymentStatus === "Đã thanh toán" && (
                  <div className="payment-status-badge">
                    <div className="payment-icon">
                      <FaCheckCircle size={16} />
                    </div>
                    <span className="payment-text">ĐÃ THANH TOÁN</span>
                  </div>
                )}
              </div>

              <div className="action-buttons-grid">
                {shouldShowPaymentButton(appointment) && (
                  <button
                    className="payment-button primary"
                    onClick={() => onPayment(appointment)}
                  >
                    <FaCreditCard size={20} />
                    <span className="button-text">THANH TOÁN NGAY</span>
                  </button>
                )}

                {appointment.status === "APPROVED" && (
                  <button
                    className="qr-button secondary"
                    onClick={() => onShowQR(appointment)}
                  >
                    <FaQrcode size={20} />
                    <span className="button-text">MÃ QR CHECK-IN</span>
                  </button>
                )}

                <button
                  className="print-button tertiary"
                  onClick={() => window.print()}
                >
                  <FaPrint size={20} />
                  <span className="button-text">IN THÔNG TIN</span>
                </button>
              </div>
            </div>

            {/* Lưu ý */}
            <div className="notes-section">
              <div className="notes-header">
                <div className="notes-icon">
                  <FaExclamationTriangle size={20} />
                </div>
                <h5>LƯU Ý QUAN TRỌNG</h5>
              </div>
              <div className="notes-content">
                <div className="note-item">
                  <div className="note-bullet">•</div>
                  <span className="note-text">
                    Vui lòng đến trước 15 phút để làm thủ tục
                  </span>
                </div>
                <div className="note-item">
                  <div className="note-bullet">•</div>
                  <span className="note-text">
                    Mang theo CMND/CCCD và thẻ BHYT (nếu có)
                  </span>
                </div>
                <div className="note-item">
                  <div className="note-bullet">•</div>
                  <span className="note-text">
                    Thanh toán trước khi đến nếu chưa thanh toán online
                  </span>
                </div>
                <div className="note-item">
                  <div className="note-bullet">•</div>
                  <span className="note-text">
                    Liên hệ 1900 1234 nếu cần hỗ trợ
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

const QRModal = React.memo(
  ({
    selectedQRData,
    downloading,
    onDownload,
    onShare,
    onClose,
    formatDate,
    getStatusDisplay,
  }) => {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>
              <FaQrcode size={24} />
              <span>MÃ QR CHECK-IN</span>
            </h2>
            <button
              className="close-modal"
              onClick={onClose}
              aria-label="Đóng cửa sổ"
            >
              <FaTimes size={24} />
            </button>
          </div>

          <div className="modal-body">
            <div className="appointment-info">
              <h3>
                Đơn #
                {selectedQRData.appointment.registrationNumber ||
                  selectedQRData.appointment.id}
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">
                    <FaUser size={16} />
                    Bệnh nhân:
                  </span>
                  <span className="info-value">
                    {selectedQRData.appointment.fullName}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">
                    <FaHospital size={16} />
                    Khoa:
                  </span>
                  <span className="info-value">
                    {selectedQRData.appointment.department}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">
                    <FaCalendar size={16} />
                    Ngày khám:
                  </span>
                  <span className="info-value">
                    {formatDate(selectedQRData.appointment.appointmentDate)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">
                    <FaCheckCircle size={16} />
                    Trạng thái:
                  </span>
                  <span className="info-value status">
                    {getStatusDisplay(selectedQRData.appointment.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="qr-display">
              <QRCode
                id="qrcode-svg"
                value={selectedQRData.data}
                size={250}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="H"
              />
              <p className="qr-instruction">
                <FaMobileAlt size={18} />
                Quét mã QR này tại quầy lễ tân để check-in
              </p>
              <p className="qr-note">
                <FaClock size={18} />
                Vui lòng đến trước 15 phút để làm thủ tục
              </p>
            </div>

            <div className="modal-actions">
              <button
                className="action-button download"
                onClick={onDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <>
                    <FaSpinner className="animate-spin" size={18} />
                    ĐANG TẢI...
                  </>
                ) : (
                  <>
                    <FaDownload size={18} />
                    TẢI MÃ QR
                  </>
                )}
              </button>
              <button className="action-button share" onClick={onShare}>
                <FaShareAlt size={18} />
                CHIA SẺ
              </button>
              <button className="action-button close" onClick={onClose}>
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default Appointments;
