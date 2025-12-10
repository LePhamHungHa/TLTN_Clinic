import React, { useState, useRef, useEffect } from "react";
import "../../css/SlotManagement.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const SlotManagement = ({ slots, doctors, getDoctorName, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSlots, setFilteredSlots] = useState([]);
  const [editingMaxPatients, setEditingMaxPatients] = useState({});

  const formRef = useRef(null);
  const bulkFormRef = useRef(null);

  const [formData, setFormData] = useState({
    doctorId: "",
    appointmentDate: "",
    timeSlot: "07:00-08:00",
    maxPatients: 5,
  });

  const [bulkData, setBulkData] = useState({
    maxPatients: 5,
  });

  const timeSlotOptions = [
    "07:00-08:00",
    "08:00-09:00",
    "09:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
  ];

  // Function to normalize search term
  const normalizeText = (text) => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  };

  // Update filtered slots whenever searchTerm or slots change
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSlots(slots);
      return;
    }

    const normalizedSearch = normalizeText(searchTerm);

    const filtered = slots.filter((slot) => {
      const doctorName = getDoctorName(slot.doctorId) || "";
      const doctorMatch = normalizeText(doctorName).includes(normalizedSearch);
      const dateMatch = slot.appointmentDate
        ? normalizeText(slot.appointmentDate).includes(normalizedSearch)
        : false;
      const timeMatch = slot.timeSlot
        ? normalizeText(slot.timeSlot).includes(normalizedSearch)
        : false;

      return doctorMatch || dateMatch || timeMatch;
    });

    setFilteredSlots(filtered);
  }, [searchTerm, slots, getDoctorName]);

  const handleEditSlot = (slot) => {
    setEditingSlot(slot);
    setFormData({
      doctorId: slot.doctorId || "",
      appointmentDate: slot.appointmentDate || "",
      timeSlot: slot.timeSlot || "07:00-08:00",
      maxPatients: slot.maxPatients || 5,
    });
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleAddSlot = async () => {
    if (!formData.doctorId || !formData.appointmentDate || !formData.timeSlot) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc (*)");
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const url = editingSlot
        ? `http://localhost:8080/api/slots/${editingSlot.id}`
        : "http://localhost:8080/api/slots";

      const method = editingSlot ? "PUT" : "POST";

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
        resetForm();
        alert(`✅ ${editingSlot ? "Cập nhật" : "Thêm"} slot thành công!`);
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Lỗi khi ${editingSlot ? "cập nhật" : "thêm"} slot`
        );
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkData.maxPatients || bulkData.maxPatients < 1) {
      alert("Vui lòng nhập số bệnh nhân tối đa hợp lệ");
      return;
    }

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn cập nhật tất cả slots thành ${bulkData.maxPatients} bệnh nhân/slot?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        "http://localhost:8080/api/slots/bulk-update",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bulkData),
        }
      );

      if (response.ok) {
        onRefresh();
        setShowBulkForm(false);
        alert("✅ Cập nhật hàng loạt thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi cập nhật hàng loạt");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleSlotStatus = async (slotId) => {
    if (!window.confirm("Bạn có chắc chắn muốn thay đổi trạng thái slot này?"))
      return;

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        `http://localhost:8080/api/slots/${slotId}/toggle-status`,
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
        throw new Error(errorData.message || "Lỗi khi cập nhật trạng thái");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMaxPatientsChange = (slotId, value) => {
    setEditingMaxPatients({
      ...editingMaxPatients,
      [slotId]: parseInt(value) || 1,
    });
  };

  const handleUpdateMaxPatients = async (slotId) => {
    const maxPatients = editingMaxPatients[slotId];
    if (!maxPatients || maxPatients < 1) {
      alert("Vui lòng nhập số bệnh nhân tối đa hợp lệ");
      return;
    }

    // Kiểm tra nếu số bệnh nhân hiện tại > maxPatients mới
    const slot = slots.find((s) => s.id === slotId);
    if (slot && (slot.currentPatients || 0) > maxPatients) {
      alert(
        `Không thể đặt số bệnh nhân tối đa nhỏ hơn số bệnh nhân hiện tại (${slot.currentPatients})`
      );
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        `http://localhost:8080/api/slots/${slotId}/max-patients`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ maxPatients }),
        }
      );

      if (response.ok) {
        onRefresh();
        setEditingMaxPatients({
          ...editingMaxPatients,
          [slotId]: undefined,
        });
        alert("✅ Cập nhật số bệnh nhân tối đa thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi cập nhật");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteSlot = async (slotId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa slot này?")) return;

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      const response = await fetch(
        `http://localhost:8080/api/slots/${slotId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        onRefresh();
        alert("✅ Xóa slot thành công!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi xóa slot");
      }
    } catch (err) {
      alert(`❌ Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      doctorId: "",
      appointmentDate: "",
      timeSlot: "07:00-08:00",
      maxPatients: 5,
    });
    setEditingSlot(null);
  };

  const handleShowBulkForm = () => {
    setShowBulkForm(true);
    setTimeout(() => {
      bulkFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleShowAddForm = () => {
    setEditingSlot(null);
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

  const handleCloseBulkForm = () => {
    setShowBulkForm(false);
    setBulkData({ maxPatients: 5 });
  };

  return (
    <div className="slot-management">
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
                    placeholder="Tìm kiếm theo tên bác sĩ, ngày, khung giờ..."
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
                    Tìm thấy <strong>{filteredSlots.length}</strong> slot
                    {filteredSlots.length === 1 ? "" : ""}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="col-12 col-lg-6 text-lg-end">
                <div className="d-flex gap-3 justify-content-lg-end justify-content-start flex-wrap">
                  <button
                    className="btn btn-warning btn-lg px-4 d-flex align-items-center gap-2 shadow-sm"
                    onClick={handleShowBulkForm}
                    disabled={loading}
                  >
                    <i className="bi bi-gear"></i>
                    Cập nhật hàng loạt
                  </button>

                  <button
                    className="btn btn-primary btn-lg px-5 d-flex align-items-center gap-2 shadow-sm"
                    onClick={handleShowAddForm}
                    disabled={loading}
                  >
                    <i className="bi bi-plus-circle"></i>
                    Thêm Slot mới
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Update Form */}
      {showBulkForm && (
        <div className="bulk-form card mb-4" ref={bulkFormRef}>
          <div className="card-header bg-warning text-white d-flex align-items-center">
            <i className="bi bi-gear me-2 fs-4"></i>
            <h5 className="mb-0">Cập nhật hàng loạt</h5>
          </div>
          <div className="card-body">
            <div className="alert alert-warning mb-3">
              <strong>Lưu ý:</strong> Thao tác này sẽ cập nhật số bệnh nhân tối
              đa cho tất cả các slot hiện có
              <br />
              <small className="text-muted">
                Số lượng tối đa không được nhỏ hơn số bệnh nhân hiện tại
              </small>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">
                  Số bệnh nhân tối đa <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control form-control-lg"
                    min="1"
                    value={bulkData.maxPatients}
                    onChange={(e) =>
                      setBulkData({
                        ...bulkData,
                        maxPatients: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                  />
                  <span className="input-group-text">người/slot</span>
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Phạm vi áp dụng</label>
                <div className="alert alert-info">
                  <strong>Tất cả các slot hiện có</strong>
                  <div className="small mt-1">Tổng số slot: {slots.length}</div>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-warning btn-lg d-flex align-items-center px-4"
                onClick={handleBulkUpdate}
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
                    Áp dụng
                  </>
                )}
              </button>
              <button
                className="btn btn-outline-secondary btn-lg d-flex align-items-center px-4"
                onClick={handleCloseBulkForm}
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
                editingSlot ? "bi-pencil-square" : "bi-plus-circle"
              } me-2 fs-4`}
            ></i>
            <h5 className="mb-0">
              {editingSlot ? "Sửa thông tin Slot" : "Thêm Slot mới"}
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">
                  Bác sĩ <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select form-select-lg"
                  value={formData.doctorId}
                  onChange={(e) =>
                    setFormData({ ...formData, doctorId: e.target.value })
                  }
                  required
                >
                  <option value="">Chọn bác sĩ</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.fullName} - {doctor.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">
                  Ngày khám <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control form-control-lg"
                  value={formData.appointmentDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      appointmentDate: e.target.value,
                    })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">
                  Khung giờ <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select form-select-lg"
                  value={formData.timeSlot}
                  onChange={(e) =>
                    setFormData({ ...formData, timeSlot: e.target.value })
                  }
                  required
                >
                  {timeSlotOptions.map((time, idx) => (
                    <option key={idx} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">
                  Số bệnh nhân tối đa
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control form-control-lg"
                    min="1"
                    value={formData.maxPatients}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxPatients: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                  <span className="input-group-text">người</span>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-primary btn-lg d-flex align-items-center px-4"
                onClick={handleAddSlot}
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
                    {editingSlot ? "Cập nhật" : "Lưu"} Slot
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
      <div className="table-responsive slot-table">
        <table className="table table-hover align-middle">
          <thead className="table-primary">
            <tr>
              <th width="60" className="text-center">
                STT
              </th>
              <th>Bác sĩ</th>
              <th>Ngày</th>
              <th>Khung giờ</th>
              <th className="text-center">Số bệnh nhân hiện tại</th>
              <th className="text-center">Số bệnh nhân tối đa</th>
              <th className="text-center">Trạng thái</th>
              <th width="150" className="text-center">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSlots.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-5">
                  <div className="empty-state">
                    <i className="bi bi-calendar-x display-4 text-muted mb-3"></i>
                    <p className="text-muted mb-0 fs-5">
                      {searchTerm
                        ? `Không tìm thấy slot nào với từ khóa: "${searchTerm}"`
                        : "Không có slot nào"}
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
              filteredSlots.map((slot, index) => (
                <tr key={slot.id}>
                  <td className="text-center fw-bold text-primary">
                    {index + 1}
                  </td>
                  <td>
                    <strong className="fs-6 text-dark">
                      {getDoctorName(slot.doctorId)}
                    </strong>
                  </td>
                  <td>
                    <span className="text-dark">
                      {slot.appointmentDate || "N/A"}
                    </span>
                  </td>
                  <td>
                    <span className="text-muted">{slot.timeSlot || "N/A"}</span>
                  </td>
                  <td className="text-center">
                    <span
                      className={`badge patient-count ${
                        slot.currentPatients >= slot.maxPatients
                          ? "bg-danger"
                          : "bg-success"
                      }`}
                    >
                      {slot.currentPatients || 0}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="d-flex align-items-center justify-content-center gap-2">
                      <input
                        type="number"
                        className="form-control form-control-sm text-center"
                        style={{ width: "80px" }}
                        min={slot.currentPatients || 0}
                        value={
                          editingMaxPatients[slot.id] !== undefined
                            ? editingMaxPatients[slot.id]
                            : slot.maxPatients || 5
                        }
                        onChange={(e) =>
                          handleMaxPatientsChange(slot.id, e.target.value)
                        }
                        onBlur={() => handleUpdateMaxPatients(slot.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdateMaxPatients(slot.id);
                          }
                        }}
                        disabled={loading}
                      />
                      <span className="text-muted small">người</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <span
                      className={`status-badge ${
                        slot.isActive ? "active" : "inactive"
                      }`}
                      onClick={() => toggleSlotStatus(slot.id, slot.isActive)}
                      style={{ cursor: "pointer" }}
                      title="Click để thay đổi trạng thái"
                    >
                      {slot.isActive ? "Hoạt động" : "Vô hiệu"}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <button
                        className="btn btn-sm btn-primary d-flex align-items-center px-3"
                        onClick={() => handleEditSlot(slot)}
                        disabled={loading}
                        title="Sửa thông tin"
                      >
                        <i className="bi bi-pencil me-1"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-danger d-flex align-items-center px-3"
                        onClick={() => deleteSlot(slot.id)}
                        disabled={loading || (slot.currentPatients || 0) > 0}
                        title={
                          (slot.currentPatients || 0) > 0
                            ? "Không thể xóa slot đã có bệnh nhân"
                            : "Xóa slot"
                        }
                      >
                        <i className="bi bi-trash me-1"></i>
                      </button>
                    </div>
                    {(slot.currentPatients || 0) > 0 && (
                      <small className="text-warning d-block mt-1">
                        Có {slot.currentPatients} bệnh nhân
                      </small>
                    )}
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

export default SlotManagement;
