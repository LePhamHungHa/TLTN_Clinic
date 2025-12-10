import React, { useState, useEffect } from "react";
import "../../css/AdminStructure.css";
import SlotManagement from "./SlotManagement";
import MedicineManagement from "./MedicineManagement";
import DoctorManagement from "./DoctorManagement";
import DepartmentManagement from "./DepartmentManagement";
import InvoiceManagement from "./InvoiceManagement";
import "bootstrap/dist/css/bootstrap.min.css";

const AdminStructure = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const menuItems = [
    {
      id: 0,
      icon: "calendar_month",
      label: "Slot Bác sĩ",
      count: slots.length,
    },
    {
      id: 1,
      icon: "medication",
      label: "Quản lý Thuốc",
      count: medicines.length,
    },
    {
      id: 2,
      icon: "person_search",
      label: "Quản lý Bác sĩ",
      count: doctors.length,
    },
    {
      id: 3,
      icon: "local_hospital",
      label: "Quản lý Khoa",
      count: departments.length,
    },
    {
      id: 4,
      icon: "receipt_long",
      label: "Quản lý Hóa đơn",
      count: invoices.length,
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;
      if (!token) throw new Error("Không tìm thấy token đăng nhập");

      const [deptRes, slotRes, medRes, docRes, invRes] = await Promise.all([
        fetch("http://localhost:8080/api/departments", {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => (r.ok ? r.json() : [])),
        fetch("http://localhost:8080/api/admin/structure/slots", {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => (r.ok ? r.json() : [])),
        fetch("http://localhost:8080/api/admin/structure/medicines", {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => (r.ok ? r.json() : [])),
        fetch("http://localhost:8080/api/doctors", {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => (r.ok ? r.json() : [])),
        fetch("http://localhost:8080/api/invoices/all", {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => (r.ok ? r.json() : [])),
      ]);

      setDepartments(Array.isArray(deptRes) ? deptRes : []);
      setSlots(Array.isArray(slotRes) ? slotRes : []);
      setMedicines(Array.isArray(medRes) ? medRes : []);
      setDoctors(Array.isArray(docRes) ? docRes : []);
      setInvoices(Array.isArray(invRes) ? invRes : []);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getDepartmentName = (id) =>
    departments.find((d) => d.id === id)?.departmentName || "Chưa phân khoa";
  const getDoctorName = (id) =>
    doctors.find((d) => d.id === id)?.fullName || "Không xác định";
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  const getStatusLabel = (status) =>
    ({
      ACTIVE: "Hoạt động",
      INACTIVE: "Ngừng hoạt động",
      OUT_OF_STOCK: "Hết hàng",
      LOW_STOCK: "Sắp hết",
      PAID: "Đã thanh toán",
      PENDING: "Chờ thanh toán",
      CANCELLED: "Đã hủy",
      REFUNDED: "Đã hoàn tiền",
    }[status] || status);
  const getGenderLabel = (g) =>
    ({ MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" }[g] || g);

  // Pagination logic
  const getPaginationData = (data) => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentData = data.slice(startIndex, endIndex);

    return { totalItems, totalPages, currentData, startIndex, endIndex };
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPagination = (totalPages) => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <nav aria-label="Page navigation">
        <ul className="pagination pagination-sm justify-content-center mb-0">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              &laquo; Trước
            </button>
          </li>

          {startPage > 1 && (
            <>
              <li className="page-item">
                <button
                  className="page-link"
                  onClick={() => handlePageChange(1)}
                >
                  1
                </button>
              </li>
              {startPage > 2 && (
                <li className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              )}
            </>
          )}

          {pageNumbers.map((number) => (
            <li
              key={number}
              className={`page-item ${currentPage === number ? "active" : ""}`}
            >
              <button
                className="page-link"
                onClick={() => handlePageChange(number)}
              >
                {number}
              </button>
            </li>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <li className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              )}
              <li className="page-item">
                <button
                  className="page-link"
                  onClick={() => handlePageChange(totalPages)}
                >
                  {totalPages}
                </button>
              </li>
            </>
          )}

          <li
            className={`page-item ${
              currentPage === totalPages ? "disabled" : ""
            }`}
          >
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Tiếp &raquo;
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light">
        <div
          className="spinner-border text-primary mb-3"
          style={{ width: "3rem", height: "3rem" }}
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="fs-5 text-muted">Đang tải dữ liệu quản trị...</p>
      </div>
    );
  }

  // const activeMenuItem = menuItems[activeTab];
  const { totalItems, totalPages, currentData, startIndex, endIndex } =
    getPaginationData(
      activeTab === 0
        ? slots
        : activeTab === 1
        ? medicines
        : activeTab === 2
        ? doctors
        : activeTab === 3
        ? departments
        : invoices
    );

  return (
    <div className="admin-layout">
      <div className="d-flex">
        {/* Sidebar Menu */}
        <div className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <h2>Quản trị hệ thống</h2>
            <p>Chào mừng trở lại!</p>
          </div>

          <nav className="sidebar-menu">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`menu-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="admin-main">
          <div className="main-content">
            <div className="tab-panel">
              {/* Tab Content */}
              {activeTab === 0 && (
                <SlotManagement
                  slots={currentData}
                  doctors={doctors}
                  getDoctorName={getDoctorName}
                  onRefresh={fetchData}
                />
              )}
              {activeTab === 1 && (
                <MedicineManagement
                  medicines={currentData}
                  formatCurrency={formatCurrency}
                  getStatusLabel={getStatusLabel}
                  onRefresh={fetchData}
                />
              )}
              {activeTab === 2 && (
                <DoctorManagement
                  doctors={currentData}
                  departments={departments}
                  getDepartmentName={getDepartmentName}
                  getGenderLabel={getGenderLabel}
                  onRefresh={fetchData}
                />
              )}
              {activeTab === 3 && (
                <DepartmentManagement
                  departments={currentData}
                  doctors={doctors}
                  onRefresh={fetchData}
                />
              )}
              {activeTab === 4 && (
                <InvoiceManagement
                  invoices={currentData}
                  formatCurrency={formatCurrency}
                  getStatusLabel={getStatusLabel}
                  onRefresh={fetchData}
                />
              )}

              {/* Pagination Footer */}
              {totalItems > 0 && (
                <div className="pagination-footer mt-4 pt-3 border-top">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                    <div className="text-muted small">
                      Hiển thị{" "}
                      <strong>
                        {startIndex + 1}-{endIndex}
                      </strong>{" "}
                      trong tổng số <strong>{totalItems}</strong> bản ghi
                      {totalPages > 1 &&
                        ` (Trang ${currentPage}/${totalPages})`}
                    </div>

                    {totalPages > 1 && renderPagination(totalPages)}
                  </div>
                </div>
              )}

              {/* Summary Cards */}
              <div className="summary-cards mt-4">
                <div className="row g-3">
                  <div className="col-lg-3 col-md-6">
                    <div className="admin-card bg-primary text-white h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="card-title mb-0">Tổng slot</h6>
                            <h3 className="mb-0 fw-bold">{slots.length}</h3>
                          </div>
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "2rem" }}
                          >
                            calendar_month
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <div className="admin-card bg-success text-white h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="card-title mb-0">Tổng thuốc</h6>
                            <h3 className="mb-0 fw-bold">{medicines.length}</h3>
                          </div>
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "2rem" }}
                          >
                            medication
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <div className="admin-card bg-warning text-white h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="card-title mb-0">Tổng bác sĩ</h6>
                            <h3 className="mb-0 fw-bold">{doctors.length}</h3>
                          </div>
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "2rem" }}
                          >
                            person_search
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <div className="admin-card bg-info text-white h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="card-title mb-0">Tổng hóa đơn</h6>
                            <h3 className="mb-0 fw-bold">{invoices.length}</h3>
                          </div>
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "2rem" }}
                          >
                            receipt_long
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStructure;
