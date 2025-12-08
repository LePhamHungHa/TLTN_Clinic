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

  // Sử dụng useRef để theo dõi đã gọi API chưa
  const hasFetched = useRef(false);
  const fetchCount = useRef(0);

  // Lấy thông tin user từ localStorage khi component mount
  useEffect(() => {
    // Kiểm tra đã gọi API chưa (tránh gọi 2 lần trong StrictMode)
    if (hasFetched.current) {
      console.log("⚠️ Đã gọi API rồi, bỏ qua lần gọi thứ 2");
      return;
    }

    hasFetched.current = true;
    fetchCount.current += 1;

    console.log(
      `🔄 InvoiceHistory useEffect RUNNING (call #${fetchCount.current})`
    );

    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    console.log("👤 User info from localStorage:", userData);
    setUserInfo(userData);

    if (userData.email) {
      fetchPatientInvoices(userData);
    } else {
      setError("Vui lòng đăng nhập để xem hóa đơn");
      setLoading(false);
    }

    // Cleanup
    return () => {
      console.log("🧹 InvoiceHistory useEffect CLEANUP");
    };
  }, []); // Chỉ chạy 1 lần khi mount

  const fetchPatientInvoices = async (userData) => {
    const callId = Date.now(); // ID duy nhất cho mỗi lần gọi
    console.log(`📞 fetchPatientInvoices STARTED (callId: ${callId})`);

    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Fetching invoices for user:", {
        email: userData.email,
        phone: userData.phone,
        fullName: userData.fullName,
      });

      // CHỈ GỌI API VỚI AUTH (không thử nhiều API nữa)
      if (userData.token) {
        try {
          console.log(`📡 Calling API /invoices/patient (callId: ${callId})`);

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
            }
          );

          console.log(`✅ API Response received (callId: ${callId}):`, {
            dataType: Array.isArray(response.data)
              ? "Array"
              : typeof response.data,
            length: Array.isArray(response.data) ? response.data.length : "N/A",
          });

          // Nếu response là array
          if (Array.isArray(response.data)) {
            setInvoices(response.data);
            console.log(`📊 Đã nhận ${response.data.length} hóa đơn`);

            // DEBUG: In chi tiết từng invoice
            response.data.forEach((invoice, index) => {
              console.log(`📄 Invoice ${index + 1}:`, {
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                transactionNo: invoice.transactionNo,
                patientName: invoice.patientName,
                amount: invoice.amount,
                createdAt: invoice.createdAt,
                status: invoice.status,
              });
            });
          } else {
            console.log("⚠️ Response không phải array:", response.data);
            setInvoices([]);
          }
        } catch (authErr) {
          console.error(
            `❌ API with auth failed (callId: ${callId}):`,
            authErr
          );

          // Nếu lỗi 403, có thể do CORS hoặc security config
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
    } catch (err) {
      console.error(`❌ Lỗi khi lấy hóa đơn (callId: ${callId}):`, err);
      setError("Có lỗi xảy ra. Vui lòng thử lại sau.");
      setInvoices([]);
    } finally {
      console.log(`🏁 fetchPatientInvoices COMPLETED (callId: ${callId})`);
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
    if (!invoiceNumber) {
      console.error("❌ Không có invoiceNumber để xem chi tiết");
      return;
    }
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
            <span>${formatDate(
              invoice.paymentDate || invoice.invoiceDate
            )}</span>
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
    console.log("🔄 Người dùng yêu cầu refresh invoices");
    if (userInfo) {
      // Reset để có thể gọi lại
      hasFetched.current = false;
      fetchPatientInvoices(userInfo);
    }
  };

  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log(`🎨 InvoiceHistory rendered ${renderCount.current} times`);

  if (loading) {
    return (
      <div className="invoice-history-container">
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <h2>Đang tải thông tin hóa đơn...</h2>
          <p>Vui lòng chờ trong giây lát</p>
          <p className="debug-info">Render count: {renderCount.current}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-history-container">
      <div className="invoice-header">
        <h1>📋 Lịch sử hóa đơn</h1>
        <p>Danh sách hóa đơn của bạn</p>
      </div>

      {error && (
        <div className="error-section">
          <div className="error-icon">⚠️</div>
          <h3>{error}</h3>
          <div className="error-actions">
            <button className="btn-primary" onClick={handleRefresh}>
              Thử lại
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate("/patient/appointments")}
              style={{ marginLeft: "10px" }}
            >
              Quay lại lịch hẹn
            </button>
          </div>
        </div>
      )}

      {!error && invoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>Chưa có hóa đơn nào</h3>
          <p>Bạn chưa có hóa đơn thanh toán nào trong hệ thống</p>
          <div className="empty-actions">
            <button
              className="btn-primary"
              onClick={() => navigate("/patient/appointments")}
            >
              📅 Đặt lịch khám ngay
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate("/payment-result")}
              style={{ marginLeft: "10px" }}
            >
              🔄 Kiểm tra thanh toán
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
                    0
                  )
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
                    👁️ Xem chi tiết
                  </button>
                  <button
                    className="btn-print"
                    onClick={() => printInvoice(invoice)}
                  >
                    🖨️ In hóa đơn
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="action-buttons">
        <button className="btn-secondary" onClick={() => navigate("/")}>
          🏠 Về trang chủ
        </button>
        <button
          className="btn-secondary"
          onClick={() => navigate("/patient/appointments")}
        >
          📅 Lịch hẹn của tôi
        </button>
        <button
          className="btn-primary"
          onClick={() => navigate("/payment")}
          style={{ background: "linear-gradient(135deg, #27ae60, #219653)" }}
        >
          💳 Thanh toán mới
        </button>
      </div>
    </div>
  );
};

export default InvoiceHistory;
