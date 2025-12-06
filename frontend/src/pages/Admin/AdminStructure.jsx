import React, { useState, useEffect } from "react";
import "../../css/AdminStructure.css";
import SlotManagement from "./SlotManagement";
import MedicineManagement from "./MedicineManagement";
import DoctorManagement from "./DoctorManagement";
import DepartmentManagement from "./DepartmentManagement";

const AdminStructure = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [slots, setSlots] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ========== FETCH DATA ==========
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      if (!token) {
        setError("Không tìm thấy token đăng nhập");
        return;
      }

      // Fetch all data in parallel
      const [departmentsRes, slotsRes, medicinesRes, doctorsRes] =
        await Promise.all([
          fetch("http://localhost:8080/api/departments", {
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => (res.ok ? res.json() : [])),

          fetch("http://localhost:8080/api/admin/structure/slots", {
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => (res.ok ? res.json() : [])),

          fetch("http://localhost:8080/api/admin/structure/medicines", {
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => (res.ok ? res.json() : [])),

          fetch("http://localhost:8080/api/doctors", {
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => (res.ok ? res.json() : [])),
        ]);

      setDepartments(Array.isArray(departmentsRes) ? departmentsRes : []);
      setSlots(Array.isArray(slotsRes) ? slotsRes : []);
      setMedicines(Array.isArray(medicinesRes) ? medicinesRes : []);
      setDoctors(Array.isArray(doctorsRes) ? doctorsRes : []);
    } catch (err) {
      setError(`Lỗi: ${err.message}`);
      setDepartments([]);
      setSlots([]);
      setMedicines([]);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // ========== HELPER FUNCTIONS ==========
  const getDepartmentName = (departmentId) => {
    if (!departmentId) return "Chưa phân khoa";
    const dept = departments.find((d) => d.id === departmentId);
    return dept ? dept.departmentName : `Khoa ID: ${departmentId}`;
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    return doctor ? doctor.fullName || "Không xác định" : "Không xác định";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      ACTIVE: "Hoạt động",
      INACTIVE: "Ngừng hoạt động",
      OUT_OF_STOCK: "Hết hàng",
      LOW_STOCK: "Sắp hết",
    };
    return statusMap[status] || status;
  };

  const getGenderLabel = (gender) => {
    const genderMap = {
      MALE: "Nam",
      FEMALE: "Nữ",
      OTHER: "Khác",
    };
    return genderMap[gender] || gender;
  };

  // ========== RENDER ==========
  if (loading) {
    return (
      <div className="admin-structure">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-structure">
      <div className="admin-container">
        <h1 className="admin-header">📋 Quản lý cơ cấu hệ thống</h1>

        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
            <button className="retry-button" onClick={fetchData}>
              Thử lại
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 0 ? "active" : ""}`}
            onClick={() => setActiveTab(0)}
          >
            📅 Quản lý Slot Bác sĩ ({slots.length})
          </button>
          <button
            className={`tab-button ${activeTab === 1 ? "active" : ""}`}
            onClick={() => setActiveTab(1)}
          >
            💊 Quản lý Thuốc ({medicines.length})
          </button>
          <button
            className={`tab-button ${activeTab === 2 ? "active" : ""}`}
            onClick={() => setActiveTab(2)}
          >
            👨‍⚕️ Quản lý Bác sĩ ({doctors.length})
          </button>
          <button
            className={`tab-button ${activeTab === 3 ? "active" : ""}`}
            onClick={() => setActiveTab(3)}
          >
            🏥 Quản lý Khoa ({departments.length})
          </button>
        </div>

        {/* Slot Management Tab */}
        {activeTab === 0 && (
          <SlotManagement
            slots={slots}
            doctors={doctors}
            getDoctorName={getDoctorName}
            onRefresh={fetchData}
          />
        )}

        {/* Medicine Management Tab */}
        {activeTab === 1 && (
          <MedicineManagement
            medicines={medicines}
            formatCurrency={formatCurrency}
            getStatusLabel={getStatusLabel}
            onRefresh={fetchData}
          />
        )}

        {/* Doctor Management Tab */}
        {activeTab === 2 && (
          <DoctorManagement
            doctors={doctors}
            departments={departments}
            getDepartmentName={getDepartmentName}
            getGenderLabel={getGenderLabel}
            onRefresh={fetchData}
          />
        )}

        {/* Department Management Tab */}
        {activeTab === 3 && (
          <DepartmentManagement
            departments={departments}
            doctors={doctors}
            onRefresh={fetchData}
          />
        )}
      </div>
    </div>
  );
};

export default AdminStructure;
