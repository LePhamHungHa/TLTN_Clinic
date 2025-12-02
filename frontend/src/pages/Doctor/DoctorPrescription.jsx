import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../css/DoctorPrescription.css";

const DoctorPrescription = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [patientInfo, setPatientInfo] = useState(null);
  const [showMedicineDetail, setShowMedicineDetail] = useState(null);
  const [medicalRecordId, setMedicalRecordId] = useState(null);
  const [existingPrescription, setExistingPrescription] = useState([]);
  const [showMedicationHistory, setShowMedicationHistory] = useState(false);
  const [medicationHistory, setMedicationHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [groupedHistory, setGroupedHistory] = useState({});

  // Danh mục thuốc
  const medicineCategories = [
    "Tất cả",
    "Kháng sinh",
    "Giảm đau - Hạ sốt",
    "Kháng viêm không steroid",
    "Kháng histamin",
    "Dạ dày",
    "Tim mạch",
    "Hô hấp",
    "Vitamin",
    "Da liễu",
  ];

  // Load dữ liệu
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem("user"));

        // 1. Load danh sách thuốc
        const medicinesResponse = await fetch(
          `http://localhost:8080/api/doctor/prescriptions/medicines/active`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        if (medicinesResponse.ok) {
          const result = await medicinesResponse.json();
          if (result.success) {
            setMedicines(result.medicines);
            setFilteredMedicines(result.medicines);
          }
        }

        // 2. Load thông tin bệnh nhân và medical record
        const appointmentResponse = await fetch(
          `http://localhost:8080/api/doctor/medical-records/${appointmentId}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        if (appointmentResponse.ok) {
          const result = await appointmentResponse.json();
          if (result.success) {
            setPatientInfo(result.appointment);

            // Lấy medicalRecordId từ response
            if (result.medicalRecord) {
              setMedicalRecordId(result.medicalRecord.id);

              // 3. Load đơn thuốc đã có (nếu có)
              await loadExistingPrescription(
                result.medicalRecord.id,
                user.token
              );
            } else {
              // Nếu chưa có medical record, tạo mới
              const createMedicalRecordResponse = await fetch(
                `http://localhost:8080/api/doctor/medical-records/create/${appointmentId}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                  },
                  body: JSON.stringify({
                    appointmentId: appointmentId,
                  }),
                }
              );

              if (createMedicalRecordResponse.ok) {
                const createResult = await createMedicalRecordResponse.json();
                if (createResult.success) {
                  setMedicalRecordId(createResult.medicalRecordId);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        alert("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [appointmentId]);

  // Load lịch sử sử dụng thuốc của bệnh nhân theo medical_record_id
  const loadPatientMedicationHistory = async (medicalRecordId, token) => {
    setLoadingHistory(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/doctor/prescriptions/history/${medicalRecordId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const history = result.history || [];
          setMedicationHistory(history);

          // Nhóm lịch sử theo ngày
          const grouped = groupMedicationHistoryByDate(history);
          setGroupedHistory(grouped);
        }
      }
    } catch (error) {
      console.error("Lỗi load lịch sử thuốc:", error);
      alert("Không thể tải lịch sử sử dụng thuốc");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Nhóm lịch sử theo ngày
  const groupMedicationHistoryByDate = (history) => {
    const grouped = {};

    history.forEach((item) => {
      if (!item.createdAt) return;

      const date = new Date(item.createdAt);
      const dateKey = date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          fullDate: item.createdAt,
          items: [],
        };
      }

      grouped[dateKey].items.push(item);
    });

    // Sắp xếp theo ngày mới nhất trước
    return Object.values(grouped)
      .sort((a, b) => new Date(b.fullDate) - new Date(a.fullDate))
      .reduce((acc, group) => {
        acc[group.date] = group;
        return acc;
      }, {});
  };

  // Load đơn thuốc đã có từ database
  const loadExistingPrescription = async (medicalRecordId, token) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/doctor/prescriptions/${medicalRecordId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (
          result.success &&
          result.prescription &&
          result.prescription.length > 0
        ) {
          // Lưu đơn thuốc đã có để hiển thị
          setExistingPrescription(result.prescription);

          // Chuyển đổi prescription items từ database sang format cho state
          const prescriptionItemsFromDB = result.prescription.map((item) => ({
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            strength: "", // Cần lấy từ medicines
            unit: "", // Cần lấy từ medicines
            unitPrice: item.unitPrice,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            quantity: item.quantity,
            instructions: item.instructions || "",
            notes: item.notes || "",
            stockQuantity: 0, // Sẽ được cập nhật sau
          }));

          // Lấy thông tin chi tiết về thuốc từ danh sách medicines
          const user = JSON.parse(localStorage.getItem("user"));
          const medicinesResponse = await fetch(
            `http://localhost:8080/api/doctor/prescriptions/medicines/active`,
            {
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
            }
          );

          if (medicinesResponse.ok) {
            const medicinesResult = await medicinesResponse.json();
            if (medicinesResult.success) {
              const medicinesMap = {};
              medicinesResult.medicines.forEach((med) => {
                medicinesMap[med.id] = med;
              });

              // Cập nhật thông tin chi tiết cho prescription items
              const updatedItems = prescriptionItemsFromDB.map((item) => {
                const medicineDetail = medicinesMap[item.medicineId];
                if (medicineDetail) {
                  return {
                    ...item,
                    medicineName: medicineDetail.medicineName,
                    strength: medicineDetail.strength || "",
                    unit: medicineDetail.unit || "",
                    stockQuantity: medicineDetail.stockQuantity || 0,
                  };
                }
                return item;
              });

              setPrescriptionItems(updatedItems);
            }
          }
        }
      }
    } catch (error) {
      console.error("Lỗi load đơn thuốc hiện có:", error);
    }
  };

  // Tìm kiếm thuốc
  useEffect(() => {
    let results = medicines;

    if (searchTerm) {
      results = results.filter(
        (medicine) =>
          medicine.medicineName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          medicine.medicineCode
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (medicine.activeIngredient &&
            medicine.activeIngredient
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== "Tất cả") {
      results = results.filter(
        (medicine) => medicine.category === selectedCategory
      );
    }

    setFilteredMedicines(results);
  }, [searchTerm, selectedCategory, medicines]);

  // Thêm thuốc vào đơn
  const addToPrescription = (medicine) => {
    const existingItem = prescriptionItems.find(
      (item) => item.medicineId === medicine.id
    );

    if (existingItem) {
      alert(
        "Thuốc đã có trong đơn. Vui lòng chỉnh sửa số lượng trong danh sách đơn thuốc."
      );
      return;
    }

    const newItem = {
      medicineId: medicine.id,
      medicineName: medicine.medicineName,
      strength: medicine.strength,
      unit: medicine.unit,
      unitPrice: medicine.unitPrice,
      dosage: "1 " + medicine.unit,
      frequency: "2 lần/ngày",
      duration: "3 ngày",
      quantity: 1,
      instructions: medicine.usageInstructions || "",
      notes: "",
      stockQuantity: medicine.stockQuantity,
    };

    setPrescriptionItems([...prescriptionItems, newItem]);
  };

  // Cập nhật thông tin thuốc trong đơn
  const updatePrescriptionItem = (index, field, value) => {
    const updatedItems = [...prescriptionItems];
    updatedItems[index][field] = value;
    setPrescriptionItems(updatedItems);
  };

  // Xóa thuốc khỏi đơn
  const removeFromPrescription = (index) => {
    const updatedItems = prescriptionItems.filter((_, i) => i !== index);
    setPrescriptionItems(updatedItems);
  };

  // Tính tổng tiền
  const calculateTotal = () => {
    return prescriptionItems.reduce((total, item) => {
      return total + item.quantity * item.unitPrice;
    }, 0);
  };

  // Lưu đơn thuốc
  const savePrescription = async () => {
    if (prescriptionItems.length === 0) {
      alert("Vui lòng thêm ít nhất một loại thuốc vào đơn");
      return;
    }

    if (!medicalRecordId) {
      alert("Không tìm thấy hồ sơ bệnh án. Vui lòng thử lại.");
      return;
    }

    // Kiểm tra số lượng tồn kho
    for (const item of prescriptionItems) {
      if (item.quantity > item.stockQuantity) {
        alert(
          `Thuốc ${item.medicineName} chỉ còn ${item.stockQuantity} ${item.unit} trong kho`
        );
        return;
      }
    }

    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user || !user.token) {
        throw new Error("Không tìm thấy thông tin đăng nhập");
      }

      // Chuẩn bị data đúng format
      const prescriptionData = prescriptionItems.map((item) => ({
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        strength: item.strength,
        unit: item.unit,
        unitPrice: item.unitPrice,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity,
        instructions: item.instructions,
        notes: item.notes || "",
      }));

      console.log("📤 Sending prescription data:", prescriptionData);
      console.log("🎯 Medical Record ID:", medicalRecordId);

      // Gọi API với endpoint đúng
      const response = await fetch(
        `http://localhost:8080/api/doctor/prescriptions/create/${medicalRecordId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(prescriptionData),
        }
      );

      console.log("📡 Response status:", response.status);
      console.log("📡 Response headers:", response.headers);

      // Kiểm tra response status
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            "Truy cập bị từ chối. Vui lòng kiểm tra quyền truy cập."
          );
        } else if (response.status === 401) {
          localStorage.removeItem("user");
          navigate("/login");
          throw new Error("Phiên đăng nhập hết hạn");
        } else {
          const errorText = await response.text();
          console.error("❌ Server error response:", errorText);
          throw new Error(`Lỗi server (${response.status}): ${errorText}`);
        }
      }

      // Parse response
      const result = await response.json();
      console.log("📦 Response result:", result);

      if (result.success) {
        alert("✅ Đã lưu đơn thuốc thành công!");
        // Chuyển về trang appointments
        navigate("/doctor/appointments");
      } else {
        throw new Error(result.message || "Không thể lưu đơn thuốc");
      }
    } catch (error) {
      console.error("❌ Lỗi lưu đơn thuốc:", error);
      alert(`❌ Lỗi: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Hiển thị chi tiết thuốc
  const showMedicineDetails = (medicine) => {
    setShowMedicineDetail(medicine);
  };

  // Kiểm tra thuốc đã có trong đơn
  const isMedicineInPrescription = (medicineId) => {
    return prescriptionItems.some((item) => item.medicineId === medicineId);
  };

  // Hiển thị lịch sử sử dụng thuốc
  const handleShowMedicationHistory = async () => {
    if (!medicalRecordId) {
      alert("Không tìm thấy hồ sơ bệnh án");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) {
      alert("Vui lòng đăng nhập lại");
      return;
    }

    await loadPatientMedicationHistory(medicalRecordId, user.token);
    setShowMedicationHistory(true);
  };

  // Format ngày tháng đầy đủ
  const formatFullDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Tính tổng tiền của một ngày
  const calculateDayTotal = (items) => {
    return items.reduce((total, item) => {
      return total + (parseFloat(item.totalPrice) || 0);
    }, 0);
  };

  // Tính tổng tiền toàn bộ lịch sử
  const calculateHistoryTotal = () => {
    return medicationHistory.reduce((total, item) => {
      return total + (parseFloat(item.totalPrice) || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="prescription-container">
        <div className="loading-spinner-large"></div>
        <p>Đang tải danh sách thuốc...</p>
      </div>
    );
  }

  return (
    <div className="prescription-container">
      {/* Header */}
      <div className="prescription-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← Quay lại
        </button>
        <h1>💊 Kê Đơn Thuốc</h1>
        {patientInfo && (
          <div className="patient-info">
            <h3>Bệnh nhân: {patientInfo.fullName}</h3>
            <div className="patient-meta">
              <span>Mã đơn: {patientInfo.registrationNumber}</span>
              <span>
                Tuổi:{" "}
                {patientInfo.dob
                  ? new Date().getFullYear() -
                    new Date(patientInfo.dob).getFullYear()
                  : "N/A"}
              </span>
              <span>Giới tính: {patientInfo.gender}</span>
              <button
                className="btn-history-header"
                onClick={handleShowMedicationHistory}
                disabled={loadingHistory || !medicalRecordId}
              >
                {loadingHistory
                  ? "⌛ Đang tải..."
                  : medicalRecordId
                  ? "📜 Lịch sử thuốc"
                  : "⏳ Đang tải dữ liệu..."}
              </button>
              {existingPrescription.length > 0 && (
                <span className="prescription-badge">
                  📋 Đã có đơn ({existingPrescription.length} thuốc)
                </span>
              )}
              {medicalRecordId && (
                <span className="record-id">Mã HS: {medicalRecordId}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="prescription-layout">
        {/* Danh sách thuốc */}
        <div className="medicine-list-section">
          <div className="section-header">
            <h2>📦 Danh Mục Thuốc</h2>
            <div className="search-filter">
              <input
                type="text"
                placeholder="🔍 Tìm kiếm thuốc, hoạt chất..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-filter"
              >
                {medicineCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="medicine-grid">
            {filteredMedicines.length > 0 ? (
              filteredMedicines.map((medicine) => {
                const isInPrescription = isMedicineInPrescription(medicine.id);

                return (
                  <div
                    key={medicine.id}
                    className={`medicine-card ${
                      isInPrescription ? "in-prescription" : ""
                    }`}
                  >
                    <div className="medicine-header">
                      <h4>{medicine.medicineName}</h4>
                      <div className="medicine-header-right">
                        {isInPrescription && (
                          <span className="in-prescription-badge">
                            ✓ Đã thêm
                          </span>
                        )}
                        <span
                          className={`stock-badge ${
                            medicine.stockQuantity <=
                            (medicine.minStockLevel || 10)
                              ? "low-stock"
                              : "in-stock"
                          }`}
                        >
                          {medicine.stockQuantity || 0} {medicine.unit}
                        </span>
                      </div>
                    </div>

                    <div className="medicine-info">
                      <p>
                        <strong>Mã:</strong> {medicine.medicineCode}
                      </p>
                      <p>
                        <strong>Hoạt chất:</strong> {medicine.activeIngredient}
                      </p>
                      <p>
                        <strong>Hàm lượng:</strong> {medicine.strength}
                      </p>
                      <p>
                        <strong>Giá:</strong>{" "}
                        {(medicine.unitPrice || 0).toLocaleString()} đ/
                        {medicine.unit}
                      </p>
                      <p>
                        <strong>Phân loại:</strong> {medicine.category}
                      </p>
                    </div>

                    <div className="medicine-actions">
                      <button
                        className="btn-info"
                        onClick={() => showMedicineDetails(medicine)}
                      >
                        ℹ️ Chi tiết
                      </button>
                      <button
                        className={`btn-add ${
                          isInPrescription ? "btn-added" : ""
                        }`}
                        onClick={() => addToPrescription(medicine)}
                        disabled={
                          (medicine.stockQuantity || 0) === 0 ||
                          isInPrescription
                        }
                      >
                        {isInPrescription
                          ? "✓ Đã thêm"
                          : (medicine.stockQuantity || 0) === 0
                          ? "❌ Hết hàng"
                          : "➕ Thêm vào đơn"}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-medicines">
                <p>Không tìm thấy thuốc phù hợp</p>
              </div>
            )}
          </div>
        </div>

        {/* Đơn thuốc */}
        <div className="prescription-section">
          <div className="section-header">
            <h2>📝 Đơn Thuốc</h2>
            <div className="prescription-stats">
              <span>{prescriptionItems.length} thuốc</span>
              <span className="total-amount">
                Tổng tiền: {calculateTotal().toLocaleString()} đ
              </span>
            </div>
          </div>

          {prescriptionItems.length === 0 ? (
            <div className="empty-prescription">
              <div className="empty-icon">💊</div>
              <p>Chưa có thuốc trong đơn</p>
              <small>Chọn thuốc từ danh mục bên trái để thêm vào đơn</small>
            </div>
          ) : (
            <div className="prescription-items">
              {prescriptionItems.map((item, index) => (
                <div key={index} className="prescription-item">
                  <div className="item-header">
                    <h4>
                      {item.medicineName} ({item.strength})
                      {existingPrescription.some(
                        (p) => p.medicineId === item.medicineId
                      ) && (
                        <span className="existing-prescription-badge">
                          (Đã kê)
                        </span>
                      )}
                    </h4>
                    <button
                      className="btn-remove"
                      onClick={() => removeFromPrescription(index)}
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="item-details">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Liều dùng:</label>
                        <input
                          type="text"
                          value={item.dosage}
                          onChange={(e) =>
                            updatePrescriptionItem(
                              index,
                              "dosage",
                              e.target.value
                            )
                          }
                          placeholder="1 viên, 2 viên..."
                        />
                      </div>
                      <div className="form-group">
                        <label>Tần suất:</label>
                        <select
                          value={item.frequency}
                          onChange={(e) =>
                            updatePrescriptionItem(
                              index,
                              "frequency",
                              e.target.value
                            )
                          }
                        >
                          <option value="1 lần/ngày">1 lần/ngày</option>
                          <option value="2 lần/ngày">2 lần/ngày</option>
                          <option value="3 lần/ngày">3 lần/ngày</option>
                          <option value="Khi cần">Khi cần</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Số ngày:</label>
                        <input
                          type="text"
                          value={item.duration}
                          onChange={(e) =>
                            updatePrescriptionItem(
                              index,
                              "duration",
                              e.target.value
                            )
                          }
                          placeholder="3 ngày, 5 ngày..."
                        />
                      </div>
                      <div className="form-group">
                        <label>Số lượng:</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updatePrescriptionItem(
                              index,
                              "quantity",
                              parseInt(e.target.value) || 1
                            )
                          }
                          min="1"
                          max={item.stockQuantity}
                        />
                        <span className="unit">({item.unit})</span>
                      </div>
                    </div>

                    <div className="form-group full-width">
                      <label>Hướng dẫn sử dụng:</label>
                      <textarea
                        value={item.instructions}
                        onChange={(e) =>
                          updatePrescriptionItem(
                            index,
                            "instructions",
                            e.target.value
                          )
                        }
                        placeholder="Uống sau ăn, uống trước khi ngủ..."
                        rows="2"
                      />
                    </div>

                    <div className="item-price">
                      <span>
                        Thành tiền:{" "}
                        {(item.quantity * item.unitPrice).toLocaleString()} đ
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nút hành động */}
          {prescriptionItems.length > 0 && (
            <div className="prescription-actions">
              <button
                className="btn-clear"
                onClick={() => setPrescriptionItems([])}
              >
                🗑️ Xóa tất cả
              </button>
              <button
                className="btn-save-prescription"
                onClick={savePrescription}
                disabled={saving || !medicalRecordId}
              >
                {saving
                  ? "💾 Đang lưu..."
                  : medicalRecordId
                  ? "💾 Lưu Đơn Thuốc"
                  : "⏳ Đang tải dữ liệu..."}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal chi tiết thuốc */}
      {showMedicineDetail && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>ℹ️ Chi Tiết Thuốc</h3>
              <button
                className="btn-close"
                onClick={() => setShowMedicineDetail(null)}
              >
                ✕
              </button>
            </div>

            <div className="medicine-detail">
              <h4>{showMedicineDetail.medicineName}</h4>

              <div className="detail-grid">
                <div className="detail-item">
                  <label>Mã thuốc:</label>
                  <span>{showMedicineDetail.medicineCode}</span>
                </div>
                <div className="detail-item">
                  <label>Hoạt chất:</label>
                  <span>{showMedicineDetail.activeIngredient}</span>
                </div>
                <div className="detail-item">
                  <label>Hàm lượng:</label>
                  <span>{showMedicineDetail.strength}</span>
                </div>
                <div className="detail-item">
                  <label>Đơn vị:</label>
                  <span>{showMedicineDetail.unit}</span>
                </div>
                <div className="detail-item">
                  <label>Phân loại:</label>
                  <span>{showMedicineDetail.category}</span>
                </div>
                <div className="detail-item">
                  <label>Giá:</label>
                  <span className="price">
                    {(showMedicineDetail.unitPrice || 0).toLocaleString()} đ/
                    {showMedicineDetail.unit}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Tồn kho:</label>
                  <span
                    className={`stock ${
                      (showMedicineDetail.stockQuantity || 0) <=
                      (showMedicineDetail.minStockLevel || 10)
                        ? "low"
                        : "normal"
                    }`}
                  >
                    {showMedicineDetail.stockQuantity || 0}{" "}
                    {showMedicineDetail.unit}
                  </span>
                </div>
              </div>

              {showMedicineDetail.description && (
                <div className="detail-section">
                  <label>Mô tả:</label>
                  <p>{showMedicineDetail.description}</p>
                </div>
              )}

              {showMedicineDetail.usageInstructions && (
                <div className="detail-section">
                  <label>Hướng dẫn sử dụng:</label>
                  <p>{showMedicineDetail.usageInstructions}</p>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="btn-add"
                  onClick={() => {
                    addToPrescription(showMedicineDetail);
                    setShowMedicineDetail(null);
                  }}
                  disabled={(showMedicineDetail.stockQuantity || 0) === 0}
                >
                  {(showMedicineDetail.stockQuantity || 0) === 0
                    ? "❌ Hết hàng"
                    : "➕ Thêm vào đơn"}
                </button>
                <button
                  className="btn-close"
                  onClick={() => setShowMedicineDetail(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal lịch sử sử dụng thuốc */}
      {showMedicationHistory && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h3>📜 Lịch Sử Thuốc Đã Sử Dụng</h3>
              <button
                className="btn-close"
                onClick={() => setShowMedicationHistory(false)}
              >
                ✕
              </button>
            </div>

            <div className="medication-history">
              {patientInfo && (
                <div className="patient-summary">
                  <h4>Bệnh nhân: {patientInfo.fullName}</h4>
                  <p>Mã HS: {medicalRecordId}</p>
                  <p>Mã đơn: {patientInfo.registrationNumber}</p>
                  <div className="history-stats">
                    <span>
                      Tổng số đơn: {Object.keys(groupedHistory).length}
                    </span>
                    <span>Tổng số thuốc: {medicationHistory.length}</span>
                    <span>
                      Tổng chi phí: {calculateHistoryTotal().toLocaleString()} đ
                    </span>
                  </div>
                </div>
              )}

              {loadingHistory ? (
                <div className="loading-history">
                  <div className="loading-spinner"></div>
                  <p>Đang tải lịch sử thuốc...</p>
                </div>
              ) : medicationHistory.length === 0 ? (
                <div className="empty-history">
                  <div className="empty-icon">📊</div>
                  <p>Chưa có lịch sử sử dụng thuốc</p>
                  <small>Hồ sơ bệnh án này chưa từng được kê đơn thuốc</small>
                </div>
              ) : (
                <div className="history-grouped-container">
                  {Object.values(groupedHistory).map((group, groupIndex) => (
                    <div key={groupIndex} className="history-day-group">
                      <div className="day-header">
                        <div className="day-title">
                          <span className="day-icon">📅</span>
                          <h4>{group.date}</h4>
                        </div>
                        <div className="day-total">
                          <span className="total-label">Tổng ngày:</span>
                          <span className="total-amount">
                            {calculateDayTotal(group.items).toLocaleString()} đ
                          </span>
                        </div>
                      </div>

                      <div className="day-medicines">
                        {group.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="medicine-item-history"
                          >
                            <div className="medicine-info-history">
                              <div className="medicine-name-history">
                                <strong>{item.medicineName}</strong>
                                {item.strength && (
                                  <span className="medicine-strength">
                                    ({item.strength})
                                  </span>
                                )}
                              </div>
                              <div className="medicine-details-history">
                                <div className="detail-row">
                                  <span className="detail-label">
                                    Liều dùng:
                                  </span>
                                  <span className="detail-value">
                                    {item.dosage}
                                  </span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">
                                    Tần suất:
                                  </span>
                                  <span className="detail-value">
                                    {item.frequency}
                                  </span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">Số ngày:</span>
                                  <span className="detail-value">
                                    {item.duration}
                                  </span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">
                                    Số lượng:
                                  </span>
                                  <span className="detail-value">
                                    {item.quantity} {item.unit || ""}
                                  </span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">Giá:</span>
                                  <span className="detail-value">
                                    {parseFloat(
                                      item.unitPrice || 0
                                    ).toLocaleString()}{" "}
                                    đ
                                  </span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">
                                    Thành tiền:
                                  </span>
                                  <span className="detail-value total-price">
                                    {parseFloat(
                                      item.totalPrice || 0
                                    ).toLocaleString()}{" "}
                                    đ
                                  </span>
                                </div>
                              </div>

                              {item.instructions && (
                                <div className="medicine-instructions">
                                  <span className="instructions-label">
                                    Hướng dẫn:
                                  </span>
                                  <span className="instructions-text">
                                    {item.instructions}
                                  </span>
                                </div>
                              )}

                              {item.notes && (
                                <div className="medicine-notes">
                                  <span className="notes-label">Ghi chú:</span>
                                  <span className="notes-text">
                                    {item.notes}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="medicine-time">
                              <span className="time-icon">🕒</span>
                              <span className="time-text">
                                {formatFullDate(item.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Tổng kết */}
                  <div className="history-summary">
                    <div className="summary-header">
                      <h4>📊 Tổng Kết</h4>
                    </div>
                    <div className="summary-content">
                      <div className="summary-row">
                        <span className="summary-label">Tổng số ngày:</span>
                        <span className="summary-value">
                          {Object.keys(groupedHistory).length} ngày
                        </span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">Tổng số thuốc:</span>
                        <span className="summary-value">
                          {medicationHistory.length} loại
                        </span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">Tổng chi phí:</span>
                        <span className="summary-value total-summary">
                          {calculateHistoryTotal().toLocaleString()} đ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="btn-close"
                  onClick={() => setShowMedicationHistory(false)}
                >
                  Đóng
                </button>
                {medicationHistory.length > 0 && (
                  <button className="btn-print" onClick={() => window.print()}>
                    🖨️ In báo cáo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPrescription;
