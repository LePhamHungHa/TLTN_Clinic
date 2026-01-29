import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import QRCode from "react-qr-code";
import "../../css/AppointmentsPage.css";

const Appointments = () => {
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [filters, setFilters] = useState({
    status: "ALL",
    paymentStatus: "ALL",
    date: "",
    search: "",
  });
  const [expandedCard, setExpandedCard] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQRData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [requestRefund, setRequestRefund] = useState(false);
  const [refundAccountInfo, setRefundAccountInfo] = useState({
    accountNumber: "",
    bankName: "",
    accountHolder: "",
  });
  const [isCancelling, setIsCancelling] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();

  const getAuthToken = useCallback(() => {
    const userData = localStorage.getItem("user");
    if (!userData) return null;
    try {
      const user = JSON.parse(userData);
      return user?.token || user?.accessToken;
    } catch (error) {
      console.error("Parse user data error:", error);
      return null;
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = getAuthToken();

      if (!user?.email || !token) {
        setErrorMsg("Vui lòng đăng nhập để xem lịch hẹn");
        setIsLoading(false);
        return;
      }

      // 🎯 FIXED: Gọi API duy nhất để lấy tất cả thông tin
      const response = await axios.get(
        `http://localhost:8080/api/patient-registrations/by-email?email=${encodeURIComponent(user.email)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        },
      );

      // 🎯 FIXED: Không gọi API payment riêng nữa - dùng data từ backend
      const appointmentsWithPaymentInfo = response.data.map((appointment) => {
        // Xác định payment status từ data có sẵn từ backend
        let paymentStatus = "Chưa thanh toán";
        let paymentAmount = appointment.examinationFee || 0;
        let paymentDate = null;
        let paymentMethod = null;

        // Kiểm tra payment status từ backend response
        const paymentStatusFromBackend = appointment.paymentStatus;

        if (
          paymentStatusFromBackend === "PAID" ||
          paymentStatusFromBackend === "Đã thanh toán" ||
          appointment.paidAt
        ) {
          paymentStatus = "Đã thanh toán";
          paymentMethod = "VNPAY";
          paymentDate = appointment.paidAt;
          paymentAmount =
            appointment.paidAmount || appointment.examinationFee || 0;
        }

        return {
          ...appointment,
          paymentStatus, // Đã được xác định từ data backend
          paymentAmount,
          paymentDate,
          paymentMethod,
        };
      });

      const sortedAppointments = appointmentsWithPaymentInfo.sort((a, b) => {
        return (
          new Date(b.appointmentDate || b.createdAt) -
          new Date(a.appointmentDate || a.createdAt)
        );
      });

      setAppointmentsData(sortedAppointments);
      setErrorMsg(null);
    } catch (error) {
      console.error("Lỗi tải lịch hẹn:", error);
      if (error.response?.status === 403) {
        setErrorMsg("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      } else if (error.response?.status === 404) {
        setErrorMsg("Không tìm thấy lịch hẹn nào.");
      } else {
        setErrorMsg("Không thể tải danh sách lịch hẹn. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [getAuthToken, navigate]);

  useEffect(() => {
    loadAppointments();
    const interval = setInterval(loadAppointments, 30000);
    return () => clearInterval(interval);
  }, [loadAppointments]);

  const filteredAppointments = useMemo(() => {
    let result = appointmentsData;

    if (filters.status !== "ALL") {
      result = result.filter((app) => app.status === filters.status);
    }

    if (filters.paymentStatus !== "ALL") {
      result = result.filter(
        (app) => app.paymentStatus === filters.paymentStatus,
      );
    }

    if (filters.date) {
      result = result.filter((app) => app.appointmentDate === filters.date);
    }

    if (filters.search) {
      const searchText = filters.search.toLowerCase();
      result = result.filter(
        (app) =>
          app.department?.toLowerCase().includes(searchText) ||
          app.symptoms?.toLowerCase().includes(searchText) ||
          app.fullName?.toLowerCase().includes(searchText),
      );
    }

    return result;
  }, [appointmentsData, filters]);

  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAppointments.slice(startIndex, endIndex);
  }, [filteredAppointments, currentPage, pageSize]);

  useEffect(() => {
    const pages = Math.ceil(filteredAppointments.length / pageSize);
    setTotalPages(pages || 1);

    if (currentPage > pages && pages > 0) {
      setCurrentPage(1);
    }
  }, [filteredAppointments, pageSize, currentPage]);

  const statistics = useMemo(() => {
    const total = appointmentsData.length;
    const approved = appointmentsData.filter(
      (app) => app.status === "APPROVED",
    ).length;
    const pending = appointmentsData.filter(
      (app) => app.status === "NEEDS_MANUAL_REVIEW" || app.status === "PENDING",
    ).length;
    const paid = appointmentsData.filter(
      (app) => app.paymentStatus === "Đã thanh toán",
    ).length;
    const unpaid = appointmentsData.filter(
      (app) =>
        app.paymentStatus === "Chưa thanh toán" && app.status === "APPROVED",
    ).length;

    return { total, approved, pending, paid, unpaid };
  }, [appointmentsData]);

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

  const toggleExpandCard = (appointmentId) => {
    setExpandedCard(expandedCard === appointmentId ? null : appointmentId);
  };

  const createQRData = (appointment) => {
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
    const statusMapping = {
      APPROVED: "DA_DUYET",
      PENDING: "CHO_DUYET",
      NEEDS_MANUAL_REVIEW: "CHUA_DUYET",
      REJECTED: "DA_TU_CHOI",
      COMPLETED: "DA_HOAN_THANH",
      CANCELLED: "DA_HUY",
    };
    return statusMapping[status] || status;
  };

  const showQRCode = (appointment) => {
    const qrText = createQRData(appointment);
    setQRData({
      data: qrText,
      appointment: appointment,
    });
    setShowQRModal(true);
  };

  const downloadQRImage = () => {
    setIsDownloading(true);
    setTimeout(() => {
      try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = 600;
        canvas.height = 800;

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, "#3b82f6");
        gradient.addColorStop(1, "#1d4ed8");
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, 120);

        context.fillStyle = "#ffffff";
        context.font = "bold 32px Arial";
        context.textAlign = "center";
        context.fillText("Mã QR Check-in", canvas.width / 2, 50);

        context.font = "bold 18px Arial";
        context.fillText("Bệnh viện Đa khoa Quốc tế", canvas.width / 2, 80);

        context.fillStyle = "#1f2937";
        context.font = "bold 24px Arial";
        context.textAlign = "left";
        context.fillText("THÔNG TIN LỊCH HẸN", 40, 160);

        context.strokeStyle = "#e5e7eb";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(40, 175);
        context.lineTo(canvas.width - 40, 175);
        context.stroke();

        context.font = "18px Arial";
        context.fillStyle = "#4b5563";

        const details = [
          `Đơn #: ${qrData.appointment.registrationNumber || qrData.appointment.id}`,
          `Bệnh nhân: ${qrData.appointment.fullName}`,
          `Khoa: ${qrData.appointment.department}`,
          `Ngày khám: ${formatDate(qrData.appointment.appointmentDate)}`,
          `Trạng thái: ${getStatusText(qrData.appointment.status)}`,
        ];

        details.forEach((detail, index) => {
          context.fillText(detail, 40, 210 + index * 40);
        });

        const svg = document.getElementById("qrcode-svg");
        if (svg) {
          const svgText = new XMLSerializer().serializeToString(svg);
          const img = new Image();

          img.onload = () => {
            const qrSize = 280;
            const qrX = (canvas.width - qrSize) / 2;
            const qrY = 400;

            context.fillStyle = "#f9fafb";
            context.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

            context.strokeStyle = "#d1d5db";
            context.lineWidth = 2;
            context.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

            context.drawImage(img, qrX, qrY, qrSize, qrSize);

            context.fillStyle = "#f97316";
            context.font = "bold 20px Arial";
            context.textAlign = "center";
            context.fillText("HƯỚNG DẪN SỬ DỤNG", canvas.width / 2, 720);

            context.fillStyle = "#6b7280";
            context.font = "16px Arial";
            context.fillText(
              "Quét mã QR này tại quầy lễ tân để check-in",
              canvas.width / 2,
              750,
            );
            context.fillText(
              "Vui lòng đến trước 15 phút để làm thủ tục",
              canvas.width / 2,
              775,
            );

            const imageUrl = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = imageUrl;
            link.download = `qr-checkin-${qrData.appointment.registrationNumber}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setIsDownloading(false);
          };

          img.src = "data:image/svg+xml;base64," + btoa(svgText);
        } else {
          setIsDownloading(false);
        }
      } catch (error) {
        console.error("Lỗi tạo QR image:", error);
        setIsDownloading(false);
      }
    }, 100);
  };

  const shareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Check-in - ${qrData.appointment.fullName}`,
          text: `Mã QR check-in lịch hẹn khám\nKhoa: ${qrData.appointment.department}\nNgày: ${formatDate(qrData.appointment.appointmentDate)}`,
        });
      } catch {
        alert("Chia sẻ đã bị hủy");
      }
    } else {
      const shareText = `QR Check-in - ${qrData.appointment.fullName}\nKhoa: ${qrData.appointment.department}\nNgày: ${formatDate(qrData.appointment.appointmentDate)}`;
      alert(
        `Chia sẻ thông tin:\n${shareText}\n\nVui lòng tải QR code về và chia sẻ thủ công.`,
      );
    }
  };

  const getStatusText = (status) => {
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
      },
      NEEDS_MANUAL_REVIEW: {
        label: "CHƯA DUYỆT",
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
      COMPLETED: {
        label: "ĐÃ HOÀN THÀNH",
        class: "status-completed",
      },
      CANCELLED: {
        label: "ĐÃ HỦY",
        class: "status-cancelled",
      },
      IN_PROGRESS: {
        label: "ĐANG KHÁM",
        class: "status-in-progress",
      },
      WAITING: {
        label: "ĐANG CHỜ",
        class: "status-waiting",
      },
    };

    const config = statusConfig[status] || {
      label: getStatusText(status),
      class: "status-default",
    };

    return (
      <span className={`status-badge ${config.class}`}>{config.label}</span>
    );
  };

  const getPaymentBadge = (paymentStatus) => {
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

  const getSessionText = (appointment) => {
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

  const canShowPaymentButton = (appointment) => {
    const allowedStatuses = ["APPROVED", "COMPLETED", "IN_PROGRESS", "WAITING"];
    return (
      appointment.paymentStatus !== "Đã thanh toán" &&
      allowedStatuses.includes(appointment.status)
    );
  };

  const canCancelAppointment = (appointment) => {
    const cannotCancelStatuses = ["COMPLETED", "IN_PROGRESS", "CANCELLED"];
    const canCancel = !cannotCancelStatuses.includes(appointment.status);
    return canCancel;
  };

  const getDoctorText = (appointment) => {
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

  const changePage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const appointmentsSection = document.querySelector(
        ".appointments-section",
      );
      if (appointmentsSection) {
        appointmentsSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const changePageSize = (e) => {
    const value = parseInt(e.target.value);
    setPageSize(value);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const numbers = [];
    const maxPages = 5;

    if (totalPages <= maxPages) {
      for (let i = 1; i <= totalPages; i++) {
        numbers.push(i);
      }
    } else {
      const halfPages = Math.floor(maxPages / 2);
      let startPage = Math.max(currentPage - halfPages, 1);
      let endPage = Math.min(startPage + maxPages - 1, totalPages);

      if (endPage - startPage + 1 < maxPages) {
        startPage = Math.max(endPage - maxPages + 1, 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        numbers.push(i);
      }
    }

    return numbers;
  };

  const handleCancelClick = async (appointment) => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
        navigate("/login");
        return;
      }

      // Test token nhanh
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      console.log("=== DEBUG: CANCEL PREPARATION ===");
      console.log("Current user:", user);
      console.log("Token exists:", !!token);
      console.log("Appointment ID:", appointment.id);
      console.log("================================");

      setSelectedAppointment(appointment);
      setCancelReason("");
      setRequestRefund(false);
      setRefundAccountInfo({
        accountNumber: "",
        bankName: "",
        accountHolder: "",
      });
      setShowCancelModal(true);
    } catch (error) {
      console.error("Error preparing cancel:", error);
      alert("Có lỗi xảy ra khi chuẩn bị hủy lịch. Vui lòng thử lại.");
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedAppointment || !cancelReason.trim()) {
      alert("Vui lòng nhập lý do hủy");
      return;
    }

    if (cancelReason.length > 500) {
      alert("Lý do hủy không được quá 500 ký tự");
      return;
    }

    setIsCancelling(true);

    try {
      const token = getAuthToken();
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      console.log("=== DEBUG CANCEL INFO ===");
      console.log("User ID from localStorage:", user?.id);
      console.log("User Email:", user?.email);
      console.log("Token exists:", !!token);
      console.log("Appointment ID:", selectedAppointment.id);
      console.log("==========================");

      if (!token) {
        alert("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
        setIsCancelling(false);
        navigate("/login");
        return;
      }

      // Xác định userId - ưu tiên từ localStorage
      const userId = user?.id || 1;
      const userEmail = user?.email || "";

      const cancelData = {
        appointmentId: selectedAppointment.id,
        reason: cancelReason,
        requestRefund: requestRefund,
        userId: userId,
        userEmail: userEmail,
        // Chỉ thêm thông tin hoàn tiền nếu có yêu cầu
        ...(requestRefund && {
          bankAccountNumber: refundAccountInfo.accountNumber || "",
          bankName: refundAccountInfo.bankName || "",
          accountHolderName: refundAccountInfo.accountHolder || "",
        }),
      };

      console.log("Sending cancel data:", cancelData);

      // Gửi request với đầy đủ headers
      const response = await axios.post(
        "http://localhost:8080/api/patient-registrations/cancel",
        cancelData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 15000,
          validateStatus: function (status) {
            return status < 500; // Chỉ reject nếu status >= 500
          },
        },
      );

      console.log("Cancel response:", response.data);

      if (response.data && response.data.success) {
        alert("Hủy lịch hẹn thành công!");
        setShowCancelModal(false);
        loadAppointments();

        // Reset form
        setCancelReason("");
        setRequestRefund(false);
        setRefundAccountInfo({
          accountNumber: "",
          bankName: "",
          accountHolder: "",
        });
      } else {
        const errorMsg =
          response.data?.message || "Hủy lịch thất bại không xác định";
        alert(`Hủy lịch thất bại: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Lỗi hủy lịch chi tiết:", error);

      // Xử lý lỗi chi tiết
      if (error.code === "ECONNABORTED") {
        alert("Request timeout. Vui lòng thử lại.");
      } else if (error.response) {
        // Server trả về response với status code lỗi
        const status = error.response.status;
        const errorData = error.response.data;

        console.log("Error status:", status);
        console.log("Error data:", errorData);

        switch (status) {
          case 401:
            alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            localStorage.removeItem("user");
            navigate("/login");
            break;
          case 403:
            if (errorData.message && errorData.message.includes("token")) {
              alert(
                "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
              );
              localStorage.removeItem("user");
              navigate("/login");
            } else {
              alert("Bạn không có quyền thực hiện thao tác này.");
            }
            break;
          case 404:
            alert("Không tìm thấy lịch hẹn.");
            break;
          case 422:
            alert(
              `Dữ liệu không hợp lệ: ${errorData.message || errorData.error}`,
            );
            break;
          default:
            alert(
              `Lỗi server (${status}): ${errorData.message || "Vui lòng thử lại sau"}`,
            );
        }
      } else if (error.request) {
        // Request được gửi nhưng không nhận được response
        alert(
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.",
        );
        console.log("No response received:", error.request);
      } else {
        // Lỗi khác
        alert(`Lỗi: ${error.message}`);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRefundAccountChange = (field, value) => {
    setRefundAccountInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="patient-appointments-container">
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner-large"></div>
            <p className="loading-text">Đang tải lịch hẹn của bạn...</p>
            <p className="loading-subtext">Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-appointments-container">
      <div className="patient-header">
        <div className="header-content">
          <h1 className="header-title">LỊCH HẸN KHÁM BỆNH CỦA TÔI</h1>
          <p className="header-subtitle">
            Quản lý và theo dõi tất cả các lịch hẹn khám bệnh của bạn
          </p>
        </div>

        {showHelp && (
          <div className="instructions-card">
            <div className="instructions-header">
              <h3>HƯỚNG DẪN SỬ DỤNG</h3>
              <button
                className="close-instructions"
                onClick={() => setShowHelp(false)}
              >
                Đóng
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
                  <strong>Hủy lịch:</strong> Nhấn nút "HỦY LỊCH" nếu không thể
                  đến khám
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="error-message-card">
          <div className="error-content">
            <h4>CÓ LỖI XẢY RA</h4>
            <p>{errorMsg}</p>
          </div>
          <button className="retry-button" onClick={loadAppointments}>
            THỬ LẠI
          </button>
        </div>
      )}

      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-content">
            <h3>Tổng số lịch hẹn</h3>
            <p className="stat-number">{statistics.total}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <h3>Đã duyệt</h3>
            <p className="stat-number">{statistics.approved}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <h3>Chờ xử lý</h3>
            <p className="stat-number">{statistics.pending}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <h3>Đã thanh toán</h3>
            <p className="stat-number">{statistics.paid}</p>
          </div>
        </div>
      </div>

      <div className="simple-filters">
        <div className="filters-title">
          <h2>TÌM LỊCH HẸN</h2>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="status-filter">Trạng thái</label>
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
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="payment-filter">Thanh toán</label>
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
            <label htmlFor="date-filter">Ngày khám</label>
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
            >
              Xóa
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
            XÓA BỘ LỌC
          </button>
        )}
      </div>

      <div className="appointments-section">
        <div className="section-header">
          <div className="section-title">
            <h2>
              DANH SÁCH LỊCH HẸN
              <span className="appointment-count">
                {" "}
                ({filteredAppointments.length} lịch hẹn)
              </span>
            </h2>
          </div>

          <div className="section-controls">
            <div className="items-per-page-selector">
              <label htmlFor="items-per-page">Hiển thị:</label>
              <select
                id="items-per-page"
                value={pageSize}
                onChange={changePageSize}
                className="items-per-page-select"
              >
                <option value={5}>5 lịch hẹn</option>
                <option value={10}>10 lịch hẹn</option>
                <option value={20}>20 lịch hẹn</option>
                <option value={50}>50 lịch hẹn</option>
              </select>
            </div>

            <button className="refresh-button" onClick={loadAppointments}>
              LÀM MỚI
            </button>
          </div>
        </div>

        <div className="pagination-info">
          <div className="pagination-stats">
            <span className="current-range">
              Hiển thị <strong>{(currentPage - 1) * pageSize + 1}</strong> -{" "}
              <strong>
                {Math.min(currentPage * pageSize, filteredAppointments.length)}
              </strong>{" "}
              của <strong>{filteredAppointments.length}</strong> lịch hẹn
            </span>
          </div>

          {filteredAppointments.length > pageSize && (
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={changePage}
              getPageNumbers={getPageNumbers}
              position="top"
            />
          )}
        </div>

        {paginatedAppointments.length === 0 ? (
          <div className="empty-state">
            <h3>KHÔNG CÓ LỊCH HẸN NÀO</h3>
            <p>
              {appointmentsData.length === 0
                ? "Bạn chưa có lịch hẹn khám bệnh nào"
                : "Không tìm thấy lịch hẹn phù hợp với bộ lọc"}
            </p>
            {appointmentsData.length === 0 && (
              <button
                className="new-appointment-button"
                onClick={() => navigate("/new-appointment")}
              >
                ĐẶT LỊCH HẸN MỚI
              </button>
            )}
          </div>
        ) : (
          <div className="appointments-list">
            {paginatedAppointments.map((appointment) => (
              <AppointmentItem
                key={appointment.id}
                appointment={appointment}
                isExpanded={expandedCard === appointment.id}
                onToggleExpand={toggleExpandCard}
                onShowQR={showQRCode}
                onPayment={handlePayment}
                onCancel={handleCancelClick}
                getStatusBadge={getStatusBadge}
                getPaymentBadge={getPaymentBadge}
                getSessionText={getSessionText}
                formatDate={formatDate}
                formatDateTime={formatDateTime}
                getDoctorText={getDoctorText}
                canShowPaymentButton={canShowPaymentButton}
                canCancelAppointment={canCancelAppointment}
                getStatusText={getStatusText}
              />
            ))}
          </div>
        )}

        {filteredAppointments.length > pageSize && (
          <div className="pagination-bottom">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={changePage}
              getPageNumbers={getPageNumbers}
              position="bottom"
            />

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
                    changePage(page);
                  }
                }}
                className="page-jump-input"
              />
              <span className="total-pages">/ {totalPages}</span>
            </div>
          </div>
        )}
      </div>

      {showQRModal && qrData && (
        <QRModal
          qrData={qrData}
          isDownloading={isDownloading}
          onDownload={downloadQRImage}
          onShare={shareQR}
          onClose={() => setShowQRModal(false)}
          formatDate={formatDate}
          getStatusText={getStatusText}
        />
      )}

      {showCancelModal && selectedAppointment && (
        <CancelModal
          appointment={selectedAppointment}
          cancelReason={cancelReason}
          setCancelReason={setCancelReason}
          requestRefund={requestRefund}
          setRequestRefund={setRequestRefund}
          refundAccountInfo={refundAccountInfo}
          setRefundAccountInfo={handleRefundAccountChange}
          isCancelling={isCancelling}
          onConfirm={handleConfirmCancel}
          onClose={() => setShowCancelModal(false)}
          formatDate={formatDate}
          isPaid={selectedAppointment?.paymentStatus === "Đã thanh toán"}
        />
      )}

      <div className="quick-help">
        <div className="help-header">
          <h3>CẦN HỖ TRỢ?</h3>
        </div>
        <p>
          Gọi tổng đài: <strong>1900 1234</strong> (Miễn phí)
        </p>
        <p className="help-time">Thời gian: 7:00 - 22:00 hàng ngày</p>
        <button className="help-button" onClick={() => navigate("/help")}>
          XEM HƯỚNG DẪN CHI TIẾT
        </button>
      </div>
    </div>
  );
};

const PaginationControl = React.memo(
  ({ currentPage, totalPages, onPageChange, getPageNumbers, position }) => {
    const pageNumbers = useMemo(() => {
      return getPageNumbers();
    }, [currentPage, totalPages, getPageNumbers]);

    return (
      <div className={`pagination-controls ${position}`}>
        <button
          className="pagination-button first"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          Đầu
        </button>

        <button
          className="pagination-button prev"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Trước
        </button>

        <div className="page-numbers">
          {pageNumbers.map((page) => (
            <button
              key={page}
              className={`page-number ${currentPage === page ? "active" : ""}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          className="pagination-button next"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Sau
        </button>

        <button
          className="pagination-button last"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          Cuối
        </button>
      </div>
    );
  },
);

const AppointmentItem = React.memo(
  ({
    appointment,
    isExpanded,
    onToggleExpand,
    onShowQR,
    onPayment,
    onCancel,
    getStatusBadge,
    getPaymentBadge,
    formatDate,
    formatDateTime,
    getDoctorText,
    canShowPaymentButton,
    canCancelAppointment,
    getStatusText,
    getSessionText,
  }) => {
    const showCancelButton = canCancelAppointment(appointment);

    return (
      <div className={`appointment-card ${isExpanded ? "expanded" : ""}`}>
        <div
          className="card-header"
          onClick={() => onToggleExpand(appointment.id)}
          role="button"
          tabIndex={0}
        >
          <div className="header-left">
            <div className="appointment-number">
              Đơn #{appointment.registrationNumber || appointment.id}
            </div>
            <div className="patient-name">
              {appointment.fullName || "Chưa có tên"}
            </div>
          </div>

          <div className="header-right">
            <div className="status-container">
              {getStatusBadge(appointment.status)}
              {getPaymentBadge(appointment.paymentStatus)}
            </div>
            <button className="expand-button">
              {isExpanded ? "Thu gọn" : "Xem chi tiết"}
            </button>
          </div>
        </div>

        <div className="basic-info">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Điện thoại</div>
              <div className="info-value phone">
                {appointment.phone || "Chưa có"}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Email</div>
              <div className="info-value email">
                {appointment.email || "Chưa có"}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Phí khám</div>
              <div
                className={`info-value ${appointment.paymentStatus === "Đã thanh toán" ? "paid" : "unpaid"}`}
              >
                {appointment.examinationFee?.toLocaleString() || "0"} VND
              </div>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="expanded-details">
            {appointment.symptoms && (
              <div className="detail-section symptoms">
                <h4 className="section-title">TRIỆU CHỨNG</h4>
                <div className="section-content">
                  <div className="symptoms-text">{appointment.symptoms}</div>
                </div>
              </div>
            )}

            <div className="detail-section appointment-info">
              <h4 className="section-title">THÔNG TIN BUỔI KHÁM</h4>
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

                  {appointment.doctor && (
                    <div className="doctor-info-card">
                      <div className="doctor-header">
                        <h5>BÁC SĨ PHỤ TRÁCH</h5>
                      </div>
                      <div className="doctor-content">
                        <div className="doctor-detail">
                          <span className="doctor-label">Tên bác sĩ:</span>
                          <span className="doctor-name">
                            {getDoctorText(appointment)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {appointment.status === "APPROVED" && (
                    <div className="appointment-details-card">
                      <div className="details-header">
                        <h5>CHI TIẾT BUỔI KHÁM</h5>
                      </div>
                      <div className="details-grid">
                        {(appointment.assignedSession ||
                          appointment.expectedTimeSlot) && (
                          <div className="detail-card">
                            <div className="detail-content">
                              <div className="detail-title">Buổi khám</div>
                              <div className="detail-value">
                                {getSessionText(appointment)}
                              </div>
                            </div>
                          </div>
                        )}
                        {appointment.expectedTimeSlot && (
                          <div className="detail-card">
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

            {appointment.paymentStatus === "Đã thanh toán" &&
              appointment.paymentDate && (
                <div className="detail-section payment">
                  <h4 className="section-title">THÔNG TIN THANH TOÁN</h4>
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

            <div className="actions-section">
              <div className="current-status-display">
                <div className="status-badge-large">
                  <span className="status-label">TRẠNG THÁI:</span>
                  <span
                    className={`status-value ${appointment.status.toLowerCase()}`}
                  >
                    {getStatusText(appointment.status)}
                  </span>
                </div>
                {appointment.paymentStatus === "Đã thanh toán" && (
                  <div className="payment-status-badge">
                    <span className="payment-text">ĐÃ THANH TOÁN</span>
                  </div>
                )}
              </div>

              <div className="action-buttons-grid">
                {canShowPaymentButton(appointment) && (
                  <button
                    className="payment-button primary"
                    onClick={() => onPayment(appointment)}
                  >
                    THANH TOÁN NGAY
                  </button>
                )}

                {appointment.status === "APPROVED" && (
                  <button
                    className="qr-button secondary"
                    onClick={() => onShowQR(appointment)}
                  >
                    MÃ QR CHECK-IN
                  </button>
                )}

                {showCancelButton && (
                  <button
                    className="cancel-button danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancel(appointment);
                    }}
                    title="Hủy lịch hẹn này"
                  >
                    HỦY LỊCH
                  </button>
                )}

                <button
                  className="print-button tertiary"
                  onClick={() => window.print()}
                >
                  IN THÔNG TIN
                </button>
              </div>
            </div>

            <div className="notes-section">
              <div className="notes-header">
                <h5>LƯU Ý QUAN TRỌNG</h5>
              </div>
              <div className="notes-content">
                <div className="note-item">
                  <span className="note-text">
                    Vui lòng đến trước 15 phút để làm thủ tục
                  </span>
                </div>
                <div className="note-item">
                  <span className="note-text">
                    Mang theo CMND/CCCD và thẻ BHYT (nếu có)
                  </span>
                </div>
                <div className="note-item">
                  <span className="note-text">
                    Nếu không thể đến được, vui lòng hủy lịch trước 1 ngày
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

const QRModal = React.memo(
  ({
    qrData,
    isDownloading,
    onDownload,
    onShare,
    onClose,
    formatDate,
    getStatusText,
  }) => {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>MÃ QR CHECK-IN</h2>
            <button className="close-modal" onClick={onClose}>
              Đóng
            </button>
          </div>

          <div className="modal-body">
            <div className="appointment-info">
              <h3>
                Đơn #
                {qrData.appointment.registrationNumber || qrData.appointment.id}
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Bệnh nhân:</span>
                  <span className="info-value">
                    {qrData.appointment.fullName}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Khoa:</span>
                  <span className="info-value">
                    {qrData.appointment.department}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Ngày khám:</span>
                  <span className="info-value">
                    {formatDate(qrData.appointment.appointmentDate)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Trạng thái:</span>
                  <span className="info-value status">
                    {getStatusText(qrData.appointment.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="qr-display">
              <QRCode
                id="qrcode-svg"
                value={qrData.data}
                size={250}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="H"
              />
              <p className="qr-instruction">
                Quét mã QR này tại quầy lễ tân để check-in
              </p>
              <p className="qr-note">
                Vui lòng đến trước 15 phút để làm thủ tục
              </p>
            </div>

            <div className="modal-actions">
              <button
                className="action-button download"
                onClick={onDownload}
                disabled={isDownloading}
              >
                {isDownloading ? "ĐANG TẢI..." : "TẢI MÃ QR"}
              </button>
              <button className="action-button share" onClick={onShare}>
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
  },
);

const CancelModal = React.memo(
  ({
    appointment,
    cancelReason,
    setCancelReason,
    requestRefund,
    setRequestRefund,
    refundAccountInfo,
    setRefundAccountInfo,
    isCancelling,
    onConfirm,
    onClose,
    formatDate,
    isPaid,
  }) => {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>HỦY LỊCH HẸN</h2>
            <button className="close-modal" onClick={onClose}>
              Đóng
            </button>
          </div>

          <div className="modal-body">
            <div className="appointment-info">
              <h3>Đơn #{appointment.registrationNumber || appointment.id}</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Bệnh nhân:</span>
                  <span className="info-value">{appointment.fullName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Ngày khám:</span>
                  <span className="info-value">
                    {formatDate(appointment.appointmentDate)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Khoa:</span>
                  <span className="info-value">{appointment.department}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Trạng thái thanh toán:</span>
                  <span className="info-value status">
                    {appointment.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="cancel-form">
              <div className="form-group">
                <label htmlFor="cancel-reason">
                  Lý do hủy <span className="required">*</span>
                </label>
                <textarea
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Vui lòng nhập lý do hủy lịch..."
                  rows={4}
                  maxLength={500}
                  className="reason-textarea"
                />
                <div className="char-count">
                  {cancelReason.length}/500 ký tự
                </div>
              </div>

              {isPaid && (
                <div className="refund-section">
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="request-refund"
                      checked={requestRefund}
                      onChange={(e) => setRequestRefund(e.target.checked)}
                    />
                    <label htmlFor="request-refund">Yêu cầu hoàn tiền</label>
                  </div>

                  {requestRefund && (
                    <div className="refund-form">
                      <h4>Thông tin tài khoản nhận hoàn tiền</h4>

                      <div className="refund-input-group">
                        <div className="form-group">
                          <label htmlFor="account-number">Số tài khoản</label>
                          <input
                            type="text"
                            id="account-number"
                            value={refundAccountInfo.accountNumber}
                            onChange={(e) =>
                              setRefundAccountInfo(
                                "accountNumber",
                                e.target.value,
                              )
                            }
                            placeholder="Nhập số tài khoản"
                            className="refund-input"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="bank-name">Tên ngân hàng</label>
                          <input
                            type="text"
                            id="bank-name"
                            value={refundAccountInfo.bankName}
                            onChange={(e) =>
                              setRefundAccountInfo("bankName", e.target.value)
                            }
                            placeholder="Nhập tên ngân hàng"
                            className="refund-input"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="account-holder">
                            Tên chủ tài khoản
                          </label>
                          <input
                            type="text"
                            id="account-holder"
                            value={refundAccountInfo.accountHolder}
                            onChange={(e) =>
                              setRefundAccountInfo(
                                "accountHolder",
                                e.target.value,
                              )
                            }
                            placeholder="Nhập tên chủ tài khoản"
                            className="refund-input"
                          />
                        </div>
                      </div>

                      <div className="refund-note">
                        Ghi chú: Số tiền hoàn sẽ được tính theo chính sách hoàn
                        tiền của bệnh viện
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="warning-box">
                <h4>LƯU Ý QUAN TRỌNG</h4>
                <ul>
                  <li>Hủy lịch không thể khôi phục</li>
                  <li>Chỉ có thể hủy lịch trước 1 ngày so với ngày hẹn</li>
                  {isPaid && (
                    <li>
                      Hoàn tiền chỉ áp dụng khi hủy trước 3 ngày (80%) hoặc 1
                      ngày (50%)
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="action-button cancel-confirm"
                onClick={onConfirm}
                disabled={isCancelling || !cancelReason.trim()}
              >
                {isCancelling ? "ĐANG XỬ LÝ..." : "XÁC NHẬN HỦY"}
              </button>
              <button
                className="action-button cancel"
                onClick={onClose}
                disabled={isCancelling}
              >
                QUAY LẠI
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default Appointments;
