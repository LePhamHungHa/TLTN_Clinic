import React, { useState, useRef, useEffect } from "react";
import "../../css/DepartmentManagement.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const DepartmentManagement = ({ departments, doctors, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    departmentName: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDepartments, setFilteredDepartments] = useState([]);

  const formRef = useRef(null);
  const importFormRef = useRef(null);

  // Chuan hoa chuoi tim kiem
  const normalizeText = (text) => {
    if (!text) return "";
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  };

  // Loc du lieu khi tim kiem
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDepartments(departments);
    } else {
      const searchTermNormalized = normalizeText(searchTerm);
      const filtered = departments.filter((dept) => {
        const nameMatch = normalizeText(dept.departmentName).includes(
          searchTermNormalized,
        );
        const descriptionMatch = dept.description
          ? normalizeText(dept.description).includes(searchTermNormalized)
          : false;
        return nameMatch || descriptionMatch;
      });
      setFilteredDepartments(filtered);
    }
  }, [searchTerm, departments]);

  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setFormData({
      departmentName: department.departmentName || "",
      description: department.description || "",
    });
    setShowForm(true);
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleAddDepartment = async () => {
    if (!formData.departmentName.trim()) {
      alert("Vui lòng nhập tên khoa");
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      let url = "";
      let method = "";

      if (editingDepartment) {
        url = `http://localhost:8080/api/departments/${editingDepartment.id}`;
        method = "PUT";
      } else {
        url = "http://localhost:8080/api/departments";
        method = "POST";
      }

      const response = await fetch(url, {
        method: method,
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
        alert((editingDepartment ? "Cập nhật" : "Thêm") + " khoa thành công!");
      } else {
        const errorData = await response.json();
        alert("Lỗi: " + (errorData.message || "Lỗi khi xử lý yêu cầu"));
      }
    } catch (error) {
      alert("Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportExcel = async () => {
    if (!importFile) {
      alert("Vui lòng chọn file Excel");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        "http://localhost:8080/api/departments/import",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (response.ok) {
        const result = await response.json();
        onRefresh();
        setShowImportForm(false);
        setImportFile(null);
        alert(result.message || "Import khoa thành công!");
      } else {
        const errorData = await response.json();
        alert("Lỗi: " + (errorData.message || "Lỗi khi import"));
      }
    } catch (error) {
      alert("Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteDepartment = async (departmentId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa khoa này?")) return;

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        `http://localhost:8080/api/departments/${departmentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        onRefresh();
        alert("Xóa khoa thành công!");
      } else {
        const errorData = await response.json();
        alert("Lỗi: " + (errorData.message || "Lỗi khi xóa khoa"));
      }
    } catch (error) {
      alert("Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShowImportForm = () => {
    setShowImportForm(true);
    setTimeout(() => {
      if (importFormRef.current) {
        importFormRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  const handleShowAddForm = () => {
    setEditingDepartment(null);
    setFormData({ departmentName: "", description: "" });
    setShowForm(true);
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData({ departmentName: "", description: "" });
    setEditingDepartment(null);
  };

  const handleCloseImportForm = () => {
    setShowImportForm(false);
    setImportFile(null);
  };

  const getDoctorCount = (departmentId) => {
    return doctors.filter((doctor) => doctor.departmentId === departmentId)
      .length;
  };

  return (
    <div className="department-management">
      {/* Tim kiem va nut thao tac */}
      <div className="modern-search-bar mb-4">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <div className="row g-3 align-items-center">
              {/* O tim kiem */}
              <div className="col-12 col-lg-6">
                <div className="position-relative">
                  <span className="position-absolute top-50 start-0 translate-middle-y text-primary ms-3">
                    <i className="bi bi-search fs-5"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-lg ps-5"
                    placeholder="Tìm kiếm theo tên khoa hoặc mô tả..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-3 text-muted p-0"
                      onClick={() => setSearchTerm("")}
                      style={{ zIndex: 10 }}
                    >
                      <i className="bi bi-x-circle fs-5"></i>
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <div className="mt-2 small text-muted">
                    Tìm thấy <strong>{filteredDepartments.length}</strong> khoa
                  </div>
                )}
              </div>

              {/* Cac nut thao tac */}
              <div className="col-12 col-lg-6 text-lg-end">
                <div className="d-flex gap-3 justify-content-lg-end">
                  <button
                    className="btn btn-success btn-lg px-4 d-flex align-items-center gap-2 shadow-sm"
                    onClick={handleShowImportForm}
                    disabled={loading}
                  >
                    <i className="bi bi-file-earmark-arrow-up"></i>
                    Import Excel
                  </button>

                  <button
                    className="btn btn-primary btn-lg px-5 d-flex align-items-center gap-2 shadow-sm"
                    onClick={handleShowAddForm}
                    disabled={loading}
                  >
                    <i className="bi bi-plus-circle"></i>
                    Thêm Khoa
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form import */}
      {showImportForm && (
        <div className="import-form card mb-4" ref={importFormRef}>
          <div className="card-header bg-success text-white d-flex align-items-center">
            <i className="bi bi-file-earmark-arrow-up me-2 fs-4"></i>
            <h5 className="mb-0">Import Khoa từ Excel</h5>
          </div>
          <div className="card-body">
            <div className="alert alert-info mb-3">
              <strong>Lưu ý:</strong> File Excel cần có các cột:{" "}
              <code>Tên khoa</code>, <code>Mô tả</code>
              <br />
              <small className="text-muted">
                Định dạng file hỗ trợ: .xlsx, .xls
              </small>
            </div>

            <div className="mb-3">
              <label className="form-label fw-medium">Chọn file Excel</label>
              <input
                type="file"
                className="form-control form-control-lg"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files[0])}
              />
              {importFile && (
                <div className="mt-2 text-success d-flex align-items-center">
                  <i className="bi bi-file-earmark-check me-2 fs-5"></i>
                  <span>Đã chọn: {importFile.name}</span>
                </div>
              )}
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-success btn-lg d-flex align-items-center px-4"
                onClick={handleImportExcel}
                disabled={!importFile || loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="bi bi-upload me-2"></i>
                    Import Khoa
                  </>
                )}
              </button>
              <button
                className="btn btn-outline-secondary btn-lg d-flex align-items-center px-4"
                onClick={handleCloseImportForm}
                disabled={loading}
              >
                <i className="bi bi-x-circle me-2"></i>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form them/sua */}
      {showForm && (
        <div className="add-form card mb-4" ref={formRef}>
          <div className="card-header bg-primary text-white d-flex align-items-center">
            <i
              className={`bi ${
                editingDepartment ? "bi-pencil-square" : "bi-plus-circle"
              } me-2 fs-4`}
            ></i>
            <h5 className="mb-0">
              {editingDepartment ? "Sửa thông tin Khoa" : "Thêm Khoa mới"}
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">
                  Tên Khoa <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.departmentName}
                  onChange={(e) =>
                    setFormData({ ...formData, departmentName: e.target.value })
                  }
                  placeholder="Nhập tên khoa"
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Mô tả</label>
                <textarea
                  className="form-control"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Nhập mô tả khoa"
                  rows="4"
                />
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-primary btn-lg d-flex align-items-center px-4"
                onClick={handleAddDepartment}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    {editingDepartment ? "Cập nhật" : "Lưu"} Khoa
                  </>
                )}
              </button>
              <button
                className="btn btn-outline-secondary btn-lg d-flex align-items-center px-4"
                onClick={handleCloseForm}
                disabled={loading}
              >
                <i className="bi bi-x-circle me-2"></i>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bang du lieu */}
      <div className="table-responsive department-table">
        <table className="table table-hover align-middle">
          <thead className="table-primary">
            <tr>
              <th width="80" className="text-center">
                STT
              </th>
              <th>Tên Khoa</th>
              <th>Mô tả</th>
              <th width="120" className="text-center">
                Ngày tạo
              </th>
              <th width="120" className="text-center">
                Số Bác sĩ
              </th>
              <th width="150" className="text-center">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredDepartments.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-5">
                  <div className="empty-state">
                    <i className="bi bi-hospital display-4 text-muted mb-3"></i>
                    <p className="text-muted mb-0 fs-5">
                      {searchTerm
                        ? `Không tìm thấy khoa nào với từ khóa: "${searchTerm}"`
                        : "Không có khoa nào"}
                    </p>
                    {searchTerm && (
                      <button
                        className="btn btn-link mt-2"
                        onClick={() => setSearchTerm("")}
                      >
                        Xóa tìm kiếm
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredDepartments.map((dept, index) => {
                const doctorCount = getDoctorCount(dept.id);
                return (
                  <tr key={dept.id}>
                    <td className="text-center fw-bold text-primary">
                      {index + 1}
                    </td>
                    <td>
                      <strong className="fs-6 text-dark">
                        {dept.departmentName}
                      </strong>
                    </td>
                    <td>
                      <div className="description-cell">
                        {dept.description || (
                          <span className="text-muted fst-italic">
                            Chưa có mô tả
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="text-muted small">
                        {dept.createdAt
                          ? new Date(dept.createdAt).toLocaleDateString("vi-VN")
                          : "N/A"}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge ${
                          doctorCount > 0 ? "bg-success" : "bg-secondary"
                        } fs-6 px-3 py-2`}
                      >
                        {doctorCount} bác sĩ
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="btn btn-sm btn-primary d-flex align-items-center px-3"
                          onClick={() => handleEditDepartment(dept)}
                          disabled={loading}
                        >
                          <i className="bi bi-pencil me-1"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-danger d-flex align-items-center px-3"
                          onClick={() => deleteDepartment(dept.id)}
                          disabled={loading}
                        >
                          <i className="bi bi-trash me-1"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DepartmentManagement;
