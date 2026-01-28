import React, { useState, useEffect, useRef } from "react";
import "../../css/AdminUsers.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    role: "PATIENT",
    username: "",
    password: "",
    fullName: "",
    phone: "",
    email: "",
    dob: "",
    address: "",
    symptoms: "",
    bhyt: "",
    relativeName: "",
    relativePhone: "",
    relativeAddress: "",
    relativeRelationship: "",
    dateOfBirth: "",
    gender: "MALE",
    citizenId: "",
    degree: "",
    position: "",
    departmentId: "",
    roomNumber: "",
    floor: "",
  });

  const getToken = () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) return null;
      const user = JSON.parse(userData);
      return user?.token;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, activeTab, users, patients, doctors]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchPatients(), fetchDoctors()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch("http://localhost:8080/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(
        "http://localhost:8080/api/admin/users/patients",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(
        "http://localhost:8080/api/admin/users/doctors",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      setDepartmentsError("");
      const token = getToken();
      if (!token) return;

      const response = await fetch(
        "http://localhost:8080/api/admin/users/departments",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      } else {
        setDepartmentsError("Không thể tải danh sách khoa");
      }
    } catch {
      setDepartmentsError("Lỗi khi tải danh sách khoa");
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const filterData = () => {
    if (!searchTerm.trim()) {
      switch (activeTab) {
        case "users":
          setFilteredData(users);
          break;
        case "patients":
          setFilteredData(patients);
          break;
        case "doctors":
          setFilteredData(doctors);
          break;
        default:
          setFilteredData(users);
      }
      return;
    }

    const normalizedSearch = searchTerm.toLowerCase().trim();
    let dataToFilter = [];

    switch (activeTab) {
      case "users":
        dataToFilter = users;
        break;
      case "patients":
        dataToFilter = patients;
        break;
      case "doctors":
        dataToFilter = doctors;
        break;
      default:
        dataToFilter = users;
    }

    const filtered = dataToFilter.filter((item) => {
      if (activeTab === "users") {
        return (
          item.username?.toLowerCase().includes(normalizedSearch) ||
          item.fullName?.toLowerCase().includes(normalizedSearch) ||
          item.email?.toLowerCase().includes(normalizedSearch) ||
          item.phone?.toLowerCase().includes(normalizedSearch)
        );
      } else if (activeTab === "patients") {
        return (
          item.fullName?.toLowerCase().includes(normalizedSearch) ||
          item.email?.toLowerCase().includes(normalizedSearch) ||
          item.phone?.toLowerCase().includes(normalizedSearch) ||
          item.bhyt?.toLowerCase().includes(normalizedSearch)
        );
      } else if (activeTab === "doctors") {
        return (
          item.fullName?.toLowerCase().includes(normalizedSearch) ||
          item.email?.toLowerCase().includes(normalizedSearch) ||
          item.phone?.toLowerCase().includes(normalizedSearch) ||
          item.degree?.toLowerCase().includes(normalizedSearch) ||
          item.position?.toLowerCase().includes(normalizedSearch) ||
          item.departmentName?.toLowerCase().includes(normalizedSearch)
        );
      }
      return false;
    });

    setFilteredData(filtered);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    // Map data based on role
    if (activeTab === "users") {
      setFormData({
        role: user.role || "PATIENT",
        username: user.username || "",
        password: "",
        fullName: user.fullName || "",
        phone: user.phone || "",
        email: user.email || "",
      });
    } else if (activeTab === "patients") {
      setFormData({
        role: "PATIENT",
        username: user.user?.username || "",
        password: "",
        fullName: user.fullName || "",
        phone: user.phone || "",
        email: user.email || "",
        dob: user.dob || "",
        address: user.address || "",
        symptoms: user.symptoms || "",
        bhyt: user.bhyt || "",
        relativeName: user.relativeName || "",
        relativePhone: user.relativePhone || "",
        relativeAddress: user.relativeAddress || "",
        relativeRelationship: user.relativeRelationship || "",
      });
    } else if (activeTab === "doctors") {
      setFormData({
        role: "DOCTOR",
        username: user.username || "",
        password: "",
        fullName: user.fullName || "",
        phone: user.phone || "",
        email: user.email || "",
        dateOfBirth: user.dateOfBirth || "",
        gender: user.gender || "MALE",
        citizenId: user.citizenId || "",
        address: user.address || "",
        degree: user.degree || "",
        position: user.position || "",
        departmentId: user.departmentId || "",
        roomNumber: user.roomNumber || "",
        floor: user.floor || "",
      });
    }
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleAddUser = async () => {
    if (!formData.username || !formData.password || !formData.fullName) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc (*)");
      return;
    }

    if (formData.role === "DOCTOR" && !formData.departmentId) {
      alert("Vui lòng chọn khoa cho bác sĩ");
      return;
    }

    setFormLoading(true);
    try {
      const token = getToken();
      if (!token) {
        alert("Vui lòng đăng nhập lại");
        return;
      }

      let endpoint = "";
      let requestData = {};
      let method = editingUser ? "PUT" : "POST";

      if (formData.role === "PATIENT") {
        endpoint = editingUser
          ? `http://localhost:8080/api/admin/users/patients/${editingUser.id}`
          : "http://localhost:8080/api/admin/users/patients";

        requestData = {
          username: formData.username,
          password: formData.password,
          full_name: formData.fullName,
          dob: formData.dob,
          phone: formData.phone,
          address: formData.address,
          email: formData.email,
          symptoms: formData.symptoms,
          bhyt: formData.bhyt,
          relative_name: formData.relativeName,
          relative_phone: formData.relativePhone,
          relative_address: formData.relativeAddress,
          relative_relationship: formData.relativeRelationship,
        };
      } else if (formData.role === "DOCTOR") {
        endpoint = editingUser
          ? `http://localhost:8080/api/admin/users/doctors/${editingUser.id}`
          : "http://localhost:8080/api/admin/users/doctors";

        requestData = {
          username: formData.username,
          password: formData.password,
          full_name: formData.fullName,
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender,
          citizen_id: formData.citizenId,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          department_id: parseInt(formData.departmentId),
          degree: formData.degree,
          position: formData.position,
          room_number: formData.roomNumber,
          floor: formData.floor,
        };
      } else if (formData.role === "ADMIN") {
        endpoint = editingUser
          ? `http://localhost:8080/api/admin/users/${editingUser.id}`
          : "http://localhost:8080/api/admin/users";

        requestData = {
          username: formData.username,
          password: formData.password,
          role: "ADMIN",
          phone: formData.phone,
          email: formData.email,
          full_name: formData.fullName,
        };
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        fetchAllData();
        setShowForm(false);
        resetForm();
        alert(`✅ ${editingUser ? "Cập nhật" : "Thêm"} người dùng thành công!`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Có lỗi xảy ra");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;

    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(
        `http://localhost:8080/api/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        fetchAllData();
        alert("✅ Xóa người dùng thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi xóa người dùng");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      role: "PATIENT",
      username: "",
      password: "",
      fullName: "",
      phone: "",
      email: "",
      dob: "",
      address: "",
      symptoms: "",
      bhyt: "",
      relativeName: "",
      relativePhone: "",
      relativeAddress: "",
      relativeRelationship: "",
      dateOfBirth: "",
      gender: "MALE",
      citizenId: "",
      degree: "",
      position: "",
      departmentId: "",
      roomNumber: "",
      floor: "",
    });
    setEditingUser(null);
  };

  const handleShowAddForm = () => {
    setEditingUser(null);
    resetForm();
    if (formData.role === "DOCTOR") {
      fetchDepartments();
    }
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

  const renderFormByRole = () => {
    switch (formData.role) {
      case "PATIENT":
        return (
          <>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Ngày sinh</label>
                <input
                  type="date"
                  className="form-control form-control-lg"
                  value={formData.dob}
                  onChange={(e) =>
                    setFormData({ ...formData, dob: e.target.value })
                  }
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Địa chỉ</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Địa chỉ hiện tại"
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Triệu chứng</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.symptoms}
                  onChange={(e) =>
                    setFormData({ ...formData, symptoms: e.target.value })
                  }
                  placeholder="Mô tả triệu chứng (nếu có)"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">BHYT</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.bhyt}
                  onChange={(e) =>
                    setFormData({ ...formData, bhyt: e.target.value })
                  }
                  placeholder="Số thẻ BHYT"
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">
                  Họ tên người thân
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.relativeName}
                  onChange={(e) =>
                    setFormData({ ...formData, relativeName: e.target.value })
                  }
                  placeholder="Họ tên người thân"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">SĐT người thân</label>
                <input
                  type="tel"
                  className="form-control form-control-lg"
                  value={formData.relativePhone}
                  onChange={(e) =>
                    setFormData({ ...formData, relativePhone: e.target.value })
                  }
                  placeholder="Số điện thoại người thân"
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">
                  Địa chỉ người thân
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.relativeAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      relativeAddress: e.target.value,
                    })
                  }
                  placeholder="Địa chỉ người thân"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Quan hệ</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.relativeRelationship}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      relativeRelationship: e.target.value,
                    })
                  }
                  placeholder="VD: Vợ, chồng, con, cha, mẹ..."
                />
              </div>
            </div>
          </>
        );

      case "DOCTOR":
        return (
          <>
            <div className="row">
              <div className="col-md-6 mb-3">
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
              <div className="col-md-6 mb-3">
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
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">CCCD/CMND</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.citizenId}
                  onChange={(e) =>
                    setFormData({ ...formData, citizenId: e.target.value })
                  }
                  placeholder="Số CCCD/CMND"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Địa chỉ</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Địa chỉ liên hệ"
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">
                  Học vị <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.degree}
                  onChange={(e) =>
                    setFormData({ ...formData, degree: e.target.value })
                  }
                  placeholder="VD: Thạc sĩ, Tiến sĩ, Bác sĩ CKII..."
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">
                  Chức vụ <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  placeholder="VD: Trưởng khoa, Phó khoa, Bác sĩ trưởng..."
                  required
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">
                  Khoa <span className="text-danger">*</span>
                </label>
                {departmentsLoading ? (
                  <div className="alert alert-info">
                    Đang tải danh sách khoa...
                  </div>
                ) : departmentsError ? (
                  <div className="alert alert-danger">{departmentsError}</div>
                ) : (
                  <select
                    className="form-select form-select-lg"
                    value={formData.departmentId}
                    onChange={(e) =>
                      setFormData({ ...formData, departmentId: e.target.value })
                    }
                    required
                  >
                    <option value="">Chọn khoa</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Số phòng</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.roomNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, roomNumber: e.target.value })
                  }
                  placeholder="VD: 101, 201..."
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Tầng</label>
                <input
                  type="number"
                  className="form-control form-control-lg"
                  value={formData.floor}
                  onChange={(e) =>
                    setFormData({ ...formData, floor: e.target.value })
                  }
                  placeholder="VD: 1, 2, 3..."
                />
              </div>
            </div>
          </>
        );

      case "ADMIN":
        return (
          <div className="alert alert-warning">
            <i className="bi bi-shield-check me-2"></i>
            <strong>Quyền Quản trị viên:</strong>
            <span className="ms-2">
              Tài khoản này sẽ có toàn quyền quản lý hệ thống
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "PATIENT":
        return "Bệnh nhân";
      case "DOCTOR":
        return "Bác sĩ";
      case "ADMIN":
        return "Quản trị viên";
      default:
        return role;
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "PATIENT":
        return "badge bg-success";
      case "DOCTOR":
        return "badge bg-primary";
      case "ADMIN":
        return "badge bg-danger";
      default:
        return "badge bg-secondary";
    }
  };

  return (
    <div className="admin-users">
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
                    placeholder="Tìm kiếm người dùng..."
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
                    Tìm thấy <strong>{filteredData.length}</strong>{" "}
                    {activeTab === "users"
                      ? "người dùng"
                      : activeTab === "patients"
                        ? "bệnh nhân"
                        : "bác sĩ"}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="col-12 col-lg-6 text-lg-end">
                <div className="d-flex gap-3 justify-content-lg-end justify-content-start flex-wrap">
                  <button
                    className="btn btn-success btn-lg px-5 d-flex align-items-center gap-2 shadow-sm"
                    onClick={handleShowAddForm}
                    disabled={loading}
                  >
                    <i className="bi bi-plus-circle"></i>
                    Thêm Người dùng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex gap-2">
            <button
              className={`btn ${
                activeTab === "users" ? "btn-primary" : "btn-outline-primary"
              } btn-lg px-4`}
              onClick={() => setActiveTab("users")}
            >
              <i className="bi bi-people me-2"></i>
              Tất cả ({users.length})
            </button>
            <button
              className={`btn ${
                activeTab === "patients" ? "btn-primary" : "btn-outline-primary"
              } btn-lg px-4`}
              onClick={() => setActiveTab("patients")}
            >
              <i className="bi bi-person-vcard me-2"></i>
              Bệnh nhân ({patients.length})
            </button>
            <button
              className={`btn ${
                activeTab === "doctors" ? "btn-primary" : "btn-outline-primary"
              } btn-lg px-4`}
              onClick={() => setActiveTab("doctors")}
            >
              <i className="bi bi-person-heart me-2"></i>
              Bác sĩ ({doctors.length})
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="add-form card mb-4" ref={formRef}>
          <div className="card-header bg-primary text-white d-flex align-items-center">
            <i
              className={`bi ${
                editingUser ? "bi-pencil-square" : "bi-plus-circle"
              } me-2 fs-4`}
            ></i>
            <h5 className="mb-0">
              {editingUser ? "Sửa thông tin" : "Thêm"}{" "}
              {getRoleLabel(formData.role)}
            </h5>
          </div>
          <div className="card-body">
            <div className="row mb-4">
              <div className="col-12">
                <label className="form-label fw-medium">Loại người dùng</label>
                <div className="d-flex gap-3">
                  <button
                    type="button"
                    className={`btn ${
                      formData.role === "PATIENT"
                        ? "btn-success"
                        : "btn-outline-success"
                    } btn-lg flex-grow-1`}
                    onClick={() => {
                      setFormData({ ...formData, role: "PATIENT" });
                      if (formData.role === "DOCTOR") {
                        fetchDepartments();
                      }
                    }}
                  >
                    <i className="bi bi-person-vcard me-2"></i>
                    Bệnh nhân
                  </button>
                  <button
                    type="button"
                    className={`btn ${
                      formData.role === "DOCTOR"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    } btn-lg flex-grow-1`}
                    onClick={() => {
                      setFormData({ ...formData, role: "DOCTOR" });
                      fetchDepartments();
                    }}
                  >
                    <i className="bi bi-person-heart me-2"></i>
                    Bác sĩ
                  </button>
                  <button
                    type="button"
                    className={`btn ${
                      formData.role === "ADMIN"
                        ? "btn-danger"
                        : "btn-outline-danger"
                    } btn-lg flex-grow-1`}
                    onClick={() => setFormData({ ...formData, role: "ADMIN" })}
                  >
                    <i className="bi bi-shield-check me-2"></i>
                    Quản trị viên
                  </button>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">
                  Tên đăng nhập <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="Nhập tên đăng nhập"
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">
                  {editingUser ? "Mật khẩu mới" : "Mật khẩu"}{" "}
                  {!editingUser && <span className="text-danger">*</span>}
                </label>
                <input
                  type="password"
                  className="form-control form-control-lg"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={
                    editingUser ? "Để trống nếu không đổi" : "Nhập mật khẩu"
                  }
                  required={!editingUser}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">
                  Họ tên <span className="text-danger">*</span>
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

              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Email</label>
                <input
                  type="email"
                  className="form-control form-control-lg"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Nhập email"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Số điện thoại</label>
                <input
                  type="tel"
                  className="form-control form-control-lg"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>

            {/* Role-specific fields */}
            {renderFormByRole()}

            <div className="d-flex gap-2 mt-4">
              <button
                className="btn btn-primary btn-lg d-flex align-items-center px-4"
                onClick={handleAddUser}
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    {editingUser ? "Cập nhật" : "Lưu"} Người dùng
                  </>
                )}
              </button>
              <button
                className="btn btn-outline-secondary btn-lg d-flex align-items-center px-4"
                onClick={handleCloseForm}
                disabled={formLoading}
              >
                <i className="bi bi-x-circle me-2"></i>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-responsive admin-users-table">
        <table className="table table-hover align-middle">
          <thead className="table-primary">
            <tr>
              <th width="60" className="text-center">
                STT
              </th>
              {activeTab === "users" ? (
                <>
                  <th>Tên đăng nhập</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Vai trò</th>
                </>
              ) : activeTab === "patients" ? (
                <>
                  <th>Họ tên</th>
                  <th>Ngày sinh</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Địa chỉ</th>
                  <th>BHYT</th>
                  <th>Triệu chứng</th>
                </>
              ) : (
                <>
                  <th>Họ tên</th>
                  <th>Khoa</th>
                  <th>Học vị</th>
                  <th>Chức vụ</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Phòng</th>
                </>
              )}
              <th width="150" className="text-center">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={
                    activeTab === "users" ? 7 : activeTab === "patients" ? 8 : 8
                  }
                  className="text-center py-5"
                >
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    activeTab === "users" ? 7 : activeTab === "patients" ? 8 : 8
                  }
                  className="text-center py-5"
                >
                  <div className="empty-state">
                    <i className="bi bi-person-x display-4 text-muted mb-3"></i>
                    <p className="text-muted mb-0 fs-5">
                      {searchTerm
                        ? `Không tìm thấy ${
                            activeTab === "users"
                              ? "người dùng"
                              : activeTab === "patients"
                                ? "bệnh nhân"
                                : "bác sĩ"
                          } nào với từ khóa: "${searchTerm}"`
                        : `Không có ${
                            activeTab === "users"
                              ? "người dùng"
                              : activeTab === "patients"
                                ? "bệnh nhân"
                                : "bác sĩ"
                          } nào`}
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
              filteredData.map((item, index) => (
                <tr key={item.id}>
                  <td className="text-center fw-bold text-primary">
                    {index + 1}
                  </td>

                  {activeTab === "users" ? (
                    <>
                      <td>
                        <strong className="fs-6 text-dark">
                          {item.username}
                        </strong>
                      </td>
                      <td>
                        <span className="text-dark">
                          {item.fullName || "N/A"}
                        </span>
                      </td>
                      <td>
                        <span className="text-muted">{item.email}</span>
                      </td>
                      <td>
                        <span className="text-dark">{item.phone || "N/A"}</span>
                      </td>
                      <td>
                        <span className={getRoleBadgeClass(item.role)}>
                          {getRoleLabel(item.role)}
                        </span>
                      </td>
                    </>
                  ) : activeTab === "patients" ? (
                    <>
                      <td>
                        <strong className="fs-6 text-dark">
                          {item.fullName}
                        </strong>
                      </td>
                      <td>
                        <span className="text-dark">
                          {item.dob
                            ? new Date(item.dob).toLocaleDateString("vi-VN")
                            : "N/A"}
                        </span>
                      </td>
                      <td>
                        <span className="text-muted">{item.email}</span>
                      </td>
                      <td>
                        <span className="text-dark">{item.phone}</span>
                      </td>
                      <td>
                        <span className="text-muted small">
                          {item.address || "N/A"}
                        </span>
                      </td>
                      <td>
                        <span className="text-dark">{item.bhyt || "N/A"}</span>
                      </td>
                      <td>
                        <span className="text-muted small">
                          {item.symptoms || "N/A"}
                        </span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <strong className="fs-6 text-dark">
                          {item.fullName}
                        </strong>
                      </td>
                      <td>
                        <span className="text-muted">
                          {item.departmentName ||
                            (item.department &&
                              item.department.departmentName) ||
                            "N/A"}
                        </span>
                      </td>
                      <td>
                        <span className="text-dark">
                          {item.degree || "N/A"}
                        </span>
                      </td>
                      <td>
                        <span className="text-dark">
                          {item.position || "N/A"}
                        </span>
                      </td>
                      <td>
                        <span className="text-muted small">{item.email}</span>
                      </td>
                      <td>
                        <span className="text-dark">{item.phone}</span>
                      </td>
                      <td>
                        <span className="text-dark">
                          {item.roomNumber ? `P.${item.roomNumber}` : "N/A"}
                          {item.floor && ` (Tầng ${item.floor})`}
                        </span>
                      </td>
                    </>
                  )}

                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <button
                        className="btn btn-sm btn-primary d-flex align-items-center px-3"
                        onClick={() => handleEditUser(item)}
                        disabled={formLoading}
                        title="Sửa thông tin"
                      >
                        <i className="bi bi-pencil me-1"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-danger d-flex align-items-center px-3"
                        onClick={() =>
                          deleteUser(item.user?.id || item.id || item.userId)
                        }
                        disabled={formLoading}
                        title="Xóa người dùng"
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

export default AdminUsers;
