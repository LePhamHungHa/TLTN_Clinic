import React, { useState, useEffect } from "react";

const AdminStructure = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [slots, setSlots] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch data với fetch (giống DoctorAppointments)
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

      console.log("🔍 Fetching admin structure data...");

      // Fetch slots
      const slotsResponse = await fetch(
        "http://localhost:8080/api/admin/structure/slots",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📡 Slots response status:", slotsResponse.status);

      if (!slotsResponse.ok) {
        const errorText = await slotsResponse.text();
        console.error("❌ Slots API error:", errorText);
        throw new Error(`Slots API error: ${slotsResponse.status}`);
      }

      const contentType = slotsResponse.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await slotsResponse.text();
        console.error("❌ Slots response is not JSON:", text.substring(0, 500));
        throw new Error("Server trả về dữ liệu không phải JSON.");
      }

      const slotsData = await slotsResponse.json();
      console.log("✅ Slots data:", slotsData);

      // Fetch medicines
      const medicinesResponse = await fetch(
        "http://localhost:8080/api/admin/structure/medicines",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const medicinesData = medicinesResponse.ok 
        ? await medicinesResponse.json()
        : [];

      // Fetch doctors
      const doctorsResponse = await fetch(
        "http://localhost:8080/api/users/doctors",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const doctorsData = doctorsResponse.ok
        ? await doctorsResponse.json()
        : [];

      // Set data - ĐẢM BẢO LUÔN LÀ MẢNG
      setSlots(Array.isArray(slotsData) ? slotsData : []);
      setMedicines(Array.isArray(medicinesData) ? medicinesData : []);
      setDoctors(Array.isArray(doctorsData) ? doctorsData : []);

    } catch (err) {
      console.error("💥 Fetch error:", err);
      setError(`Lỗi: ${err.message}`);
      setSlots([]);
      setMedicines([]);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getDoctorName = (doctorId) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    return doctor ? doctor.fullName || "Unknown" : "Unknown";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      "ACTIVE": "Hoạt động",
      "INACTIVE": "Ngừng hoạt động",
      "OUT_OF_STOCK": "Hết hàng",
      "LOW_STOCK": "Sắp hết",
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "20px", color: "#1976d2" }}>
        📋 Quản lý cơ cấu hệ thống
      </h1>

      {error && (
        <div style={{
          padding: "10px",
          backgroundColor: "#ffebee",
          color: "#c62828",
          marginBottom: "20px",
          borderRadius: "4px"
        }}>
          <p>❌ {error}</p>
          <button 
            onClick={fetchData}
            style={{
              padding: "5px 10px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #e0e0e0", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab(0)}
          style={{
            padding: "10px 20px",
            background: activeTab === 0 ? "#1976d2" : "transparent",
            color: activeTab === 0 ? "white" : "#1976d2",
            border: "none",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          📅 Quản lý Slot Bác sĩ
        </button>
        <button
          onClick={() => setActiveTab(1)}
          style={{
            padding: "10px 20px",
            background: activeTab === 1 ? "#1976d2" : "transparent",
            color: activeTab === 1 ? "white" : "#1976d2",
            border: "none",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          💊 Quản lý Thuốc
        </button>
      </div>

      {/* Slot Management Tab */}
      {activeTab === 0 && (
        <div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px"
          }}>
            <h2>Quản lý Slot khám bệnh ({slots.length})</h2>
            <button style={{
              padding: "8px 16px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}>
              ➕ Thêm Slot
            </button>
          </div>

          {slots.length === 0 ? (
            <div style={{
              padding: "40px",
              textAlign: "center",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px"
            }}>
              <p>Không có slot nào</p>
            </div>
          ) : (
            <div style={{
              overflowX: "auto",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#f5f5f5" }}>
                  <tr>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>Bác sĩ</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>Ngày</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>Khung giờ</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>Số bệnh nhân hiện tại</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>Số bệnh nhân tối đa</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot) => (
                    <tr key={slot.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "12px" }}>{getDoctorName(slot.doctorId)}</td>
                      <td style={{ padding: "12px" }}>{slot.appointmentDate || "N/A"}</td>
                      <td style={{ padding: "12px" }}>{slot.timeSlot || "N/A"}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          backgroundColor: slot.currentPatients >= slot.maxPatients ? "#ffebee" : "#e8f5e8",
                          color: slot.currentPatients >= slot.maxPatients ? "#c62828" : "#2e7d32",
                          borderRadius: "12px",
                          fontSize: "14px"
                        }}>
                          {slot.currentPatients || 0}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>{slot.maxPatients || 5}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Medicine Management Tab */}
      {activeTab === 1 && (
        <div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px"
          }}>
            <h2>Quản lý Thuốc ({medicines.length})</h2>
            <button style={{
              padding: "8px 16px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}>
              ➕ Thêm thuốc
            </button>
          </div>

          {/* Stats */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "20px"
          }}>
            <div style={{
              padding: "16px",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#666" }}>Tổng số thuốc</h3>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{medicines.length}</div>
            </div>
            <div style={{
              padding: "16px",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#666" }}>Đang hoạt động</h3>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2e7d32" }}>
                {medicines.filter(m => m.status === "ACTIVE").length}
              </div>
            </div>
            <div style={{
              padding: "16px",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#666" }}>Sắp hết hàng</h3>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f57c00" }}>
                {medicines.filter(m => m.stockQuantity <= (m.minStockLevel || 10)).length}
              </div>
            </div>
          </div>

          {medicines.length === 0 ? (
            <div style={{
              padding: "40px",
              textAlign: "center",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px"
            }}>
              <p>Không có thuốc nào</p>
            </div>
          ) : (
            <div style={{
              overflowX: "auto",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#f5f5f5" }}>
                  <tr>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>Mã thuốc</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>Tên thuốc</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>Số lượng</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>Đơn giá</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((medicine) => (
                    <tr key={medicine.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "12px" }}>{medicine.medicineCode || "N/A"}</td>
                      <td style={{ padding: "12px" }}>{medicine.medicineName || "N/A"}</td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>
                            {medicine.stockQuantity || 0} {medicine.unit || ""}
                          </span>
                          {medicine.stockQuantity <= (medicine.minStockLevel || 10) && (
                            <span style={{
                              padding: "2px 6px",
                              backgroundColor: "#fff3e0",
                              color: "#e65100",
                              fontSize: "12px",
                              borderRadius: "10px"
                            }}>
                              Sắp hết
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>{formatCurrency(medicine.unitPrice)}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          backgroundColor: medicine.status === "ACTIVE" ? "#e8f5e8" : 
                                         medicine.status === "INACTIVE" ? "#ffebee" : "#fff3e0",
                          color: medicine.status === "ACTIVE" ? "#2e7d32" : 
                                medicine.status === "INACTIVE" ? "#c62828" : "#e65100",
                          borderRadius: "12px",
                          fontSize: "14px",
                          cursor: "pointer"
                        }}>
                          {getStatusLabel(medicine.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminStructure;