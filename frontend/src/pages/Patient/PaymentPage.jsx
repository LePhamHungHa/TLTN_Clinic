import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/PaymentPage.css";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Dữ liệu từ trang đăng ký khám - THÊM patientRegistrationId
  const patientRegistrationId =
    location.state?.patientRegistrationId || location.state?.registrationId;
  const fullname = location.state?.fullname || "Unknown";
  const phone = location.state?.phone || "000000000";
  const amount = location.state?.amount || 200000;

  const [countdown, setCountdown] = useState(30 * 60);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("📍 PaymentPage location.state:", location.state);
    console.log("🆔 patientRegistrationId:", patientRegistrationId);

    const timer = setInterval(
      () => setCountdown((prev) => (prev > 0 ? prev - 1 : 0)),
      1000
    );
    return () => clearInterval(timer);
  }, [location.state, patientRegistrationId]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handlePayment = async () => {
    if (!patientRegistrationId) {
      alert("❌ Thiếu thông tin đăng ký khám. Vui lòng quay lại trang trước.");
      return;
    }

    setLoading(true);
    try {
      console.log("🔄 Creating payment...", {
        amount,
        patientRegistrationId,
        fullname,
        phone,
      });

      const response = await axios.post(
        "http://localhost:8080/api/vnpay/create-payment",
        {
          amount: amount,
          orderInfo: `Thanh toan phi kham cho ${fullname} - ${phone}`,
          patientRegistrationId: patientRegistrationId,
        },
        {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Payment created:", response.data);

      if (response.data.paymentUrl) {
        localStorage.setItem("currentTransaction", response.data.transactionNo);
        window.location.href = response.data.paymentUrl;
      } else {
        throw new Error("Không nhận được URL thanh toán từ server");
      }
    } catch (error) {
      console.error("❌ Lỗi khi tạo giao dịch:", error);

      let errorMessage =
        "Không thể tạo giao dịch thanh toán. Vui lòng thử lại!";

      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);

        if (error.response.status === 403) {
          errorMessage = "Không có quyền truy cập. Vui lòng đăng nhập lại!";
        } else if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        errorMessage =
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối!";
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      <h1 className="payment-title">Thanh toán phí khám bệnh</h1>
      <p className="payment-subtitle">
        Nhấn nút bên dưới để thanh toán qua cổng VNPay:
      </p>

      <div className="payment-info">
        <p>
          <strong>Họ và tên:</strong> {fullname}
        </p>
        <p>
          <strong>Số điện thoại:</strong> {phone}
        </p>
        <p>
          <strong>Số tiền:</strong> {amount.toLocaleString("vi-VN")} ₫
        </p>
        <p>
          <strong>Mã đăng ký:</strong> {patientRegistrationId || "Chưa có"}
        </p>
      </div>

      <div className="payment-expire">
        ⏳ Phiên thanh toán hết hạn sau: <span>{formatTime(countdown)}</span>
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          className="payment-btn"
          onClick={handlePayment}
          disabled={loading || !patientRegistrationId}
        >
          {loading ? "Đang xử lý..." : "Thanh toán online"}
        </button>

        {!patientRegistrationId && (
          <p style={{ color: "red", marginTop: "10px" }}>
            ⚠️ Thiếu thông tin đăng ký. Vui lòng quay lại trang đăng ký.
          </p>
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        <button className="payment-back" onClick={() => navigate("/")}>
          ← Quay lại trang chủ
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;
