import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "../../css/PaymentResult.css";

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    const checkPaymentResult = async () => {
      try {
        console.log("🔄 Checking payment result...");

        // Lấy các tham số từ URL trả về từ VNPay
        const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
        const vnp_TransactionNo = searchParams.get("vnp_TransactionNo");
        const vnp_Amount = searchParams.get("vnp_Amount");
        const vnp_OrderInfo = searchParams.get("vnp_OrderInfo");
        const vnp_BankCode = searchParams.get("vnp_BankCode");
        const vnp_PayDate = searchParams.get("vnp_PayDate");
        const vnp_TxnRef = searchParams.get("vnp_TxnRef");

        console.log("📦 Payment return params:", {
          vnp_ResponseCode,
          vnp_TransactionNo,
          vnp_Amount,
          vnp_OrderInfo,
          vnp_BankCode,
          vnp_PayDate,
          vnp_TxnRef,
        });

        // Nếu có response code từ VNPay, gọi API để cập nhật trạng thái
        if (vnp_ResponseCode && vnp_TxnRef) {
          try {
            console.log("🔄 Calling payment-return API...");
            const updateResponse = await axios.get(
              "http://localhost:8080/api/vnpay/payment-return",
              {
                params: {
                  vnp_ResponseCode,
                  vnp_TransactionNo,
                  vnp_Amount,
                  vnp_OrderInfo,
                  vnp_BankCode,
                  vnp_PayDate,
                  vnp_TxnRef,
                },
              }
            );
            console.log("✅ Payment status updated:", updateResponse.data);
          } catch (updateError) {
            console.error("❌ Failed to update payment status:", updateError);
          }
        }

        // Tạo object chứa thông tin thanh toán
        const paymentInfo = {
          responseCode: vnp_ResponseCode,
          transactionNo: vnp_TransactionNo,
          amount: vnp_Amount ? parseInt(vnp_Amount) / 100 : null,
          orderInfo: vnp_OrderInfo,
          bankCode: vnp_BankCode,
          payDate: vnp_PayDate,
          txnRef: vnp_TxnRef,
        };

        setPaymentDetails(paymentInfo);

        // Kiểm tra kết quả thanh toán
        if (vnp_ResponseCode === "00") {
          setResult({
            status: "success",
            title: "Thanh toán thành công!",
            message: "Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.",
            icon: "✅",
          });
        } else {
          const errorMessages = {
            "07": "Giao dịch bị nghi ngờ gian lận",
            "09": "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking",
            10: "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
            11: "Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.",
            12: "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.",
            13: "Giao dịch không thành công do: Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).",
            24: "Giao dịch không thành công do: Khách hàng hủy giao dịch",
            51: "Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.",
            65: "Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.",
            75: "Ngân hàng thanh toán đang bảo trì",
            79: "Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.",
            99: "Các lỗi khác",
          };

          const errorMessage =
            errorMessages[vnp_ResponseCode] || "Thanh toán thất bại!";

          setResult({
            status: "error",
            title: "Thanh toán thất bại",
            message: errorMessage,
            icon: "❌",
          });
        }
      } catch (error) {
        console.error("❌ Lỗi khi kiểm tra kết quả thanh toán:", error);
        setResult({
          status: "error",
          title: "Lỗi hệ thống",
          message:
            "Có lỗi xảy ra khi kiểm tra kết quả thanh toán. Vui lòng liên hệ hỗ trợ.",
          icon: "⚠️",
        });
      } finally {
        setLoading(false);
      }
    };

    checkPaymentResult();
  }, [searchParams]);

  const formatCurrency = (amount) => {
    return amount ? amount.toLocaleString("vi-VN") + " ₫" : "N/A";
  };

  const formatPayDate = (payDate) => {
    if (!payDate) return "N/A";

    // Định dạng: yyyyMMddHHmmss -> dd/MM/yyyy HH:mm:ss
    const year = payDate.substring(0, 4);
    const month = payDate.substring(4, 6);
    const day = payDate.substring(6, 8);
    const hour = payDate.substring(8, 10);
    const minute = payDate.substring(10, 12);
    const second = payDate.substring(12, 14);

    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  };

  const getBankName = (bankCode) => {
    const bankNames = {
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

    return bankNames[bankCode] || bankCode || "N/A";
  };

  if (loading) {
    return (
      <div className="payment-result-container">
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <h2>Đang xác nhận kết quả thanh toán...</h2>
          <p>Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-container">
      <div className={`result-card ${result?.status}`}>
        <div className="result-header">
          <div className="result-icon">{result?.icon}</div>
          <h1 className="result-title">{result?.title}</h1>
          <p className="result-message">{result?.message}</p>
        </div>

        {paymentDetails && (
          <div className="payment-details">
            <h3>📋 Thông tin giao dịch</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Mã giao dịch VNPay:</span>
                <span className="detail-value">
                  {paymentDetails.transactionNo || "N/A"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Mã tham chiếu:</span>
                <span className="detail-value">
                  {paymentDetails.txnRef || "N/A"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Số tiền:</span>
                <span
                  className={`detail-value ${
                    result?.status === "success" ? "success-amount" : ""
                  }`}
                >
                  {formatCurrency(paymentDetails.amount)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Ngân hàng:</span>
                <span className="detail-value">
                  {getBankName(paymentDetails.bankCode)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Thời gian:</span>
                <span className="detail-value">
                  {formatPayDate(paymentDetails.payDate)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Nội dung:</span>
                <span className="detail-value">
                  {paymentDetails.orderInfo || "N/A"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Mã phản hồi:</span>
                <span className="detail-value">
                  {paymentDetails.responseCode || "N/A"}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="result-actions">
          {result?.status === "success" && (
            <>
              <button
                className="btn-primary"
                onClick={() => navigate("/patient/appointments")}
              >
                📅 Xem lịch hẹn
              </button>
              <button className="btn-secondary" onClick={() => navigate("/")}>
                🏠 Về trang chủ
              </button>
            </>
          )}

          {result?.status === "error" && (
            <>
              <button
                className="btn-primary"
                onClick={() => navigate("/payment")}
              >
                🔄 Thử lại thanh toán
              </button>
              <button className="btn-secondary" onClick={() => navigate("/")}>
                🏠 Về trang chủ
              </button>
              <button
                className="btn-support"
                onClick={() => window.open("tel:19001001", "_self")}
              >
                📞 Gọi hỗ trợ
              </button>
            </>
          )}
        </div>

        <div className="result-footer">
          <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
          <p>
            Mọi thắc mắc vui lòng liên hệ: <strong>1900 1001</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
