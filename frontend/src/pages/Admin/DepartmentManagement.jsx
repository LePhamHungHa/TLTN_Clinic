import React, { useState, useRef } from "react";
import "../../css/DepartmentManagement.css";

const DepartmentManagement = ({ departments, doctors, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    departmentName: "",
    description: "",
  });

  // Thêm ref để scroll tới form
  const formRef = useRef(null);
  const importFormRef = useRef(null);

  // Hàm mở form chỉnh sửa với scroll
  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setFormData({
      departmentName: department.departmentName || "",
      description: department.description || "",
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

  const handleAddDepartment = async () => {
    if (!formData.departmentName.trim()) {
      alert("Vui lòng nhập tên khoa");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const url = editingDepartment
        ? `http://localhost:8080/api/departments/${editingDepartment.id}`
        : "http://localhost:8080/api/departments";

      const method = editingDepartment ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onRefresh();
        setShowForm(false);
        setFormData({ departmentName: "", description: "" });
        setEditingDepartment(null);
        alert(`✅ ${editingDepartment ? "Cập nhật" : "Thêm"} khoa thành công!`);
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Lỗi khi ${editingDepartment ? "cập nhật" : "thêm"} khoa`
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
        "http://localhost:8080/api/departments/import",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        onRefresh();
        setShowImportForm(false);
        setImportFile(null);
        alert(result.message || "✅ Import khoa thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi import");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  const deleteDepartment = async (departmentId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa khoa này?")) return;

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        `http://localhost:8080/api/departments/${departmentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        onRefresh();
        alert("✅ Xóa khoa thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi xóa khoa");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
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
    setEditingDepartment(null);
    setFormData({ departmentName: "", description: "" });
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
    setFormData({ departmentName: "", description: "" });
    setEditingDepartment(null);
  };

  // Hàm đóng import form
  const handleCloseImportForm = () => {
    setShowImportForm(false);
    setImportFile(null);
  };

  return (
    <div className="department-management">
      <div className="section-header">
        <h2>Quản lý Khoa ({departments.length})</h2>
        <div className="action-buttons">
          <button className="warning-button" onClick={handleShowImportForm}>
            📤 Import từ Excel
          </button>
          <button className="primary-button" onClick={handleShowAddForm}>
            🏥 {editingDepartment ? "Sửa" : "Thêm"} Khoa
          </button>
        </div>
      </div>

      {/* Import Form - Thêm ref */}
      {showImportForm && (
        <div className="import-form" ref={importFormRef}>
          <h3>📤 Import Khoa từ Excel</h3>
          <div className="form-content">
            <p>
              <strong>Lưu ý:</strong> File Excel cần có cột:{" "}
              <code>Tên khoa</code> và <code>Mô tả</code>
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
                📤 Import Khoa
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
        <div className="add-form" ref={formRef}>
          <h3>{editingDepartment ? "Sửa thông tin Khoa" : "Thêm Khoa mới"}</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Tên Khoa *:</label>
              <input
                type="text"
                value={formData.departmentName}
                onChange={(e) =>
                  setFormData({ ...formData, departmentName: e.target.value })
                }
                placeholder="Nhập tên khoa"
                required
              />
            </div>
            <div className="form-field">
              <label>Mô tả:</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Nhập mô tả khoa"
                rows="3"
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="success-button" onClick={handleAddDepartment}>
              💾 {editingDepartment ? "Cập nhật" : "Lưu"} Khoa
            </button>
            <button className="danger-button" onClick={handleCloseForm}>
              ❌ Hủy
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {departments.length === 0 ? (
        <div className="empty-state">
          <p>Không có khoa nào. Hãy thêm khoa mới hoặc import từ Excel!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên Khoa</th>
                <th>Mô tả</th>
                <th>Ngày tạo</th>
                <th>Số Bác sĩ</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => {
                const doctorCount = doctors.filter(
                  (doctor) => doctor.departmentId === dept.id
                ).length;
                return (
                  <tr key={dept.id}>
                    <td>{dept.id}</td>
                    <td>
                      <strong>{dept.departmentName}</strong>
                    </td>
                    <td>
                      {dept.description || (
                        <span className="text-muted">Không có mô tả</span>
                      )}
                    </td>
                    <td>
                      {dept.createdAt
                        ? new Date(dept.createdAt).toLocaleDateString("vi-VN")
                        : "N/A"}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          doctorCount > 0 ? "has-doctors" : "empty"
                        }`}
                      >
                        {doctorCount} bác sĩ
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="edit-button"
                          onClick={() => handleEditDepartment(dept)}
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => deleteDepartment(dept.id)}
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;
