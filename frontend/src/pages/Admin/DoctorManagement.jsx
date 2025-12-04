import React from "react";

const DoctorManagement = ({
  doctors,
  departments,
  genderOptions,
  specialtyOptions,
  degreeOptions,
  positionOptions,
  showDoctorForm,
  editingDoctor,
  newDoctor,
  doctorFormRef,
  handleAddDoctorClick,
  handleEditDoctor,
  handleAddDoctor,
  handleUpdateDoctor,
  deleteDoctor,
  setNewDoctor,
  setShowDoctorForm,
  setEditingDoctor,
  resetDoctorForm,
  getDepartmentName,
  getGenderLabel,
}) => {
  return (
    <div className="doctor-management">
      <div className="section-header">
        <h2>Quản lý Bác sĩ</h2>
        <div className="action-buttons">
          <button className="primary-button" onClick={handleAddDoctorClick}>
            👨‍⚕️ Thêm Bác sĩ mới
          </button>
        </div>
      </div>

      {/* Add/Edit Doctor Form */}
      {showDoctorForm && (
        <div className="add-doctor-form" ref={doctorFormRef}>
          <h3>{editingDoctor ? "Chỉnh sửa Bác sĩ" : "Thêm Bác sĩ mới"}</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Họ và tên *:</label>
              <input
                type="text"
                value={newDoctor.fullName}
                onChange={(e) =>
                  setNewDoctor({ ...newDoctor, fullName: e.target.value })
                }
                required
              />
            </div>
            <div className="form-field">
              <label>Ngày sinh:</label>
              <input
                type="date"
                value={newDoctor.dateOfBirth}
                onChange={(e) =>
                  setNewDoctor({
                    ...newDoctor,
                    dateOfBirth: e.target.value,
                  })
                }
              />
            </div>
            <div className="form-field">
              <label>Giới tính:</label>
              <select
                value={newDoctor.gender}
                onChange={(e) =>
                  setNewDoctor({ ...newDoctor, gender: e.target.value })
                }
              >
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>CMND/CCCD:</label>
              <input
                type="text"
                value={newDoctor.citizenId}
                onChange={(e) =>
                  setNewDoctor({
                    ...newDoctor,
                    citizenId: e.target.value,
                  })
                }
              />
            </div>
            <div className="form-field">
              <label>Địa chỉ:</label>
              <input
                type="text"
                value={newDoctor.address}
                onChange={(e) =>
                  setNewDoctor({ ...newDoctor, address: e.target.value })
                }
              />
            </div>

            {/* SELECT KHOA */}
            <div className="form-field">
              <label>Khoa:</label>
              <select
                value={newDoctor.departmentId}
                onChange={(e) =>
                  setNewDoctor({
                    ...newDoctor,
                    departmentId: e.target.value,
                  })
                }
              >
                <option value="">Chọn khoa (tùy chọn)</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.departmentName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Chuyên khoa *:</label>
              <select
                value={newDoctor.specialty}
                onChange={(e) =>
                  setNewDoctor({
                    ...newDoctor,
                    specialty: e.target.value,
                  })
                }
                required
              >
                <option value="">Chọn chuyên khoa</option>
                {specialtyOptions.map((specialty, index) => (
                  <option key={index} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Số điện thoại *:</label>
              <input
                type="tel"
                value={newDoctor.phone}
                onChange={(e) =>
                  setNewDoctor({ ...newDoctor, phone: e.target.value })
                }
                required
              />
            </div>
            <div className="form-field">
              <label>Email *:</label>
              <input
                type="email"
                value={newDoctor.email}
                onChange={(e) =>
                  setNewDoctor({ ...newDoctor, email: e.target.value })
                }
                required
              />
            </div>
            <div className="form-field">
              <label>Bằng cấp:</label>
              <select
                value={newDoctor.degree}
                onChange={(e) =>
                  setNewDoctor({ ...newDoctor, degree: e.target.value })
                }
              >
                <option value="">Chọn bằng cấp</option>
                {degreeOptions.map((degree, index) => (
                  <option key={index} value={degree}>
                    {degree}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Vị trí:</label>
              <select
                value={newDoctor.position}
                onChange={(e) =>
                  setNewDoctor({ ...newDoctor, position: e.target.value })
                }
              >
                <option value="">Chọn vị trí</option>
                {positionOptions.map((position, index) => (
                  <option key={index} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Username:</label>
              <input
                type="text"
                value={newDoctor.username}
                onChange={(e) =>
                  setNewDoctor({ ...newDoctor, username: e.target.value })
                }
                placeholder="Tự động tạo từ email nếu để trống"
              />
            </div>
            {!editingDoctor && (
              <div className="form-field">
                <label>Mật khẩu:</label>
                <input
                  type="password"
                  value={newDoctor.password}
                  onChange={(e) =>
                    setNewDoctor({
                      ...newDoctor,
                      password: e.target.value,
                    })
                  }
                  placeholder="Để trống sẽ tạo mật khẩu mặc định"
                />
              </div>
            )}
            <div className="form-field">
              <label>Số phòng:</label>
              <input
                type="text"
                value={newDoctor.roomNumber}
                onChange={(e) =>
                  setNewDoctor({
                    ...newDoctor,
                    roomNumber: e.target.value,
                  })
                }
              />
            </div>
            <div className="form-field">
              <label>Tầng:</label>
              <input
                type="text"
                value={newDoctor.floor}
                onChange={(e) =>
                  setNewDoctor({ ...newDoctor, floor: e.target.value })
                }
              />
            </div>
          </div>
          <div className="form-actions">
            <button
              className="success-button"
              onClick={editingDoctor ? handleUpdateDoctor : handleAddDoctor}
            >
              💾 {editingDoctor ? "Cập nhật" : "Lưu"} Bác sĩ
            </button>
            <button
              className="danger-button"
              onClick={() => {
                setShowDoctorForm(false);
                setEditingDoctor(null);
                resetDoctorForm();
              }}
            >
              ❌ Hủy
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Tổng số bác sĩ</div>
          <div className="stat-value">{doctors.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Đã phân khoa</div>
          <div className="stat-value">
            {doctors.filter((d) => d.departmentId).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Số khoa</div>
          <div className="stat-value">{departments.length}</div>
        </div>
      </div>

      {doctors.length === 0 ? (
        <div className="empty-state">
          <p>Không có bác sĩ nào</p>
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
                <th>Phòng</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td>
                    <div className="doctor-info">
                      <strong>{doctor.fullName || "N/A"}</strong>
                      <small>{doctor.position || "Bác sĩ"}</small>
                    </div>
                  </td>
                  <td>{getGenderLabel(doctor.gender)}</td>
                  <td>{doctor.specialty || "N/A"}</td>
                  <td>{getDepartmentName(doctor.departmentId)}</td>
                  <td>{doctor.phone || "N/A"}</td>
                  <td>{doctor.email || "N/A"}</td>
                  <td>{doctor.degree || "N/A"}</td>
                  <td>
                    {doctor.roomNumber
                      ? `P${doctor.roomNumber} - T${doctor.floor || "1"}`
                      : "N/A"}
                  </td>
                  <td className="doctor-actions">
                    <button
                      className="edit-button"
                      onClick={() => handleEditDoctor(doctor)}
                      title="Chỉnh sửa"
                      disabled={!doctor.id}
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => deleteDoctor(doctor.id)}
                      title="Xóa"
                      disabled={!doctor.id}
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

export default DoctorManagement;
