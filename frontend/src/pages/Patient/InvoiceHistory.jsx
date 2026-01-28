import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/InvoiceHistory.css";

const InvoiceHistory = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) {
      return;
    }

    hasFetched.current = true;

    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUserInfo(userData);

    if (userData.email) {
      fetchPatientInvoices(userData);
    } else {
      setError("Vui lòng đăng nhập để xem hóa đơn");
      setLoading(false);
    }
  }, []);

  const fetchPatientInvoices = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      if (userData.token) {
        try {
          const response = await axios.get(
            "http://localhost:8080/api/invoices/patient",
            {
              params: {
                email: userData.email,
                phone: userData.phone || "",
              },
              headers: {
                Authorization: `Bearer ${userData.token}`,
              },
            },
          );

          if (Array.isArray(response.data)) {
            setInvoices(response.data);
          } else {
            setInvoices([]);
          }
        } catch (authErr) {
          if (authErr.response?.status === 403) {
            setError("Không có quyền truy cập. Vui lòng đăng nhập lại.");
          } else {
            setError("Không thể tải danh sách hóa đơn");
          }
          setInvoices([]);
        }
      } else {
        setError("Không có token xác thực. Vui lòng đăng nhập lại.");
        setInvoices([]);
      }
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại sau.");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === "") return "N/A";
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return "N/A";
    return numAmount.toLocaleString("vi-VN") + " ₫";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PAID: { label: "Đã thanh toán", className: "status-paid" },
      PENDING: { label: "Chờ thanh toán", className: "status-pending" },
      CANCELLED: { label: "Đã hủy", className: "status-cancelled" },
      SUCCESS: { label: "Thành công", className: "status-paid" },
      FAILED: { label: "Thất bại", className: "status-cancelled" },
    };

    const config = statusConfig[status] || {
      label: status,
      className: "status-unknown",
    };

    return (
      <span className={`status-badge ${config.className}`}>{config.label}</span>
    );
  };

  const viewInvoiceDetail = (invoiceNumber) => {
    if (!invoiceNumber) return;
    navigate(`/invoice/${invoiceNumber}`);
  };

  const printInvoice = (invoice) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hóa đơn ${invoice.invoiceNumber || invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .invoice-header { text-align: center; margin-bottom: 30px; }
          .invoice-title { font-size: 24px; font-weight: bold; color: #2c3e50; }
          .invoice-info { margin: 20px 0; }
          .info-row { display: flex; margin-bottom: 8px; }
          .info-label { font-weight: bold; width: 150px; }
          .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          .invoice-table th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; background-color: #f8f9fa; }
          .footer { margin-top: 40px; text-align: center; font-style: italic; color: #666; }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="invoice-title">HÓA ĐƠN THANH TOÁN</div>
          <div>Số: ${invoice.invoiceNumber || `INV${invoice.id}`}</div>
          <div>Ngày: ${formatDate(invoice.invoiceDate)}</div>
        </div>
        
        <div class="invoice-info">
          <div class="info-row">
            <span class="info-label">Tên bệnh nhân:</span>
            <span>${invoice.patientName || userInfo?.fullName || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span>${invoice.patientEmail || userInfo?.email || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Số điện thoại:</span>
            <span>${invoice.patientPhone || userInfo?.phone || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Mã giao dịch:</span>
            <span>${invoice.transactionNo || "N/A"}</span>
          </div>
        </div>
        
        <table class="invoice-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Dịch vụ</th>
              <th>Số tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>${invoice.serviceName || "Phí khám bệnh"}</td>
              <td>${formatCurrency(invoice.amount)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="2" style="text-align: right;">Tổng cộng:</td>
              <td>${formatCurrency(invoice.amount)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="invoice-info">
          <div class="info-row">
            <span class="info-label">Phương thức thanh toán:</span>
            <span>${invoice.paymentMethod || "VNPay"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Ngân hàng:</span>
            <span>${invoice.bankCode || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Trạng thái:</span>
            <span>${getStatusBadge(invoice.status).props.children}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Ngày thanh toán:</span>
            <span>${formatDate(invoice.paymentDate || invoice.invoiceDate)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!</p>
          <p>Mọi thắc mắc vui lòng liên hệ: 1900 1001</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleRefresh = () => {
    if (userInfo) {
      hasFetched.current = false;
      fetchPatientInvoices(userInfo);
    }
  };

  if (loading) {
    return (
      <div className="invoice-history-container">
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <h2>Đang tải thông tin hóa đơn...</h2>
          <p>Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-history-container">
      <div className="invoice-header">
        <h1>Lịch sử hóa đơn</h1>
        <p>Danh sách hóa đơn của bạn</p>
      </div>

      {error && (
        <div className="error-section">
          <h3>{error}</h3>
          <div className="error-actions">
            <button className="btn-primary" onClick={handleRefresh}>
              Thử lại
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate("/patient/appointments")}
            >
              Quay lại lịch hẹn
            </button>
          </div>
        </div>
      )}

      {!error && invoices.length === 0 ? (
        <div className="empty-state">
          <h3>Chưa có hóa đơn nào</h3>
          <p>Bạn chưa có hóa đơn thanh toán nào trong hệ thống</p>
          <div className="empty-actions">
            <button
              className="btn-primary"
              onClick={() => navigate("/patient/appointments")}
            >
              Đặt lịch khám ngay
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate("/payment-result")}
            >
              Kiểm tra thanh toán
            </button>
          </div>
        </div>
      ) : (
        <div className="invoices-list">
          <div className="summary-info">
            <div className="summary-header">
              <p>
                Tìm thấy <strong>{invoices.length}</strong> hóa đơn
              </p>
            </div>
            <p>
              Tổng số tiền đã thanh toán:{" "}
              <strong className="total-amount">
                {formatCurrency(
                  invoices.reduce(
                    (sum, inv) => sum + (parseFloat(inv.amount) || 0),
                    0,
                  ),
                )}
              </strong>
            </p>
          </div>

          <div className="invoices-grid">
            {invoices.map((invoice) => (
              <div
                key={invoice.id || invoice.invoiceNumber}
                className="invoice-card"
              >
                <div className="invoice-card-header">
                  <div>
                    <h3>
                      Số hóa đơn: {invoice.invoiceNumber || `INV${invoice.id}`}
                    </h3>
                    <p className="invoice-date">
                      {formatDate(invoice.invoiceDate || invoice.createdAt)}
                    </p>
                  </div>
                  {getStatusBadge(invoice.status)}
                </div>

                <div className="invoice-card-body">
                  <div className="invoice-info-row">
                    <span className="info-label">Bệnh nhân:</span>
                    <span className="info-value">
                      {invoice.patientName || "N/A"}
                    </span>
                  </div>
                  <div className="invoice-info-row">
                    <span className="info-label">Dịch vụ:</span>
                    <span className="info-value">
                      {invoice.serviceName || "Phí khám bệnh"}
                    </span>
                  </div>
                  <div className="invoice-info-row">
                    <span className="info-label">Số tiền:</span>
                    <span className="info-value amount">
                      {formatCurrency(invoice.amount)}
                    </span>
                  </div>
                  <div className="invoice-info-row">
                    <span className="info-label">Phương thức:</span>
                    <span className="info-value">
                      {invoice.paymentMethod || "VNPay"}
                    </span>
                  </div>
                  {invoice.transactionNo && (
                    <div className="invoice-info-row">
                      <span className="info-label">Mã GD:</span>
                      <span className="info-value transaction">
                        {invoice.transactionNo}
                      </span>
                    </div>
                  )}
                </div>

                <div className="invoice-card-footer">
                  <button
                    className="btn-view"
                    onClick={() =>
                      viewInvoiceDetail(invoice.invoiceNumber || invoice.id)
                    }
                  >
                    Xem chi tiết
                  </button>
                  <button
                    className="btn-print"
                    onClick={() => printInvoice(invoice)}
                  >
                    In hóa đơn
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="action-buttons">
        <button className="btn-secondary" onClick={() => navigate("/")}>
          Về trang chủ
        </button>
        <button
          className="btn-secondary"
          onClick={() => navigate("/patient/appointments")}
        >
          Lịch hẹn của tôi
        </button>
        <button className="btn-primary" onClick={() => navigate("/payment")}>
          Thanh toán mới
        </button>
      </div>
    </div>
  );
};

export default InvoiceHistory;
