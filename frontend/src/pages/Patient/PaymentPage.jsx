import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/PaymentPage.css";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const patientRegId =
    location.state?.patientRegistrationId || location.state?.registrationId;
  const patientName = location.state?.fullname || "Unknown";
  const phoneNumber = location.state?.phone || "000000000";
  const paymentAmount = location.state?.amount || 200000;

  const [remainingTime, setRemainingTime] = useState(30 * 60);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime > 0) {
          return prevTime - 1;
        }
        return 0;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const formatTimer = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const processPayment = async () => {
    if (!patientRegId) {
      alert("Không tìm thấy thông tin đăng ký. Vui lòng thử lại.");
      return;
    }

    setIsProcessing(true);

    try {
      const requestBody = {
        amount: paymentAmount,
        orderInfo: `Thanh toán phí khám cho ${patientName} - ${phoneNumber}`,
        patientRegistrationId: patientRegId,
      };

      const response = await axios.post(
        "http://localhost:8080/api/vnpay/create-payment",
        requestBody,
        {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data && response.data.paymentUrl) {
        localStorage.setItem("transactionId", response.data.transactionNo);
        window.location.href = response.data.paymentUrl;
      } else {
        alert("Không thể tạo liên kết thanh toán.");
      }
    } catch (error) {
      let errorMsg = "Không thể kết nối. Vui lòng kiểm tra lại!";

      if (error.response) {
        if (error.response.status === 403) {
          errorMsg = "Bạn cần đăng nhập lại!";
        } else if (error.response.data && error.response.data.error) {
          errorMsg = error.response.data.error;
        }
      } else if (error.request) {
        errorMsg = "Không kết nối được server!";
      }

      alert(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="payment-container">
      <h1 className="payment-title">Thanh toán phí khám bệnh</h1>
      <p className="payment-subtitle">Vui lòng thanh toán qua cổng VNPay:</p>

      <div className="payment-info">
        <p>
          <strong>Họ tên:</strong> {patientName}
        </p>
        <p>
          <strong>Số điện thoại:</strong> {phoneNumber}
        </p>
        <p>
          <strong>Số tiền:</strong> {paymentAmount.toLocaleString("vi-VN")} ₫
        </p>
        <p>
          <strong>Mã đăng ký:</strong> {patientRegId || "N/A"}
        </p>
      </div>

      <div className="payment-expire">
        Thời gian còn lại: <span>{formatTimer(remainingTime)}</span>
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          className="payment-btn"
          onClick={processPayment}
          disabled={isProcessing || !patientRegId}
        >
          {isProcessing ? "Đang chuyển hướng..." : "Thanh toán online"}
        </button>

        {!patientRegId && (
          <p style={{ color: "red", marginTop: "10px" }}>
            Thiếu thông tin đăng ký. Vui lòng thử lại.
          </p>
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        <button className="payment-back" onClick={() => navigate("/")}>
          Về trang chủ
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;
