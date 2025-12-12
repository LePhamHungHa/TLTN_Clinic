import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaWallet,
  FaQrcode,
  FaCreditCard,
  FaMoneyBillWave,
  FaHistory,
  FaPlusCircle,
  FaDownload,
  FaShareAlt,
  FaSpinner,
  FaExclamationTriangle,
  FaRedo,
  FaPhoneAlt,
  FaQuestionCircle,
  FaArrowRight,
  FaShieldAlt,
  FaSync,
} from "react-icons/fa";
import "../../css/WalletPage.css";

const WalletPage = () => {
  const [wallet, setWallet] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const denominations = [50000, 100000, 200000, 500000];
  const [selectedDenomination, setSelectedDenomination] = useState(
    denominations[1]
  );
  const navigate = useNavigate();

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const userData = localStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;
      const token = user?.token;

      if (!token) {
        setErrorMessage("Vui lòng đăng nhập để truy cập ví");
        setLoading(false);
        return;
      }

      // Gọi API lấy ví + QR
      const [walletRes, qrRes, historyRes] = await Promise.all([
        axios.get("http://localhost:8080/api/wallets/me", {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }),
        axios.get("http://localhost:8080/api/wallets/qr", {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }),
        axios
          .get("http://localhost:8080/api/wallets/transactions", {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
          })
          .catch(() => ({ data: [] })), // Fallback nếu API chưa có
      ]);

      setWallet(walletRes.data);
      setQrCode(qrRes.data);

      // Lấy 5 giao dịch gần nhất
      const history = historyRes.data || [];
      if (history.length > 0) {
        setRecentTransactions(history.slice(0, 5));
      }
    } catch (err) {
      console.error("Error fetching wallet:", err);
      if (err.response?.status === 404) {
        setErrorMessage("Bạn chưa có ví điện tử. Vui lòng tạo ví để sử dụng.");
      } else if (err.response?.status === 403) {
        setErrorMessage("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      } else {
        setErrorMessage("Không thể tải thông tin ví. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const handlePayment = async () => {
    try {
      const amountStr = window.prompt(
        "Nhập số tiền cần thanh toán (VND):",
        "100000"
      );
      if (!amountStr) return;
      const amount = parseInt(amountStr.replace(/[^0-9]/g, ""), 10);
      if (!amount || amount <= 0) {
        alert("Số tiền không hợp lệ");
        return;
      }

      const response = await axios.post(
        "http://localhost:8080/api/vnpay/create-payment",
        { amount, type: "PAYMENT" }
      );
      window.location.href = response.data.paymentUrl;
    } catch (error) {
      console.error("Lỗi khi tạo giao dịch:", error);
      alert("Không thể tạo giao dịch thanh toán. Vui lòng thử lại!");
    }
  };

  const openDepositModal = () => setShowDepositModal(true);

  const closeDepositModal = () => setShowDepositModal(false);

  const confirmDeposit = async () => {
    try {
      const amount = selectedDenomination;
      const response = await axios.post(
        "http://localhost:8080/api/vnpay/create-wallet-payment",
        {
          amount,
          walletId: wallet?.id,
        }
      );

      if (response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        alert("Không nhận được URL thanh toán từ server");
      }
    } catch (error) {
      console.error("Lỗi khi tạo giao dịch nạp tiền (wallet):", error);
      alert("Không thể tạo giao dịch nạp tiền. Vui lòng thử lại!");
    }
  };

  const handleWithdraw = async () => {
    try {
      const amountStr = window.prompt(
        "Nhập số tiền cần rút về VNPay (VND):",
        "100000"
      );
      if (!amountStr) return;
      const amount = parseInt(amountStr.replace(/[^0-9]/g, ""), 10);
      if (!amount || amount <= 0) {
        alert("Số tiền không hợp lệ");
        return;
      }

      const response = await axios.post(
        "http://localhost:8080/api/vnpay/create-payment",
        {
          amount,
          type: "WITHDRAW",
          walletId: wallet?.id,
        }
      );

      window.location.href = response.data.paymentUrl;
    } catch (error) {
      console.error("Lỗi khi tạo giao dịch rút tiền:", error);
      alert("Không thể tạo giao dịch rút tiền. Vui lòng thử lại!");
    }
  };

  const handleShowHistory = () => {
    navigate("/transaction-history");
  };

  const downloadQRCode = () => {
    if (!qrCode) return;

    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `wallet-qr-${wallet?.walletCode || "wallet"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mã QR Ví điện tử - ${wallet?.cardHolder}`,
          text: `Mã QR nhận tiền vào ví của bạn\nSố ví: ${wallet?.walletCode}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      const shareText = `Mã QR Ví điện tử - ${wallet?.cardHolder}\nSố ví: ${wallet?.walletCode}\nDùng để nhận tiền chuyển khoản`;
      alert(
        `Chia sẻ thông tin:\n${shareText}\n\nVui lòng tải QR code về và chia sẻ thủ công.`
      );
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && !wallet) {
    return (
      <div className="wallet-container">
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner-large">
              <FaSpinner className="animate-spin" size={48} />
            </div>
            <p className="loading-text">Đang tải thông tin ví...</p>
            <p className="loading-subtext">Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-container">
      {/* Header */}
      <div className="patient-header">
        <div className="header-content">
          <div className="header-icon-wrapper">
            <FaWallet size={40} />
          </div>
          <h1 className="header-title">VÍ ĐIỆN TỬ CỦA TÔI</h1>
          <p className="header-subtitle">
            Quản lý và thực hiện các giao dịch thanh toán trực tuyến
          </p>
        </div>
      </div>

      {/* Thông báo lỗi */}
      {errorMessage && (
        <div className="error-message-card">
          <div className="error-icon">
            <FaExclamationTriangle size={40} />
          </div>
          <div className="error-content">
            <h4>CÓ LỖI XẢY RA</h4>
            <p>{errorMessage}</p>
          </div>
          {errorMessage.includes("chưa có ví") ? (
            <button
              className="create-wallet-button"
              onClick={() => navigate("/create-card")}
            >
              <FaPlusCircle size={18} />
              TẠO VÍ MỚI
            </button>
          ) : (
            <button className="retry-button-large" onClick={fetchWalletData}>
              <FaRedo size={18} />
              THỬ LẠI
            </button>
          )}
        </div>
      )}

      {wallet && (
        <>
          {/* Thống kê nhanh và số dư */}
          <div className="wallet-overview">
            <div className="balance-card">
              <div className="balance-header">
                <div className="balance-icon">
                  <FaMoneyBillWave size={32} />
                </div>
                <div className="balance-info">
                  <h3>SỐ DƯ KHẢ DỤNG</h3>
                  <p className="balance-amount">
                    {formatCurrency(wallet.balance)}
                  </p>
                </div>
              </div>
              <div className="balance-details">
                <div className="detail-item">
                  <span className="detail-label">Số ví:</span>
                  <span className="detail-value">{wallet.walletCode}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Chủ thẻ:</span>
                  <span className="detail-value">{wallet.cardHolder}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Số thẻ:</span>
                  <span className="detail-value card-number">
                    **** **** **** {wallet.cardNumber?.slice(-4)}
                  </span>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <div className="action-card" onClick={openDepositModal}>
                <div className="action-icon deposit">
                  <FaPlusCircle size={28} />
                </div>
                <div className="action-content">
                  <h4>NẠP TIỀN</h4>
                  <p>Thêm tiền vào ví</p>
                </div>
                <div className="action-arrow">
                  <FaArrowRight size={20} />
                </div>
              </div>

              <div className="action-card" onClick={handleWithdraw}>
                <div className="action-icon withdraw">
                  <FaMoneyBillWave size={28} />
                </div>
                <div className="action-content">
                  <h4>RÚT TIỀN</h4>
                  <p>Chuyển về tài khoản</p>
                </div>
                <div className="action-arrow">
                  <FaArrowRight size={20} />
                </div>
              </div>

              <div className="action-card" onClick={handleShowHistory}>
                <div className="action-icon history">
                  <FaHistory size={28} />
                </div>
                <div className="action-content">
                  <h4>LỊCH SỬ</h4>
                  <p>Xem giao dịch</p>
                </div>
                <div className="action-arrow">
                  <FaArrowRight size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* QR Code và thanh toán */}
          <div className="payment-section">
            <div className="section-header">
              <div className="section-title">
                <FaQrcode size={24} />
                <h2>MÃ QR NHẬN TIỀN</h2>
              </div>
              <button className="refresh-button" onClick={fetchWalletData}>
                <FaSync size={18} />
                <span>CẬP NHẬT</span>
              </button>
            </div>

            <div className="qr-section">
              <div className="qr-card">
                {qrCode ? (
                  <>
                    <div className="qr-display">
                      <img src={qrCode} alt="Wallet QR Code" />
                      <div className="qr-overlay">
                        <div className="qr-overlay-content">
                          <FaQrcode size={40} />
                          <p>Mã QR Nhận tiền</p>
                        </div>
                      </div>
                    </div>
                    <div className="qr-actions">
                      <button
                        className="qr-button download"
                        onClick={downloadQRCode}
                      >
                        <FaDownload size={18} />
                        <span>TẢI XUỐNG</span>
                      </button>
                      <button className="qr-button share" onClick={shareQRCode}>
                        <FaShareAlt size={18} />
                        <span>CHIA SẺ</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="qr-placeholder">
                    <FaQrcode size={60} />
                    <p>Đang tạo mã QR...</p>
                  </div>
                )}
                <div className="qr-instructions">
                  <h4>HƯỚNG DẪN SỬ DỤNG</h4>
                  <ul>
                    <li>Chia sẻ mã QR này để nhận thanh toán</li>
                    <li>Người gửi quét mã để chuyển tiền vào ví</li>
                    <li>Tiền sẽ được cập nhật ngay lập tức</li>
                    <li>Không chia sẻ mã QR với người lạ</li>
                  </ul>
                </div>
              </div>

              <div className="payment-methods">
                <div className="payment-method-card">
                  <div className="method-header">
                    <div className="method-icon">
                      <FaCreditCard size={28} />
                    </div>
                    <h3>THANH TOÁN ONLINE</h3>
                  </div>
                  <div className="method-content">
                    <p>Thanh toán nhanh chóng và an toàn qua VNPay</p>
                    <ul>
                      <li>Hỗ trợ tất cả ngân hàng Việt Nam</li>
                      <li>Xử lý ngay lập tức</li>
                      <li>Bảo mật tuyệt đối</li>
                    </ul>
                    <button className="payment-button" onClick={handlePayment}>
                      <FaCreditCard size={20} />
                      <span>THANH TOÁN VNPAY</span>
                    </button>
                  </div>
                </div>

                <div className="security-card">
                  <div className="security-header">
                    <div className="security-icon">
                      <FaShieldAlt size={28} />
                    </div>
                    <h3>BẢO MẬT VÍ</h3>
                  </div>
                  <div className="security-content">
                    <div className="security-item">
                      <div className="security-bullet">✓</div>
                      <span>Mã hóa SSL 256-bit</span>
                    </div>
                    <div className="security-item">
                      <div className="security-bullet">✓</div>
                      <span>Xác thực 2 lớp</span>
                    </div>
                    <div className="security-item">
                      <div className="security-bullet">✓</div>
                      <span>Giám sát 24/7</span>
                    </div>
                    <div className="security-item">
                      <div className="security-bullet">✓</div>
                      <span>Bảo hiểm bồi hoàn</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Giao dịch gần đây */}
          {recentTransactions.length > 0 && (
            <div className="transactions-section">
              <div className="section-header">
                <div className="section-title">
                  <FaHistory size={24} />
                  <h2>GIAO DỊCH GẦN ĐÂY</h2>
                </div>
                <button className="view-all-button" onClick={handleShowHistory}>
                  <FaArrowRight size={18} />
                  <span>XEM TẤT CẢ</span>
                </button>
              </div>

              <div className="transactions-list">
                {recentTransactions.map((transaction, index) => (
                  <div key={index} className="transaction-item">
                    <div className="transaction-icon">
                      {transaction.type === "DEPOSIT" ? (
                        <FaPlusCircle size={20} />
                      ) : (
                        <FaMoneyBillWave size={20} />
                      )}
                    </div>
                    <div className="transaction-details">
                      <div className="transaction-header">
                        <span className="transaction-type">
                          {transaction.type === "DEPOSIT"
                            ? "NẠP TIỀN"
                            : "CHI TIÊU"}
                        </span>
                        <span
                          className={`transaction-amount ${
                            transaction.type === "DEPOSIT"
                              ? "deposit"
                              : "withdraw"
                          }`}
                        >
                          {transaction.type === "DEPOSIT" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                      <div className="transaction-footer">
                        <span className="transaction-description">
                          {transaction.description || "Giao dịch"}
                        </span>
                        <span className="transaction-date">
                          {formatDate(transaction.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`transaction-status ${transaction.status?.toLowerCase()}`}
                    >
                      {transaction.status === "COMPLETED"
                        ? "Thành công"
                        : "Đang xử lý"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hỗ trợ nhanh */}
          <div className="quick-help">
            <div className="help-header">
              <FaPhoneAlt size={24} />
              <h3>CẦN HỖ TRỢ VÍ?</h3>
            </div>
            <p>
              Gọi tổng đài: <strong>1900 1234</strong> (Miễn phí)
            </p>
            <p className="help-time">
              Thời gian hỗ trợ: 7:00 - 22:00 hàng ngày
            </p>
            <button
              className="help-button"
              onClick={() => navigate("/wallet-help")}
            >
              <FaQuestionCircle size={20} />
              <span>HƯỚNG DẪN SỬ DỤNG VÍ</span>
            </button>
          </div>
        </>
      )}

      {/* Nút tạo ví khi không có ví */}
      {!wallet && !errorMessage && !loading && (
        <div className="create-wallet-section">
          <div className="empty-wallet">
            <div className="empty-icon">
              <FaWallet size={80} />
            </div>
            <h3>BẠN CHƯA CÓ VÍ ĐIỆN TỬ</h3>
            <p>Tạo ví ngay để trải nghiệm thanh toán nhanh chóng và tiện lợi</p>
            <button
              className="create-wallet-button-large"
              onClick={() => navigate("/create-card")}
            >
              <FaPlusCircle size={24} />
              <span>TẠO VÍ MỚI</span>
            </button>
            <div className="wallet-benefits">
              <div className="benefit-item">
                <div className="benefit-icon">✓</div>
                <span>Thanh toán không tiền mặt</span>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">✓</div>
                <span>Nhận ưu đãi đặc biệt</span>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">✓</div>
                <span>Quản lý chi tiêu dễ dàng</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit modal */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={closeDepositModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Chọn mệnh giá nạp</h3>
            <div className="denominations">
              {denominations.map((d) => (
                <button
                  key={d}
                  className={`denom-button ${
                    selectedDenomination === d ? "selected" : ""
                  }`}
                  onClick={() => setSelectedDenomination(d)}
                >
                  {new Intl.NumberFormat("vi-VN").format(d)} ₫
                </button>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeDepositModal}>
                HỦY
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  confirmDeposit();
                }}
              >
                NẠP{" "}
                {new Intl.NumberFormat("vi-VN").format(selectedDenomination)} ₫
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
