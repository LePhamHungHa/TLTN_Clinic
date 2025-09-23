import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Header from "./components/Header.jsx";
import Home from "./components/Home.jsx";
import Footer from "./components/Footer.jsx";
import Patients from "./pages/Patients.jsx";
import Appointments from "./pages/Appointments.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import RegisterPatient from "./pages/RegisterPatient.jsx";
import CreateCard from "./pages/CreateCard.jsx";
import WalletPage from "./pages/WalletPage.jsx"; // 👈 thêm import

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
            <PrivateRoute role="PATIENT">
              <>
                <Header />
                <CreateCard />
              </>
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

        {/* Mặc định */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
