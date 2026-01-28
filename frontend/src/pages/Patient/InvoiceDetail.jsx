import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/InvoiceDetail.css";

function InvoiceDetail() {
  const { invoiceNumber } = useParams();
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getInvoiceDetail = async () => {
      try {
        setIsLoading(true);
        const result = await axios.get(
          `http://localhost:8080/api/invoices/${invoiceNumber}`,
        );
        setInvoiceData(result.data);
      } catch (err) {
        console.error("Lỗi khi lấy chi tiết hóa đơn:", err);
        setError("Không tìm thấy hóa đơn hoặc có lỗi xảy ra");
      } finally {
        setIsLoading(false);
      }
    };

    if (invoiceNumber) {
      getInvoiceDetail();
    }
  }, [invoiceNumber]);

  const formatMoney = (amount) => {
    return amount ? amount.toLocaleString("vi-VN") + " ₫" : "0 ₫";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStatus = (status) => {
    const statusMap = {
      PAID: { label: "Đã thanh toán", className: "status-paid" },
      PENDING: { label: "Chờ thanh toán", className: "status-pending" },
      CANCELLED: { label: "Đã hủy", className: "status-cancelled" },
    };

    const config = statusMap[status] || {
      label: status,
      className: "status-unknown",
    };

    return (
      <span className={`status-badge ${config.className}`}>{config.label}</span>
    );
  };

  const printDocument = () => {
    if (!invoiceData) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hóa đơn ${invoiceData.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .invoice-header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #333; }
          .clinic-name { font-size: 28px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
          .invoice-title { font-size: 22px; font-weight: bold; margin: 20px 0; }
          .invoice-meta { margin: 20px 0; }
          .meta-row { display: flex; margin-bottom: 8px; }
          .meta-label { font-weight: bold; width: 180px; }
          .invoice-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          .invoice-table th { background-color: #f2f2f2; border: 1px solid #ddd; padding: 12px; text-align: left; }
          .invoice-table td { border: 1px solid #ddd; padding: 12px; }
          .total-row { font-weight: bold; background-color: #f8f9fa; }
          .footer { margin-top: 60px; text-align: center; }
          .signature { margin-top: 100px; }
          .signature-line { border-top: 1px solid #333; width: 200px; margin: 0 auto; padding-top: 5px; }
          @media print { body { padding: 20px; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="clinic-name">PHÒNG KHÁM MEDICARE</div>
          <div>Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</div>
          <div>Điện thoại: 1900 1001 | Email: info@medicare.com</div>
        </div>
        
        <div class="invoice-title">HÓA ĐƠN THANH TOÁN DỊCH VỤ Y TẾ</div>
        
        <div class="invoice-meta">
          <div class="meta-row">
            <span class="meta-label">Số hóa đơn:</span>
            <span>${invoiceData.invoiceNumber}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Ngày lập hóa đơn:</span>
            <span>${formatDate(invoiceData.invoiceDate)}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Mã bệnh nhân:</span>
            <span>REG-${invoiceData.patientRegistrationId}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Tên bệnh nhân:</span>
            <span>${invoiceData.patientName}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Số điện thoại:</span>
            <span>${invoiceData.patientPhone}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Email:</span>
            <span>${invoiceData.patientEmail}</span>
          </div>
        </div>
        
        <table class="invoice-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>MÔ TẢ DỊCH VỤ</th>
              <th>ĐƠN GIÁ</th>
              <th>THÀNH TIỀN</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>${invoiceData.serviceName}</td>
              <td>${formatMoney(invoiceData.amount)}</td>
              <td>${formatMoney(invoiceData.amount)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3" style="text-align: right; padding-right: 20px;">TỔNG CỘNG:</td>
              <td>${formatMoney(invoiceData.amount)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="invoice-meta">
          <div class="meta-row">
            <span class="meta-label">Phương thức thanh toán:</span>
            <span>${invoiceData.paymentMethod}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Mã giao dịch:</span>
            <span>${invoiceData.transactionNo}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Ngân hàng:</span>
            <span>${invoiceData.bankCode || "VNPay"}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Trạng thái:</span>
            <span>${invoiceData.status === "PAID" ? "Đã thanh toán" : invoiceData.status}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Ngày thanh toán:</span>
            <span>${formatDate(invoiceData.paymentDate)}</span>
          </div>
        </div>
        
        <div class="footer">
          <div class="signature">
            <div>Người lập hóa đơn</div>
            <div class="signature-line"></div>
            <div style="margin-top: 5px;">(Ký, ghi rõ họ tên)</div>
          </div>
          <p style="margin-top: 40px; font-style: italic;">Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!</p>
          <p>Hóa đơn này có giá trị thanh toán và kế toán theo quy định</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (isLoading) {
    return (
      <div className="invoice-detail-container">
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <h2>Đang tải thông tin hóa đơn...</h2>
        </div>
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="invoice-detail-container">
        <div className="error-state">
          <h3>{error || "Không tìm thấy hóa đơn"}</h3>
          <p>Vui lòng kiểm tra lại số hóa đơn hoặc liên hệ hỗ trợ</p>
          <button
            className="secondary-button"
            onClick={() => navigate("/invoices")}
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-detail-container">
      <div className="invoice-detail-header">
        <button className="back-button" onClick={() => navigate("/invoices")}>
          Quay lại
        </button>
        <h1>Hóa đơn #{invoiceData.invoiceNumber}</h1>
        <div className="header-actions">
          <button className="print-button" onClick={printDocument}>
            In hóa đơn
          </button>
        </div>
      </div>

      <div className="invoice-detail-card">
        <div className="invoice-header-section">
          <div className="clinic-info">
            <h2>PHÒNG KHÁM MEDICARE</h2>
            <p>123 Đường ABC, Quận XYZ, TP.HCM</p>
            <p>ĐT: 1900 1001 | Email: info@medicare.com</p>
          </div>
          <div className="invoice-title-section">
            <h3>HÓA ĐƠN THANH TOÁN DỊCH VỤ Y TẾ</h3>
            <div className="invoice-meta">
              <div className="meta-item">
                <span className="meta-label">Số hóa đơn:</span>
                <span className="meta-value">{invoiceData.invoiceNumber}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Ngày lập:</span>
                <span className="meta-value">
                  {formatDate(invoiceData.invoiceDate)}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Trạng thái:</span>
                <span className="meta-value">
                  {getStatus(invoiceData.status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="invoice-body">
          <div className="patient-info-section">
            <h4>THÔNG TIN BỆNH NHÂN</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Họ tên:</span>
                <span className="info-value">{invoiceData.patientName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{invoiceData.patientEmail}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Số điện thoại:</span>
                <span className="info-value">{invoiceData.patientPhone}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Mã đăng ký:</span>
                <span className="info-value">
                  REG-{invoiceData.patientRegistrationId}
                </span>
              </div>
            </div>
          </div>

          <div className="services-section">
            <h4>CHI TIẾT DỊCH VỤ</h4>
            <table className="services-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>MÔ TẢ DỊCH VỤ</th>
                  <th>ĐƠN GIÁ</th>
                  <th>THÀNH TIỀN</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>{invoiceData.serviceName}</td>
                  <td>{formatMoney(invoiceData.amount)}</td>
                  <td>{formatMoney(invoiceData.amount)}</td>
                </tr>
                <tr className="total-row">
                  <td colSpan="3" className="total-label">
                    TỔNG CỘNG
                  </td>
                  <td className="total-amount">
                    {formatMoney(invoiceData.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="payment-info-section">
            <h4>THÔNG TIN THANH TOÁN</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Phương thức:</span>
                <span className="info-value">{invoiceData.paymentMethod}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Mã giao dịch:</span>
                <span className="info-value transaction-code">
                  {invoiceData.transactionNo}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Ngân hàng:</span>
                <span className="info-value">
                  {invoiceData.bankCode || "VNPay"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Ngày thanh toán:</span>
                <span className="info-value">
                  {formatDate(invoiceData.paymentDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="invoice-footer">
            <div className="terms-section">
              <h5>ĐIỀU KHOẢN VÀ LƯU Ý:</h5>
              <ul>
                <li>
                  Hóa đơn này có giá trị thanh toán và kế toán theo quy định
                </li>
                <li>
                  Vui lòng xuất trình hóa đơn khi cần hỗ trợ hoặc khiếu nại
                </li>
                <li>Mọi thắc mắc vui lòng liên hệ: 1900 1001</li>
              </ul>
            </div>

            <div className="signature-section">
              <div className="signature-box">
                <p>Người lập hóa đơn</p>
                <div className="signature-line"></div>
                <p className="signature-note">(Ký, ghi rõ họ tên)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button
          className="secondary-button"
          onClick={() => navigate("/invoices")}
        >
          Danh sách hóa đơn
        </button>
        <button className="primary-button" onClick={printDocument}>
          In hóa đơn
        </button>
        <button className="secondary-button" onClick={() => navigate("/")}>
          Trang chủ
        </button>
      </div>
    </div>
  );
}

export default InvoiceDetail;
