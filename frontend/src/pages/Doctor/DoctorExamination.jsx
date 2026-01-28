import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../css/DoctorExamination.css";

function DoctorExamination() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  // Khai báo state
  const [appointment, setAppointment] = useState(null);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [showPaymentNotice, setShowPaymentNotice] = useState(false);
  const [isExamFinished, setIsExamFinished] = useState(false);

  // State cho form dữ liệu
  const [formValues, setFormValues] = useState({
    chiefComplaint: "",
    historyOfIllness: "",
    physicalExamination: "",
    vitalSigns: {
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      respiratoryRate: "",
      height: "",
      weight: "",
    },
    preliminaryDiagnosis: "",
    finalDiagnosis: "",
    treatmentPlan: "",
    medications: [],
    labTests: [],
    advice: "",
    followUpDate: "",
    followUpNotes: "",
  });

  // Hàm kiểm tra trạng thái thanh toán
  const getPaymentStatus = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const url = `http://localhost:8080/api/doctor/medical-records/${appointmentId}/payment-status`;

      const response = await fetch(url, {
        headers: {
          Authorization: "Bearer " + userData.token,
        },
      });

      if (response.status === 200) {
        const data = await response.json();
        if (data.success) {
          setPaymentInfo(data);
          return data;
        }
      }
      return null;
    } catch (err) {
      console.log("Lỗi khi kiểm tra thanh toán:", err);
      return null;
    }
  };

  // Lấy thông tin cuộc hẹn và hồ sơ bệnh án
  useEffect(() => {
    async function getExaminationData() {
      try {
        setLoading(true);
        const userData = JSON.parse(localStorage.getItem("user"));
        const url = `http://localhost:8080/api/doctor/medical-records/${appointmentId}`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + userData.token,
          },
        });

        if (response.status !== 200) {
          throw new Error("Không tải được thông tin khám bệnh");
        }

        const result = await response.json();

        if (result.success) {
          setAppointment(result.appointment);
          setMedicalRecord(result.medicalRecord);

          let finished = false;
          if (
            result.medicalRecord &&
            result.medicalRecord.examinationStatus === "COMPLETED"
          ) {
            finished = true;
          }
          setIsExamFinished(finished);

          // Nếu có dữ liệu hồ sơ, điền vào form
          if (result.medicalRecord) {
            let vitalData = result.medicalRecord.vitalSigns || {};
            if (typeof vitalData === "string") {
              try {
                vitalData = JSON.parse(vitalData);
              } catch {
                vitalData = {};
              }
            }

            setFormValues({
              chiefComplaint: result.medicalRecord.chiefComplaint || "",
              historyOfIllness: result.medicalRecord.historyOfIllness || "",
              physicalExamination:
                result.medicalRecord.physicalExamination || "",
              vitalSigns: {
                bloodPressure: vitalData.bloodPressure || "",
                heartRate: vitalData.heartRate || "",
                temperature: vitalData.temperature || "",
                respiratoryRate: vitalData.respiratoryRate || "",
                height: vitalData.height || "",
                weight: vitalData.weight || "",
              },
              preliminaryDiagnosis:
                result.medicalRecord.preliminaryDiagnosis || "",
              finalDiagnosis: result.medicalRecord.finalDiagnosis || "",
              treatmentPlan: result.medicalRecord.treatmentPlan || "",
              medications: result.medicalRecord.medications || [],
              labTests: result.medicalRecord.labTests || [],
              advice: result.medicalRecord.advice || "",
              followUpDate: result.medicalRecord.followUpDate || "",
              followUpNotes: result.medicalRecord.followUpNotes || "",
            });
          }

          // Kiểm tra thanh toán
          const paymentData = await getPaymentStatus();
          if (
            paymentData &&
            !paymentData.isPaid &&
            result.medicalRecord &&
            result.medicalRecord.examinationStatus === "COMPLETED"
          ) {
            setShowPaymentNotice(true);
          }
        } else {
          throw new Error(result.message || "Không tìm thấy thông tin khám");
        }
      } catch (err) {
        console.log("Lỗi khi lấy dữ liệu khám:", err);
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    }

    getExaminationData();
  }, [appointmentId]);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const fieldName = e.target.name;
    const fieldValue = e.target.value;
    setFormValues((prev) => ({
      ...prev,
      [fieldName]: fieldValue,
    }));
  };

  // Xử lý thay đổi dấu hiệu sinh tồn
  const handleVitalChange = (e) => {
    const fieldName = e.target.name;
    const fieldValue = e.target.value;
    setFormValues((prev) => ({
      ...prev,
      vitalSigns: {
        ...prev.vitalSigns,
        [fieldName]: fieldValue,
      },
    }));
  };

  // Lưu kết quả khám tạm thời
  const saveExamination = async () => {
    if (
      !window.confirm(
        "Xác nhận lưu kết quả khám? Bạn vẫn có thể chỉnh sửa sau.",
      )
    ) {
      return;
    }

    try {
      setIsSaving(true);
      const userData = JSON.parse(localStorage.getItem("user"));

      // Chuẩn bị dữ liệu gửi lên server
      const requestData = {
        appointmentId: parseInt(appointmentId),
        doctorId: appointment.doctorId,
        chiefComplaint: formValues.chiefComplaint,
        historyOfIllness: formValues.historyOfIllness,
        physicalExamination: formValues.physicalExamination,
        vitalSigns: JSON.stringify(formValues.vitalSigns),
        preliminaryDiagnosis: formValues.preliminaryDiagnosis,
        finalDiagnosis: formValues.finalDiagnosis,
        treatmentPlan: formValues.treatmentPlan,
        medications: JSON.stringify(formValues.medications),
        labTests: JSON.stringify(formValues.labTests),
        advice: formValues.advice,
        followUpDate: formValues.followUpDate,
        followUpNotes: formValues.followUpNotes,
        examinationStatus: "IN_PROGRESS",
      };

      const url = `http://localhost:8080/api/doctor/medical-records/${appointmentId}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + userData.token,
        },
        body: JSON.stringify(requestData),
      });

      if (response.status !== 200) {
        const errorText = await response.text();
        throw new Error("HTTP " + response.status + ": " + errorText);
      }

      const result = await response.json();

      if (result.success) {
        alert("Đã lưu kết quả khám!");
        setMedicalRecord(result.medicalRecord);
      } else {
        throw new Error(result.message || "Lỗi khi lưu kết quả");
      }
    } catch (err) {
      console.log("Lỗi khi lưu kết quả:", err);
      alert("Lỗi: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Hoàn thành khám bệnh
  const finishExamination = async () => {
    if (
      !window.confirm(
        "Xác nhận hoàn thành khám? Sau khi hoàn thành không thể sửa.",
      )
    ) {
      return;
    }

    try {
      setIsSaving(true);
      const userData = JSON.parse(localStorage.getItem("user"));

      const requestData = {
        appointmentId: parseInt(appointmentId),
        doctorId: appointment.doctorId,
        chiefComplaint: formValues.chiefComplaint,
        historyOfIllness: formValues.historyOfIllness,
        physicalExamination: formValues.physicalExamination,
        vitalSigns: JSON.stringify(formValues.vitalSigns),
        preliminaryDiagnosis: formValues.preliminaryDiagnosis,
        finalDiagnosis: formValues.finalDiagnosis,
        treatmentPlan: formValues.treatmentPlan,
        medications: JSON.stringify(formValues.medications),
        labTests: JSON.stringify(formValues.labTests),
        advice: formValues.advice,
        followUpDate: formValues.followUpDate,
        followUpNotes: formValues.followUpNotes,
        examinationStatus: "COMPLETED",
      };

      const url = `http://localhost:8080/api/doctor/medical-records/${appointmentId}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + userData.token,
        },
        body: JSON.stringify(requestData),
      });

      if (response.status !== 200) {
        const errorText = await response.text();
        throw new Error("HTTP " + response.status + ": " + errorText);
      }

      const result = await response.json();

      if (result.success) {
        setMedicalRecord(result.medicalRecord);
        setIsExamFinished(true);

        // Kiểm tra thanh toán
        const paymentData = await getPaymentStatus();

        if (paymentData && paymentData.isPaid) {
          alert("Đã hoàn thành khám! Chuyển đến kê đơn thuốc...");
          navigate(
            `/doctor/prescription/${appointmentId}/${result.medicalRecord.id}`,
          );
        } else {
          alert("Đã hoàn thành khám! Đang chờ thanh toán...");
          setShowPaymentNotice(true);
        }
      } else {
        throw new Error(result.message || "Lỗi khi hoàn thành khám");
      }
    } catch (err) {
      console.log("Lỗi khi hoàn thành khám:", err);
      alert("Lỗi: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Kiểm tra lại thanh toán
  const checkPaymentAgain = async () => {
    const paymentData = await getPaymentStatus();
    if (paymentData && paymentData.isPaid) {
      alert("Bệnh nhân đã thanh toán! Có thể kê đơn thuốc.");
      setShowPaymentNotice(false);
    } else {
      alert("Bệnh nhân chưa thanh toán. Vui lòng chờ...");
    }
  };

  // Hiển thị loading
  if (loading) {
    return (
      <div className="doctor-examination-container">
        <div className="examination-content-wrapper">
          <div className="examination-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải thông tin khám bệnh...</p>
          </div>
        </div>
      </div>
    );
  }

  // Hiển thị lỗi
  if (errorMessage) {
    return (
      <div className="doctor-examination-container">
        <div className="examination-content-wrapper">
          <div className="examination-error">
            <h3>Lỗi</h3>
            <p>{errorMessage}</p>
            <button onClick={() => navigate("/doctor/appointments")}>
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-examination-container">
      <div className="examination-content-wrapper">
        {/* Phần header */}
        <div className="examination-header">
          <button
            className="back-button"
            onClick={() => navigate("/doctor/appointments")}
          >
            Quay lại
          </button>
          <h1>Khám Bệnh</h1>
          <div className="patient-info-header">
            <h2>{appointment ? appointment.fullName : ""}</h2>
            <div className="patient-meta">
              <span>
                Mã BN: {appointment ? appointment.registrationNumber : ""}
              </span>
              <span>
                Số thứ tự: #{appointment ? appointment.queueNumber : ""}
              </span>
              <span>Phòng: {appointment ? appointment.roomNumber : ""}</span>
              {medicalRecord && (
                <span
                  className={
                    "status-" +
                    (medicalRecord.examinationStatus
                      ? medicalRecord.examinationStatus.toLowerCase()
                      : "")
                  }
                >
                  Trạng thái:{" "}
                  {medicalRecord.examinationStatus === "COMPLETED"
                    ? "ĐÃ HOÀN THÀNH"
                    : "ĐANG KHÁM"}
                </span>
              )}
              {paymentInfo && (
                <span
                  className={
                    "payment-status " + (paymentInfo.isPaid ? "paid" : "unpaid")
                  }
                >
                  Thanh toán:{" "}
                  {paymentInfo.isPaid ? "ĐÃ THANH TOÁN" : "CHƯA THANH TOÁN"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Thông báo chờ thanh toán */}
        {showPaymentNotice &&
          isExamFinished &&
          paymentInfo &&
          !paymentInfo.isPaid && (
            <div className="payment-alert">
              <div className="alert-content">
                <div className="alert-text">
                  <h3>Chờ Thanh Toán</h3>
                  <p>
                    Bệnh nhân cần thanh toán phí khám trước khi kê đơn thuốc.
                  </p>
                  <div className="payment-details">
                    <p>
                      <strong>Mã hóa đơn:</strong>{" "}
                      {paymentInfo.invoiceCode || "INV-" + appointmentId}
                    </p>
                    <p>
                      <strong>Số tiền:</strong>{" "}
                      {appointment && appointment.examinationFee
                        ? appointment.examinationFee.toLocaleString()
                        : "200,000"}{" "}
                      VND
                    </p>
                    <p>
                      <strong>Trạng thái:</strong>{" "}
                      <span className="status-unpaid">CHƯA THANH TOÁN</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="alert-actions">
                <button
                  className="check-payment-button"
                  onClick={checkPaymentAgain}
                >
                  Kiểm tra lại thanh toán
                </button>
              </div>
            </div>
          )}

        {/* Thông tin bệnh nhân */}
        <div className="patient-info-card">
          <h3>Thông Tin Bệnh Nhân</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Tuổi:</label>
              <span>
                {appointment && appointment.dob
                  ? new Date().getFullYear() -
                    new Date(appointment.dob).getFullYear() +
                    " tuổi"
                  : "Chưa có"}
              </span>
            </div>
            <div className="info-item">
              <label>Giới tính:</label>
              <span>{appointment ? appointment.gender : ""}</span>
            </div>
            <div className="info-item">
              <label>Số điện thoại:</label>
              <span>{appointment ? appointment.phone : ""}</span>
            </div>
            <div className="info-item">
              <label>Triệu chứng:</label>
              <span className="symptoms">
                {appointment && appointment.symptoms
                  ? appointment.symptoms
                  : "Chưa có"}
              </span>
            </div>
          </div>
        </div>

        {/* Form khám bệnh */}
        <div className="examination-form">
          {/* Lý do khám & Tiền sử */}
          <div className="form-section">
            <h3>Lý Do Khám & Tiền Sử</h3>
            <div className="form-group">
              <label>Lý do khám chính:</label>
              <textarea
                name="chiefComplaint"
                value={formValues.chiefComplaint}
                onChange={handleChange}
                placeholder="Mô tả lý do khám chính..."
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Tiền sử bệnh:</label>
              <textarea
                name="historyOfIllness"
                value={formValues.historyOfIllness}
                onChange={handleChange}
                placeholder="Mô tả tiền sử bệnh..."
                rows="3"
              />
            </div>
          </div>

          {/* Dấu hiệu sinh tồn */}
          <div className="form-section">
            <h3>Dấu Hiệu Sinh Tồn</h3>
            <div className="vital-signs-grid">
              <div className="form-group">
                <label>Huyết áp (mmHg):</label>
                <input
                  type="text"
                  name="bloodPressure"
                  value={formValues.vitalSigns.bloodPressure}
                  onChange={handleVitalChange}
                  placeholder="120/80"
                />
              </div>
              <div className="form-group">
                <label>Nhịp tim (bpm):</label>
                <input
                  type="number"
                  name="heartRate"
                  value={formValues.vitalSigns.heartRate}
                  onChange={handleVitalChange}
                  placeholder="72"
                />
              </div>
              <div className="form-group">
                <label>Nhiệt độ (°C):</label>
                <input
                  type="number"
                  name="temperature"
                  value={formValues.vitalSigns.temperature}
                  onChange={handleVitalChange}
                  placeholder="37.0"
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Nhịp thở (lần/phút):</label>
                <input
                  type="number"
                  name="respiratoryRate"
                  value={formValues.vitalSigns.respiratoryRate}
                  onChange={handleVitalChange}
                  placeholder="16"
                />
              </div>
              <div className="form-group">
                <label>Chiều cao (cm):</label>
                <input
                  type="number"
                  name="height"
                  value={formValues.vitalSigns.height}
                  onChange={handleVitalChange}
                  placeholder="170"
                />
              </div>
              <div className="form-group">
                <label>Cân nặng (kg):</label>
                <input
                  type="number"
                  name="weight"
                  value={formValues.vitalSigns.weight}
                  onChange={handleVitalChange}
                  placeholder="65"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Khám lâm sàng */}
          <div className="form-section">
            <h3>Khám Lâm Sàng</h3>
            <div className="form-group">
              <label>Khám thực thể:</label>
              <textarea
                name="physicalExamination"
                value={formValues.physicalExamination}
                onChange={handleChange}
                placeholder="Kết quả khám thực thể..."
                rows="4"
              />
            </div>
          </div>

          {/* Chẩn đoán */}
          <div className="form-section">
            <h3>Chẩn Đoán</h3>
            <div className="form-group">
              <label>Chẩn đoán sơ bộ:</label>
              <textarea
                name="preliminaryDiagnosis"
                value={formValues.preliminaryDiagnosis}
                onChange={handleChange}
                placeholder="Chẩn đoán sơ bộ..."
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Chẩn đoán xác định:</label>
              <textarea
                name="finalDiagnosis"
                value={formValues.finalDiagnosis}
                onChange={handleChange}
                placeholder="Chẩn đoán xác định..."
                rows="3"
              />
            </div>
          </div>

          {/* Điều trị */}
          <div className="form-section">
            <h3>Điều Trị</h3>
            <div className="form-group">
              <label>Kế hoạch điều trị:</label>
              <textarea
                name="treatmentPlan"
                value={formValues.treatmentPlan}
                onChange={handleChange}
                placeholder="Kế hoạch điều trị..."
                rows="4"
              />
            </div>
          </div>

          {/* Tư vấn & Theo dõi */}
          <div className="form-section">
            <h3>Tư Vấn & Theo Dõi</h3>
            <div className="form-group">
              <label>Lời khuyên:</label>
              <textarea
                name="advice"
                value={formValues.advice}
                onChange={handleChange}
                placeholder="Lời khuyên cho bệnh nhân..."
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Ngày tái khám:</label>
              <input
                type="date"
                name="followUpDate"
                value={formValues.followUpDate}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Ghi chú tái khám:</label>
              <textarea
                name="followUpNotes"
                value={formValues.followUpNotes}
                onChange={handleChange}
                placeholder="Ghi chú cho lần tái khám..."
                rows="2"
              />
            </div>
          </div>

          {/* Nút hành động */}
          <div className="examination-actions">
            <button
              className="save-button"
              onClick={saveExamination}
              disabled={isSaving || isExamFinished}
            >
              {isSaving ? "Đang lưu..." : "Lưu Kết Quả"}
            </button>

            <button
              className="complete-button"
              onClick={finishExamination}
              disabled={isSaving || isExamFinished}
            >
              {isSaving
                ? "Đang xử lý..."
                : isExamFinished
                  ? "Đã Hoàn Thành"
                  : "Hoàn Thành Khám"}
            </button>
          </div>

          {/* Thông báo lỗi nếu có */}
          {errorMessage &&
            errorMessage.includes("Query did not return a unique result") && (
              <div className="error-message">
                <h4>Cảnh báo: Lỗi dữ liệu trùng lặp</h4>
                <p>
                  Có nhiều hơn một hồ sơ khám cho lịch hẹn này. Vui lòng liên hệ
                  quản trị viên.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default DoctorExamination;
