import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "../../css/DoctorPersonalStatistics.css";

const DoctorPersonalStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("TODAY");
  const [customRange, setCustomRange] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const navigate = useNavigate();

  const fetchWithAuth = async (url, options = {}) => {
    const user = JSON.parse(localStorage.getItem("user"));

    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        ...(user && user.token
          ? { Authorization: `Bearer ${user.token}` }
          : {}),
      },
    };

    const response = await fetch(url, config);

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new Error("Authentication failed");
    }

    return response;
  };

  const fetchStatistics = async (selectedPeriod = period) => {
    try {
      setLoading(true);
      setError("");

      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || user.role !== "DOCTOR") {
        navigate("/login");
        return;
      }

      let url = `http://localhost:8080/api/doctor/statistics/${user.id}?period=${selectedPeriod}`;
      const response = await fetchWithAuth(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        setStatistics(data);
      } else {
        throw new Error(data.message || "Lỗi từ server");
      }
    } catch (err) {
      setError(`Lỗi: ${err.message}`);

      const user = JSON.parse(localStorage.getItem("user"));
      const defaultStats = {
        success: true,
        doctorId: user?.id || "N/A",
        doctorName: user?.fullName || "Bác sĩ",
        period: selectedPeriod,
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        stats: {
          totalAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          noShowAppointments: 0,
        },
        successRate: 0,
        failureRate: 0,
        chartData: null,
        lastUpdated: new Date().toISOString(),
      };
      setStatistics(defaultStats);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomStatistics = async () => {
    try {
      setLoading(true);
      setError("");

      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || user.role !== "DOCTOR") {
        navigate("/login");
        return;
      }

      const url = `http://localhost:8080/api/doctor/statistics/custom/${user.id}?startDate=${customRange.startDate}&endDate=${customRange.endDate}`;
      const response = await fetchWithAuth(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        setStatistics({
          ...data,
          period: "CUSTOM",
        });
      } else {
        throw new Error(data.message || "Lỗi từ server");
      }
    } catch (err) {
      setError(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    fetchStatistics(newPeriod);
  };

  const handleCustomRangeSubmit = (e) => {
    e.preventDefault();
    fetchCustomStatistics();
  };

  const formatNumber = (num) => {
    return num?.toLocaleString("vi-VN") || "0";
  };

  const getPeriodText = (period) => {
    const texts = {
      TODAY: "Hôm nay",
      WEEK: "Tuần này",
      MONTH: "Tháng này",
      CUSTOM: "Tùy chỉnh",
    };
    return texts[period] || period;
  };

  const getDateRangeText = () => {
    if (!statistics) return "Đang tải...";

    if (statistics.startDate && statistics.endDate) {
      const start = new Date(statistics.startDate);
      const end = new Date(statistics.endDate);

      if (start.toDateString() === end.toDateString()) {
        return start.toLocaleDateString("vi-VN");
      }

      return `${start.toLocaleDateString("vi-VN")} - ${end.toLocaleDateString(
        "vi-VN"
      )}`;
    }

    return "Không xác định";
  };

  const getPieData = () => {
    if (!statistics || !statistics.stats) {
      return [];
    }

    const stats = statistics.stats || {};
    const total = stats.totalAppointments || 0;
    const completed = stats.completedAppointments || 0;
    const cancelled = stats.cancelledAppointments || 0;
    const noShow = stats.noShowAppointments || 0;
    const waiting = Math.max(0, total - completed - cancelled - noShow);

    return [
      {
        name: "Đã hoàn thành",
        value: completed,
        color: "#10B981",
      },
      {
        name: "Đã hủy",
        value: cancelled,
        color: "#EF4444",
      },
      {
        name: "Vắng mặt",
        value: noShow,
        color: "#F59E0B",
      },
      {
        name: "Đang chờ",
        value: waiting,
        color: "#6B7280",
      },
    ];
  };

  const getBarData = () => {
    if (!statistics || !statistics.chartData) {
      return [];
    }

    const { labels = [], totals = [], completeds = [] } = statistics.chartData;

    if (!labels || !totals || labels.length === 0) {
      return [];
    }

    return labels.map((label, index) => ({
      name: label,
      "Tổng ca": totals[index] || 0,
      "Đã hoàn thành": completeds[index] || 0,
    }));
  };

  if (loading) {
    return (
      <div className="statistics-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải thống kê...</p>
      </div>
    );
  }

  const stats = statistics?.stats || {};
  const successRate = statistics?.successRate || 0;
  const failureRate = statistics?.failureRate || 0;
  const doctorName = statistics?.doctorName || "Bác sĩ";
  //   const doctorId = statistics?.doctorId || "N/A";
  const chartData = statistics?.chartData || null;

  return (
    <div className="doctor-statistics-container">
      {/* Header */}
      <div className="statistics-header">
        <div className="header-main">
          <h1>📊 Thống Kê Cá Nhân</h1>
          <div className="doctor-info">
            <span className="doctor-name">
              Bác sĩ: <strong>{doctorName}</strong>
            </span>
            {/* <span className="doctor-id">
              ID: <strong>{doctorId}</strong>
            </span> */}
            <span className="stat-period">
              Kỳ:{" "}
              <strong>{getPeriodText(statistics?.period || "TODAY")}</strong>
            </span>
            <span className="date-range">
              Thời gian: <strong>{getDateRangeText()}</strong>
            </span>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-back" onClick={() => navigate("/doctor")}>
            ↩ Quay lại
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
          <button
            onClick={() => fetchStatistics(period)}
            className="retry-button"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Period Selector */}
      <div className="period-selector">
        <div className="period-buttons">
          <button
            className={`period-btn ${period === "TODAY" ? "active" : ""}`}
            onClick={() => handlePeriodChange("TODAY")}
          >
            📅 Hôm nay
          </button>
          <button
            className={`period-btn ${period === "WEEK" ? "active" : ""}`}
            onClick={() => handlePeriodChange("WEEK")}
          >
            📅 Tuần này
          </button>
          <button
            className={`period-btn ${period === "MONTH" ? "active" : ""}`}
            onClick={() => handlePeriodChange("MONTH")}
          >
            📅 Tháng này
          </button>
        </div>

        <div className="custom-range">
          <h3>📆 Thống kê tùy chỉnh</h3>
          <form onSubmit={handleCustomRangeSubmit} className="range-form">
            <div className="date-inputs">
              <div className="input-group">
                <label>Từ ngày:</label>
                <input
                  type="date"
                  value={customRange.startDate}
                  onChange={(e) =>
                    setCustomRange({
                      ...customRange,
                      startDate: e.target.value,
                    })
                  }
                  max={customRange.endDate}
                />
              </div>
              <div className="input-group">
                <label>Đến ngày:</label>
                <input
                  type="date"
                  value={customRange.endDate}
                  onChange={(e) =>
                    setCustomRange({ ...customRange, endDate: e.target.value })
                  }
                  min={customRange.startDate}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <button type="submit" className="btn-custom">
              📈 Xem thống kê
            </button>
          </form>
        </div>
      </div>

      {/* Main Statistics */}
      <div className="main-statistics">
        {/* Key Metrics */}
        <div className="key-metrics">
          <div className="metric-card total">
            <div className="metric-icon">📋</div>
            <div className="metric-content">
              <div className="metric-value">
                {formatNumber(stats.totalAppointments || 0)}
              </div>
              <div className="metric-label">Tổng số ca</div>
            </div>
          </div>

          <div className="metric-card success">
            <div className="metric-icon">✅</div>
            <div className="metric-content">
              <div className="metric-value">
                {formatNumber(stats.completedAppointments || 0)}
              </div>
              <div className="metric-label">Đã hoàn thành</div>
            </div>
          </div>

          <div className="metric-card rate">
            <div className="metric-icon">📈</div>
            <div className="metric-content">
              <div className="metric-value">{successRate.toFixed(1)}%</div>
              <div className="metric-label">Tỷ lệ thành công</div>
            </div>
          </div>

          <div className="metric-card failure">
            <div className="metric-icon">📉</div>
            <div className="metric-content">
              <div className="metric-value">{failureRate.toFixed(1)}%</div>
              <div className="metric-label">Tỷ lệ không thành công</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          {/* Phân bố trạng thái với hiệu ứng 3D */}
          <div className="chart-card">
            <h3>📊 Phân bố trạng thái ca khám</h3>
            <div className="chart-container">
              {getPieData().length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <defs>
                      {/* Gradient cho hiệu ứng 3D */}
                      <linearGradient
                        id="gradient-success"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#0da271" />
                      </linearGradient>
                      <linearGradient
                        id="gradient-danger"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#EF4444" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                      <linearGradient
                        id="gradient-warning"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                      <linearGradient
                        id="gradient-gray"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#6B7280" />
                        <stop offset="100%" stopColor="#4b5563" />
                      </linearGradient>
                    </defs>

                    {/* Lớp shadow tạo độ sâu 3D */}
                    <Pie
                      data={getPieData()}
                      cx="50%"
                      cy="52%"
                      outerRadius={78}
                      innerRadius={0}
                      dataKey="value"
                      stroke="none"
                      fill="#8884d8"
                      opacity={0.3}
                    >
                      {getPieData().map((entry, index) => (
                        <Cell
                          key={`shadow-${index}`}
                          fill="rgba(0, 0, 0, 0.3)"
                        />
                      ))}
                    </Pie>

                    {/* Pie chart chính với hiệu ứng 3D */}
                    <Pie
                      data={getPieData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }) =>
                        value > 0
                          ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                          : ""
                      }
                      outerRadius={80}
                      innerRadius={0}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                      className="pie-3d"
                    >
                      {getPieData().map((entry, index) => {
                        const gradientId =
                          entry.name === "Đã hoàn thành"
                            ? "gradient-success"
                            : entry.name === "Đã hủy"
                            ? "gradient-danger"
                            : entry.name === "Vắng mặt"
                            ? "gradient-warning"
                            : "gradient-gray";

                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#${gradientId})`}
                            className="pie-slice-3d"
                          />
                        );
                      })}
                    </Pie>
                    {/* <Tooltip
                      formatter={(value, name) => [value, name]}
                      contentStyle={{
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        border: "none",
                        background: "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(10px)",
                      }}
                    /> */}
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-chart">
                  <div className="no-data-icon">📊</div>
                  <p>Không có dữ liệu để hiển thị biểu đồ</p>
                  <p className="no-data-detail">
                    Tổng số ca: {stats.totalAppointments || 0}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Biểu đồ xu hướng */}
          {chartData && getBarData().length > 0 ? (
            <div className="chart-card">
              <h3>📈 Xu hướng số ca khám</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getBarData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Tổng ca" fill="#3B82F6" className="bar-3d" />
                    <Bar
                      dataKey="Đã hoàn thành"
                      fill="#10B981"
                      className="bar-3d"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="chart-card">
              <h3>📈 Xu hướng số ca khám</h3>
              <div className="no-data-chart">
                <div className="no-data-icon">📈</div>
                <p>Không có dữ liệu biểu đồ</p>
                <p>API không trả về dữ liệu chartData hoặc dữ liệu rỗng</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button
            className="btn-action"
            onClick={() => navigate("/doctor/appointments")}
          >
            👁️ Xem lịch hẹn
          </button>
          <button className="btn-action" onClick={() => window.print()}>
            🖨️ In báo cáo
          </button>
          <button
            className="btn-action"
            onClick={() => {
              if (!statistics) return;
              const dataStr = JSON.stringify(statistics, null, 2);
              const dataUri =
                "data:application/json;charset=utf-8," +
                encodeURIComponent(dataStr);
              const exportFileDefaultName = `thong-ke-${doctorName}-${
                new Date().toISOString().split("T")[0]
              }.json`;
              const linkElement = document.createElement("a");
              linkElement.setAttribute("href", dataUri);
              linkElement.setAttribute("download", exportFileDefaultName);
              linkElement.click();
            }}
          >
            💾 Xuất dữ liệu
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorPersonalStatistics;
