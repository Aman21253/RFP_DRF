import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

function OTPPage() {
  const navigate = useNavigate();
  const email = localStorage.getItem("pending_email") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const verifyOTP = async () => {
    try {
      const res = await API.post("auth/verify-otp/", { email, otp });
      localStorage.setItem("access_token", res.data.tokens.access);
      localStorage.setItem("refresh_token", res.data.tokens.refresh);
      const role = res.data.role || "vendor";
      localStorage.setItem("user_role", role);
      if (role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/vendor-dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP");
    }
  };

  const resendOTP = async () => {
    try {
      const res = await API.post("auth/resend-otp/", { email });
      setMsg(res.data.message || "OTP resent");
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Resend failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">
          Verify OTP
        </h2>
        <p className="text-center text-slate-500 mb-6">{email}</p>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {msg && (
          <div className="bg-green-100 text-green-600 p-3 rounded-lg mb-4 text-sm">
            {msg}
          </div>
        )}

        <input
          type="text"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400 mb-4"
        />

        <button
          onClick={verifyOTP}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold mb-3"
        >
          Verify OTP
        </button>

        <button
          onClick={resendOTP}
          className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-lg font-semibold"
        >
          Resend OTP
        </button>
      </div>
    </div>
  );
}

export default OTPPage;