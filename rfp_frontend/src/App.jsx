import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import OTPPage from "./pages/OTPPage";
import VendorDashboard from "./pages/VendorDashboard";
import VendorRegister from "./pages/VendorRegister";
import AdminDashboard from "./pages/AdminDashboard";
import AddRFPPage from "./pages/AddRFPPage";
import GoogleAuthLoginPage from "./pages/GoogleAuthLoginPage";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/otp" element={<OTPPage />} />
      <Route path="/google-auth-login" element={<GoogleAuthLoginPage />} />
      <Route path="/vendor-register" element={<VendorRegister />} />
      <Route path="/add-rfp" element={<PrivateRoute><AddRFPPage /></PrivateRoute>} />

      <Route
        path="/vendor-dashboard"
        element={
          <PrivateRoute>
            <VendorDashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin-dashboard"
        element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}