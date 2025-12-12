import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../css/WalletPage.css";

const PAGE_SIZE = 10;

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchTx = async () => {
      setLoading(true);
      try {
        const userData = localStorage.getItem("user");
        const user = userData ? JSON.parse(userData) : null;
        const token = user?.token;
        const res = await axios.get(
          "http://localhost:8080/api/wallets/transactions",
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            timeout: 10000,
          }
        );
        if (!mounted) return;
        setTransactions(res.data || []);
      } catch (err) {
        console.error("Lỗi tải lịch sử giao dịch:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchTx();
    return () => (mounted = false);
  }, []);

  const totalPages = Math.max(
    1,
    Math.ceil((transactions.length || 0) / PAGE_SIZE)
  );
  const pageSlice = transactions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <div className="wallet-container">
      <div className="patient-header">
        <div className="header-content">
          <h1 className="header-title">Lịch sử giao dịch</h1>
          <p className="header-subtitle">
            Xem tất cả giao dịch nạp/rút/chi tiêu
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          Quay lại
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 24 }}>Đang tải...</div>
      ) : (
        <div className="transactions-section">
          <div className="transactions-list">
            {pageSlice.length === 0 && (
              <div style={{ padding: 24 }}>Chưa có giao dịch nào.</div>
            )}

            {pageSlice.map((tx, idx) => (
              <div key={idx} className="transaction-item">
                <div className="transaction-icon">
                  {tx.type === "DEPOSIT"
                    ? "+"
                    : tx.type === "WITHDRAW"
                    ? "-"
                    : "•"}
                </div>
                <div className="transaction-details">
                  <div className="transaction-header">
                    <span className="transaction-type">
                      {tx.type === "DEPOSIT"
                        ? "NẠP TIỀN"
                        : tx.type === "WITHDRAW"
                        ? "RÚT TIỀN"
                        : "CHI TIÊU"}
                    </span>
                    <span
                      className={`transaction-amount ${
                        tx.type === "DEPOSIT" ? "deposit" : "withdraw"
                      }`}
                    >
                      {tx.type === "DEPOSIT" ? "+" : "-"}
                      {new Intl.NumberFormat("vi-VN").format(tx.amount)}
                    </span>
                  </div>
                  <div className="transaction-footer">
                    <span className="transaction-description">
                      {tx.description || tx.orderInfo || "Giao dịch"}
                    </span>
                    <span className="transaction-date">
                      {new Date(tx.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>
                <div
                  className={`transaction-status ${tx.status?.toLowerCase()}`}
                >
                  {tx.status === "COMPLETED"
                    ? "Thành công"
                    : tx.status || "Đang xử lý"}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 16,
            }}
          >
            <div>
              Trang {page} / {totalPages}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn-secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Trước
              </button>
              <button
                className="btn-primary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Tiếp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
