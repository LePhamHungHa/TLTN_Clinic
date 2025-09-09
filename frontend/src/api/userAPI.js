
const BASE_URL = "http://localhost:8080/api/auth";

export const loginUser = async (credentials) => {
  console.log("Gửi yêu cầu đến backend (login):", credentials);
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await res.json();
  console.log("Phản hồi từ backend (login):", data);

  if (!res.ok) {
    throw new Error(data.error || "Sai tài khoản hoặc mật khẩu");
  }
  return data;
};

export const registerUser = async (userData) => {
  console.log("Gửi yêu cầu đến backend (register):", userData);
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  // IMPORTANT: phải parse JSON trước khi dùng
  const data = await res.json();
  console.log("Phản hồi từ backend (register):", data);

  if (!res.ok) {
    // trả về message lỗi rõ ràng từ backend nếu có
    throw new Error(data.error || data.message || "Đăng ký thất bại");
  }

  return data;
};