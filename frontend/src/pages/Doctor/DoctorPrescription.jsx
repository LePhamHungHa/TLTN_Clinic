import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../css/DoctorPrescription.css";

// Component hiển thị lịch sử thuốc
function MedicationHistoryModal({
  isOpen,
  onClose,
  medicalRecordId,
  patientInfo,
  medicationHistory,
  loadingHistory,
}) {
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    if (medicationHistory && medicationHistory.length > 0) {
      const groupedByDate = {};

      medicationHistory.forEach((item) => {
        if (!item.createdAt) return;

        const date = new Date(item.createdAt);
        const dateKey = date.toLocaleDateString("vi-VN");

        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = {
            date: dateKey,
            items: [],
          };
        }

        groupedByDate[dateKey].items.push(item);
      });

      const formattedData = Object.values(groupedByDate);
      setHistoryData(formattedData);
    }
  }, [medicationHistory]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content medication-history-modal">
        <div className="modal-header">
          <h3>Lịch sử sử dụng thuốc</h3>
          <button className="close-button" onClick={onClose}>
            Đóng
          </button>
        </div>

        <div className="modal-body">
          {loadingHistory ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : medicationHistory.length === 0 ? (
            <div className="empty-state">
              <h4>Chưa có lịch sử sử dụng thuốc</h4>
              <p>Bệnh nhân chưa từng được kê đơn thuốc trong hồ sơ này</p>
            </div>
          ) : (
            <>
              {patientInfo && (
                <div className="patient-info-card">
                  <div className="patient-info-row">
                    <span className="label">Bệnh nhân:</span>
                    <span className="value">{patientInfo.fullName}</span>
                  </div>
                  <div className="patient-info-row">
                    <span className="label">Mã HS:</span>
                    <span className="value">{medicalRecordId}</span>
                  </div>
                  <div className="patient-info-row">
                    <span className="label">Tổng số đơn:</span>
                    <span className="value">
                      {historyData.length} lần kê đơn
                    </span>
                  </div>
                </div>
              )}

              <div className="history-list">
                {historyData.map((day, dayIndex) => (
                  <div key={dayIndex} className="history-day">
                    <div className="history-day-header">
                      <span className="date-label">{day.date}</span>
                      <span className="item-count">
                        ({day.items.length} loại thuốc)
                      </span>
                    </div>

                    <div className="history-items">
                      {day.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="history-item">
                          <div className="medicine-name">
                            {item.medicineName}
                            {item.strength && ` (${item.strength})`}
                          </div>

                          <div className="medicine-details">
                            <div className="detail-row">
                              <span className="detail-label">Liều dùng:</span>
                              <span className="detail-value">
                                {item.dosage}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Tần suất:</span>
                              <span className="detail-value">
                                {item.frequency}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Thời gian:</span>
                              <span className="detail-value">
                                {item.duration}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Số lượng:</span>
                              <span className="detail-value">
                                {item.quantity} {item.unit}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Giá:</span>
                              <span className="detail-value price">
                                {formatCurrency(item.quantity * item.unitPrice)}
                              </span>
                            </div>
                            {item.instructions && (
                              <div className="detail-row">
                                <span className="detail-label">Hướng dẫn:</span>
                                <span className="detail-value instructions">
                                  {item.instructions}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {medicationHistory.length > 0 && (
                <div className="history-summary">
                  <div className="summary-row">
                    <span className="summary-label">Tổng số thuốc đã kê:</span>
                    <span className="summary-value">
                      {medicationHistory.length} loại
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Tổng chi phí:</span>
                    <span className="summary-value total-cost">
                      {formatCurrency(
                        medicationHistory.reduce(
                          (sum, item) => sum + item.quantity * item.unitPrice,
                          0,
                        ),
                      )}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="close-modal-button" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// Component chính
function DoctorPrescription() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [prescriptionList, setPrescriptionList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [medicineDetail, setMedicineDetail] = useState(null);
  const [recordId, setRecordId] = useState(null);
  const [oldPrescription, setOldPrescription] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [categories, setCategories] = useState(["Tất cả"]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Lấy danh mục thuốc
  useEffect(() => {
    const getCategories = async () => {
      setLoadingCategories(true);
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const result = await fetch(
          "http://localhost:8080/api/doctor/prescriptions/medicines/categories",
          {
            headers: {
              Authorization: "Bearer " + user.token,
            },
          },
        );

        if (result.status === 200) {
          const data = await result.json();
          if (data.success && Array.isArray(data.categories)) {
            const sorted = data.categories.sort((a, b) =>
              a.localeCompare(b, "vi"),
            );
            setCategories(["Tất cả", ...sorted]);
          }
        } else {
          console.warn("Không thể tải danh mục thuốc");
          setCategories([
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
            "Tiểu đường",
            "Thần kinh",
          ]);
        }
      } catch (err) {
        console.error("Lỗi tải danh mục thuốc:", err);
        setCategories([
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
          "Tiểu đường",
          "Thần kinh",
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };

    getCategories();
  }, []);

  // Tải dữ liệu chính
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem("user"));

        // Lấy danh sách thuốc
        const medicinesResult = await fetch(
          "http://localhost:8080/api/doctor/prescriptions/medicines/active",
          {
            headers: {
              Authorization: "Bearer " + user.token,
            },
          },
        );

        if (medicinesResult.status === 200) {
          const data = await medicinesResult.json();
          if (data.success) {
            setMedicines(data.medicines);
            setFilteredMedicines(data.medicines);
          }
        }

        // Lấy thông tin bệnh nhân và hồ sơ
        const appointmentResult = await fetch(
          `http://localhost:8080/api/doctor/medical-records/${appointmentId}`,
          {
            headers: {
              Authorization: "Bearer " + user.token,
            },
          },
        );

        if (appointmentResult.status === 200) {
          const data = await appointmentResult.json();
          if (data.success) {
            setPatientData(data.appointment);

            if (data.medicalRecord) {
              setRecordId(data.medicalRecord.id);
              await getExistingPrescription(data.medicalRecord.id, user.token);
            } else {
              const createRecordResult = await fetch(
                `http://localhost:8080/api/doctor/medical-records/create/${appointmentId}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + user.token,
                  },
                  body: JSON.stringify({
                    appointmentId: appointmentId,
                  }),
                },
              );

              if (createRecordResult.status === 200) {
                const createData = await createRecordResult.json();
                if (createData.success) {
                  setRecordId(createData.medicalRecordId);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        alert("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [appointmentId]);

  // Lấy lịch sử thuốc
  const getMedicationHistory = async (recordId, token) => {
    setLoadingHistory(true);
    try {
      const result = await fetch(
        `http://localhost:8080/api/doctor/prescriptions/history/${recordId}`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      if (result.status === 200) {
        const data = await result.json();
        if (data.success) {
          setHistoryData(data.history || []);
        }
      }
    } catch (error) {
      console.error("Lỗi load lịch sử thuốc:", error);
      alert("Không thể tải lịch sử sử dụng thuốc");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Lấy đơn thuốc cũ
  const getExistingPrescription = async (recordId, token) => {
    try {
      const result = await fetch(
        `http://localhost:8080/api/doctor/prescriptions/${recordId}`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      if (result.status === 200) {
        const data = await result.json();
        if (data.success && data.prescription && data.prescription.length > 0) {
          setOldPrescription(data.prescription);

          const itemsFromDB = data.prescription.map((item) => ({
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            strength: "",
            unit: "",
            unitPrice: item.unitPrice,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            quantity: item.quantity,
            instructions: item.instructions || "",
            notes: item.notes || "",
            stockQuantity: 0,
          }));

          const user = JSON.parse(localStorage.getItem("user"));
          const medicinesResult = await fetch(
            "http://localhost:8080/api/doctor/prescriptions/medicines/active",
            {
              headers: {
                Authorization: "Bearer " + user.token,
              },
            },
          );

          if (medicinesResult.status === 200) {
            const medicinesData = await medicinesResult.json();
            if (medicinesData.success) {
              const medicinesMap = {};
              medicinesData.medicines.forEach((med) => {
                medicinesMap[med.id] = med;
              });

              const updatedItems = itemsFromDB.map((item) => {
                const medicineInfo = medicinesMap[item.medicineId];
                if (medicineInfo) {
                  return {
                    ...item,
                    medicineName: medicineInfo.medicineName,
                    strength: medicineInfo.strength || "",
                    unit: medicineInfo.unit || "",
                    stockQuantity: medicineInfo.stockQuantity || 0,
                  };
                }
                return item;
              });

              setPrescriptionList(updatedItems);
            }
          }
        }
      }
    } catch (error) {
      console.error("Lỗi load đơn thuốc cũ:", error);
    }
  };

  // Tìm kiếm và lọc thuốc
  useEffect(() => {
    let results = medicines;

    if (searchText) {
      results = results.filter(
        (medicine) =>
          medicine.medicineName
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          medicine.medicineCode
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          (medicine.activeIngredient &&
            medicine.activeIngredient
              .toLowerCase()
              .includes(searchText.toLowerCase())),
      );
    }

    if (selectedCategory !== "Tất cả") {
      results = results.filter(
        (medicine) => medicine.category === selectedCategory,
      );
    }

    setFilteredMedicines(results);
  }, [searchText, selectedCategory, medicines]);

  // Thêm thuốc vào đơn
  const addMedicineToPrescription = (medicine) => {
    const existingItem = prescriptionList.find(
      (item) => item.medicineId === medicine.id,
    );

    if (existingItem) {
      alert(
        "Thuốc đã có trong đơn. Vui lòng chỉnh sửa số lượng trong danh sách đơn thuốc.",
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

    setPrescriptionList([...prescriptionList, newItem]);
  };

  // Cập nhật thông tin thuốc trong đơn
  const updatePrescriptionItem = (index, field, value) => {
    const newList = [...prescriptionList];
    newList[index][field] = value;
    setPrescriptionList(newList);
  };

  // Xóa thuốc khỏi đơn
  const removeMedicineFromPrescription = (index) => {
    const newList = prescriptionList.filter((_, i) => i !== index);
    setPrescriptionList(newList);
  };

  // Tính tổng tiền
  const calculateTotalPrice = () => {
    return prescriptionList.reduce((total, item) => {
      return total + item.quantity * item.unitPrice;
    }, 0);
  };

  // Lưu đơn thuốc
  const savePrescriptionData = async () => {
    if (prescriptionList.length === 0) {
      alert("Vui lòng thêm ít nhất một loại thuốc vào đơn");
      return;
    }

    if (!recordId) {
      alert("Không tìm thấy hồ sơ bệnh án. Vui lòng thử lại.");
      return;
    }

    for (const item of prescriptionList) {
      if (item.quantity > item.stockQuantity) {
        alert(
          `Thuốc ${item.medicineName} chỉ còn ${item.stockQuantity} ${item.unit} trong kho`,
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user || !user.token) {
        throw new Error("Không tìm thấy thông tin đăng nhập");
      }

      const prescriptionData = prescriptionList.map((item) => ({
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

      const response = await fetch(
        `http://localhost:8080/api/doctor/prescriptions/create/${recordId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + user.token,
          },
          body: JSON.stringify(prescriptionData),
        },
      );

      if (response.status !== 200) {
        if (response.status === 403) {
          throw new Error(
            "Truy cập bị từ chối. Vui lòng kiểm tra quyền truy cập.",
          );
        } else if (response.status === 401) {
          localStorage.removeItem("user");
          navigate("/login");
          throw new Error("Phiên đăng nhập hết hạn");
        } else {
          const errorText = await response.text();
          throw new Error(`Lỗi server (${response.status}): ${errorText}`);
        }
      }

      const result = await response.json();

      if (result.success) {
        alert("Đã lưu đơn thuốc thành công!");
        navigate("/doctor/appointments");
      } else {
        throw new Error(result.message || "Không thể lưu đơn thuốc");
      }
    } catch (error) {
      console.error("Lỗi lưu đơn thuốc:", error);
      alert(`Lỗi: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Hiển thị chi tiết thuốc
  const showMedicineInfo = (medicine) => {
    setMedicineDetail(medicine);
  };

  // Kiểm tra thuốc đã có trong đơn
  const checkMedicineInPrescription = (medicineId) => {
    return prescriptionList.some((item) => item.medicineId === medicineId);
  };

  // Hiển thị lịch sử sử dụng thuốc
  const openHistoryModal = async () => {
    if (!recordId) {
      alert("Không tìm thấy hồ sơ bệnh án");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) {
      alert("Vui lòng đăng nhập lại");
      return;
    }

    await getMedicationHistory(recordId, user.token);
    setShowHistoryModal(true);
  };

  if (isLoading) {
    return (
      <div className="prescription-container">
        <div className="loading-spinner-large"></div>
        <p>Đang tải danh sách thuốc...</p>
      </div>
    );
  }

  return (
    <div className="prescription-container">
      <div className="prescription-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          Quay lại
        </button>
        <h1>Kê Đơn Thuốc</h1>
        {patientData && (
          <div className="patient-info">
            <h3>Bệnh nhân: {patientData.fullName}</h3>
            <div className="patient-meta">
              <span>Mã đơn: {patientData.registrationNumber}</span>
              <span>
                Tuổi:{" "}
                {patientData.dob
                  ? new Date().getFullYear() -
                    new Date(patientData.dob).getFullYear()
                  : "N/A"}
              </span>
              <span>Giới tính: {patientData.gender}</span>
              <button
                className="history-button"
                onClick={openHistoryModal}
                disabled={loadingHistory || !recordId}
              >
                {loadingHistory
                  ? "Đang tải..."
                  : recordId
                    ? "Lịch sử thuốc"
                    : "Đang tải dữ liệu..."}
              </button>
              {oldPrescription.length > 0 && (
                <span className="prescription-badge">
                  Đã có đơn ({oldPrescription.length} thuốc)
                </span>
              )}
              {recordId && <span className="record-id">Mã HS: {recordId}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="prescription-layout">
        <div className="medicine-list-section">
          <div className="section-header">
            <h2>Danh Mục Thuốc</h2>
            <div className="search-filter">
              <input
                type="text"
                placeholder="Tìm kiếm thuốc, hoạt chất..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="search-input"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-filter"
                disabled={loadingCategories}
              >
                {categories.map((category) => (
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
                const isInList = checkMedicineInPrescription(medicine.id);

                return (
                  <div
                    key={medicine.id}
                    className={`medicine-card ${isInList ? "in-prescription" : ""}`}
                  >
                    <div className="medicine-header">
                      <h4>{medicine.medicineName}</h4>
                      <div className="medicine-header-right">
                        {isInList && (
                          <span className="in-prescription-badge">Đã thêm</span>
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
                        className="info-button"
                        onClick={() => showMedicineInfo(medicine)}
                      >
                        Chi tiết
                      </button>
                      <button
                        className={`add-button ${isInList ? "added-button" : ""}`}
                        onClick={() => addMedicineToPrescription(medicine)}
                        disabled={
                          (medicine.stockQuantity || 0) === 0 || isInList
                        }
                      >
                        {isInList
                          ? "Đã thêm"
                          : (medicine.stockQuantity || 0) === 0
                            ? "Hết hàng"
                            : "Thêm vào đơn"}
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

        <div className="prescription-section">
          <div className="section-header">
            <h2>Đơn Thuốc</h2>
            <div className="prescription-stats">
              <span>{prescriptionList.length} thuốc</span>
              <span className="total-amount">
                Tổng tiền: {calculateTotalPrice().toLocaleString()} đ
              </span>
            </div>
          </div>

          {prescriptionList.length === 0 ? (
            <div className="empty-prescription">
              <p>Chưa có thuốc trong đơn</p>
              <small>Chọn thuốc từ danh mục bên trái để thêm vào đơn</small>
            </div>
          ) : (
            <div className="prescription-items">
              {prescriptionList.map((item, index) => (
                <div key={index} className="prescription-item">
                  <div className="item-header">
                    <h4>
                      {item.medicineName} ({item.strength})
                      {oldPrescription.some(
                        (p) => p.medicineId === item.medicineId,
                      ) && (
                        <span className="existing-prescription-badge">
                          (Đã kê)
                        </span>
                      )}
                    </h4>
                    <button
                      className="remove-button"
                      onClick={() => removeMedicineFromPrescription(index)}
                    >
                      Xóa
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
                              e.target.value,
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
                              e.target.value,
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
                              e.target.value,
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
                              parseInt(e.target.value) || 1,
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
                            e.target.value,
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

          {prescriptionList.length > 0 && (
            <div className="prescription-actions">
              <button
                className="clear-button"
                onClick={() => setPrescriptionList([])}
              >
                Xóa tất cả
              </button>
              <button
                className="save-button"
                onClick={savePrescriptionData}
                disabled={isSaving || !recordId}
              >
                {isSaving
                  ? "Đang lưu..."
                  : recordId
                    ? "Lưu Đơn Thuốc"
                    : "Đang tải dữ liệu..."}
              </button>
            </div>
          )}
        </div>
      </div>

      {medicineDetail && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Chi Tiết Thuốc</h3>
              <button
                className="close-button"
                onClick={() => setMedicineDetail(null)}
              >
                Đóng
              </button>
            </div>

            <div className="medicine-detail">
              <h4>{medicineDetail.medicineName}</h4>

              <div className="detail-grid">
                <div className="detail-item">
                  <label>Mã thuốc:</label>
                  <span>{medicineDetail.medicineCode}</span>
                </div>
                <div className="detail-item">
                  <label>Hoạt chất:</label>
                  <span>{medicineDetail.activeIngredient}</span>
                </div>
                <div className="detail-item">
                  <label>Hàm lượng:</label>
                  <span>{medicineDetail.strength}</span>
                </div>
                <div className="detail-item">
                  <label>Đơn vị:</label>
                  <span>{medicineDetail.unit}</span>
                </div>
                <div className="detail-item">
                  <label>Phân loại:</label>
                  <span>{medicineDetail.category}</span>
                </div>
                <div className="detail-item">
                  <label>Giá:</label>
                  <span className="price">
                    {(medicineDetail.unitPrice || 0).toLocaleString()} đ/
                    {medicineDetail.unit}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Tồn kho:</label>
                  <span
                    className={`stock ${
                      (medicineDetail.stockQuantity || 0) <=
                      (medicineDetail.minStockLevel || 10)
                        ? "low"
                        : "normal"
                    }`}
                  >
                    {medicineDetail.stockQuantity || 0} {medicineDetail.unit}
                  </span>
                </div>
              </div>

              {medicineDetail.description && (
                <div className="detail-section">
                  <label>Mô tả:</label>
                  <p>{medicineDetail.description}</p>
                </div>
              )}

              {medicineDetail.usageInstructions && (
                <div className="detail-section">
                  <label>Hướng dẫn sử dụng:</label>
                  <p>{medicineDetail.usageInstructions}</p>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="add-button"
                  onClick={() => {
                    addMedicineToPrescription(medicineDetail);
                    setMedicineDetail(null);
                  }}
                  disabled={(medicineDetail.stockQuantity || 0) === 0}
                >
                  {(medicineDetail.stockQuantity || 0) === 0
                    ? "Hết hàng"
                    : "Thêm vào đơn"}
                </button>
                <button
                  className="close-button"
                  onClick={() => setMedicineDetail(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MedicationHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        medicalRecordId={recordId}
        patientInfo={patientData}
        medicationHistory={historyData}
        loadingHistory={loadingHistory}
      />
    </div>
  );
}

export default DoctorPrescription;
