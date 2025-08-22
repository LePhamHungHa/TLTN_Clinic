import React, { useEffect, useState } from "react";
import { getPatients } from "../api/patientAPI";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Patients = () => {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    getPatients().then(setPatients);
  }, []);

  return (
    <div>
      <Header />
      <h2>Danh sách bệnh nhân</h2>
      <ul>
        {patients.map(p => (
          <li key={p.id}>
            {p.full_name} | {p.dob} | {p.phone} | {p.address}
          </li>
        ))}
      </ul>
      <Footer />
    </div>
  );
};

export default Patients;
