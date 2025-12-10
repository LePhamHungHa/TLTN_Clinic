import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../css/AdminUsers.css";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form states
  const [userForm, setUserForm] = useState({
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
      if (!userData) {
        console.error("❌ Không tìm thấy user data");
        return null;
      }
      const user = JSON.parse(userData);
      return user?.token;
    } catch (error) {
      console.error("❌ Lỗi khi lấy token:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = getToken();
      if (!token) {
        alert("⚠️ Vui lòng đăng nhập lại");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        "http://localhost:8080/api/admin/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Users data:", response.data);
      setUsers(response.data);
    } catch (error) {
      console.error("Lỗi tải danh sách người dùng:", error);
      if (error.response?.status === 403) {
        setError("Bạn không có quyền ADMIN để truy cập tính năng này");
      } else if (error.response?.status === 401) {
        alert("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại");
      } else {
        setError("Không thể tải danh sách người dùng: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.get(
        "http://localhost:8080/api/admin/users/patients",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Patients data:", response.data);
      setPatients(response.data);
    } catch (error) {
      console.error("❌ Lỗi tải danh sách bệnh nhân:", error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.get(
        "http://localhost:8080/api/admin/users/doctors",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Doctors data with departments:", response.data);

      // Debug chi tiết từng doctor
      response.data.forEach((doctor) => {
        console.log(
          `🔍 Doctor: ${doctor.fullName}, 
          Dept ID: ${doctor.departmentId}, 
          Dept Object:`,
          doctor.department,
          `Dept Name: ${doctor.departmentName}`
        );
      });

      setDoctors(response.data);
    } catch (error) {
      console.error("❌ Lỗi tải danh sách bác sĩ:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      setDepartmentsError("");
      const token = getToken();
      if (!token) {
        setDepartmentsError("Không có token, vui lòng đăng nhập lại");
        return;
      }

      console.log("🔄 Đang tải danh sách khoa...");

      const response = await axios.get(
        "http://localhost:8080/api/admin/users/departments",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Danh sách khoa:", response.data);
      setDepartments(response.data);

      if (response.data.length === 0) {
        console.warn("⚠️ Danh sách khoa trống");
        setDepartmentsError("Không có khoa nào trong hệ thống");
      }
    } catch (error) {
      console.error("❌ Lỗi tải danh sách khoa:", error);
      setDepartmentsError(
        "Không thể tải danh sách khoa: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const refreshData = () => {
    setLoading(true);
    setError("");
    fetchUsers();
    fetchPatients();
    fetchDoctors();
  };

  // Filter data based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPatients = patients.filter(
    (patient) =>
      patient.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.departmentName &&
        doctor.departmentName
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (doctor.department &&
        doctor.department.departmentName &&
        doctor.department.departmentName
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      doctor.degree?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form changes
  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Get department name by ID
  const getDepartmentName = (departmentId) => {
    if (!departmentId) return "N/A";
    const department = departments.find((dept) => dept.id === departmentId);
    return department ? department.departmentName : "N/A";
  };

  // Create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      if (!token) return;

      // Kiểm tra các trường bắt buộc
      if (!userForm.username || !userForm.password || !userForm.fullName) {
        setError("Vui lòng điền đầy đủ thông tin bắt buộc (*)");
        return;
      }

      if (userForm.role === "DOCTOR" && !userForm.departmentId) {
        setError("Vui lòng chọn khoa cho bác sĩ");
        return;
      }

      let requestData = {};
      let endpoint = "";

      if (userForm.role === "PATIENT") {
        requestData = {
          username: userForm.username,
          password: userForm.password,
          full_name: userForm.fullName,
          dob: userForm.dob,
          phone: userForm.phone,
          address: userForm.address,
          email: userForm.email,
          symptoms: userForm.symptoms,
          bhyt: userForm.bhyt,
          relative_name: userForm.relativeName,
          relative_phone: userForm.relativePhone,
          relative_address: userForm.relativeAddress,
          relative_relationship: userForm.relativeRelationship,
        };
        endpoint = "http://localhost:8080/api/admin/users/patients";
      } else if (userForm.role === "DOCTOR") {
        requestData = {
          username: userForm.username,
          password: userForm.password,
          full_name: userForm.fullName,
          date_of_birth: userForm.dateOfBirth,
          gender: userForm.gender,
          citizen_id: userForm.citizenId,
          address: userForm.address,
          phone: userForm.phone,
          email: userForm.email,
          department_id: parseInt(userForm.departmentId),
          degree: userForm.degree,
          position: userForm.position,
          room_number: userForm.roomNumber,
          floor: userForm.floor,
        };
        endpoint = "http://localhost:8080/api/admin/users/doctors";
      } else if (userForm.role === "ADMIN") {
        requestData = {
          username: userForm.username,
          password: userForm.password,
          role: "ADMIN",
          phone: userForm.phone,
          email: userForm.email,
          full_name: userForm.fullName,
        };
        endpoint = "http://localhost:8080/api/admin/users";
      }

      console.log("📤 Gửi data tạo user:", requestData);
      console.log("🎯 Endpoint:", endpoint);

      const response = await axios.post(endpoint, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Tạo user thành công:", response.data);

      setShowUserModal(false);
      // Reset form
      setUserForm({
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

      refreshData();
      setError("");

      const roleName =
        userForm.role === "ADMIN"
          ? "admin"
          : userForm.role === "DOCTOR"
          ? "bác sĩ"
          : "bệnh nhân";
      alert(`✅ Tạo ${roleName} thành công!`);
    } catch (error) {
      console.error("❌ Lỗi tạo người dùng:", error);
      console.log("📝 Chi tiết lỗi:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      // Hiển thị lỗi chi tiết từ backend
      const errorMessage = error.response?.data || error.message;
      setError(`Lỗi khi tạo người dùng: ${JSON.stringify(errorMessage)}`);
      alert(`❌ Lỗi: ${JSON.stringify(errorMessage)}`);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      try {
        const token = getToken();
        if (!token) return;

        await axios.delete(`http://localhost:8080/api/admin/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        refreshData();
        setError("");
        alert("✅ Xóa người dùng thành công!");
      } catch (error) {
        console.error("❌ Lỗi xóa người dùng:", error);
        setError("Lỗi khi xóa người dùng: " + error.message);
      }
    }
  };

  // Open user modal and fetch departments nếu cần
  const handleOpenUserModal = async () => {
    setShowUserModal(true);
    setError("");

    setUserForm({
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

    // Load departments nếu là doctor
    await fetchDepartments();
  };

  // Render form theo role
  const renderFormByRole = () => {
    switch (userForm.role) {
      case "PATIENT":
        return (
          <>
            <div className="admin-users-form-section">
              <h3 className="admin-users-form-section-title">
                Thông tin cá nhân
              </h3>
              <div className="admin-users-form-row">
                <div className="admin-users-form-group">
                  <label className="admin-users-form-label">Ngày sinh</label>
                  <input
                    type="date"
                    name="dob"
                    value={userForm.dob}
                    onChange={handleUserFormChange}
                    className="admin-users-form-input"
                  />
                </div>
                <div className="admin-users-form-group">
                  <label className="admin-users-form-label">Địa chỉ</label>
                  <input
                    type="text"
                    name="address"
                    value={userForm.address}
                    onChange={handleUserFormChange}
                    placeholder="Địa chỉ hiện tại"
                    className="admin-users-form-input"
                  />
                </div>
              </div>
              <div className="admin-users-form-row">
                <div className="admin-users-form-group">
                  <label className="admin-users-form-label">Triệu chứng</label>
                  <input
                    type="text"
                    name="symptoms"
                    value={userForm.symptoms}
                    onChange={handleUserFormChange}
                    placeholder="Mô tả triệu chứng (nếu có)"
                    className="admin-users-form-input"
                  />
                </div>
                <div className="admin-users-form-group">
                  <label className="admin-users-form-label">BHYT</label>
                  <input
                    type="text"
                    name="bhyt"
                    value={userForm.bhyt}
                    onChange={handleUserFormChange}
                    placeholder="Số thẻ BHYT"
                    className="admin-users-form-input"
                  />
                </div>
              </div>
            </div>

            <div className="admin-users-form-section">
              <h3 className="admin-users-form-section-title">
                Thông tin người thân
              </h3>
              <div className="admin-users-form-row">
                <div className="admin-users-form-group">
                  <label className="admin-users-form-label">
                    Họ tên người thân
                  </label>
                  <input
                    type="text"
                    name="relativeName"
                    value={userForm.relativeName}
                    onChange={handleUserFormChange}
                    placeholder="Họ tên người thân"
                    className="admin-users-form-input"
                  />
                </div>
                <div className="admin-users-form-group">
                  <label className="admin-users-form-label">
                    SĐT người thân
                  </label>
                  <input
                    type="tel"
                    name="relativePhone"
                    value={userForm.relativePhone}
                    onChange={handleUserFormChange}
                    placeholder="Số điện thoại người thân"
                    className="admin-users-form-input"
                  />
                </div>
              </div>
              <div className="admin-users-form-row">
                <div className="admin-users-form-group">
                  <label className="admin-users-form-label">
                    Địa chỉ người thân
                  </label>
                  <input
                    type="text"
                    name="relativeAddress"
                    value={userForm.relativeAddress}
                    onChange={handleUserFormChange}
                    placeholder="Địa chỉ người thân"
                    className="admin-users-form-input"
                  />
                </div>
                <div className="admin-users-form-group">
                  <label className="admin-users-form-label">Quan hệ</label>
                  <input
                    type="text"
                    name="relativeRelationship"
                    value={userForm.relativeRelationship}
                    onChange={handleUserFormChange}
                    placeholder="VD: Vợ, chồng, con, cha, mẹ..."
                    className="admin-users-form-input"
                  />
                </div>
              </div>
            </div>
          </>
        );

      case "DOCTOR":
        return (
          <>
            <div className="admin-users-form-section">
              <h3 className="admin-users-form-section-title">
                Thông tin cá nhân
              </h3>
              <div className="admin-users-form-row">
                <div className="admin-users-form-group">
                  <label className="admin-users-form-label">Ngày sinh</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={userForm.dateOfBirth}
                    onChange={handleUserFormChange}
                    className="admin-users-form-input"
                  />
                </div>
                <div className="admin-users-form-group">
                  <label className="admin-users-form-label">Giới tính</label>
                  <select
                    name="gender"
                    value={userForm.gender}
                    onChange={handleUserFormChange}
                    className="admin-users-form-input"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
              </div>
              <div className="admin-users-form-row">
                <div className="admin-users-form-group">
                  <label className="admin-users-form-label">CCCD/CMND</label>
                  <input
                    type="text"
                    name="citizenId"
                    value={userForm.citizenId}
                    onChange={handleUserFormChange}
                    placeholder="Số CCCD/CMND"
                    className="admin-users-form-input"
                  />
                </div>
                <div className="admin-users-form-group">
                  <label className="admin-users-form-label">Địa chỉ</label>
                  <input
                    type="text"
                    name="address"
                    value={userForm.address}
                    onChange={handleUserFormChange}
                    placeholder="Địa chỉ liên hệ"
                    className="admin-users-form-input"
                  />
                </div>
              </div>
            </div>

            <div className="admin-users-form-section">
              <h3 className="admin-users-form-section-title">
                Thông tin chuyên môn
              </h3>
              <div className="admin-users-form-row">
                <div className="admin-users-form-group">
                  <label className="admin-users-form-label">Học vị *</label>
                  <input
                    type="text"
                    name="degree"
                    value={userForm.degree}
                    onChange={handleUserFormChange}
                    placeholder="VD: Thạc sĩ, Tiến sĩ, Bác sĩ CKII..."
                    required
                    className="admin-users-form-input"
                  />
                </div>
                <div className="admin-users-form-group">
                  <label className="admin-users-form-label">Chức vụ *</label>
                  <input
                    type="text"
                    name="position"
                    value={userForm.position}
                    onChange={handleUserFormChange}
                    placeholder="VD: Trưởng khoa, Phó khoa, Bác sĩ trưởng..."
                    required
                    className="admin-users-form-input"
                  />
                </div>
              </div>
              <div className="admin-users-form-row">
                <div className="admin-users-form-group admin-users-form-group-fullwidth">
                  <label className="admin-users-form-label">Khoa *</label>
                  {departmentsLoading ? (
                    <div className="admin-users-departments-loading">
                      Đang tải danh sách khoa...
                    </div>
                  ) : departmentsError ? (
                    <div className="admin-users-departments-error">
                      {departmentsError}
                    </div>
                  ) : (
                    <select
                      name="departmentId"
                      value={userForm.departmentId}
                      onChange={handleUserFormChange}
                      required
                      className="admin-users-form-input"
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
              </div>
            </div>

            <div className="admin-users-form-section">
              <h3 className="admin-users-form-section-title">
                Thông tin làm việc
              </h3>
              <div className="admin-users-form-row">
                <div className="admin-users-form-group">
                  <label className="admin-users-form-label">Số phòng</label>
                  <input
                    type="text"
                    name="roomNumber"
                    value={userForm.roomNumber}
                    onChange={handleUserFormChange}
                    placeholder="VD: 101, 201..."
                    className="admin-users-form-input"
                  />
                </div>
                <div className="admin-users-form-group">
                  <label className="admin-users-form-label">Tầng</label>
                  <input
                    type="number"
                    name="floor"
                    value={userForm.floor}
                    onChange={handleUserFormChange}
                    placeholder="VD: 1, 2, 3..."
                    className="admin-users-form-input"
                  />
                </div>
              </div>
            </div>
          </>
        );

      case "ADMIN":
        return (
          <div className="admin-users-form-section">
            <div className="admin-users-admin-warning">
              <i className="fas fa-shield-alt admin-users-warning-icon"></i>
              <strong className="admin-users-warning-text">
                Quyền Quản trị viên:
              </strong>
              <span className="admin-users-warning-description">
                {" "}
                Tài khoản này sẽ có toàn quyền quản lý hệ thống
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) return <div className="admin-users-loading">Đang tải...</div>;

  return (
    <div className="admin-users-wrapper">
      <div className="admin-users-header">
        <h1 className="admin-users-title">Quản lý Người dùng</h1>
        <div className="admin-users-header-actions">
          <div className="admin-users-search-box">
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-users-search-input"
            />
            <i className="fas fa-search admin-users-search-icon"></i>
          </div>
          <button className="admin-users-btn-refresh" onClick={refreshData}>
            <i className="fas fa-sync-alt admin-users-btn-icon"></i>
            Refresh
          </button>
          <button
            className="admin-users-btn-primary"
            onClick={handleOpenUserModal}
          >
            <i className="fas fa-plus admin-users-btn-icon"></i>
            Thêm Người dùng
          </button>
        </div>
      </div>

      {error && <div className="admin-users-error-message">{error}</div>}

      <div className="admin-users-tabs">
        <button
          className={`admin-users-tab ${
            activeTab === "users" ? "admin-users-tab-active" : ""
          }`}
          onClick={() => setActiveTab("users")}
        >
          Tất cả Người dùng ({users.length})
        </button>
        <button
          className={`admin-users-tab ${
            activeTab === "patients" ? "admin-users-tab-active" : ""
          }`}
          onClick={() => setActiveTab("patients")}
        >
          Bệnh nhân ({patients.length})
        </button>
        <button
          className={`admin-users-tab ${
            activeTab === "doctors" ? "admin-users-tab-active" : ""
          }`}
          onClick={() => setActiveTab("doctors")}
        >
          Bác sĩ ({doctors.length})
        </button>
      </div>

      <div className="admin-users-table-container">
        {activeTab === "users" && (
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên đăng nhập</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="admin-users-table-row">
                  <td className="admin-users-table-cell">{user.id}</td>
                  <td className="admin-users-table-cell">{user.username}</td>
                  <td className="admin-users-table-cell">
                    {user.fullName || "N/A"}
                  </td>
                  <td className="admin-users-table-cell">{user.email}</td>
                  <td className="admin-users-table-cell">
                    {user.phone || "N/A"}
                  </td>
                  <td className="admin-users-table-cell">
                    <span
                      className={`admin-users-role-badge admin-users-role-${user.role?.toLowerCase()}`}
                    >
                      {user.role === "PATIENT" && "Bệnh nhân"}
                      {user.role === "DOCTOR" && "Bác sĩ"}
                      {user.role === "ADMIN" && "Quản trị viên"}
                    </span>
                  </td>
                  <td className="admin-users-table-cell">
                    <div className="admin-users-action-buttons">
                      <button
                        className="admin-users-btn-delete"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <i className="fas fa-trash admin-users-action-icon"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "patients" && (
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ tên</th>
                <th>Ngày sinh</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Địa chỉ</th>
                <th>BHYT</th>
                <th>Triệu chứng</th>
                <th>Người thân</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="admin-users-table-row">
                  <td className="admin-users-table-cell">{patient.id}</td>
                  <td className="admin-users-table-cell">
                    {patient.fullName || "N/A"}
                  </td>
                  <td className="admin-users-table-cell">
                    {patient.dob
                      ? new Date(patient.dob).toLocaleDateString("vi-VN")
                      : "N/A"}
                  </td>
                  <td className="admin-users-table-cell">{patient.email}</td>
                  <td className="admin-users-table-cell">{patient.phone}</td>
                  <td className="admin-users-table-cell">
                    {patient.address || "N/A"}
                  </td>
                  <td className="admin-users-table-cell">
                    {patient.bhyt || "N/A"}
                  </td>
                  <td className="admin-users-table-cell">
                    {patient.symptoms || "N/A"}
                  </td>
                  <td className="admin-users-table-cell">
                    {patient.relativeName
                      ? `${patient.relativeName} (${patient.relativeRelationship})`
                      : "N/A"}
                  </td>
                  <td className="admin-users-table-cell">
                    <div className="admin-users-action-buttons">
                      <button
                        className="admin-users-btn-delete"
                        onClick={() =>
                          handleDeleteUser(patient.user?.id || patient.userId)
                        }
                      >
                        <i className="fas fa-trash admin-users-action-icon"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "doctors" && (
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ tên</th>
                <th>Khoa</th>
                <th>Học vị</th>
                <th>Chức vụ</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Phòng</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.map((doctor) => (
                <tr key={doctor.id} className="admin-users-table-row">
                  <td className="admin-users-table-cell">{doctor.id}</td>
                  <td className="admin-users-table-cell">
                    {doctor.fullName || "N/A"}
                  </td>
                  <td className="admin-users-table-cell">
                    {doctor.departmentName ||
                      (doctor.department && doctor.department.departmentName) ||
                      getDepartmentName(doctor.departmentId) ||
                      "Đang cập nhật"}
                  </td>
                  <td className="admin-users-table-cell">
                    {doctor.degree || "N/A"}
                  </td>
                  <td className="admin-users-table-cell">
                    {doctor.position || "N/A"}
                  </td>
                  <td className="admin-users-table-cell">{doctor.email}</td>
                  <td className="admin-users-table-cell">{doctor.phone}</td>
                  <td className="admin-users-table-cell">
                    {doctor.roomNumber ? `P.${doctor.roomNumber}` : "N/A"}
                    {doctor.floor ? ` - Tầng ${doctor.floor}` : ""}
                  </td>
                  <td className="admin-users-table-cell">
                    <div className="admin-users-action-buttons">
                      <button
                        className="admin-users-btn-delete"
                        onClick={() => handleDeleteUser(doctor.userId)}
                      >
                        <i className="fas fa-trash admin-users-action-icon"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal thêm người dùng */}
      {showUserModal && (
        <div className="admin-users-modal-overlay">
          <div className="admin-users-modal">
            <div className="admin-users-modal-header">
              <h2 className="admin-users-modal-title">
                Thêm{" "}
                {userForm.role === "ADMIN"
                  ? "Admin"
                  : userForm.role === "DOCTOR"
                  ? "Bác sĩ"
                  : "Bệnh nhân"}{" "}
                Mới
              </h2>
              <button
                className="admin-users-modal-close-btn"
                onClick={() => setShowUserModal(false)}
              >
                <i className="fas fa-times admin-users-close-icon"></i>
              </button>
            </div>
            <form
              className="admin-users-modal-form"
              onSubmit={handleCreateUser}
            >
              {/* Role selector ở đầu */}
              <div className="admin-users-form-section">
                <div className="admin-users-role-selector">
                  <label className="admin-users-role-label">Vai trò *</label>
                  <div className="admin-users-role-options">
                    <button
                      type="button"
                      className={`admin-users-role-option ${
                        userForm.role === "PATIENT"
                          ? "admin-users-role-option-active"
                          : ""
                      }`}
                      onClick={() =>
                        setUserForm((prev) => ({ ...prev, role: "PATIENT" }))
                      }
                    >
                      <i className="fas fa-user-injured admin-users-role-icon"></i>
                      Bệnh nhân
                    </button>
                    <button
                      type="button"
                      className={`admin-users-role-option ${
                        userForm.role === "DOCTOR"
                          ? "admin-users-role-option-active"
                          : ""
                      }`}
                      onClick={() =>
                        setUserForm((prev) => ({ ...prev, role: "DOCTOR" }))
                      }
                    >
                      <i className="fas fa-user-md admin-users-role-icon"></i>
                      Bác sĩ
                    </button>
                    <button
                      type="button"
                      className={`admin-users-role-option ${
                        userForm.role === "ADMIN"
                          ? "admin-users-role-option-active"
                          : ""
                      }`}
                      onClick={() =>
                        setUserForm((prev) => ({ ...prev, role: "ADMIN" }))
                      }
                    >
                      <i className="fas fa-user-shield admin-users-role-icon"></i>
                      Quản trị viên
                    </button>
                  </div>
                </div>
              </div>

              {/* Thông tin đăng nhập chung */}
              <div className="admin-users-form-section">
                <h3 className="admin-users-form-section-title">
                  Thông tin đăng nhập
                </h3>
                <div className="admin-users-form-row">
                  <div className="admin-users-form-group">
                    <label className="admin-users-form-label">
                      Tên đăng nhập *
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={userForm.username}
                      onChange={handleUserFormChange}
                      required
                      className="admin-users-form-input"
                    />
                  </div>
                  <div className="admin-users-form-group">
                    <label className="admin-users-form-label">Mật khẩu *</label>
                    <input
                      type="password"
                      name="password"
                      value={userForm.password}
                      onChange={handleUserFormChange}
                      required
                      className="admin-users-form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Thông tin cá nhân chung */}
              <div className="admin-users-form-section">
                <h3 className="admin-users-form-section-title">
                  Thông tin cá nhân
                </h3>
                <div className="admin-users-form-row">
                  <div className="admin-users-form-group">
                    <label className="admin-users-form-label">Họ tên *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={userForm.fullName}
                      onChange={handleUserFormChange}
                      required
                      className="admin-users-form-input"
                    />
                  </div>
                  <div className="admin-users-form-group">
                    <label className="admin-users-form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={userForm.email}
                      onChange={handleUserFormChange}
                      className="admin-users-form-input"
                    />
                  </div>
                </div>
                <div className="admin-users-form-row">
                  <div className="admin-users-form-group">
                    <label className="admin-users-form-label">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={userForm.phone}
                      onChange={handleUserFormChange}
                      className="admin-users-form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Form theo role */}
              {renderFormByRole()}

              <div className="admin-users-form-actions">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="admin-users-btn-cancel"
                >
                  Hủy
                </button>
                <button type="submit" className="admin-users-btn-submit">
                  {userForm.role === "ADMIN"
                    ? "Tạo Admin"
                    : userForm.role === "DOCTOR"
                    ? "Tạo Bác sĩ"
                    : "Tạo Bệnh nhân"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
