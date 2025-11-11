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
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form states
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    role: "PATIENT",
    phone: "",
    email: "",
    fullName: "",
  });

  const [doctorForm, setDoctorForm] = useState({
    username: "",
    password: "",
    fullName: "",
    dateOfBirth: "",
    gender: "MALE",
    citizenId: "",
    address: "",
    phone: "",
    email: "",
    departmentId: "",
    degree: "",
    position: "",
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

      console.log("✅ Doctors data:", response.data);
      // Debug: kiểm tra dữ liệu department
      response.data.forEach((doctor) => {
        console.log(
          `Doctor: ${doctor.fullName}, Dept ID: ${
            doctor.departmentId
          }, Dept Name: ${doctor.departmentName || "N/A"}`
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

  const handleDoctorFormChange = (e) => {
    const { name, value } = e.target;
    setDoctorForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Create new user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      if (!token) return;

      const userData = {
        username: userForm.username,
        password: userForm.password,
        role: userForm.role,
        phone: userForm.phone,
        email: userForm.email,
        full_name: userForm.fullName,
      };

      console.log("📤 Gửi data tạo user:", userData);

      const response = await axios.post(
        "http://localhost:8080/api/admin/users",
        userData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Tạo user thành công:", response.data);

      setShowUserModal(false);
      setUserForm({
        username: "",
        password: "",
        role: "PATIENT",
        phone: "",
        email: "",
        fullName: "",
      });
      refreshData();
      setError("");
    } catch (error) {
      console.error("❌ Lỗi tạo người dùng:", error);
      setError(
        "Lỗi khi tạo người dùng: " + (error.response?.data || error.message)
      );
    }
  };

  // Create new doctor - ĐÃ SỬA HOÀN TOÀN
  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      if (!token) {
        setError("Không có token, vui lòng đăng nhập lại");
        return;
      }

      // Validate department
      if (!doctorForm.departmentId) {
        setError("Vui lòng chọn khoa");
        return;
      }

      // Chuẩn bị data gửi lên server - DÙNG snake_case
      const doctorData = {
        username: doctorForm.username,
        password: doctorForm.password,
        full_name: doctorForm.fullName,
        date_of_birth: doctorForm.dateOfBirth,
        gender: doctorForm.gender,
        citizen_id: doctorForm.citizenId,
        address: doctorForm.address,
        phone: doctorForm.phone,
        email: doctorForm.email,
        department_id: parseInt(doctorForm.departmentId),
        degree: doctorForm.degree,
        position: doctorForm.position,
        room_number: doctorForm.roomNumber,
        floor: doctorForm.floor,
      };

      console.log("📤 Gửi data tạo doctor:", doctorData);

      const response = await axios.post(
        "http://localhost:8080/api/admin/users/doctors",
        doctorData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Tạo doctor thành công:", response.data);

      // Reset form và đóng modal
      setShowDoctorModal(false);
      setDoctorForm({
        username: "",
        password: "",
        fullName: "",
        dateOfBirth: "",
        gender: "MALE",
        citizenId: "",
        address: "",
        phone: "",
        email: "",
        departmentId: "",
        degree: "",
        position: "",
        roomNumber: "",
        floor: "",
      });

      // Refresh danh sách
      await fetchDoctors();
      await fetchUsers(); // Refresh cả users vì có user mới
      setError("");

      alert("✅ Tạo bác sĩ thành công!");
    } catch (error) {
      console.error("❌ Lỗi tạo bác sĩ:", error);
      console.error("❌ Chi tiết lỗi:", error.response?.data);

      const errorMessage =
        error.response?.data?.message || error.response?.data || error.message;
      setError("Lỗi khi tạo bác sĩ: " + errorMessage);
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

  // Open doctor modal and fetch departments
  const handleOpenDoctorModal = async () => {
    setShowDoctorModal(true);
    setError("");
    setDepartmentsError("");

    // Reset form
    setDoctorForm({
      username: "",
      password: "",
      fullName: "",
      dateOfBirth: "",
      gender: "MALE",
      citizenId: "",
      address: "",
      phone: "",
      email: "",
      departmentId: "",
      degree: "",
      position: "",
      roomNumber: "",
      floor: "",
    });

    // Load departments
    await fetchDepartments();
  };

  // Get department name by ID
  const getDepartmentName = (departmentId) => {
    if (!departmentId) return "N/A";
    const department = departments.find((dept) => dept.id === departmentId);
    return department ? department.departmentName : "N/A";
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="admin-users">
      <div className="admin-header">
        <h1>Quản lý Người dùng</h1>
        <div className="header-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search"></i>
          </div>
          <button className="btn-refresh" onClick={refreshData}>
            <i className="fas fa-sync-alt"></i>
            Refresh
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowUserModal(true)}
          >
            <i className="fas fa-plus"></i>
            Thêm Người dùng
          </button>
          <button className="btn-secondary" onClick={handleOpenDoctorModal}>
            <i className="fas fa-user-md"></i>
            Thêm Bác sĩ
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tabs">
        <button
          className={`tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Tất cả Người dùng ({users.length})
        </button>
        <button
          className={`tab ${activeTab === "patients" ? "active" : ""}`}
          onClick={() => setActiveTab("patients")}
        >
          Bệnh nhân ({patients.length})
        </button>
        <button
          className={`tab ${activeTab === "doctors" ? "active" : ""}`}
          onClick={() => setActiveTab("doctors")}
        >
          Bác sĩ ({doctors.length})
        </button>
      </div>

      <div className="table-container">
        {activeTab === "users" && (
          <table className="users-table">
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
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.fullName || "N/A"}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || "N/A"}</td>
                  <td>
                    <span
                      className={`role-badge role-${user.role?.toLowerCase()}`}
                    >
                      {user.role === "PATIENT" && "Bệnh nhân"}
                      {user.role === "DOCTOR" && "Bác sĩ"}
                      {user.role === "ADMIN" && "Quản trị viên"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "patients" && (
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ tên</th>
                <th>Ngày sinh</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Địa chỉ</th>
                <th>BHYT</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.id}</td>
                  <td>{patient.fullName || "N/A"}</td>
                  <td>
                    {patient.dob
                      ? new Date(patient.dob).toLocaleDateString("vi-VN")
                      : "N/A"}
                  </td>
                  <td>{patient.email}</td>
                  <td>{patient.phone}</td>
                  <td>{patient.address || "N/A"}</td>
                  <td>{patient.bhyt || "N/A"}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-delete"
                        onClick={() =>
                          handleDeleteUser(patient.user?.id || patient.userId)
                        }
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "doctors" && (
          <table className="users-table">
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
                <tr key={doctor.id}>
                  <td>{doctor.id}</td>
                  <td>{doctor.fullName || "N/A"}</td>
                  <td>
                    {/* Ưu tiên hiển thị departmentName từ backend, nếu không có thì dùng hàm getDepartmentName */}
                    {doctor.departmentName ||
                      getDepartmentName(doctor.departmentId)}
                  </td>
                  <td>{doctor.degree || "N/A"}</td>
                  <td>{doctor.position || "N/A"}</td>
                  <td>{doctor.email}</td>
                  <td>{doctor.phone}</td>
                  <td>
                    {doctor.roomNumber ? `P.${doctor.roomNumber}` : "N/A"}
                    {doctor.floor ? ` - Tầng ${doctor.floor}` : ""}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteUser(doctor.userId)}
                      >
                        <i className="fas fa-trash"></i>
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
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Thêm Người dùng Mới</h2>
              <button
                className="close-btn"
                onClick={() => setShowUserModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="form-row">
                <div className="form-group">
                  <label>Tên đăng nhập *</label>
                  <input
                    type="text"
                    name="username"
                    value={userForm.username}
                    onChange={handleUserFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Mật khẩu *</label>
                  <input
                    type="password"
                    name="password"
                    value={userForm.password}
                    onChange={handleUserFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Họ tên *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={userForm.fullName}
                    onChange={handleUserFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Vai trò *</label>
                  <select
                    name="role"
                    value={userForm.role}
                    onChange={handleUserFormChange}
                    required
                  >
                    <option value="PATIENT">Bệnh nhân</option>
                    <option value="DOCTOR">Bác sĩ</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={userForm.email}
                    onChange={handleUserFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={userForm.phone}
                    onChange={handleUserFormChange}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowUserModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Tạo người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal thêm bác sĩ */}
      {showDoctorModal && (
        <div className="modal-overlay">
          <div className="modal doctor-modal">
            <div className="modal-header">
              <h2>Thêm Bác sĩ Mới</h2>
              <button
                className="close-btn"
                onClick={() => setShowDoctorModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateDoctor} className="doctor-form">
              <div className="form-section">
                <h3>Thông tin đăng nhập</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tên đăng nhập *</label>
                    <input
                      type="text"
                      name="username"
                      value={doctorForm.username}
                      onChange={handleDoctorFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Mật khẩu *</label>
                    <input
                      type="password"
                      name="password"
                      value={doctorForm.password}
                      onChange={handleDoctorFormChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Thông tin cá nhân</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Họ tên *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={doctorForm.fullName}
                      onChange={handleDoctorFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Ngày sinh</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={doctorForm.dateOfBirth}
                      onChange={handleDoctorFormChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Giới tính</label>
                    <select
                      name="gender"
                      value={doctorForm.gender}
                      onChange={handleDoctorFormChange}
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>CCCD/CMND</label>
                    <input
                      type="text"
                      name="citizenId"
                      value={doctorForm.citizenId}
                      onChange={handleDoctorFormChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Địa chỉ</label>
                    <input
                      type="text"
                      name="address"
                      value={doctorForm.address}
                      onChange={handleDoctorFormChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Thông tin chuyên môn</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Học vị *</label>
                    <input
                      type="text"
                      name="degree"
                      value={doctorForm.degree}
                      onChange={handleDoctorFormChange}
                      placeholder="VD: Thạc sĩ, Tiến sĩ, Bác sĩ CKII..."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Chức vụ *</label>
                    <input
                      type="text"
                      name="position"
                      value={doctorForm.position}
                      onChange={handleDoctorFormChange}
                      placeholder="VD: Trưởng khoa, Phó khoa, Bác sĩ trưởng..."
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Khoa *</label>
                    {departmentsLoading ? (
                      <div className="departments-loading">
                        Đang tải danh sách khoa...
                      </div>
                    ) : departmentsError ? (
                      <div className="departments-error">
                        {departmentsError}
                      </div>
                    ) : (
                      <select
                        name="departmentId"
                        value={doctorForm.departmentId}
                        onChange={handleDoctorFormChange}
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
                </div>
              </div>

              <div className="form-section">
                <h3>Thông tin liên hệ & làm việc</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={doctorForm.email}
                      onChange={handleDoctorFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Số điện thoại *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={doctorForm.phone}
                      onChange={handleDoctorFormChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Số phòng</label>
                    <input
                      type="text"
                      name="roomNumber"
                      value={doctorForm.roomNumber}
                      onChange={handleDoctorFormChange}
                      placeholder="VD: 101, 201..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Tầng</label>
                    <input
                      type="number"
                      name="floor"
                      value={doctorForm.floor}
                      onChange={handleDoctorFormChange}
                      placeholder="VD: 1, 2, 3..."
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowDoctorModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Tạo bác sĩ
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
