import React, { useState, useEffect } from "react";
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
  LineChart,
  Line,
} from "recharts";
import "../../css/InvoiceManagement.css";

const InvoiceManagement = () => {
  const [activeTab, setActiveTab] = useState("revenue");
  const [timeRange, setTimeRange] = useState("THIS_MONTH");
  const [allInvoices, setAllInvoices] = useState([]);
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);

  // State cho tab Hóa đơn
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Fetch data khi tab thay đổi
  useEffect(() => {
    if (activeTab === "revenue") {
      fetchAllRegistrations();
    } else if (activeTab === "invoices") {
      fetchAllInvoices();
    }
  }, [activeTab, timeRange]);

  const fetchAllRegistrations = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        "http://localhost:8080/api/patient-registrations",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAllRegistrations(data);
      }
    } catch (error) {
      console.error("Error fetching registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllInvoices = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch("http://localhost:8080/api/invoices/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAllInvoices(data);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  // Tính toán thống kê từ tất cả lịch hẹn
  const calculateRevenueFromRegistrations = () => {
    if (allRegistrations.length === 0) return null;

    const stats = {
      totalRegistrations: allRegistrations.length,
      paidRegistrations: 0,
      pendingRegistrations: 0,
      unpaidRegistrations: 0,
      totalRevenue: 0,
      paidRevenue: 0,
      pendingRevenue: 0,
    };

    allRegistrations.forEach((reg) => {
      const paidAmount = parseFloat(reg.paidAmount) || 0;
      const examinationFee = parseFloat(reg.examinationFee) || 0;
      const paymentStatus = reg.paymentStatus || "UNPAID";

      if (paymentStatus === "PAID" || paidAmount > 0) {
        stats.paidRegistrations++;
        stats.paidRevenue += paidAmount;
        stats.totalRevenue += paidAmount;
      } else if (paymentStatus === "PENDING") {
        stats.pendingRegistrations++;
        stats.pendingRevenue += examinationFee;
      } else {
        stats.unpaidRegistrations++;
      }
    });

    // Tính tỷ lệ
    stats.paymentRate =
      stats.totalRegistrations > 0
        ? ((stats.paidRegistrations / stats.totalRegistrations) * 100).toFixed(
            1
          )
        : 0;

    stats.averageRevenue =
      stats.paidRegistrations > 0
        ? stats.paidRevenue / stats.paidRegistrations
        : 0;

    return stats;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format number
  const formatNumber = (num) => {
    return new Intl.NumberFormat("vi-VN").format(num || 0);
  };

  // Format percentage
  const formatPercentage = (num) => {
    return `${parseFloat(num || 0).toFixed(1)}%`;
  };

  // Prepare payment status data for pie chart
  const preparePaymentStatusData = () => {
    const stats = calculateRevenueFromRegistrations();
    if (!stats) return [];

    return [
      {
        name: "Đã thanh toán",
        value: stats.paidRegistrations,
        percentage: stats.paymentRate,
        color: "#10B981",
        revenue: stats.paidRevenue,
      },
      {
        name: "Chờ thanh toán",
        value: stats.pendingRegistrations,
        percentage: (
          (stats.pendingRegistrations / stats.totalRegistrations) *
          100
        ).toFixed(1),
        color: "#F59E0B",
        revenue: stats.pendingRevenue,
      },
      {
        name: "Chưa thanh toán",
        value: stats.unpaidRegistrations,
        percentage: (
          (stats.unpaidRegistrations / stats.totalRegistrations) *
          100
        ).toFixed(1),
        color: "#EF4444",
        revenue: 0,
      },
    ];
  };

  // Prepare revenue trend data
  const prepareRevenueTrendData = () => {
    // Nhóm theo tháng
    const monthlyData = {};

    allRegistrations.forEach((reg) => {
      if (reg.appointmentDate) {
        const date = new Date(reg.appointmentDate);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = {
            month: `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`,
            revenue: 0,
            appointments: 0,
            paid: 0,
          };
        }

        monthlyData[monthYear].appointments++;

        if (
          reg.paymentStatus === "PAID" ||
          (reg.paidAmount && parseFloat(reg.paidAmount) > 0)
        ) {
          monthlyData[monthYear].revenue += parseFloat(reg.paidAmount) || 0;
          monthlyData[monthYear].paid++;
        }
      }
    });

    // Chuyển thành mảng và sắp xếp
    return Object.values(monthlyData)
      .sort((a, b) => {
        const aDate = a.month.split(" ")[1].split("/");
        const bDate = b.month.split(" ")[1].split("/");
        return (
          new Date(aDate[1], aDate[0] - 1) - new Date(bDate[1], bDate[0] - 1)
        );
      })
      .slice(-6); // Lấy 6 tháng gần nhất
  };

  // Prepare department revenue data
  const prepareDepartmentRevenueData = () => {
    const departmentStats = {};

    allRegistrations.forEach((reg) => {
      const department = reg.department || "Không xác định";

      if (!departmentStats[department]) {
        departmentStats[department] = {
          department,
          appointments: 0,
          revenue: 0,
          paid: 0,
        };
      }

      departmentStats[department].appointments++;

      if (
        reg.paymentStatus === "PAID" ||
        (reg.paidAmount && parseFloat(reg.paidAmount) > 0)
      ) {
        departmentStats[department].revenue += parseFloat(reg.paidAmount) || 0;
        departmentStats[department].paid++;
      }
    });

    return Object.values(departmentStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5
  };

  // Filter invoices cho tab Hóa đơn
  const filteredInvoices = allInvoices.filter((invoice) => {
    const matchesSearch =
      invoiceSearchTerm === "" ||
      (invoice.invoiceNumber?.toLowerCase() || "").includes(
        invoiceSearchTerm.toLowerCase()
      ) ||
      (invoice.patientName?.toLowerCase() || "").includes(
        invoiceSearchTerm.toLowerCase()
      ) ||
      (invoice.patientEmail?.toLowerCase() || "").includes(
        invoiceSearchTerm.toLowerCase()
      ) ||
      (invoice.patientPhone || "").includes(invoiceSearchTerm);

    const matchesStatus =
      invoiceStatusFilter === "ALL" || invoice.status === invoiceStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get status label with color for invoices
  const getStatusLabel = (status) => {
    const statusMap = {
      PAID: { label: "Đã thanh toán", color: "#10B981", bg: "#D1FAE5" },
      PENDING: { label: "Chờ thanh toán", color: "#F59E0B", bg: "#FEF3C7" },
      CANCELLED: { label: "Đã hủy", color: "#EF4444", bg: "#FEE2E2" },
      REFUNDED: { label: "Đã hoàn tiền", color: "#8B5CF6", bg: "#EDE9FE" },
    };
    return (
      statusMap[status] || { label: status, color: "#6B7280", bg: "#F3F4F6" }
    );
  };

  // Format date for invoices
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    if (activeTab === "revenue") {
      fetchAllRegistrations();
    } else {
      fetchAllInvoices();
    }
  };

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Tính toán thống kê
  const revenueData = calculateRevenueFromRegistrations();

  return (
    <div className="invoice-management">
      {/* Header với Tabs */}
      <div className="invoice-header">
        <div className="header-left">
          <h2>💰 Quản lý Doanh thu & Hóa đơn</h2>
          <p className="subtitle">
            Thống kê doanh thu và quản lý hóa đơn phòng khám
          </p>
        </div>
        <div className="header-right">
          {activeTab === "revenue" && (
            <div className="time-range-selector">
              {[
                "TODAY",
                "THIS_WEEK",
                "THIS_MONTH",
                "THIS_QUARTER",
                "THIS_YEAR",
              ].map((range) => (
                <button
                  key={range}
                  className={`time-range-btn ${
                    timeRange === range ? "active" : ""
                  }`}
                  onClick={() => handleTimeRangeChange(range)}
                >
                  {range === "TODAY" && "Hôm nay"}
                  {range === "THIS_WEEK" && "Tuần này"}
                  {range === "THIS_MONTH" && "Tháng này"}
                  {range === "THIS_QUARTER" && "Quý này"}
                  {range === "THIS_YEAR" && "Năm nay"}
                </button>
              ))}
            </div>
          )}
          <button className="btn-refresh" onClick={handleRefresh}>
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === "revenue" ? "active" : ""}`}
          onClick={() => handleTabChange("revenue")}
        >
          📊 Thống kê Doanh thu
        </button>
        <button
          className={`tab-btn ${activeTab === "invoices" ? "active" : ""}`}
          onClick={() => handleTabChange("invoices")}
        >
          🧾 Danh sách Hóa đơn
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          {/* Tab Doanh thu */}
          {activeTab === "revenue" && revenueData && (
            <div className="revenue-tab">
              {/* Summary Cards */}
              <div className="quick-stats">
                <div className="stat-card total-revenue">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <div className="stat-label">Tổng doanh thu</div>
                    <div className="stat-value">
                      {formatCurrency(revenueData.totalRevenue || 0)}
                    </div>
                    <div className="stat-period">Tất cả lịch hẹn</div>
                  </div>
                </div>

                <div className="stat-card paid-registrations">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <div className="stat-label">Đã thanh toán</div>
                    <div className="stat-value">
                      {formatNumber(revenueData.paidRegistrations)} /{" "}
                      {formatNumber(revenueData.totalRegistrations)}
                    </div>
                    <div className="stat-period">
                      {formatPercentage(revenueData.paymentRate)} tỷ lệ
                    </div>
                  </div>
                </div>

                <div className="stat-card total-registrations">
                  <div className="stat-icon">📋</div>
                  <div className="stat-content">
                    <div className="stat-label">Tổng lịch hẹn</div>
                    <div className="stat-value">
                      {formatNumber(revenueData.totalRegistrations)}
                    </div>
                    <div className="stat-period">
                      {revenueData.pendingRegistrations} chờ TT •{" "}
                      {revenueData.unpaidRegistrations} chưa TT
                    </div>
                  </div>
                </div>

                <div className="stat-card average-revenue">
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <div className="stat-label">Doanh thu TB/lượt</div>
                    <div className="stat-value">
                      {formatCurrency(revenueData.averageRevenue || 0)}
                    </div>
                    <div className="stat-period">
                      {revenueData.paidRegistrations} lượt đã TT
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="charts-section">
                {/* Payment Status Distribution */}
                <div className="chart-card">
                  <h3>📊 Phân bổ trạng thái thanh toán</h3>
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={preparePaymentStatusData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(1)}%`
                          }
                        >
                          {preparePaymentStatusData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => {
                            const data =
                              preparePaymentStatusData()[props.payload.index];
                            return [
                              <>
                                <div>
                                  {data.value} lượt ({data.percentage}%)
                                </div>
                                <div>
                                  Doanh thu: {formatCurrency(data.revenue)}
                                </div>
                              </>,
                              name,
                            ];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pie-stats">
                      {preparePaymentStatusData().map((item, index) => (
                        <div key={index} className="pie-stat-item">
                          <span
                            className="stat-color"
                            style={{ backgroundColor: item.color }}
                          ></span>
                          <span className="stat-label">{item.name}:</span>
                          <span className="stat-value">
                            {item.value} lượt ({item.percentage}%)
                          </span>
                          {item.revenue > 0 && (
                            <span className="stat-revenue">
                              {formatCurrency(item.revenue)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Revenue Trend */}
                <div className="chart-card">
                  <h3>📈 Xu hướng doanh thu 6 tháng gần nhất</h3>
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={prepareRevenueTrendData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" />
                        <YAxis
                          yAxisId="left"
                          tickFormatter={(value) =>
                            `${(value / 1000000).toFixed(1)}M`
                          }
                        />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === "revenue")
                              return [formatCurrency(value), "Doanh thu"];
                            if (name === "appointments")
                              return [value, "Số lượt"];
                            if (name === "paid") return [value, "Đã TT"];
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          name="Doanh thu"
                          stroke="#3B82F6"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="paid"
                          name="Lượt đã TT"
                          stroke="#10B981"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Department Revenue */}
                <div className="chart-card full-width">
                  <h3>🏥 Doanh thu theo khoa (Top 5)</h3>
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={prepareDepartmentRevenueData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="department" />
                        <YAxis
                          yAxisId="left"
                          tickFormatter={(value) =>
                            `${(value / 1000000).toFixed(0)}M`
                          }
                        />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === "revenue")
                              return [formatCurrency(value), "Doanh thu"];
                            if (name === "appointments")
                              return [value, "Số lượt"];
                            if (name === "paid") return [value, "Đã TT"];
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Bar
                          yAxisId="left"
                          dataKey="revenue"
                          name="Doanh thu"
                          fill="#8B5CF6"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="appointments"
                          name="Số lượt"
                          fill="#F59E0B"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Detailed Statistics */}
              <div className="detailed-stats">
                <h3>📋 Thống kê chi tiết</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Tổng doanh thu:</span>
                    <span className="stat-value">
                      {formatCurrency(revenueData.totalRevenue)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Tổng lượt khám:</span>
                    <span className="stat-value">
                      {formatNumber(revenueData.totalRegistrations)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Đã thanh toán:</span>
                    <span className="stat-value">
                      {formatNumber(revenueData.paidRegistrations)} lượt
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Chờ thanh toán:</span>
                    <span className="stat-value">
                      {formatNumber(revenueData.pendingRegistrations)} lượt
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Chưa thanh toán:</span>
                    <span className="stat-value">
                      {formatNumber(revenueData.unpaidRegistrations)} lượt
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Tỷ lệ thanh toán:</span>
                    <span className="stat-value">
                      {formatPercentage(revenueData.paymentRate)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Doanh thu TB/lượt:</span>
                    <span className="stat-value">
                      {formatCurrency(revenueData.averageRevenue)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Doanh thu TB/ngày:</span>
                    <span className="stat-value">
                      {formatCurrency(revenueData.totalRevenue / 30)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Hóa đơn */}
          {activeTab === "invoices" && (
            <div className="invoices-tab">
              {/* Filters */}
              <div className="invoice-filters">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="🔍 Tìm kiếm theo số HĐ, tên, email, số điện thoại..."
                    value={invoiceSearchTerm}
                    onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="filter-group">
                  <select
                    value={invoiceStatusFilter}
                    onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="PAID">Đã thanh toán</option>
                    <option value="PENDING">Chờ thanh toán</option>
                    <option value="CANCELLED">Đã hủy</option>
                    <option value="REFUNDED">Đã hoàn tiền</option>
                  </select>
                </div>
              </div>

              {/* Invoice List */}
              <div className="invoice-list-container">
                <div className="invoice-list-header">
                  <span className="list-count">
                    Hiển thị {filteredInvoices.length} / {allInvoices.length}{" "}
                    hóa đơn
                  </span>
                </div>
                <div className="invoice-table-container">
                  <table className="invoice-table">
                    <thead>
                      <tr>
                        <th>Số HĐ</th>
                        <th>Bệnh nhân</th>
                        <th>Dịch vụ</th>
                        <th>Số tiền</th>
                        <th>Phương thức</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.length > 0 ? (
                        filteredInvoices.map((invoice) => {
                          const statusInfo = getStatusLabel(invoice.status);
                          return (
                            <tr key={invoice.id || invoice.invoiceNumber}>
                              <td>
                                <strong>{invoice.invoiceNumber}</strong>
                              </td>
                              <td>
                                <div className="patient-info">
                                  <div className="patient-name">
                                    {invoice.patientName}
                                  </div>
                                  <div className="patient-contact">
                                    {invoice.patientEmail} |{" "}
                                    {invoice.patientPhone}
                                  </div>
                                </div>
                              </td>
                              <td>{invoice.serviceName || "Phí khám bệnh"}</td>
                              <td className="amount-cell">
                                <strong>
                                  {formatCurrency(invoice.amount)}
                                </strong>
                              </td>
                              <td>
                                <span className="payment-method">
                                  {invoice.paymentMethod || "VNPAY"}
                                </span>
                              </td>
                              <td>
                                <span
                                  className="status-badge"
                                  style={{
                                    backgroundColor: statusInfo.bg,
                                    color: statusInfo.color,
                                  }}
                                >
                                  {statusInfo.label}
                                </span>
                              </td>
                              <td>{formatDate(invoice.invoiceDate)}</td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    className="btn-view"
                                    onClick={() => setSelectedInvoice(invoice)}
                                  >
                                    👁️ Xem
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="8" className="no-data">
                            <div className="no-data-message">
                              <div className="no-data-icon">📭</div>
                              <p>Không tìm thấy hóa đơn nào</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Detail Modal */}
          {selectedInvoice && (
            <div
              className="modal-overlay"
              onClick={() => setSelectedInvoice(null)}
            >
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3>Chi tiết hóa đơn</h3>
                  <button
                    className="close-btn"
                    onClick={() => setSelectedInvoice(null)}
                  >
                    ✕
                  </button>
                </div>
                <div className="modal-body">
                  <div className="invoice-detail">
                    <div className="detail-section">
                      <h4>Thông tin hóa đơn</h4>
                      <div className="detail-row">
                        <span className="label">Số hóa đơn:</span>
                        <span className="value">
                          {selectedInvoice.invoiceNumber}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Ngày tạo:</span>
                        <span className="value">
                          {formatDate(selectedInvoice.invoiceDate)}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Trạng thái:</span>
                        <span
                          className="value status"
                          style={{
                            color: getStatusLabel(selectedInvoice.status).color,
                          }}
                        >
                          {getStatusLabel(selectedInvoice.status).label}
                        </span>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h4>Thông tin bệnh nhân</h4>
                      <div className="detail-row">
                        <span className="label">Họ tên:</span>
                        <span className="value">
                          {selectedInvoice.patientName}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Email:</span>
                        <span className="value">
                          {selectedInvoice.patientEmail}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Số điện thoại:</span>
                        <span className="value">
                          {selectedInvoice.patientPhone}
                        </span>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h4>Thông tin thanh toán</h4>
                      <div className="detail-row">
                        <span className="label">Dịch vụ:</span>
                        <span className="value">
                          {selectedInvoice.serviceName}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Số tiền:</span>
                        <span className="value amount">
                          {formatCurrency(selectedInvoice.amount)}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Phương thức:</span>
                        <span className="value">
                          {selectedInvoice.paymentMethod}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Mã giao dịch:</span>
                        <span className="value">
                          {selectedInvoice.transactionNo}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Ngân hàng:</span>
                        <span className="value">
                          {selectedInvoice.bankCode || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn-secondary"
                    onClick={() => setSelectedInvoice(null)}
                  >
                    Đóng
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => window.print()}
                  >
                    🖨️ In hóa đơn
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InvoiceManagement;
