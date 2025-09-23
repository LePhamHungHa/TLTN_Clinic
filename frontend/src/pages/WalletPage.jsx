import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/WalletPage.css";

const WalletPage = () => {
  const [wallet, setWallet] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const token = localStorage.getItem("token");

        // gọi API lấy ví + QR song song
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

  if (loading) return <p>Đang tải ví...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

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
        </div>
      ) : (
        <p>Bạn chưa có ví. Vui lòng tạo ví.</p>
      )}
    </div>
  );
};

export default WalletPage;
