import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ToastProvider from "./components/ToastProvider";
import Header from "./components/Header.jsx";
import Home from "./components/Home.jsx";
import Footer from "./components/Footer.jsx";
import Patients from "./pages/Patients.jsx";
import Appointments from "./pages/Patient/Appointments.jsx";
import Login from "./pages/Auth/Login.jsx";
import Register from "./pages/Auth/Register.jsx";
import RegisterPatient from "./pages/Patient/RegisterPatient.jsx";
import CreateCard from "./pages/CreateCard.jsx";
import WalletPage from "./pages/Patient/WalletPage.jsx";
import PaymentPage from "./pages/Patient/PaymentPage.jsx";
import PatientInfo from "./pages/Patient/PatientInfo.jsx";
import AppointmentsPage from "./pages/Patient/Appointments.jsx";
import BMIPage from "./pages/Patient/BMIPage.jsx";

function App() {
  const user = JSON.parse(localStorage.getItem("user")) || null;

  const PrivateRoute = ({ children, role }) => {
    const user = JSON.parse(localStorage.getItem("user")) || null;
    if (!user) return <Navigate to="/login" />;
    if (role && user.role !== role) return <Navigate to="/" />;
    return children;
  };

  const GuestRoute = ({ children }) => {
    return !user ? children : <Navigate to="/" />;
  };

  return (
    <Router>
      <ToastProvider />

      <Routes>
        {/* Trang chủ */}
        <Route
          path="/"
          element={
            <>
              <Header />
              <Home />
              <Footer />
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

        {/* Ví điện tử (chỉ dành cho bệnh nhân) */}
        <Route
          path="/wallet"
          element={
            <PrivateRoute role="PATIENT">
              <>
                <Header />
                <WalletPage />
              </>
            </PrivateRoute>
          }
        />

        {/* Tạo thẻ thanh toán (role bệnh nhân) */}
        <Route
          path="/create-card"
          element={
            <>
              <Header />
              <CreateCard />
            </>
          }
        />

        {/* Thanh toán tiền khám bênh */}
        <Route
          path="/payment"
          element={
            <>
              <Header />
              <PaymentPage />
              <Footer />
            </>
          }
        />

        {/* Thông tin cá nhân (chỉ dành cho bệnh nhân) */}
        <Route
          path="/patient/info"
          element={
            <>
              <Header />
              <PatientInfo />
            </>
          }
        />
        {/* Lịch hẹn của bệnh nhân */}
        <Route
          path="/patient/appointments"
          element={
            <>
              <Header />
              <AppointmentsPage />
            </>
          }
        />
        {/* BMI của bệnh nhân */}
        <Route
          path="/patient/health-tracking"
          element={
            <>
              <Header />
              <BMIPage />
            </>
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

        {/* Mặc định */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
