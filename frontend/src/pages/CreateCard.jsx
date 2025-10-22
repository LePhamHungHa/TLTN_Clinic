import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import axios from "axios";
import "../css/CreateCard.css";

const CreateCard = () => {
  const navigate = useNavigate();
  const [card, setCard] = useState({
    cardHolder: "",
    cardNumber: "",
    cvv: "",
    expiry: "",
  });
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("Không tìm thấy token, chuyển hướng đến login");
      navigate("/login");
      return;
    }

    try {
      await fetchPatientInfo(token);
    } catch (error) {
      console.error("Lỗi xác thực:", error);
      navigate("/login");
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchPatientInfo = async (token) => {
    try {
      // Thử lấy thông tin patient từ API
      const response = await axios.get(
        "http://localhost:8080/api/patients/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data) {
        setPatientInfo(response.data);
        // Lưu patientId vào localStorage để sử dụng sau
        localStorage.setItem("patientId", response.data.id);
        console.log("Thông tin patient:", response.data);
      }
    } catch (error) {
      console.warn(
        "Không thể lấy thông tin patient từ API, thử phương án khác...",
        error
      );

      // Phương án dự phòng: lấy thông tin từ token hoặc tạo tạm
      const patientId = localStorage.getItem("patientId");
      const userEmail = localStorage.getItem("userEmail");

      if (patientId) {
        setPatientInfo({ id: patientId, email: userEmail });
      } else {
        // Nếu không có patientId, tạo tạm object với thông tin cơ bản
        setPatientInfo({
          id: Date.now().toString(), // ID tạm
          email: userEmail || "user@example.com",
        });
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Format số thẻ: tự động thêm khoảng trắng mỗi 4 số
    if (name === "cardNumber") {
      const cleanedValue = value.replace(/\s/g, "").replace(/\D/g, "");
      const formattedValue = cleanedValue.replace(/(.{4})/g, "$1 ").trim();
      setCard((prev) => ({ ...prev, [name]: formattedValue }));
      return;
    }

    // Format CVV: chỉ cho phép số, tối đa 3 ký tự
    if (name === "cvv") {
      const cleanedValue = value.replace(/\D/g, "").slice(0, 3);
      setCard((prev) => ({ ...prev, [name]: cleanedValue }));
      return;
    }

    setCard((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Phiên đăng nhập đã hết hạn! Vui lòng đăng nhập lại.");
      navigate("/login");
      return;
    }

    // Kiểm tra thông tin patient
    if (!patientInfo || !patientInfo.id) {
      alert("Không tìm thấy thông tin bệnh nhân! Vui lòng thử lại.");
      return;
    }

    setLoading(true);

    try {
      // Format expiry: YYYY-MM -> MM/YY
      const formattedExpiry = card.expiry
        ? card.expiry.slice(5, 7) + "/" + card.expiry.slice(2, 4)
        : "";

      // Xóa khoảng trắng trong số thẻ
      const cleanedCardNumber = card.cardNumber.replace(/\s/g, "");

      const requestData = {
        cardHolder: card.cardHolder.trim(),
        cardNumber: cleanedCardNumber,
        cvv: card.cvv,
        expiry: formattedExpiry,
      };

      console.log("Gửi request tạo ví cho patientId:", patientInfo.id);
      console.log("Request data:", requestData);

      // Gọi API tạo ví
      const response = await axios.post(
        "http://localhost:8080/api/wallets/create",
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Tạo ví thành công:", response.data);
      setWallet(response.data);
    } catch (error) {
      console.error("Lỗi tạo ví:", error);

      if (error.response?.status === 401) {
        alert("Phiên đăng nhập đã hết hạn! Vui lòng đăng nhập lại.");
        localStorage.removeItem("token");
        localStorage.removeItem("patientId");
        navigate("/login");
      } else if (error.response?.status === 400) {
        alert(
          "Dữ liệu không hợp lệ: " +
            (error.response.data?.message ||
              "Vui lòng kiểm tra lại thông tin thẻ")
        );
      } else if (error.response?.data) {
        alert(
          "Tạo ví thất bại: " +
            (error.response.data.message || error.response.data)
        );
      } else {
        alert("Tạo ví thất bại! Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị loading khi đang kiểm tra authentication
  if (checkingAuth) {
    return (
      <div className="create-card-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang kiểm tra thông tin...</p>
        </div>
      </div>
    );
  }

  // Nếu không có patientInfo sau khi kiểm tra
  if (!patientInfo) {
    return (
      <div className="create-card-page">
        <div className="error-container">
          <h2>Lỗi xác thực</h2>
          <p>Không thể tải thông tin bệnh nhân. Vui lòng đăng nhập lại.</p>
          <button onClick={() => navigate("/login")} className="submit-button">
            Đăng nhập lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-card-page">
      {!wallet ? (
        <form onSubmit={handleSubmit} className="card-form">
          <h2>Đăng ký thẻ / ví điện tử</h2>

          <div className="patient-info">
            <p>
              <strong>Thông tin bệnh nhân:</strong>
            </p>
            <p>Email: {patientInfo.email || "Chưa có thông tin"}</p>
            <p>Mã bệnh nhân: {patientInfo.id}</p>
          </div>

          <div className="form-group">
            <label>Chủ thẻ ngân hàng *</label>
            <input
              type="text"
              name="cardHolder"
              required
              value={card.cardHolder}
              onChange={handleChange}
              placeholder="NGUYEN VAN A"
              style={{ textTransform: "uppercase" }}
            />
          </div>

          <div className="form-group">
            <label>Số thẻ ngân hàng *</label>
            <input
              type="text"
              name="cardNumber"
              required
              value={card.cardNumber}
              onChange={handleChange}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>CVV *</label>
              <input
                type="password"
                name="cvv"
                required
                value={card.cvv}
                onChange={handleChange}
                placeholder="123"
                maxLength={3}
              />
            </div>

            <div className="form-group">
              <label>Ngày hết hạn *</label>
              <input
                type="month"
                name="expiry"
                required
                value={card.expiry}
                onChange={handleChange}
                min={new Date().toISOString().slice(0, 7)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={
              loading ||
              !card.cardHolder ||
              !card.cardNumber ||
              !card.cvv ||
              !card.expiry
            }
          >
            {loading ? "Đang xử lý..." : "Tạo ví điện tử"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="cancel-button"
          >
            Hủy bỏ
          </button>
        </form>
      ) : (
        <div className="wallet-success">
          <div className="success-icon">🎉</div>
          <h2>Ví điện tử đã được tạo thành công!</h2>

          <div className="wallet-details">
            <div className="detail-item">
              <span className="label">Tên chủ ví:</span>
              <span className="value">{wallet.cardHolder}</span>
            </div>
            <div className="detail-item">
              <span className="label">Mã ví:</span>
              <span className="value code">
                {wallet.walletCode || wallet.id}
              </span>
            </div>
            <div className="detail-item">
              <span className="label">Số dư ban đầu:</span>
              <span className="value balance">
                {wallet.balance ? wallet.balance.toLocaleString() : "0"} VNĐ
              </span>
            </div>
          </div>

          <div className="qr-section">
            <p>Quét mã QR để nạp tiền vào ví:</p>
            <div className="qr-code">
              <QRCode
                value={wallet.walletCode || wallet.id || "DEFAULT"}
                size={128}
              />
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={() => navigate("/")} className="primary-button">
              Về trang chủ
            </button>
            <button
              onClick={() => setWallet(null)}
              className="secondary-button"
            >
              Tạo ví khác
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateCard;
