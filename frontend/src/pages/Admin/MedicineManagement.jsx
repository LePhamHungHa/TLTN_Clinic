import React, { useState, useEffect, useRef } from "react";
import "../../css/MedicineManagement.css";

const MedicineManagement = ({
  medicines,
  formatCurrency,
  getStatusLabel,
  onRefresh,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [categories, setCategories] = useState([]);

  // Thêm ref để scroll tới form
  const formRef = useRef(null);
  const importFormRef = useRef(null);

  // Lấy danh sách danh mục
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        "http://localhost:8080/api/admin/structure/medicines/categories",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Lỗi khi lấy danh mục:", err);
    }
  };

  const [formData, setFormData] = useState({
    medicineCode: "",
    medicineName: "",
    activeIngredient: "",
    dosageForm: "",
    strength: "",
    unit: "viên",
    packageType: "Vỉ",
    quantityPerPackage: 10,
    manufacturer: "",
    countryOrigin: "Việt Nam",
    lotNumber: "",
    expiryDate: "",
    unitPrice: "",
    stockQuantity: 0,
    minStockLevel: 10,
    maxStockLevel: 100,
    prescriptionRequired: true,
    description: "",
    sideEffects: "",
    contraindications: "",
    usageInstructions: "",
    storageConditions: "",
    category: "",
    status: "ACTIVE",
  });

  // Hàm mở form chỉnh sửa với scroll
  const handleEditMedicine = (medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      medicineCode: medicine.medicineCode || "",
      medicineName: medicine.medicineName || "",
      activeIngredient: medicine.activeIngredient || "",
      dosageForm: medicine.dosageForm || "",
      strength: medicine.strength || "",
      unit: medicine.unit || "viên",
      packageType: medicine.packageType || "Vỉ",
      quantityPerPackage: medicine.quantityPerPackage || 10,
      manufacturer: medicine.manufacturer || "",
      countryOrigin: medicine.countryOrigin || "Việt Nam",
      lotNumber: medicine.lotNumber || "",
      expiryDate: medicine.expiryDate ? medicine.expiryDate.split("T")[0] : "",
      unitPrice: medicine.unitPrice || "",
      stockQuantity: medicine.stockQuantity || 0,
      minStockLevel: medicine.minStockLevel || 10,
      maxStockLevel: medicine.maxStockLevel || 100,
      prescriptionRequired: medicine.prescriptionRequired !== false,
      description: medicine.description || "",
      sideEffects: medicine.sideEffects || "",
      contraindications: medicine.contraindications || "",
      usageInstructions: medicine.usageInstructions || "",
      storageConditions: medicine.storageConditions || "",
      category: medicine.category || "",
      status: medicine.status || "ACTIVE",
    });
    setShowForm(true);

    // Scroll tới form sau khi cập nhật state
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleAddMedicine = async () => {
    // Validate
    if (!formData.medicineName || !formData.medicineCode) {
      alert("Vui lòng điền mã thuốc và tên thuốc");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const url = editingMedicine
        ? `http://localhost:8080/api/admin/structure/medicines/${editingMedicine.id}`
        : "http://localhost:8080/api/admin/structure/medicines";

      const method = editingMedicine ? "PUT" : "POST";

      const medicineData = {
        ...formData,
        unitPrice: parseFloat(formData.unitPrice) || 0,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        minStockLevel: parseInt(formData.minStockLevel) || 10,
        maxStockLevel: parseInt(formData.maxStockLevel) || 100,
        quantityPerPackage: parseInt(formData.quantityPerPackage) || 10,
        prescriptionRequired: formData.prescriptionRequired,
      };

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(medicineData),
      });

      if (response.ok) {
        onRefresh();
        fetchCategories(); // Refresh categories
        setShowForm(false);
        resetForm();
        alert(`✅ ${editingMedicine ? "Cập nhật" : "Thêm"} thuốc thành công!`);
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Lỗi khi ${editingMedicine ? "cập nhật" : "thêm"} thuốc`
        );
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  const handleImportExcel = async () => {
    if (!importFile) {
      alert("Vui lòng chọn file Excel");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        "http://localhost:8080/api/admin/structure/medicines/import",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        onRefresh();
        fetchCategories(); // Refresh categories
        setShowImportForm(false);
        setImportFile(null);
        alert(result.message || "✅ Import thuốc thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi import");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  // Thêm các hàm bị thiếu
  const toggleMedicineStatus = async (medicineId) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        `http://localhost:8080/api/admin/structure/medicines/${medicineId}/toggle-status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        onRefresh();
        alert("✅ Cập nhật trạng thái thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi cập nhật");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  const deleteMedicine = async (medicineId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thuốc này?")) return;

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        `http://localhost:8080/api/admin/structure/medicines/${medicineId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        onRefresh();
        alert("✅ Xóa thuốc thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi xóa");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      medicineCode: "",
      medicineName: "",
      activeIngredient: "",
      dosageForm: "",
      strength: "",
      unit: "viên",
      packageType: "Vỉ",
      quantityPerPackage: 10,
      manufacturer: "",
      countryOrigin: "Việt Nam",
      lotNumber: "",
      expiryDate: "",
      unitPrice: "",
      stockQuantity: 0,
      minStockLevel: 10,
      maxStockLevel: 100,
      prescriptionRequired: true,
      description: "",
      sideEffects: "",
      contraindications: "",
      usageInstructions: "",
      storageConditions: "",
      category: "",
      status: "ACTIVE",
    });
    setEditingMedicine(null);
  };

  // Xử lý mở form import và scroll tới đó
  const handleShowImportForm = () => {
    setShowImportForm(true);
    setTimeout(() => {
      importFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // Xử lý mở form thêm mới và scroll tới đó
  const handleShowAddForm = () => {
    setEditingMedicine(null);
    resetForm();
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // Hàm đóng form và reset
  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
  };

  // Hàm đóng import form
  const handleCloseImportForm = () => {
    setShowImportForm(false);
    setImportFile(null);
  };

  return (
    <div className="medicine-management">
      <div className="section-header">
        <h2>Quản lý Thuốc ({medicines.length})</h2>
        <div className="action-buttons">
          <button className="warning-button" onClick={handleShowImportForm}>
            📤 Import từ Excel
          </button>
          <button className="primary-button" onClick={handleShowAddForm}>
            💊 {editingMedicine ? "Sửa" : "Thêm"} thuốc
          </button>
        </div>
      </div>

      {/* Import Form - Thêm ref */}
      {showImportForm && (
        <div className="import-form" ref={importFormRef}>
          <h3>📤 Import Thuốc từ Excel</h3>
          <div className="form-content">
            <p>
              <strong>Lưu ý:</strong> File Excel cần đúng định dạng 31 cột như
              dữ liệu mẫu
            </p>
            <p>
              <em>Định dạng file hỗ trợ: .xlsx, .xls</em>
            </p>

            <div className="file-input">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files[0])}
              />
              {importFile && (
                <div className="file-name">📄 Đã chọn: {importFile.name}</div>
              )}
            </div>

            <div className="form-actions">
              <button
                className="success-button"
                onClick={handleImportExcel}
                disabled={!importFile}
              >
                📤 Import Thuốc
              </button>
              <button className="danger-button" onClick={handleCloseImportForm}>
                ❌ Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form - Thêm ref */}
      {showForm && (
        <div className="add-form full-form" ref={formRef}>
          <h3>{editingMedicine ? "Sửa thông tin Thuốc" : "Thêm thuốc mới"}</h3>

          <div className="form-scrollable">
            <div className="form-section">
              <h4>📋 Thông tin cơ bản</h4>
              <div className="form-grid">
                <div className="form-field">
                  <label>Mã thuốc *:</label>
                  <input
                    type="text"
                    value={formData.medicineCode}
                    onChange={(e) =>
                      setFormData({ ...formData, medicineCode: e.target.value })
                    }
                    placeholder="AMOX250"
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Tên thuốc *:</label>
                  <input
                    type="text"
                    value={formData.medicineName}
                    onChange={(e) =>
                      setFormData({ ...formData, medicineName: e.target.value })
                    }
                    placeholder="Amoxicillin 250mg"
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Hoạt chất:</label>
                  <input
                    type="text"
                    value={formData.activeIngredient}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        activeIngredient: e.target.value,
                      })
                    }
                    placeholder="Amoxicillin"
                  />
                </div>
                <div className="form-field">
                  <label>Danh mục:</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat, index) => (
                      <option key={index} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>💊 Thông số kỹ thuật</h4>
              <div className="form-grid">
                <div className="form-field">
                  <label>Dạng bào chế:</label>
                  <select
                    value={formData.dosageForm}
                    onChange={(e) =>
                      setFormData({ ...formData, dosageForm: e.target.value })
                    }
                  >
                    <option value="">-- Chọn dạng --</option>
                    <option value="Viên nang">Viên nang</option>
                    <option value="Viên nén">Viên nén</option>
                    <option value="Viên nén bao phim">Viên nén bao phim</option>
                    <option value="Bình xịt">Bình xịt</option>
                    <option value="Bình xịt định liều">
                      Bình xịt định liều
                    </option>
                    <option value="Kem bôi">Kem bôi</option>
                    <option value="Dung dịch">Dung dịch</option>
                    <option value="Gói bột">Gói bột</option>
                    <option value="Lọ tiêm">Lọ tiêm</option>
                    <option value="Viên sủi">Viên sủi</option>
                    <option value="Viên nang mềm">Viên nang mềm</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Hàm lượng:</label>
                  <input
                    type="text"
                    value={formData.strength}
                    onChange={(e) =>
                      setFormData({ ...formData, strength: e.target.value })
                    }
                    placeholder="250mg"
                  />
                </div>
                <div className="form-field">
                  <label>Đơn vị:</label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                  >
                    <option value="Viên">Viên</option>
                    <option value="Gói">Gói</option>
                    <option value="Lọ">Lọ</option>
                    <option value="Bình">Bình</option>
                    <option value="Tuýp">Tuýp</option>
                    <option value="Hộp">Hộp</option>
                    <option value="Ống">Ống</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Loại bao bì:</label>
                  <select
                    value={formData.packageType}
                    onChange={(e) =>
                      setFormData({ ...formData, packageType: e.target.value })
                    }
                  >
                    <option value="Vỉ">Vỉ</option>
                    <option value="Hộp">Hộp</option>
                    <option value="Lọ">Lọ</option>
                    <option value="Bình">Bình</option>
                    <option value="Tuýp">Tuýp</option>
                    <option value="Ống">Ống</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Số lượng/bao bì:</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantityPerPackage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantityPerPackage: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>🏭 Thông tin sản xuất</h4>
              <div className="form-grid">
                <div className="form-field">
                  <label>Nhà sản xuất:</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) =>
                      setFormData({ ...formData, manufacturer: e.target.value })
                    }
                    placeholder="Công ty CP Dược Hậu Giang"
                  />
                </div>
                <div className="form-field">
                  <label>Quốc gia:</label>
                  <input
                    type="text"
                    value={formData.countryOrigin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        countryOrigin: e.target.value,
                      })
                    }
                    placeholder="Việt Nam"
                  />
                </div>
                <div className="form-field">
                  <label>Số lô:</label>
                  <input
                    type="text"
                    value={formData.lotNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, lotNumber: e.target.value })
                    }
                  />
                </div>
                <div className="form-field">
                  <label>Hạn sử dụng:</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>💰 Thông tin giá & tồn kho</h4>
              <div className="form-grid">
                <div className="form-field">
                  <label>Đơn giá (VNĐ) *:</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.unitPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, unitPrice: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Tồn kho hiện tại:</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stockQuantity: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-field">
                  <label>Tồn tối thiểu:</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStockLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minStockLevel: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-field">
                  <label>Tồn tối đa:</label>
                  <input
                    type="number"
                    min="10"
                    value={formData.maxStockLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxStockLevel: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-field">
                  <label>Cần kê đơn:</label>
                  <select
                    value={formData.prescriptionRequired}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prescriptionRequired: e.target.value === "true",
                      })
                    }
                  >
                    <option value="true">Có</option>
                    <option value="false">Không</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Trạng thái:</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="INACTIVE">Ngừng hoạt động</option>
                    <option value="OUT_OF_STOCK">Hết hàng</option>
                    <option value="LOW_STOCK">Sắp hết hàng</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>📝 Thông tin bổ sung</h4>
              <div className="form-columns">
                <div className="form-field full-width">
                  <label>Mô tả:</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows="3"
                    placeholder="Kháng sinh nhóm Beta-lactam, điều trị nhiễm khuẩn..."
                  />
                </div>
                <div className="form-field full-width">
                  <label>Tác dụng phụ:</label>
                  <textarea
                    value={formData.sideEffects}
                    onChange={(e) =>
                      setFormData({ ...formData, sideEffects: e.target.value })
                    }
                    rows="3"
                    placeholder="Tiêu chảy, buồn nôn, phát ban, dị ứng..."
                  />
                </div>
                <div className="form-field full-width">
                  <label>Chống chỉ định:</label>
                  <textarea
                    value={formData.contraindications}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contraindications: e.target.value,
                      })
                    }
                    rows="3"
                    placeholder="Quá mẫn với Penicillin, suy gan nặng..."
                  />
                </div>
                <div className="form-field full-width">
                  <label>Hướng dẫn sử dụng:</label>
                  <textarea
                    value={formData.usageInstructions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usageInstructions: e.target.value,
                      })
                    }
                    rows="3"
                    placeholder="Uống cách xa bữa ăn 2 giờ, tuân thủ đủ liệu trình..."
                  />
                </div>
                <div className="form-field full-width">
                  <label>Điều kiện bảo quản:</label>
                  <textarea
                    value={formData.storageConditions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        storageConditions: e.target.value,
                      })
                    }
                    rows="3"
                    placeholder="Nơi khô ráo, tránh ánh sáng, dưới 30°C..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button className="success-button" onClick={handleAddMedicine}>
              💾 {editingMedicine ? "Cập nhật" : "Lưu"} thuốc
            </button>
            <button className="danger-button" onClick={handleCloseForm}>
              ❌ Hủy
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {medicines.length === 0 ? (
        <div className="empty-state">
          <p>Không có thuốc nào. Hãy thêm thuốc mới hoặc import từ Excel!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã thuốc</th>
                <th>Tên thuốc</th>
                <th>Hoạt chất</th>
                <th>Dạng bào chế</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Danh mục</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((medicine) => (
                <tr key={medicine.id}>
                  <td>{medicine.medicineCode || "N/A"}</td>
                  <td>{medicine.medicineName}</td>
                  <td>{medicine.activeIngredient || "N/A"}</td>
                  <td>{medicine.dosageForm || "N/A"}</td>
                  <td>
                    <div className="stock-info">
                      <span>
                        {medicine.stockQuantity} {medicine.unit}
                      </span>
                      {medicine.stockQuantity <= medicine.minStockLevel &&
                        medicine.stockQuantity > 0 && (
                          <span className="low-stock-badge">⚠️ Sắp hết</span>
                        )}
                    </div>
                  </td>
                  <td>{formatCurrency(medicine.unitPrice)}</td>
                  <td>{medicine.category || "N/A"}</td>
                  <td>
                    <span
                      className={`status-badge ${medicine.status.toLowerCase()}`}
                      onClick={() => toggleMedicineStatus(medicine.id)}
                      style={{ cursor: "pointer" }}
                    >
                      {getStatusLabel(medicine.status)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="edit-button"
                        onClick={() => handleEditMedicine(medicine)}
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => deleteMedicine(medicine.id)}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MedicineManagement;
