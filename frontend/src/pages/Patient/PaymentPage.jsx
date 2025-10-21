import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/PaymentPage.css";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Dữ liệu từ trang đăng ký khám
  // const patientId = location.state?.patientId || "0000";
  const fullname = location.state?.fullname || "Unknown";
  const phone = location.state?.phone || "000000000";
  const amount = location.state?.amount || 200000;

  const [countdown, setCountdown] = useState(30 * 60);

  useEffect(() => {
    const timer = setInterval(
      () => setCountdown((prev) => (prev > 0 ? prev - 1 : 0)),
      1000
    );
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // 🔹 Hàm gọi API backend tạo link thanh toán VNPay
  const handlePayment = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8080/api/vnpay/create-payment",
        {
          amount: amount,
          orderInfo: `Thanh toan phi kham cho ${fullname} - ${phone}`,
        }
      );
      // Điều hướng sang trang thanh toán VNPay
      window.location.href = response.data.paymentUrl;
    } catch (error) {
      console.error("Lỗi khi tạo giao dịch:", error);
      alert("Không thể tạo giao dịch thanh toán. Vui lòng thử lại!");
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
      </div>

      <div className="payment-expire">
        ⏳ Phiên thanh toán hết hạn sau: <span>{formatTime(countdown)}</span>
      </div>

      <div style={{ marginTop: 24 }}>
        <button className="payment-btn" onClick={handlePayment}>
          Thanh toán online
        </button>
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
