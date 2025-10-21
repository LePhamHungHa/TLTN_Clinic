import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../css/AppointmentsPage.css";

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const token = localStorage.getItem("token");

        if (!user?.email || !token) {
          setError("Vui lòng đăng nhập để xem lịch hẹn");
          setLoading(false);
          return;
        }

        console.log("🔍 Fetching appointments for email:", user.email);

        const response = await axios.get(
          `http://localhost:8080/api/patient-registrations/by-email?email=${encodeURIComponent(
            user.email
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );

        console.log("✅ Appointments data received:", response.data);

        // Log thông tin bác sĩ để debug
        response.data.forEach((appointment) => {
          if (appointment.doctor) {
            console.log(
              `👨‍⚕️ Appointment ${appointment.id}: Doctor = ${appointment.doctor.fullName}`
            );
          }
        });

        setAppointments(response.data);
        setError(null);
      } catch (err) {
        console.error("❌ Lỗi tải lịch hẹn:", err);

        if (err.response?.status === 403) {
          setError("Không có quyền truy cập. Vui lòng đăng nhập lại.");
        } else if (err.response?.status === 404) {
          setError("Không tìm thấy lịch hẹn nào.");
        } else if (err.response?.status === 500) {
          setError("Lỗi server. Vui lòng thử lại sau.");
        } else {
          setError("Không thể tải danh sách lịch hẹn. Vui lòng thử lại sau.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [refreshCount]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshCount((prev) => prev + 1);
  };

  // Hàm hiển thị thông tin bác sĩ
  const getDoctorInfo = (appointment) => {
    if (appointment.doctor) {
      const doctor = appointment.doctor;
      let info = doctor.fullName;

      if (doctor.degree) {
        info += ` - ${doctor.degree}`;
      }
      if (doctor.position) {
        info += ` (${doctor.position})`;
      }

      return info;
    }
    return "Chưa chỉ định bác sĩ";
  };

  if (loading) {
    return (
      <div className="appointments-container">
        <div className="loading">Đang tải lịch hẹn...</div>
      </div>
    );
  }

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h2>📅 Lịch hẹn của tôi</h2>
        <button
          className="refresh-button"
          onClick={handleRefresh}
          disabled={loading}
        >
          🔄 Làm mới
        </button>
      </div>

      {error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-button">
            Thử lại
          </button>
        </div>
      ) : appointments.length === 0 ? (
        <div className="no-appointments">
          <p>Không có lịch hẹn nào.</p>
          <button onClick={handleRefresh} className="retry-button">
            Kiểm tra lại
          </button>
        </div>
      ) : (
        <>
          <div className="appointments-info">
            <p>
              Tìm thấy <strong>{appointments.length}</strong> lịch hẹn
            </p>
            <button onClick={handleRefresh} className="refresh-small">
              Làm mới
            </button>
          </div>
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Ngày khám</th>
                <th>Giờ khám</th>
                <th>Khoa</th>
                <th>Bác sĩ</th>
                <th>Triệu chứng</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{appointment.appointmentDate}</td>
                  <td>{appointment.appointmentTime}</td>
                  <td>{appointment.department}</td>
                  <td>
                    <div className="doctor-info">
                      <strong>{getDoctorInfo(appointment)}</strong>
                      {appointment.doctor?.specialty && (
                        <div className="doctor-specialty">
                          Chuyên khoa: {appointment.doctor.specialty}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{appointment.symptoms || "Không có"}</td>
                  <td>
                    <span
                      className={`status ${
                        appointment.status?.toLowerCase() || "pending"
                      }`}
                    >
                      {appointment.status || "Đang xử lý"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default AppointmentsPage;
