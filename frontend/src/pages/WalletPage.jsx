import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/WalletPage.css";
import { useNavigate } from "react-router-dom";

const WalletPage = () => {
  const [wallet, setWallet] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const token = localStorage.getItem("token");

        // gọi API lấy ví + QR
        const [walletRes, qrRes] = await Promise.all([
          axios.get("http://localhost:8080/api/wallets/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:8080/api/wallets/qr", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setWallet(walletRes.data);
        setQrCode(qrRes.data);
      } catch (err) {
        console.error("Error fetching wallet:", err);
        setError("Không tìm thấy ví. Vui lòng tạo ví.");
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  const handlePayment = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8080/api/vnpay/create-payment",
        {}
      );
      // Điều hướng sang trang thanh toán VNPay
      window.location.href = response.data.paymentUrl;
    } catch (error) {
      console.error("Lỗi khi tạo giao dịch:", error);
      alert("Không thể tạo giao dịch thanh toán. Vui lòng thử lại!");
    }
  };

  if (loading) return <p>Đang tải ví...</p>;
  if (error)
    return (
      <div className="wallet-page">
        <p style={{ color: "red" }}>{error}</p>
        {/* 👇 Thêm nút Tạo thẻ khi chưa có ví */}
        <button
          onClick={() => navigate("/create-card")}
          className="create-wallet-button"
        >
          Tạo ví / thẻ mới
        </button>
      </div>
    );

  return (
    <div className="wallet-page">
      <h2>Ví điện tử của bạn</h2>
      {wallet ? (
        <div className="wallet-info">
          <p>
            <strong>Mã ví:</strong> {wallet.walletCode}
          </p>
          <p>
            <strong>Chủ thẻ:</strong> {wallet.cardHolder}
          </p>
          <p>
            <strong>Số thẻ:</strong> {wallet.cardNumber}
          </p>
          <p>
            <strong>Ngày hết hạn:</strong> {wallet.expiry}
          </p>
          <p>
            <strong>Số dư:</strong> {wallet.balance} VND
          </p>

          {/* Hiển thị QR code */}
          {qrCode && (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <h3>Mã QR nhận tiền</h3>
              <img
                src={qrCode}
                alt="Wallet QR"
                style={{ width: "200px", height: "200px" }}
              />
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <button className="payment-btn" onClick={handlePayment}>
              Thanh toán online
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p>Bạn chưa có ví. Vui lòng tạo ví.</p>
          {/* 👇 Nút tạo thẻ khi chưa có ví */}
          <button
            onClick={() => navigate("/create-card")}
            className="create-wallet-button"
          >
            Tạo ví / thẻ mới
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
