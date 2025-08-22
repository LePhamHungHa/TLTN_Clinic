import React, { useEffect, useState } from "react";
import { getAppointmentsByUser } from "../api/appointmentAPI";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Appointments = ({ userId }) => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    getAppointmentsByUser(userId).then(setAppointments);
  }, [userId]);

  return (
    <div>
      <Header />
      <h2>Lịch hẹn</h2>
      <ul>
        {appointments.map(a => (
          <li key={a.id}>
            Ngày: {a.date}, Giờ: {a.time}, Bác sĩ: {a.doctorName}
          </li>
        ))}
      </ul>
      <Footer />
    </div>
  );
};

export default Appointments;
