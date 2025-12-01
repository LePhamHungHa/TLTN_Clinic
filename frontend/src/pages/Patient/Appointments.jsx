import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import QRCode from "react-qr-code";
import "../../css/AppointmentsPage.css";

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, filters]);

  // Hàm chuyển tiếng Việt có dấu thành không dấu
  const removeAccents = (str) => {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  };

  const fetchAppointments = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");

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
          timeout: 10000,
        }
      );

      const appointmentsWithPayment = await Promise.all(
        response.data.map(async (appointment) => {
          let paymentStatus = "Chưa thanh toán";
          let paymentAmount = appointment.examinationFee || 0;
          let paymentDate = null;
          let paymentMethod = null;

          try {
            // Gọi API mới để kiểm tra trạng thái thanh toán
            const paymentResponse = await axios.get(
              `http://localhost:8080/api/payments/status/${appointment.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                timeout: 5000,
              }
            );

            if (paymentResponse.data.success) {
              const paymentData = paymentResponse.data;

              if (paymentData.paymentStatus === "PAID") {
                paymentStatus = "Đã thanh toán";
                paymentMethod = paymentData.paymentMethod || "VNPAY";
              } else {
                paymentStatus = "Chưa thanh toán";
              }

              paymentAmount = paymentData.amount || paymentAmount;
              paymentDate = paymentData.paymentDate;
            }
          } catch (error) {
            console.error(`Payment API failed for ${appointment.id}:`, error);
            // Fallback: Kiểm tra paymentStatus từ appointment
            if (appointment.paymentStatus === "PAID") {
              paymentStatus = "Đã thanh toán";
            } else {
              paymentStatus = "Chưa thanh toán";
            }
          }

          return {
            ...appointment,
            paymentStatus: paymentStatus,
            paymentAmount: paymentAmount,
            paymentDate: paymentDate,
            paymentMethod: paymentMethod,
          };
        })
      );

      setAppointments(appointmentsWithPayment);
      setErrorMessage(null);
    } catch (error) {
      console.error("❌ Lỗi tải lịch hẹn:", error);
      if (error.response?.status === 403) {
        setErrorMessage("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      } else if (error.response?.status === 404) {
        setErrorMessage("Không tìm thấy lịch hẹn nào.");
      } else if (error.response?.status === 500) {
        setErrorMessage("Lỗi server. Vui lòng thử lại sau.");
      } else {
        setErrorMessage(
          "Không thể tải danh sách lịch hẹn. Vui lòng thử lại sau."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Hàm kiểm tra lại trạng thái thanh toán cho 1 appointment cụ thể
  // const refreshPaymentStatus = async (appointmentId) => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     const paymentResponse = await axios.get(
  //       `http://localhost:8080/api/payments/status/${appointmentId}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //         timeout: 5000,
  //       }
  //     );

  //     if (paymentResponse.data.success) {
  //       const paymentData = paymentResponse.data;

  //       // Cập nhật state
  //       setAppointments((prevAppointments) =>
  //         prevAppointments.map((app) =>
  //           app.id === appointmentId
  //             ? {
  //                 ...app,
  //                 paymentStatus:
  //                   paymentData.paymentStatus === "PAID"
  //                     ? "Đã thanh toán"
  //                     : "Chưa thanh toán",
  //                 paymentMethod: paymentData.paymentMethod,
  //                 paymentDate: paymentData.paymentDate,
  //               }
  //             : app
  //         )
  //       );

  //       return paymentData.paymentStatus === "PAID";
  //     }
  //     return false;
  //   } catch (error) {
  //     console.error("Lỗi kiểm tra thanh toán:", error);
  //     return false;
  //   }
  // };

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
          app.department?.toLowerCase().includes(searchLower) ||
          app.symptoms?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredAppointments(filtered);
  };

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
    // Format đơn giản, chỉ dùng chữ không dấu và số để tránh lỗi font
    const qrText = `MEDICAL_CHECKIN
ID:${appointment.registrationNumber || appointment.id}
NAME:${removeAccents(appointment.fullName)}
DEPT:${removeAccents(appointment.department)}
DATE:${formatDateForQR(appointment.appointmentDate)}
STATUS:${getStatusForQR(appointment.status)}`;

    return qrText;
  };

  // Hàm format date cho QR (dùng format số đơn giản)
  const formatDateForQR = (dateString) => {
    if (!dateString) return "NULL";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  // Hàm chuyển status sang format cho QR (không dấu)
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
        // Tạo canvas với thiết kế đẹp
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Kích thước ảnh (tỷ lệ 3:4)
        canvas.width = 600;
        canvas.height = 800;

        // ===== VẼ NỀN =====
        // Nền chính
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header với gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, "#1890ff");
        gradient.addColorStop(1, "#096dd9");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, 120);

        // ===== TIÊU ĐỀ =====
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 28px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🏥 Mã QR Check-in", canvas.width / 2, 50);

        ctx.font = "16px Arial, sans-serif";
        ctx.fillText("Bệnh viện Đa khoa Quốc tế", canvas.width / 2, 80);

        // ===== THÔNG TIN ĐƠN =====
        ctx.fillStyle = "#2c3e50";
        ctx.font = "bold 20px Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("THÔNG TIN LỊCH HẸN", 40, 160);

        // Đường kẻ ngang
        ctx.strokeStyle = "#e8e8e8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(40, 175);
        ctx.lineTo(canvas.width - 40, 175);
        ctx.stroke();

        // Chi tiết thông tin
        ctx.font = "16px Arial, sans-serif";
        ctx.fillStyle = "#555";

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
          ctx.fillText(detail, 40, 210 + index * 35);
        });

        // ===== VẼ QR CODE =====
        const svg = document.getElementById("qrcode-svg");
        if (svg) {
          const svgData = new XMLSerializer().serializeToString(svg);
          const img = new Image();

          img.onload = () => {
            // Khung QR code
            const qrSize = 280;
            const qrX = (canvas.width - qrSize) / 2;
            const qrY = 400;

            // Vẽ nền QR
            ctx.fillStyle = "#f8f9fa";
            ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

            // Vẽ border QR
            ctx.strokeStyle = "#dee2e6";
            ctx.lineWidth = 2;
            ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

            // Vẽ QR code
            ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

            // ===== HƯỚNG DẪN =====
            ctx.fillStyle = "#d35400";
            ctx.font = "bold 18px Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("📍 HƯỚNG DẪN SỬ DỤNG", canvas.width / 2, 720);

            ctx.fillStyle = "#666";
            ctx.font = "14px Arial, sans-serif";
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

            // ===== TẢI VỀ =====
            const pngUrl = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `qr-checkin-${
              selectedQRData.appointment.registrationNumber
            }-${new Date().getTime()}.png`;
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
        console.log("Chia sẻ bị hủy");
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

  // Hàm chuyển status sang tiếng Việt để hiển thị
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
      label: getStatusDisplay(status),
      class: "status-default",
    };

    return (
      <span className={`status-badge ${config.class}`}>{config.label}</span>
    );
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

  const statsData = calculateStats();

  // Hàm kiểm tra lại thanh toán cho 1 appointment
  // const handleCheckPaymentStatus = async (appointmentId) => {
  //   const isPaid = await refreshPaymentStatus(appointmentId);
  //   if (isPaid) {
  //     alert("✅ Lịch hẹn đã được thanh toán!");
  //   } else {
  //     alert("❌ Lịch hẹn chưa được thanh toán.");
  //   }
  // };

  // Hàm kiểm tra xem có hiển thị nút thanh toán không
  const shouldShowPaymentButton = (appointment) => {
    const allowedStatuses = ["APPROVED", "COMPLETED", "IN_PROGRESS", "WAITING"];
    return (
      appointment.paymentStatus !== "Đã thanh toán" &&
      allowedStatuses.includes(appointment.status)
    );
  };

  // Hàm kiểm tra xem có hiển thị thông báo chờ duyệt không
  const shouldShowPendingMessage = (appointment) => {
    const pendingStatuses = ["PENDING", "NEEDS_MANUAL_REVIEW", "REJECTED"];
    return pendingStatuses.includes(appointment.status);
  };

  if (loading) {
    return (
      <div className="appointments-container">
        <div className="loading">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h1>📅 Lịch hẹn Khám bệnh của tôi</h1>
        <p>Quản lý và theo dõi các lịch hẹn khám bệnh của bạn</p>
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
          <h3>Tổng lịch hẹn</h3>
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
          <label>Trạng thái đơn:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="NEEDS_MANUAL_REVIEW">Cần xử lý</option>
            <option value="REJECTED">Đã từ chối</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="IN_PROGRESS">Đang khám</option>
            <option value="WAITING">Đang chờ</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Trạng thái thanh toán:</label>
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
            placeholder="Khoa, triệu chứng..."
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
            {filters.status !== "ALL" &&
              ` - ${getStatusDisplay(filters.status)}`}
          </h2>
          <button className="refresh-btn" onClick={fetchAppointments}>
            🔄 Làm mới
          </button>
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
                }`}
                id={`appointment-${appointment.id}`}
              >
                {/* Card Header - Luôn hiển thị */}
                <div className="card-header">
                  <div className="card-main-info">
                    <h3>
                      Đơn #{appointment.registrationNumber || appointment.id}
                    </h3>
                    <div className="status-group">
                      {getStatusBadge(appointment.status)}
                      {getPaymentStatusBadge(appointment.paymentStatus)}
                    </div>
                  </div>
                  <div className="card-actions-header">
                    <button
                      className="qr-btn"
                      onClick={() => handleShowQR(appointment)}
                      title="Mã QR Check-in"
                    >
                      📱 QR
                    </button>
                    <button
                      className="expand-btn"
                      onClick={() => toggleCardExpand(appointment.id)}
                    >
                      {expandedCard === appointment.id ? "▼" : "▶"}
                    </button>
                  </div>
                </div>

                {/* Basic Info - Luôn hiển thị */}
                <div className="card-basic-info">
                  <div className="basic-info-grid">
                    <div className="info-item">
                      <span className="label">👤 Bệnh nhân:</span>
                      <span>{appointment.fullName || "Chưa có"}</span>
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
                  </div>
                </div>

                {/* Expanded Details - Chỉ hiển thị khi expanded */}
                {expandedCard === appointment.id && (
                  <div className="card-expanded-details">
                    {/* QR Code Mini - Chỉ hiển thị với đơn đã duyệt */}
                    {appointment.status === "APPROVED" && (
                      <div className="details-section qr-section">
                        <h4>📱 Mã QR Check-in</h4>
                        <div className="qr-mini-container">
                          <div className="qr-code-mini">
                            <QRCode
                              value={generateQRData(appointment)}
                              size={80}
                              bgColor="#FFFFFF"
                              fgColor="#000000"
                              level="M"
                            />
                          </div>
                          <div className="qr-info">
                            <p>Quét mã QR này khi đến phòng khám để check-in</p>
                            <button
                              className="btn-show-qr"
                              onClick={() => handleShowQR(appointment)}
                            >
                              🔍 Xem mã QR lớn
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="details-section">
                      <h4>Thông tin chi tiết</h4>
                      <div className="details-grid">
                        <div className="detail-item">
                          <span className="label">📞 SĐT:</span>
                          <span>{appointment.phone || "Chưa có"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">📧 Email:</span>
                          <span>{appointment.email || "Chưa có"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">👨‍⚕️ Bác sĩ:</span>
                          <span className="doctor-info">
                            <strong>{getDoctorInfo(appointment)}</strong>
                            {appointment.doctor?.specialty && (
                              <div className="doctor-specialty">
                                {appointment.doctor.specialty}
                              </div>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Thông tin buổi khám cho đơn đã duyệt */}
                    {appointment.status === "APPROVED" && (
                      <div className="details-section approved-section">
                        <h4>Thông tin buổi khám</h4>
                        <div className="appointment-details">
                          <div className="detail-row">
                            <span className="label">🕒 Buổi khám:</span>
                            <span>
                              {appointment.assignedSession || "Chưa có"}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="label">🎯 Số thứ tự:</span>
                            <span className="queue-number">
                              {appointment.queueNumber || "Chưa có"}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="label">⏰ Khung giờ dự kiến:</span>
                            <span>
                              {appointment.expectedTimeSlot || "Chưa có"}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="label">🚪 Phòng khám:</span>
                            <span>{appointment.roomNumber || "Chưa có"}</span>
                          </div>
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
                          {appointment.paymentMethod && (
                            <div className="detail-row">
                              <span className="label">💳 Phương thức:</span>
                              <span>
                                {appointment.paymentMethod === "CASH"
                                  ? "Tiền mặt"
                                  : "VNPAY"}
                              </span>
                            </div>
                          )}
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

                    {/* Nút thanh toán - CHỈ ẨN KHI ĐÃ THANH TOÁN */}
                    {shouldShowPaymentButton(appointment) && (
                      <div className="payment-action">
                        {appointment.status === "COMPLETED" && (
                          <div className="completed-warning">
                            ⚠️ <strong>Lưu ý quan trọng:</strong> Đã khám xong
                            nhưng chưa thanh toán!
                          </div>
                        )}
                        <button
                          className={`btn-pay-now expanded ${
                            appointment.status === "COMPLETED" ? "urgent" : ""
                          }`}
                          onClick={() => handlePayment(appointment)}
                        >
                          {appointment.status === "COMPLETED"
                            ? "💳 THANH TOÁN NGAY"
                            : "💳 Thanh toán online"}
                        </button>
                        {/* <button
                          className="btn-check-payment-status"
                          onClick={() =>
                            handleCheckPaymentStatus(appointment.id)
                          }
                          title="Kiểm tra nếu đã thanh toán tiền mặt tại quầy"
                        >
                          🔄 Kiểm tra thanh toán
                        </button>
                        <p className="payment-note">
                          {appointment.status === "COMPLETED"
                            ? "⚠️ Vui lòng thanh toán phí khám để hoàn tất hồ sơ y tế"
                            : "💡 Nếu bạn đã thanh toán tiền mặt tại quầy, vui lòng bấm 'Kiểm tra thanh toán' để cập nhật trạng thái"}
                        </p> */}
                      </div>
                    )}

                    {/* Thông báo đã thanh toán */}
                    {appointment.paymentStatus === "Đã thanh toán" && (
                      <div className="payment-info">
                        <p className="payment-success-note">
                          ✅ <strong>Đã thanh toán:</strong> Phí khám đã được
                          thanh toán đầy đủ
                        </p>
                      </div>
                    )}

                    {/* Thông báo chờ duyệt */}
                    {shouldShowPendingMessage(appointment) && (
                      <div className="payment-info">
                        <p className="payment-disabled-note">
                          ⏳ <strong>Thông báo:</strong> Chỉ có thể thanh toán
                          khi đơn đã được duyệt (APPROVED)
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="appointment-notes">
                      <p>
                        💡 <strong>Lưu ý:</strong> Vui lòng đến trước 15 phút để
                        làm thủ tục
                      </p>
                      {appointment.status === "APPROVED" && (
                        <p>
                          ✅ <strong>Trạng thái:</strong> Lịch hẹn đã được xác
                          nhận
                          {appointment.paymentStatus === "Chưa thanh toán" &&
                            " - Vui lòng thanh toán phí khám trước khi đến"}
                        </p>
                      )}
                      {appointment.status === "COMPLETED" && (
                        <p>
                          ✅ <strong>Trạng thái:</strong> Đã hoàn thành khám
                          bệnh
                          {appointment.paymentStatus === "Chưa thanh toán" &&
                            " - Vui lòng thanh toán phí khám để hoàn tất hồ sơ"}
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

      {/* Modal hiển thị QR Code lớn */}
      {showQRModal && selectedQRData && (
        <div className="modal-overlay">
          <div className="modal-content qr-modal">
            <div className="modal-header">
              <h3>📱 Mã QR Check-in</h3>
              <button
                className="close-btn"
                onClick={() => setShowQRModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="qr-info-section">
                <h4>
                  Đơn #
                  {selectedQRData.appointment.registrationNumber ||
                    selectedQRData.appointment.id}
                </h4>
                <p>
                  <strong>Bệnh nhân:</strong>{" "}
                  {selectedQRData.appointment.fullName}
                </p>
                <p>
                  <strong>Khoa:</strong> {selectedQRData.appointment.department}
                </p>
                <p>
                  <strong>Ngày khám:</strong>{" "}
                  {formatDate(selectedQRData.appointment.appointmentDate)}
                </p>
                <p>
                  <strong>Trạng thái:</strong>{" "}
                  {getStatusDisplay(selectedQRData.appointment.status)}
                </p>
              </div>

              <div className="qr-code-container">
                <QRCode
                  id="qrcode-svg"
                  value={selectedQRData.data}
                  size={200}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  level="H"
                />
                <p className="qr-instruction">
                  📍 Quét mã QR này tại quầy lễ tân để check-in
                </p>
              </div>

              <div className="qr-actions">
                <button
                  className="btn-download-qr"
                  onClick={downloadQRCode}
                  disabled={downloading}
                >
                  {downloading ? "⏳ Đang tải..." : "💾 Tải QR Code"}
                </button>
                <button className="btn-share-qr" onClick={shareQRCode}>
                  📤 Chia sẻ thông tin
                </button>
                <button
                  className="btn-close-qr"
                  onClick={() => setShowQRModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
