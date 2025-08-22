const BASE_URL = "http://localhost:8080/api";

export const getPatients = async () => {
  const res = await fetch(`${BASE_URL}/patients`);
  return res.json();
};

export const getPatientById = async (id) => {
  const res = await fetch(`${BASE_URL}/patients/${id}`);
  return res.json();
};
