const BASE_URL = "http://localhost:8080/api";

export const getAppointmentsByUser = async (userId) => {
  const res = await fetch(`${BASE_URL}/appointments?userId=${userId}`);
  return res.json();
};

export const createAppointment = async (data) => {
  const res = await fetch(`${BASE_URL}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};
