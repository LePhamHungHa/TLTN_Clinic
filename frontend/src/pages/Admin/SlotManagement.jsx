import React from "react";

const SlotManagement = ({
  slots,
  doctors,
  showSlotForm,
  newSlot,
  slotFormRef,
  showBulkForm,
  bulkMaxPatients,
  getDoctorName,
  handleAddSlotClick,
  handleCreateSlot,
  setNewSlot,
  setShowSlotForm,
  setShowBulkForm,
  setBulkMaxPatients,
  handleBulkUpdate,
  updateSlotMaxPatients,
  toggleSlotStatus,
  deleteSlot,
}) => {
  return (
    <div className="slot-management">
      <div className="section-header">
        <h2>Quản lý Slot khám bệnh ({slots.length})</h2>
        <div className="action-buttons">
          <button
            className="warning-button"
            onClick={() => {
              setShowBulkForm(!showBulkForm);
              if (showBulkForm && slotFormRef.current) {
                setTimeout(() => {
                  slotFormRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }, 50);
              }
            }}
          >
            📊 Cập nhật hàng loạt
          </button>
          <button className="primary-button" onClick={handleAddSlotClick}>
            ➕ Thêm Slot mới
          </button>
        </div>
      </div>

      {/* Add Slot Form */}
      {showSlotForm && (
        <div className="add-slot-form" ref={slotFormRef}>
          <h3>Thêm Slot mới</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Bác sĩ *:</label>
              <select
                value={newSlot.doctorId}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, doctorId: e.target.value })
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
            <div className="form-field">
              <label>Ngày khám *:</label>
              <input
                type="date"
                value={newSlot.appointmentDate}
                onChange={(e) =>
                  setNewSlot({
                    ...newSlot,
                    appointmentDate: e.target.value,
                  })
                }
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div className="form-field">
              <label>Khung giờ *:</label>
              <select
                value={newSlot.timeSlot}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, timeSlot: e.target.value })
                }
              >
                <option value="07:00-08:00">07:00 - 08:00</option>
                <option value="08:00-09:00">08:00 - 09:00</option>
                <option value="09:00-10:00">09:00 - 10:00</option>
                <option value="10:00-11:00">10:00 - 11:00</option>
                <option value="11:00-12:00">11:00 - 12:00</option>
                <option value="13:00-14:00">13:00 - 14:00</option>
                <option value="14:00-15:00">14:00 - 15:00</option>
                <option value="15:00-16:00">15:00 - 16:00</option>
                <option value="16:00-17:00">16:00 - 17:00</option>
              </select>
            </div>
            <div className="form-field">
              <label>Số bệnh nhân tối đa:</label>
              <input
                type="number"
                min="1"
                value={newSlot.maxPatients}
                onChange={(e) =>
                  setNewSlot({
                    ...newSlot,
                    maxPatients: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="success-button" onClick={handleCreateSlot}>
              💾 Lưu Slot
            </button>
            <button
              className="danger-button"
              onClick={() => setShowSlotForm(false)}
            >
              ❌ Hủy
            </button>
          </div>
        </div>
      )}

      {/* Bulk Update Form */}
      {showBulkForm && (
        <div className="bulk-form" ref={slotFormRef}>
          <h3>Cập nhật số bệnh nhân tối đa hàng loạt</h3>
          <div className="form-group">
            <label>Số bệnh nhân tối đa:</label>
            <input
              type="number"
              min="1"
              value={bulkMaxPatients}
              onChange={(e) =>
                setBulkMaxPatients(parseInt(e.target.value) || 1)
              }
              className="number-input"
            />
            <span>người/slot</span>
          </div>
          <div className="note">
            <p>
              <strong>Phạm vi áp dụng:</strong> Tất cả các slot hiện có
            </p>
            <p>
              <em>
                Lưu ý: Số lượng tối đa không được nhỏ hơn số bệnh nhân hiện tại
              </em>
            </p>
          </div>
          <div className="form-actions">
            <button className="success-button" onClick={handleBulkUpdate}>
              ✅ Áp dụng
            </button>
            <button
              className="danger-button"
              onClick={() => setShowBulkForm(false)}
            >
              ❌ Hủy
            </button>
          </div>
        </div>
      )}

      {slots.length === 0 ? (
        <div className="empty-state">
          <p>Không có slot nào</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bác sĩ</th>
                <th>Ngày</th>
                <th>Khung giờ</th>
                <th>Số bệnh nhân hiện tại</th>
                <th>Số bệnh nhân tối đa</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot.id}>
                  <td>{getDoctorName(slot.doctorId)}</td>
                  <td>{slot.appointmentDate || "N/A"}</td>
                  <td>{slot.timeSlot || "N/A"}</td>
                  <td>
                    <span
                      className={`patient-count ${
                        slot.currentPatients >= slot.maxPatients
                          ? "full"
                          : "normal"
                      }`}
                    >
                      {slot.currentPatients || 0}
                    </span>
                  </td>
                  <td>
                    <div className="max-patients-input">
                      <input
                        type="number"
                        min={slot.currentPatients || 0}
                        value={slot.maxPatients || 5}
                        onBlur={(e) =>
                          updateSlotMaxPatients(
                            slot.id,
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                      <span>người</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        slot.isActive ? "active" : "inactive"
                      }`}
                      onClick={() => toggleSlotStatus(slot.id, slot.isActive)}
                      title="Nhấn để thay đổi trạng thái"
                      style={{ cursor: "pointer" }}
                    >
                      {slot.isActive ? "Hoạt động" : "Vô hiệu"}
                    </span>
                  </td>
                  <td className="slot-actions">
                    <button
                      className="delete-button"
                      onClick={() => deleteSlot(slot.id)}
                      disabled={(slot.currentPatients || 0) > 0}
                      title={
                        (slot.currentPatients || 0) > 0
                          ? "Không thể xóa slot đã có bệnh nhân"
                          : "Xóa slot"
                      }
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

export default SlotManagement;
