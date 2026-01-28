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

function DoctorPersonalStatistics() {
  const [statsData, setStatsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [timePeriod, setTimePeriod] = useState("TODAY");
  const [customDates, setCustomDates] = useState({
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
  });
  const navigate = useNavigate();

  const apiCall = async (url, options = {}) => {
    const userInfo = JSON.parse(localStorage.getItem("user"));

    const requestConfig = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        ...(userInfo && userInfo.token
          ? { Authorization: "Bearer " + userInfo.token }
          : {}),
      },
    };

    const result = await fetch(url, requestConfig);

    if (result.status === 401 || result.status === 403) {
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new Error("Xác thực thất bại");
    }

    return result;
  };

  const getStatsData = async (selectedPeriod = timePeriod) => {
    try {
      setIsLoading(true);
      setErrorMsg("");

      const userInfo = JSON.parse(localStorage.getItem("user"));
      if (!userInfo || userInfo.role !== "DOCTOR") {
        navigate("/login");
        return;
      }

      let apiUrl = `http://localhost:8080/api/doctor/statistics/${userInfo.id}?period=${selectedPeriod}`;
      const response = await apiCall(apiUrl);

      if (response.status !== 200) {
        const errorText = await response.text();
        throw new Error("HTTP " + response.status + ": " + errorText);
      }

      const responseData = await response.json();

      if (responseData.success) {
        setStatsData(responseData);
      } else {
        throw new Error(responseData.message || "Lỗi từ máy chủ");
      }
    } catch (err) {
      setErrorMsg("Lỗi: " + err.message);

      const userInfo = JSON.parse(localStorage.getItem("user"));
      const fallbackData = {
        success: true,
        doctorId: userInfo?.id || "N/A",
        doctorName: userInfo?.fullName || "Bác sĩ",
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
      setStatsData(fallbackData);
    } finally {
      setIsLoading(false);
    }
  };

  const getCustomStats = async () => {
    try {
      setIsLoading(true);
      setErrorMsg("");

      const userInfo = JSON.parse(localStorage.getItem("user"));
      if (!userInfo || userInfo.role !== "DOCTOR") {
        navigate("/login");
        return;
      }

      const apiUrl = `http://localhost:8080/api/doctor/statistics/custom/${userInfo.id}?startDate=${customDates.fromDate}&endDate=${customDates.toDate}`;
      const response = await apiCall(apiUrl);

      if (response.status !== 200) {
        const errorText = await response.text();
        throw new Error("HTTP " + response.status + ": " + errorText);
      }

      const responseData = await response.json();

      if (responseData.success) {
        setStatsData({
          ...responseData,
          period: "CUSTOM",
        });
      } else {
        throw new Error(responseData.message || "Lỗi từ máy chủ");
      }
    } catch (err) {
      setErrorMsg("Lỗi: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getStatsData();
  }, []);

  const changeTimePeriod = (newPeriod) => {
    setTimePeriod(newPeriod);
    getStatsData(newPeriod);
  };

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    getCustomStats();
  };

  const formatNumber = (num) => {
    return num?.toLocaleString("vi-VN") || "0";
  };

  const getPeriodDescription = (period) => {
    const periodMap = {
      TODAY: "Hôm nay",
      WEEK: "Tuần này",
      MONTH: "Tháng này",
      CUSTOM: "Tùy chỉnh",
    };
    return periodMap[period] || period;
  };

  const getDateRangeDescription = () => {
    if (!statsData) return "Đang tải...";

    if (statsData.startDate && statsData.endDate) {
      const start = new Date(statsData.startDate);
      const end = new Date(statsData.endDate);

      if (start.toDateString() === end.toDateString()) {
        return start.toLocaleDateString("vi-VN");
      }

      return (
        start.toLocaleDateString("vi-VN") +
        " - " +
        end.toLocaleDateString("vi-VN")
      );
    }

    return "Không xác định";
  };

  const getPieChartData = () => {
    if (!statsData || !statsData.stats) {
      return [];
    }

    const stats = statsData.stats || {};
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

  const getBarChartData = () => {
    if (!statsData || !statsData.chartData) {
      return [];
    }

    const { labels = [], totals = [], completeds = [] } = statsData.chartData;

    if (!labels || !totals || labels.length === 0) {
      return [];
    }

    return labels.map((label, index) => ({
      name: label,
      "Tổng ca": totals[index] || 0,
      "Đã hoàn thành": completeds[index] || 0,
    }));
  };

  if (isLoading) {
    return (
      <div className="statistics-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải thống kê...</p>
      </div>
    );
  }

  const stats = statsData?.stats || {};
  const successRate = statsData?.successRate || 0;
  const failureRate = statsData?.failureRate || 0;
  const doctorName = statsData?.doctorName || "Bác sĩ";
  const chartInfo = statsData?.chartData || null;

  return (
    <div className="doctor-statistics-container">
      <div className="statistics-header">
        <div className="header-main">
          <h1>Thống Kê Cá Nhân</h1>
          <div className="doctor-info">
            <span className="doctor-name">
              Bác sĩ: <strong>{doctorName}</strong>
            </span>
            <span className="stat-period">
              Kỳ:{" "}
              <strong>
                {getPeriodDescription(statsData?.period || "TODAY")}
              </strong>
            </span>
            <span className="date-range">
              Thời gian: <strong>{getDateRangeDescription()}</strong>
            </span>
          </div>
        </div>
        <div className="header-actions">
          <button className="back-button" onClick={() => navigate("/doctor")}>
            Quay lại
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="error-message">
          <p>{errorMsg}</p>
          <button
            onClick={() => getStatsData(timePeriod)}
            className="retry-button"
          >
            Thử lại
          </button>
        </div>
      )}

      <div className="period-selector">
        <div className="period-buttons">
          <button
            className={`period-button ${timePeriod === "TODAY" ? "active" : ""}`}
            onClick={() => changeTimePeriod("TODAY")}
          >
            Hôm nay
          </button>
          <button
            className={`period-button ${timePeriod === "WEEK" ? "active" : ""}`}
            onClick={() => changeTimePeriod("WEEK")}
          >
            Tuần này
          </button>
          <button
            className={`period-button ${timePeriod === "MONTH" ? "active" : ""}`}
            onClick={() => changeTimePeriod("MONTH")}
          >
            Tháng này
          </button>
        </div>

        <div className="custom-range">
          <h3>Thống kê tùy chỉnh</h3>
          <form onSubmit={handleCustomDateSubmit} className="range-form">
            <div className="date-inputs">
              <div className="input-group">
                <label>Từ ngày:</label>
                <input
                  type="date"
                  value={customDates.fromDate}
                  onChange={(e) =>
                    setCustomDates({ ...customDates, fromDate: e.target.value })
                  }
                  max={customDates.toDate}
                />
              </div>
              <div className="input-group">
                <label>Đến ngày:</label>
                <input
                  type="date"
                  value={customDates.toDate}
                  onChange={(e) =>
                    setCustomDates({ ...customDates, toDate: e.target.value })
                  }
                  min={customDates.fromDate}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <button type="submit" className="custom-button">
              Xem thống kê
            </button>
          </form>
        </div>
      </div>

      <div className="main-statistics">
        <div className="key-metrics">
          <div className="metric-card total">
            <div className="metric-content">
              <div className="metric-value">
                {formatNumber(stats.totalAppointments || 0)}
              </div>
              <div className="metric-label">Tổng số ca</div>
            </div>
          </div>

          <div className="metric-card success">
            <div className="metric-content">
              <div className="metric-value">
                {formatNumber(stats.completedAppointments || 0)}
              </div>
              <div className="metric-label">Đã hoàn thành</div>
            </div>
          </div>

          <div className="metric-card rate">
            <div className="metric-content">
              <div className="metric-value">{successRate.toFixed(1)}%</div>
              <div className="metric-label">Tỷ lệ thành công</div>
            </div>
          </div>

          <div className="metric-card failure">
            <div className="metric-content">
              <div className="metric-value">{failureRate.toFixed(1)}%</div>
              <div className="metric-label">Tỷ lệ không thành công</div>
            </div>
          </div>
        </div>

        <div className="charts-section">
          <div className="chart-card">
            <h3>Phân bố trạng thái ca khám</h3>
            <div className="chart-container">
              {getPieChartData().length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <defs>
                      <linearGradient
                        id="grad-success"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#0da271" />
                      </linearGradient>
                      <linearGradient
                        id="grad-danger"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#EF4444" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                      <linearGradient
                        id="grad-warning"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                      <linearGradient
                        id="grad-gray"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#6B7280" />
                        <stop offset="100%" stopColor="#4b5563" />
                      </linearGradient>
                    </defs>

                    <Pie
                      data={getPieChartData()}
                      cx="50%"
                      cy="52%"
                      outerRadius={78}
                      innerRadius={0}
                      dataKey="value"
                      stroke="none"
                      fill="#8884d8"
                      opacity={0.3}
                    >
                      {getPieChartData().map((entry, index) => (
                        <Cell
                          key={`shadow-${index}`}
                          fill="rgba(0, 0, 0, 0.3)"
                        />
                      ))}
                    </Pie>

                    <Pie
                      data={getPieChartData()}
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
                      {getPieChartData().map((entry, index) => {
                        const gradientId =
                          entry.name === "Đã hoàn thành"
                            ? "grad-success"
                            : entry.name === "Đã hủy"
                              ? "grad-danger"
                              : entry.name === "Vắng mặt"
                                ? "grad-warning"
                                : "grad-gray";

                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#${gradientId})`}
                            className="pie-slice-3d"
                          />
                        );
                      })}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-chart">
                  <div className="no-data-icon">Không có dữ liệu</div>
                  <p>Không có dữ liệu để hiển thị biểu đồ</p>
                  <p className="no-data-detail">
                    Tổng số ca: {stats.totalAppointments || 0}
                  </p>
                </div>
              )}
            </div>
          </div>

          {chartInfo && getBarChartData().length > 0 ? (
            <div className="chart-card">
              <h3>Xu hướng số ca khám</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getBarChartData()}>
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
              <h3>Xu hướng số ca khám</h3>
              <div className="no-data-chart">
                <div className="no-data-icon">Không có dữ liệu</div>
                <p>Không có dữ liệu biểu đồ</p>
                <p>API không trả về dữ liệu chartData hoặc dữ liệu rỗng</p>
              </div>
            </div>
          )}
        </div>

        <div className="quick-actions">
          <button
            className="action-button"
            onClick={() => navigate("/doctor/appointments")}
          >
            Xem lịch hẹn
          </button>
          <button className="action-button" onClick={() => window.print()}>
            In báo cáo
          </button>
          <button
            className="action-button"
            onClick={() => {
              if (!statsData) return;
              const dataString = JSON.stringify(statsData, null, 2);
              const dataUri =
                "data:application/json;charset=utf-8," +
                encodeURIComponent(dataString);
              const fileName = `thong-ke-${doctorName}-${new Date().toISOString().split("T")[0]}.json`;
              const downloadLink = document.createElement("a");
              downloadLink.setAttribute("href", dataUri);
              downloadLink.setAttribute("download", fileName);
              downloadLink.click();
            }}
          >
            Xuất dữ liệu
          </button>
        </div>
      </div>
    </div>
  );
}

export default DoctorPersonalStatistics;
