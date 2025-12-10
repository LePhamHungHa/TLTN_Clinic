import React, { useState, useRef, useEffect } from "react";
import "../../css/DoctorManagement.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

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
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState([]);

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

  // Function to normalize search term
  const normalizeText = (text) => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  };

  // Update filtered doctors whenever searchTerm or doctors change
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDoctors(doctors);
      return;
    }

    const normalizedSearch = normalizeText(searchTerm);

    const filtered = doctors.filter((doctor) => {
      const nameMatch = normalizeText(doctor.fullName || "").includes(
        normalizedSearch
      );
      const specialtyMatch = doctor.specialty
        ? normalizeText(doctor.specialty).includes(normalizedSearch)
        : false;
      const emailMatch = doctor.email
        ? normalizeText(doctor.email).includes(normalizedSearch)
        : false;
      const phoneMatch = doctor.phone
        ? normalizeText(doctor.phone).includes(normalizedSearch)
        : false;
      const departmentMatch = doctor.departmentId
        ? normalizeText(getDepartmentName(doctor.departmentId)).includes(
            normalizedSearch
          )
        : false;

      return (
        nameMatch ||
        specialtyMatch ||
        emailMatch ||
        phoneMatch ||
        departmentMatch
      );
    });

    setFilteredDoctors(filtered);
  }, [searchTerm, doctors, getDepartmentName]);

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
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleAddDoctor = async () => {
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.specialty.trim()
    ) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc (*)");
      return;
    }

    setLoading(true);
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
    const importFormData = new FormData();
    importFormData.append("file", importFile);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch("http://localhost:8080/api/doctors/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: importFormData,
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
    } finally {
      setLoading(false);
    }
  };

  const deleteDoctor = async (doctorId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bác sĩ này?")) return;

    setLoading(true);
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
    } finally {
      setLoading(false);
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

  const handleShowImportForm = () => {
    setShowImportForm(true);
    setTimeout(() => {
      importFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

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

  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleCloseImportForm = () => {
    setShowImportForm(false);
    setImportFile(null);
  };

  return (
    <div className="doctor-management">
      {/* Modern Search and Action Bar */}
      <div className="modern-search-bar mb-4">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <div className="row g-3 align-items-center">
              {/* Search Box */}
              <div className="col-12 col-lg-6">
                <div className="position-relative">
                  <span className="position-absolute top-50 start-0 translate-middle-y text-primary ms-3">
                    <i className="bi bi-search fs-5"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-lg ps-5"
                    placeholder="Tìm kiếm theo tên, chuyên khoa, số điện thoại..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-3 text-muted p-0"
                      onClick={() => setSearchTerm("")}
                      style={{ zIndex: 10 }}
                      title="Xóa tìm kiếm"
                    >
                      <i className="bi bi-x-circle fs-5"></i>
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <div className="mt-2 small text-muted">
                    Tìm thấy <strong>{filteredDoctors.length}</strong> bác sĩ
                    {filteredDoctors.length === 1 ? "" : ""}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="col-12 col-lg-6 text-lg-end">
                <div className="d-flex gap-3 justify-content-lg-end justify-content-start flex-wrap">
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
                    Thêm Bác sĩ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Form */}
      {showImportForm && (
        <div className="import-form card mb-4" ref={importFormRef}>
          <div className="card-header bg-success text-white d-flex align-items-center">
            <i className="bi bi-file-earmark-arrow-up me-2 fs-4"></i>
            <h5 className="mb-0">Import Bác sĩ từ Excel</h5>
          </div>
          <div className="card-body">
            <div className="alert alert-info mb-3">
              <strong>Lưu ý:</strong> File Excel cần có các cột:{" "}
              <code>Họ tên</code>, <code>Email</code>, <code>SĐT</code>,{" "}
              <code>Chuyên khoa</code>
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
                    Import Bác sĩ
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

      {/* Add/Edit Form */}
      {showForm && (
        <div className="add-form card mb-4" ref={formRef}>
          <div className="card-header bg-primary text-white d-flex align-items-center">
            <i
              className={`bi ${
                editingDoctor ? "bi-pencil-square" : "bi-plus-circle"
              } me-2 fs-4`}
            ></i>
            <h5 className="mb-0">
              {editingDoctor ? "Sửa thông tin Bác sĩ" : "Thêm Bác sĩ mới"}
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">
                  Họ và tên <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">Ngày sinh</label>
                <input
                  type="date"
                  className="form-control form-control-lg"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">Giới tính</label>
                <select
                  className="form-select form-select-lg"
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

              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className="form-control form-control-lg"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Nhập email"
                  required
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">
                  Số điện thoại <span className="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  className="form-control form-control-lg"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Nhập số điện thoại"
                  required
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">
                  Chuyên khoa <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select form-select-lg"
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

              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">Khoa</label>
                <select
                  className="form-select form-select-lg"
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

              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">Bằng cấp</label>
                <select
                  className="form-select form-select-lg"
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

              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">Vị trí</label>
                <select
                  className="form-select form-select-lg"
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

              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">Số phòng</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.roomNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, roomNumber: e.target.value })
                  }
                  placeholder="Số phòng"
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">Tầng</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.floor}
                  onChange={(e) =>
                    setFormData({ ...formData, floor: e.target.value })
                  }
                  placeholder="Tầng"
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">Username</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="Tự động tạo từ email nếu để trống"
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">
                  {editingDoctor ? "Mật khẩu mới" : "Mật khẩu"}
                </label>
                <input
                  type="password"
                  className="form-control form-control-lg"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={
                    editingDoctor ? "Để trống nếu không đổi" : "Nhập mật khẩu"
                  }
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label fw-medium">Địa chỉ</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Nhập địa chỉ"
                />
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-primary btn-lg d-flex align-items-center px-4"
                onClick={handleAddDoctor}
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
                    {editingDoctor ? "Cập nhật" : "Lưu"} Bác sĩ
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

      {/* Table */}
      <div className="table-responsive doctor-table">
        <table className="table table-hover align-middle">
          <thead className="table-primary">
            <tr>
              <th width="60" className="text-center">
                STT
              </th>
              <th>Họ tên</th>
              <th width="100" className="text-center">
                Giới tính
              </th>
              <th>Chuyên khoa</th>
              <th>Khoa</th>
              <th>SĐT</th>
              <th>Email</th>
              <th width="150">Bằng cấp</th>
              <th width="150" className="text-center">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredDoctors.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-5">
                  <div className="empty-state">
                    <i className="bi bi-person-x display-4 text-muted mb-3"></i>
                    <p className="text-muted mb-0 fs-5">
                      {searchTerm
                        ? `Không tìm thấy bác sĩ nào với từ khóa: "${searchTerm}"`
                        : "Không có bác sĩ nào"}
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
              filteredDoctors.map((doctor, index) => (
                <tr key={doctor.id}>
                  <td className="text-center fw-bold text-primary">
                    {index + 1}
                  </td>
                  <td>
                    <strong className="fs-6 text-dark">
                      {doctor.fullName}
                    </strong>
                  </td>
                  <td className="text-center">
                    <span className="badge bg-info">
                      {getGenderLabel(doctor.gender)}
                    </span>
                  </td>
                  <td>
                    <span className="text-dark">{doctor.specialty}</span>
                  </td>
                  <td>
                    <span className="text-muted">
                      {getDepartmentName(doctor.departmentId) || "N/A"}
                    </span>
                  </td>
                  <td>
                    <span className="text-dark">{doctor.phone}</span>
                  </td>
                  <td>
                    <span className="text-muted small">{doctor.email}</span>
                  </td>
                  <td>
                    <span className="text-dark">{doctor.degree || "N/A"}</span>
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <button
                        className="btn btn-sm btn-primary d-flex align-items-center px-3"
                        onClick={() => handleEditDoctor(doctor)}
                        disabled={loading}
                        title="Sửa bác sĩ"
                      >
                        <i className="bi bi-pencil me-1"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-danger d-flex align-items-center px-3"
                        onClick={() => deleteDoctor(doctor.id)}
                        disabled={loading}
                        title="Xóa bác sĩ"
                      >
                        <i className="bi bi-trash me-1"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorManagement;
