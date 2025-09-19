import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home.jsx";
import Patients from "./pages/Patients.jsx";
import Appointments from "./pages/Appointments.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Header from "./components/Header.jsx";
import RegisterPatient from "./pages/RegisterPatient.jsx";

// Components for future use - currently commented out to avoid errors
// import PatientDashboard from "./pages/patient/Dashboard.jsx";
// import DoctorDashboard from "./pages/doctor/Dashboard.jsx";
// import AdminDashboard from "./pages/admin/Dashboard.jsx";

function App() {
  const user = JSON.parse(localStorage.getItem("user")) || null;

  const PrivateRoute = ({ children, role }) => {
    if (!user) return <Navigate to="/login" />;
    if (role && user.role !== role) return <Navigate to="/" />;
    return children;
  };

  const GuestRoute = ({ children }) => {
    return !user ? children : <Navigate to="/" />;
  };

  return (
    <Router>
      <Routes>
        {/* Trang chủ */}
        <Route
          path="/"
          element={
            <>
              <Header />
              <Home />
            </>
          }
        />

        <Route
          path="/register-patient"
          element={
            <>
              <Header />
              <RegisterPatient />
            </>
          }
        />

        {/* Các route khác */}
        <Route
          path="/patients"
          element={
            <PrivateRoute role="ADMIN">
              <>
                <Header />
                <Patients />
              </>
            </PrivateRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <PrivateRoute>
              <>
                <Header />
                <Appointments />
              </>
            </PrivateRoute>
          }
        />

        {/* Portal cho Bệnh nhân - Commented for future use */}
        {/* <Route
          path="/patient/*"
          element={
            <PrivateRoute role="PATIENT">
              <>
                <Header />
                <PatientDashboard />
              </>
            </PrivateRoute>
          }
        /> */}

        {/* Portal cho Bác sĩ - Commented for future use */}
        {/* <Route
          path="/doctor/*"
          element={
            <PrivateRoute role="DOCTOR">
              <>
                <Header />
                <DoctorDashboard />
              </>
            </PrivateRoute>
          }
        /> */}

        {/* Portal cho Admin - Commented for future use */}
        {/* <Route
          path="/admin/*"
          element={
            <PrivateRoute role="ADMIN">
              <>
                <Header />
                <AdminDashboard />
              </>
            </PrivateRoute>
          }
        /> */}

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

        {/* Mặc định */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;