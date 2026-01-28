import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useToast } from "../../hooks/useToast";
import "../../css/PatientInfo.css";

const PatientInfo = () => {
  const [patientData, setPatientData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const toast = useToast();
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const loadPatientData = async () => {
      try {
        const userToken = localStorage.getItem("token");
        const result = await axios.get(
          "http://localhost:8080/api/patients/me",
          {
            headers: { Authorization: `Bearer ${userToken}` },
          },
        );
        setPatientData(result.data);
        toast.success("Đã tải thông tin bệnh nhân!");
      } catch (err) {
        console.log("Có lỗi khi tải thông tin:", err);
        toast.error("Không thể tải thông tin. Vui lòng thử lại!");
      } finally {
        setIsLoading(false);
      }
    };
    loadPatientData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientData({ ...patientData, [name]: value });
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!patientData || !patientData.id) {
      toast.error("Dữ liệu bệnh nhân không hợp lệ!");
      return;
    }

    setIsSaving(true);
    const loadingMsg = toast.loading("Đang lưu thông tin...");

    try {
      const userToken = localStorage.getItem("token");
      await axios.put(
        `http://localhost:8080/api/patients/${patientData.id}`,
        patientData,
        { headers: { Authorization: `Bearer ${userToken}` } },
      );

      toast.dismiss(loadingMsg);
      toast.success("Đã cập nhật thông tin!");
    } catch (err) {
      console.log("Lỗi khi cập nhật:", err);
      toast.dismiss(loadingMsg);
      toast.error("Không thể cập nhật thông tin!");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error("Mật khẩu mới không khớp!");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    setIsUpdatingPassword(true);
    const loadingMsg = toast.loading("Đang thay đổi mật khẩu...");

    try {
      const userToken = localStorage.getItem("token");
      await axios.put(
        "http://localhost:8080/api/users/change-password",
        {
          currentPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        },
        { headers: { Authorization: `Bearer ${userToken}` } },
      );

      toast.dismiss(loadingMsg);
      toast.success("Đã đổi mật khẩu!");

      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setShowPasswordForm(false);
    } catch (err) {
      console.log("Lỗi khi đổi mật khẩu:", err);
      toast.dismiss(loadingMsg);

      if (err.response && err.response.status === 400) {
        toast.error("Mật khẩu cũ không đúng!");
      } else {
        toast.error("Không thể đổi mật khẩu!");
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleReload = () => {
    setIsLoading(true);
    hasLoaded.current = false;
    const loadPatientData = async () => {
      try {
        const userToken = localStorage.getItem("token");
        const result = await axios.get(
          "http://localhost:8080/api/patients/me",
          {
            headers: { Authorization: `Bearer ${userToken}` },
          },
        );
        setPatientData(result.data);
        toast.success("Đã tải thông tin bệnh nhân!");
      } catch (err) {
        console.log("Có lỗi khi tải thông tin:", err);
        toast.error("Không thể tải thông tin. Vui lòng thử lại!");
      } finally {
        setIsLoading(false);
      }
    };
    loadPatientData();
  };

  if (isLoading)
    return (
      <div className="loading">
        <p>Đang tải...</p>
      </div>
    );

  if (!patientData)
    return (
      <div className="error-message">
        <p>Không có thông tin bệnh nhân.</p>
        <button className="retry-button" onClick={handleReload}>
          Tải lại
        </button>
      </div>
    );

  return (
    <div className="patient-info-container">
      <div className="patient-info-header">
        <h2>Thông tin bệnh nhân</h2>
        <p>Quản lý thông tin cá nhân</p>
      </div>

      <div className="patient-card">
        <form onSubmit={handleFormSubmit} className="patient-form">
          <div className="form-section">
            <h3>Thông tin cá nhân</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Họ tên *</label>
                <input
                  type="text"
                  name="fullName"
                  value={patientData.fullName || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Ngày sinh</label>
                <input
                  type="date"
                  name="dob"
                  value={patientData.dob || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="text"
                  name="phone"
                  value={patientData.phone || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={patientData.email || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Địa chỉ</label>
              <input
                type="text"
                name="address"
                value={patientData.address || ""}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Thông tin y tế</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Triệu chứng</label>
                <input
                  type="text"
                  name="symptoms"
                  value={patientData.symptoms || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>BHYT</label>
                <input
                  type="text"
                  name="bhyt"
                  value={patientData.bhyt || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Thông tin người nhà</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Tên người nhà</label>
                <input
                  type="text"
                  name="relativeName"
                  value={patientData.relativeName || ""}
                  onChange={handleInputChange}
                  placeholder="Nhập tên người nhà"
                />
              </div>

              <div className="form-group">
                <label>Điện thoại người nhà</label>
                <input
                  type="text"
                  name="relativePhone"
                  value={patientData.relativePhone || ""}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Quan hệ</label>
                <select
                  name="relativeRelationship"
                  value={patientData.relativeRelationship || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Chọn quan hệ</option>
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
                  value={patientData.relativeAddress || ""}
                  onChange={handleInputChange}
                  placeholder="Nhập địa chỉ"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>

      <div className="password-section">
        <div className="section-header">
          <h3>Mật khẩu</h3>
          <button
            type="button"
            className="change-password-btn"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            {showPasswordForm ? "Ẩn" : "Đổi mật khẩu"}
          </button>
        </div>

        {showPasswordForm && (
          <div className="password-form-card">
            <form onSubmit={handlePasswordUpdate}>
              <div className="form-row">
                <div className="form-group">
                  <label>Mật khẩu hiện tại *</label>
                  <input
                    type="password"
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordInputChange}
                    required
                    placeholder="Mật khẩu hiện tại"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Mật khẩu mới *</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    required
                    placeholder="Mật khẩu mới (6 ký tự)"
                    minLength="6"
                  />
                </div>

                <div className="form-group">
                  <label>Xác nhận mật khẩu *</label>
                  <input
                    type="password"
                    name="confirmNewPassword"
                    value={passwordData.confirmNewPassword}
                    onChange={handlePasswordInputChange}
                    required
                    placeholder="Nhập lại mật khẩu"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="save-btn"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({
                      oldPassword: "",
                      newPassword: "",
                      confirmNewPassword: "",
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
