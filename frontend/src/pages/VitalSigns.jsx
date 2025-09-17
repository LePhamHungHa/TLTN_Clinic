import React, { useState, useEffect } from "react";
import { addVital, getVitals } from "../api/vitalAPI";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import "../css/vitalSigns.css";

const VitalSigns = ({ patientId }) => {
  const [form, setForm] = useState({
    bmi: "",
    bloodPressure: "",
    bloodSugar: "",
    spo2: "",
  });
  const [data, setData] = useState([]);

  useEffect(() => {
    if (patientId) {
      getVitals(patientId).then(setData);
    }
  }, [patientId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addVital({ ...form, patient: { id: patientId } });
    setData(await getVitals(patientId));
    setForm({ bmi: "", bloodPressure: "", bloodSugar: "", spo2: "" });
  };

  return (
    <div className="vital-container">
      <h2>Theo dõi chỉ số sức khỏe</h2>
      <form onSubmit={handleSubmit} className="vital-form">
        <input name="bmi" placeholder="BMI" value={form.bmi} onChange={handleChange} />
        <input name="bloodPressure" placeholder="Huyết áp" value={form.bloodPressure} onChange={handleChange} />
        <input name="bloodSugar" placeholder="Đường huyết" value={form.bloodSugar} onChange={handleChange} />
        <input name="spo2" placeholder="SpO2" value={form.spo2} onChange={handleChange} />
        <button type="submit">Lưu</button>
      </form>

      <LineChart width={600} height={300} data={data}>
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="bmi" stroke="#8884d8" />
        <Line type="monotone" dataKey="bloodSugar" stroke="#82ca9d" />
        <Line type="monotone" dataKey="spo2" stroke="#ff7300" />
      </LineChart>
    </div>
  );
};

export default VitalSigns;
