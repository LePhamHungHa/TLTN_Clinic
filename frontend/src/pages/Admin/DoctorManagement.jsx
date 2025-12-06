import React, { useState, useRef } from "react";
import "../../css/DoctorManagement.css";

const DoctorManagement = ({
  doctors,
  departments,
  getDepartmentName,
  getGenderLabel,
  onRefresh,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState(null);

  // Thêm ref để scroll tới form
  const formRef = useRef(null);
  const importFormRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "MALE",
    citizenId: "",
    address: "",
    specialty: "",
    phone: "",
    email: "",
    departmentId: "",
    degree: "",
    position: "Bác sĩ",
    username: "",
    password: "",
    roomNumber: "",
    floor: "",
  });

  const specialtyOptions = [
    "Nội khoa",
    "Ngoại khoa",
    "Nhi khoa",
    "Sản phụ khoa",
    "Tai mũi họng",
    "Răng hàm mặt",
    "Da liễu",
    "Mắt",
    "Thần kinh",
    "Tim mạch",
    "Tiêu hóa",
    "Nội tiết",
    "Cơ xương khớp",
    "Ung bướu",
  ];

  const degreeOptions = [
    "Bác sĩ chuyên khoa I",
    "Bác sĩ chuyên khoa II",
    "Thạc sĩ",
    "Tiến sĩ",
    "Phó giáo sư",
    "Giáo sư",
  ];

  const positionOptions = [
    "Bác sĩ",
    "Trưởng khoa",
    "Phó khoa",
    "Bác sĩ trưởng",
    "Chuyên viên",
  ];

  // Hàm mở form chỉnh sửa với scroll
  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      fullName: doctor.fullName || "",
      dateOfBirth: doctor.dateOfBirth ? doctor.dateOfBirth.split("T")[0] : "",
      gender: doctor.gender || "MALE",
      citizenId: doctor.citizenId || "",
      address: doctor.address || "",
      specialty: doctor.specialty || "",
      phone: doctor.phone || "",
      email: doctor.email || "",
      departmentId: doctor.departmentId || "",
      degree: doctor.degree || "",
      position: doctor.position || "Bác sĩ",
      username: doctor.username || "",
      password: "",
      roomNumber: doctor.roomNumber || "",
      floor: doctor.floor || "",
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

  const handleAddDoctor = async () => {
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.specialty
    ) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const url = editingDoctor
        ? `http://localhost:8080/api/doctors/${editingDoctor.id}`
        : "http://localhost:8080/api/doctors/create";

      const method = editingDoctor ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          username: formData.username || formData.email.split("@")[0],
        }),
      });

      if (response.ok) {
        onRefresh();
        setShowForm(false);
        resetForm();
        setEditingDoctor(null);
        alert(`✅ ${editingDoctor ? "Cập nhật" : "Thêm"} bác sĩ thành công!`);
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Lỗi khi ${editingDoctor ? "cập nhật" : "thêm"} bác sĩ`
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

      const response = await fetch("http://localhost:8080/api/doctors/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        onRefresh();
        setShowImportForm(false);
        setImportFile(null);
        alert(result.message || "✅ Import bác sĩ thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi import");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  const deleteDoctor = async (doctorId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bác sĩ này?")) return;

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        `http://localhost:8080/api/doctors/${doctorId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        onRefresh();
        alert("✅ Xóa bác sĩ thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi xóa bác sĩ");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      dateOfBirth: "",
      gender: "MALE",
      citizenId: "",
      address: "",
      specialty: "",
      phone: "",
      email: "",
      departmentId: "",
      degree: "",
      position: "Bác sĩ",
      username: "",
      password: "",
      roomNumber: "",
      floor: "",
    });
    setEditingDoctor(null);
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
    setEditingDoctor(null);
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
    <div className="doctor-management">
      <div className="section-header">
        <h2>Quản lý Bác sĩ ({doctors.length})</h2>
        <div className="action-buttons">
          <button className="warning-button" onClick={handleShowImportForm}>
            📤 Import từ Excel
          </button>
          <button className="primary-button" onClick={handleShowAddForm}>
            👨‍⚕️ {editingDoctor ? "Sửa" : "Thêm"} Bác sĩ
          </button>
        </div>
      </div>

      {/* Import Form - Thêm ref */}
      {showImportForm && (
        <div className="import-form" ref={importFormRef}>
          <h3>📤 Import Bác sĩ từ Excel</h3>
          <div className="form-content">
            <p>
              <strong>Lưu ý:</strong> File Excel cần theo đúng định dạng mẫu
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
                📤 Import Bác sĩ
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
          <h3>{editingDoctor ? "Sửa thông tin Bác sĩ" : "Thêm Bác sĩ mới"}</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Họ và tên *:</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
              />
            </div>
            <div className="form-field">
              <label>Ngày sinh:</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label>Giới tính:</label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <div className="form-field">
              <label>Email *:</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="form-field">
              <label>SĐT *:</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
              />
            </div>
            <div className="form-field">
              <label>Chuyên khoa *:</label>
              <select
                value={formData.specialty}
                onChange={(e) =>
                  setFormData({ ...formData, specialty: e.target.value })
                }
                required
              >
                <option value="">Chọn chuyên khoa</option>
                {specialtyOptions.map((spec, idx) => (
                  <option key={idx} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Khoa:</label>
              <select
                value={formData.departmentId}
                onChange={(e) =>
                  setFormData({ ...formData, departmentId: e.target.value })
                }
              >
                <option value="">Chọn khoa</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.departmentName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Bằng cấp:</label>
              <select
                value={formData.degree}
                onChange={(e) =>
                  setFormData({ ...formData, degree: e.target.value })
                }
              >
                <option value="">Chọn bằng cấp</option>
                {degreeOptions.map((deg, idx) => (
                  <option key={idx} value={deg}>
                    {deg}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Vị trí:</label>
              <select
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
              >
                {positionOptions.map((pos, idx) => (
                  <option key={idx} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Username:</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label>Mật khẩu:</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder={editingDoctor ? "Để trống nếu không đổi" : ""}
              />
            </div>
            <div className="form-field">
              <label>Số phòng:</label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={(e) =>
                  setFormData({ ...formData, roomNumber: e.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label>Tầng:</label>
              <input
                type="text"
                value={formData.floor}
                onChange={(e) =>
                  setFormData({ ...formData, floor: e.target.value })
                }
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="success-button" onClick={handleAddDoctor}>
              💾 {editingDoctor ? "Cập nhật" : "Lưu"} Bác sĩ
            </button>
            <button className="danger-button" onClick={handleCloseForm}>
              ❌ Hủy
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {doctors.length === 0 ? (
        <div className="empty-state">
          <p>Không có bác sĩ nào. Hãy thêm bác sĩ mới hoặc import từ Excel!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Giới tính</th>
                <th>Chuyên khoa</th>
                <th>Khoa</th>
                <th>SĐT</th>
                <th>Email</th>
                <th>Bằng cấp</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td>
                    <strong>{doctor.fullName}</strong>
                  </td>
                  <td>{getGenderLabel(doctor.gender)}</td>
                  <td>{doctor.specialty}</td>
                  <td>{getDepartmentName(doctor.departmentId)}</td>
                  <td>{doctor.phone}</td>
                  <td>{doctor.email}</td>
                  <td>{doctor.degree || "N/A"}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="edit-button"
                        onClick={() => handleEditDoctor(doctor)}
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => deleteDoctor(doctor.id)}
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

export default DoctorManagement;
