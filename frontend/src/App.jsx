import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Patients from "./pages/Patients.jsx";
import Appointments from "./pages/Appointments.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Header from "./components/Header.jsx";

function App() {
  const user = JSON.parse(localStorage.getItem("user")) || null;

  // Route cần login
  const PrivateRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" />;
  };

  // Route chỉ cho khách chưa login
  const GuestRoute = ({ children }) => {
    return !user ? children : <Navigate to="/" />;
  };

  return (
    <Router>
      {/* Header xuất hiện ở tất cả các trang */}
      <Header />

      <Routes>
        {/* Trang chủ */}
        <Route path="/" element={<Home />} />

        {/* Các route cần login */}
        <Route
          path="/patients"
          element={
            <PrivateRoute>
              <Patients />
            </PrivateRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <PrivateRoute>
              <Appointments userId={user?.id} />
            </PrivateRoute>
          }
        />

        {/* Đăng nhập / đăng ký */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />

        {/* Mặc định: redirect về home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;