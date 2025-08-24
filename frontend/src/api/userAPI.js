const BASE_URL = "http://localhost:8080/api/auth";

export const loginUser = async (credentials) => {
  console.log("Gửi yêu cầu đến backend:", credentials);
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const data = await res.json();
  console.log("Phản hồi từ backend:", data);
  if (!res.ok) {
    throw new Error(data.error || "Sai tài khoản hoặc mật khẩu");
  }
  return data;
};

export const registerUser = async (user) => {
  console.log("Gửi yêu cầu đăng ký:", user);
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  const data = await res.json();
  console.log("Phản hồi đăng ký:", data);
  if (!res.ok) {
    throw new Error(data.error || "Đăng ký thất bại");
  }
  return data;
};