import React from "react";

const MedicineManagement = ({
  medicines,
  showMedicineForm,
  showImportForm,
  importFile,
  newMedicine,
  medicineFormRef,
  formatCurrency,
  getStatusLabel,
  handleAddMedicineClick,
  handleImportClick,
  handleAddMedicine,
  handleImportExcel,
  setNewMedicine,
  setShowMedicineForm,
  setShowImportForm,
  setImportFile,
  toggleMedicineStatus,
  deleteMedicine,
}) => {
  return (
    <div className="medicine-management">
      <div className="section-header">
        <h2>Quản lý Thuốc ({medicines.length})</h2>
        <div className="action-buttons">
          <button className="warning-button" onClick={handleImportClick}>
            📄 Import từ Excel
          </button>
          <button className="primary-button" onClick={handleAddMedicineClick}>
            ➕ Thêm thuốc mới
          </button>
        </div>
      </div>

      {/* Import Form */}
      {showImportForm && (
        <div className="import-form" ref={medicineFormRef}>
          <h3>Import thuốc từ Excel</h3>
          <div className="form-content">
            <p>Vui lòng chọn file Excel theo đúng định dạng mẫu</p>
            <div className="file-input">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files[0])}
              />
              {importFile && (
                <p className="file-name">Đã chọn: {importFile.name}</p>
              )}
            </div>
          </div>
          <div className="form-actions">
            <button
              className="success-button"
              onClick={handleImportExcel}
              disabled={!importFile}
            >
              📤 Upload & Import
            </button>
            <button
              className="danger-button"
              onClick={() => {
                setShowImportForm(false);
                setImportFile(null);
              }}
            >
              ❌ Hủy
            </button>
          </div>
        </div>
      )}

      {/* Add Medicine Form */}
      {showMedicineForm && (
        <div className="add-medicine-form" ref={medicineFormRef}>
          <h3>Thêm thuốc mới</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Mã thuốc:</label>
              <input
                type="text"
                value={newMedicine.medicineCode}
                onChange={(e) =>
                  setNewMedicine({
                    ...newMedicine,
                    medicineCode: e.target.value,
                  })
                }
              />
            </div>
            <div className="form-field">
              <label>Tên thuốc *:</label>
              <input
                type="text"
                value={newMedicine.medicineName}
                onChange={(e) =>
                  setNewMedicine({
                    ...newMedicine,
                    medicineName: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="form-field">
              <label>Hoạt chất:</label>
              <input
                type="text"
                value={newMedicine.activeIngredient}
                onChange={(e) =>
                  setNewMedicine({
                    ...newMedicine,
                    activeIngredient: e.target.value,
                  })
                }
              />
            </div>
            <div className="form-field">
              <label>Đơn vị:</label>
              <select
                value={newMedicine.unit}
                onChange={(e) =>
                  setNewMedicine({ ...newMedicine, unit: e.target.value })
                }
              >
                <option value="viên">Viên</option>
                <option value="chai">Chai</option>
                <option value="tuýp">Tuýp</option>
                <option value="hộp">Hộp</option>
                <option value="vỉ">Vỉ</option>
              </select>
            </div>
            <div className="form-field">
              <label>Đơn giá (VNĐ) *:</label>
              <input
                type="number"
                min="0"
                value={newMedicine.unitPrice}
                onChange={(e) =>
                  setNewMedicine({
                    ...newMedicine,
                    unitPrice: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="form-field">
              <label>Số lượng tồn:</label>
              <input
                type="number"
                min="0"
                value={newMedicine.stockQuantity}
                onChange={(e) =>
                  setNewMedicine({
                    ...newMedicine,
                    stockQuantity: e.target.value,
                  })
                }
              />
            </div>
            <div className="form-field">
              <label>Danh mục:</label>
              <input
                type="text"
                value={newMedicine.category}
                onChange={(e) =>
                  setNewMedicine({
                    ...newMedicine,
                    category: e.target.value,
                  })
                }
              />
            </div>
            <div className="form-field">
              <label>Cần kê đơn:</label>
              <select
                value={newMedicine.prescriptionRequired}
                onChange={(e) =>
                  setNewMedicine({
                    ...newMedicine,
                    prescriptionRequired: e.target.value === "true",
                  })
                }
              >
                <option value="true">Có</option>
                <option value="false">Không</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="success-button" onClick={handleAddMedicine}>
              💾 Lưu thuốc
            </button>
            <button
              className="danger-button"
              onClick={() => setShowMedicineForm(false)}
            >
              ❌ Hủy
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Tổng số thuốc</div>
          <div className="stat-value">{medicines.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Đang hoạt động</div>
          <div className="stat-value active">
            {medicines.filter((m) => m.status === "ACTIVE").length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Sắp hết hàng</div>
          <div className="stat-value warning">
            {
              medicines.filter(
                (m) => m.stockQuantity <= (m.minStockLevel || 10)
              ).length
            }
          </div>
        </div>
      </div>

      {medicines.length === 0 ? (
        <div className="empty-state">
          <p>Không có thuốc nào</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã thuốc</th>
                <th>Tên thuốc</th>
                <th>Hoạt chất</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((medicine) => (
                <tr key={medicine.id}>
                  <td>{medicine.medicineCode || "N/A"}</td>
                  <td>{medicine.medicineName || "N/A"}</td>
                  <td>{medicine.activeIngredient || "N/A"}</td>
                  <td>
                    <div className="stock-info">
                      <span>
                        {medicine.stockQuantity || 0} {medicine.unit || ""}
                      </span>
                      {medicine.stockQuantity <=
                        (medicine.minStockLevel || 10) && (
                        <span className="low-stock-badge">Sắp hết</span>
                      )}
                    </div>
                  </td>
                  <td>{formatCurrency(medicine.unitPrice)}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        medicine.status === "ACTIVE"
                          ? "active"
                          : medicine.status === "INACTIVE"
                          ? "inactive"
                          : medicine.status === "OUT_OF_STOCK"
                          ? "out-of-stock"
                          : "low-stock"
                      }`}
                      onClick={() =>
                        toggleMedicineStatus(medicine.id, medicine.status)
                      }
                      title="Nhấn để thay đổi trạng thái"
                    >
                      {getStatusLabel(medicine.status)}
                    </span>
                  </td>
                  <td className="medicine-actions">
                    <button
                      className="delete-button"
                      onClick={() => deleteMedicine(medicine.id)}
                    >
                      🗑️ Xóa
                    </button>
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
