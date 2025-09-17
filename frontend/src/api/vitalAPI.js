import axios from "axios";

const API_URL = "http://localhost:8080/api/vitals";

export const addVital = async (vital) => {
  return axios.post(API_URL, vital).then((res) => res.data);
};

export const getVitals = async (patientId) => {
  return axios.get(`${API_URL}/${patientId}`).then((res) => res.data);
};
