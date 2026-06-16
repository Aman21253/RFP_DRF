import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import OTPPage from "./pages/OTPPage";
import VendorDashboard from "./pages/VendorDashboard";
import VendorRegister from "./pages/VendorRegister";
import AdminDashboard from "./pages/AdminDashboard";
import OrganizationRegister from "./pages/OrganizationRegister";
import AddRFPPage from "./pages/AddRFPPage";
import GoogleAuthLoginPage from "./pages/GoogleAuthLoginPage";
// Generic auth guard — must be logged in
function PrivateRoute({ children }) {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/" replace />;
}

// Role-specific guard
function AdminRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const role  = localStorage.getItem("user_role");
  if (!token) return <Navigate to="/" replace />;
  if (role !== "admin") return <Navigate to="/vendor-dashboard" replace />;
  return children;
}

function VendorRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const role  = localStorage.getItem("user_role");
  if (!token) return <Navigate to="/" replace />;
  if (role !== "vendor") return <Navigate to="/admin-dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"                    element={<LoginPage />} />
      <Route path="/otp"                 element={<OTPPage />} />
      <Route path="/google-auth-login"   element={<GoogleAuthLoginPage />} />
      <Route path="/vendor-register"     element={<VendorRegister />} />

      {/* Admin only */}
      <Route path="/admin-dashboard"     element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/add-rfp"             element={<AdminRoute><AddRFPPage /></AdminRoute>} />



      <Route path="/organization-register" element={<OrganizationRegister />}/>

      {/* Vendor only */}
      <Route path="/vendor-dashboard"    element={<VendorRoute><VendorDashboard /></VendorRoute>} />

      {/* Fallback */}
      <Route path="*"                    element={<Navigate to="/" replace />} />
    </Routes>
  );
}