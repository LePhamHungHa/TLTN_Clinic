import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "../../css/PaymentResult.css";

const PaymentResult = () => {
  // Khai báo state và hook
  const [urlParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentResult, setPaymentResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactionData, setTransactionData] = useState(null);

  // Đọc các tham số từ URL
  const vnpResponseCode = urlParams.get("vnp_ResponseCode");
  const vnpTransactionNo = urlParams.get("vnp_TransactionNo");
  const vnpAmount = urlParams.get("vnp_Amount");
  const vnpOrderInfo = urlParams.get("vnp_OrderInfo");
  const vnpBankCode = urlParams.get("vnp_BankCode");
  const vnpPayDate = urlParams.get("vnp_PayDate");
  const vnpTxnRef = urlParams.get("vnp_TxnRef");

  // Phương thức xử lý kết quả thanh toán
  const handlePaymentResult = async () => {
    try {
      // Tạo đối tượng lưu thông tin giao dịch
      const paymentInfo = {
        responseCode: vnpResponseCode,
        transactionNo: vnpTransactionNo,
        amount: vnpAmount ? parseInt(vnpAmount) / 100 : null,
        orderInfo: vnpOrderInfo,
        bankCode: vnpBankCode,
        payDate: vnpPayDate,
        txnRef: vnpTxnRef,
      };

      setTransactionData(paymentInfo);

      // Kiểm tra mã phản hồi từ VNPay
      if (vnpResponseCode === "00") {
        // Thanh toán thành công
        setPaymentResult({
          status: "success",
          title: "Thanh toán thành công",
          message: "Giao dịch đã được thực hiện thành công",
        });
      } else {
        // Xử lý các mã lỗi
        const errorMessages = {
          "07": "Giao dịch bị nghi ngờ gian lận",
          "09": "Thẻ/Tài khoản chưa đăng ký Internet Banking",
          10: "Xác thực thông tin sai quá 3 lần",
          11: "Đã hết hạn chờ thanh toán",
          12: "Thẻ/Tài khoản bị khóa",
          13: "Nhập sai OTP",
          24: "Khách hàng hủy giao dịch",
          51: "Tài khoản không đủ số dư",
          65: "Vượt quá hạn mức giao dịch",
          75: "Ngân hàng đang bảo trì",
          79: "Nhập sai mật khẩu quá số lần",
          99: "Lỗi khác",
        };

        const errorMsg =
          errorMessages[vnpResponseCode] || "Giao dịch không thành công";

        setPaymentResult({
          status: "error",
          title: "Thanh toán thất bại",
          message: errorMsg,
        });
      }

      // Gọi API cập nhật trạng thái thanh toán
      if (vnpResponseCode && vnpTxnRef) {
        try {
          await axios.get("http://localhost:8080/api/vnpay/payment-return", {
            params: {
              vnp_ResponseCode: vnpResponseCode,
              vnp_TransactionNo: vnpTransactionNo,
              vnp_Amount: vnpAmount,
              vnp_OrderInfo: vnpOrderInfo,
              vnp_BankCode: vnpBankCode,
              vnp_PayDate: vnpPayDate,
              vnp_TxnRef: vnpTxnRef,
            },
          });
        } catch (apiError) {
          console.error("Không thể cập nhật trạng thái:", apiError);
        }
      }
    } catch (error) {
      console.error("Lỗi xử lý thanh toán:", error);
      setPaymentResult({
        status: "error",
        title: "Lỗi hệ thống",
        message: "Có lỗi xảy ra khi xử lý kết quả thanh toán",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý khi component được render
  useEffect(() => {
    handlePaymentResult();
  }, []);

  // Hàm định dạng số tiền
  const formatMoney = (amount) => {
    if (!amount) return "Không xác định";
    return amount.toLocaleString("vi-VN") + " ₫";
  };

  // Hàm chuyển đổi định dạng ngày giờ
  const formatDateTime = (dateString) => {
    if (!dateString) return "Không xác định";

    // Định dạng: yyyyMMddHHmmss -> dd/MM/yyyy HH:mm:ss
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const hour = dateString.substring(8, 10);
    const minute = dateString.substring(10, 12);
    const second = dateString.substring(12, 14);

    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  };

  // Hàm lấy tên ngân hàng
  const getBankName = (code) => {
    const banks = {
      VNBANK: "Ngân hàng VNPay",
      INTCARD: "Thẻ quốc tế",
      VNPAYQR: "VNPay QR",
      MBAPP: "MB Bank",
      VCB: "Vietcombank",
      BIDV: "BIDV",
      VIB: "VIB",
      VIETINBANK: "VietinBank",
      AGRIBANK: "Agribank",
      TECHCOMBANK: "Techcombank",
      TPBANK: "TPBank",
      ACB: "ACB",
      HDBANK: "HDBank",
      SCB: "SCB",
      OCB: "OCB",
      SHB: "SHB",
      EXIMBANK: "Eximbank",
      MSBANK: "MSB",
      NAMABANK: "Nam A Bank",
      VABB: "Viet A Bank",
      VPBANK: "VPBank",
      SEABANK: "SeABank",
      LPBANK: "LienVietPostBank",
      KLB: "KienLongBank",
    };

    return banks[code] || code || "Không xác định";
  };

  // Hiển thị trạng thái loading
  if (isLoading) {
    return (
      <div className="payment-result-container">
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <h2>Đang kiểm tra kết quả thanh toán</h2>
          <p>Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-container">
      <div className={`result-card ${paymentResult?.status}`}>
        <div className="result-header">
          <div className="result-icon">
            {paymentResult?.status === "success" ? "✓" : "✗"}
          </div>
          <h1 className="result-title">{paymentResult?.title}</h1>
          <p className="result-message">{paymentResult?.message}</p>
        </div>

        {transactionData && (
          <div className="payment-details">
            <h3>Chi tiết giao dịch</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Mã giao dịch:</span>
                <span className="detail-value">
                  {transactionData.transactionNo || "Không có"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Mã tham chiếu:</span>
                <span className="detail-value">
                  {transactionData.txnRef || "Không có"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Số tiền:</span>
                <span
                  className={`detail-value ${paymentResult?.status === "success" ? "success-amount" : ""}`}
                >
                  {formatMoney(transactionData.amount)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Ngân hàng:</span>
                <span className="detail-value">
                  {getBankName(transactionData.bankCode)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Thời gian:</span>
                <span className="detail-value">
                  {formatDateTime(transactionData.payDate)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Nội dung:</span>
                <span className="detail-value">
                  {transactionData.orderInfo || "Không có"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Mã phản hồi:</span>
                <span className="detail-value">
                  {transactionData.responseCode || "Không có"}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="result-actions">
          {paymentResult?.status === "success" && (
            <>
              <button
                className="btn-primary"
                onClick={() => navigate("/invoices")}
              >
                Xem hóa đơn
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate("/patient/appointments")}
              >
                Xem lịch hẹn
              </button>
              <button className="btn-secondary" onClick={() => navigate("/")}>
                Trang chủ
              </button>
            </>
          )}

          {paymentResult?.status === "error" && (
            <>
              <button
                className="btn-primary"
                onClick={() => navigate("/payment")}
              >
                Thử lại
              </button>
              <button className="btn-secondary" onClick={() => navigate("/")}>
                Trang chủ
              </button>
              <button
                className="btn-support"
                onClick={() => window.open("tel:19001001", "_self")}
              >
                Hỗ trợ
              </button>
            </>
          )}
        </div>

        <div className="result-footer">
          <p>Cảm ơn bạn đã sử dụng dịch vụ</p>
          <p>
            Liên hệ hỗ trợ: <strong>1900 1001</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
