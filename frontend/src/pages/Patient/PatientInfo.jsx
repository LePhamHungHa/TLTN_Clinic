import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useToast } from "../../hooks/useToast";
import "../../css/PatientInfo.css";

const PatientInfo = () => {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const toast = useToast();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchPatient = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:8080/api/patients/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPatient(response.data);
        toast.success("Tải thông tin bệnh nhân thành công!");
      } catch (error) {
        console.error("Lỗi khi tải thông tin bệnh nhân:", error);
        toast.error("Không thể tải thông tin bệnh nhân. Vui lòng thử lại!");
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatient({ ...patient, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patient || !patient.id) {
      toast.error("Thông tin bệnh nhân không hợp lệ!");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Đang cập nhật thông tin...");

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:8080/api/patients/${patient.id}`,
        patient,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.dismiss(loadingToast);
      toast.success(" Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      toast.dismiss(loadingToast);
      toast.error("Cập nhật thông tin thất bại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Xác thực
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    setIsChangingPassword(true);
    const loadingToast = toast.loading("Đang đổi mật khẩu...");

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:8080/api/users/change-password",
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.dismiss(loadingToast);
      toast.success("Đổi mật khẩu thành công!");

      // reset form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowChangePassword(false);
    } catch (error) {
      console.error("Lỗi khi đổi mật khẩu:", error);
      toast.dismiss(loadingToast);

      if (error.response?.status === 400) {
        toast.error("Mật khẩu hiện tại không đúng!");
      } else {
        toast.error("Đổi mật khẩu thất bại!");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    hasFetched.current = false;
    const fetchPatient = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:8080/api/patients/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPatient(response.data);
        toast.success("Tải thông tin bệnh nhân thành công!");
      } catch (error) {
        console.error("Lỗi khi tải thông tin bệnh nhân:", error);
        toast.error("Không thể tải thông tin bệnh nhân. Vui lòng thử lại!");
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  };

  if (loading)
    return (
      <div className="loading">
        <p>Đang tải dữ liệu...</p>
      </div>
    );

  if (!patient)
    return (
      <div className="error-message">
        <p>Không tìm thấy thông tin bệnh nhân.</p>
        <button className="retry-button" onClick={handleRetry}>
          Thử lại
        </button>
      </div>
    );

  return (
    <div className="patient-info-container">
      <div className="patient-info-header">
        <h2>Thông tin bệnh nhân</h2>
        <p>Quản lý và cập nhật thông tin cá nhân của bạn</p>
      </div>

      <div className="patient-card">
        <form onSubmit={handleSubmit} className="patient-form">
          {/* Thông tin cá nhân */}
          <div className="form-section">
            <h3>Thông tin cá nhân</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Họ và tên *</label>
                <input
                  type="text"
                  name="fullName"
                  value={patient.fullName || ""}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Ngày sinh</label>
                <input
                  type="date"
                  name="dob"
                  value={patient.dob || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="text"
                  name="phone"
                  value={patient.phone || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={patient.email || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Địa chỉ</label>
              <input
                type="text"
                name="address"
                value={patient.address || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Thông tin y tế */}
          <div className="form-section">
            <h3>Thông tin y tế</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Triệu chứng</label>
                <input
                  type="text"
                  name="symptoms"
                  value={patient.symptoms || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>BHYT</label>
                <input
                  type="text"
                  name="bhyt"
                  value={patient.bhyt || ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Thông tin người nhà */}
          <div className="form-section">
            <h3>Thông tin người nhà</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Họ tên người nhà</label>
                <input
                  type="text"
                  name="relativeName"
                  value={patient.relativeName || ""}
                  onChange={handleChange}
                  placeholder="Nhập họ tên người nhà"
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại người nhà</label>
                <input
                  type="text"
                  name="relativePhone"
                  value={patient.relativePhone || ""}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại liên hệ"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Mối quan hệ</label>
                <select
                  name="relativeRelationship"
                  value={patient.relativeRelationship || ""}
                  onChange={handleChange}
                >
                  <option value="">Chọn mối quan hệ</option>
                  <option value="Vợ/Chồng">Vợ/Chồng</option>
                  <option value="Cha/Mẹ">Cha/Mẹ</option>
                  <option value="Con cái">Con cái</option>
                  <option value="Anh/Chị/Em">Anh/Chị/Em</option>
                  <option value="Người thân">Người thân</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="form-group">
                <label>Địa chỉ người nhà</label>
                <input
                  type="text"
                  name="relativeAddress"
                  value={patient.relativeAddress || ""}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ người nhà"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn" disabled={isSubmitting}>
              {isSubmitting ? "Đang cập nhật..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>

      {/* Phần đổi mật khẩu */}
      <div className="password-section">
        <div className="section-header">
          <h3>Quản lý mật khẩu</h3>
          <button
            type="button"
            className="change-password-btn"
            onClick={() => setShowChangePassword(!showChangePassword)}
          >
            {showChangePassword ? "Ẩn" : "Đổi mật khẩu"}
          </button>
        </div>

        {showChangePassword && (
          <div className="password-form-card">
            <form onSubmit={handleChangePassword}>
              <div className="form-row">
                <div className="form-group">
                  <label>Mật khẩu hiện tại *</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Mật khẩu mới *</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                    minLength="6"
                  />
                </div>

                <div className="form-group">
                  <label>Xác nhận mật khẩu mới *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="save-btn"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordForm({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientInfo;
