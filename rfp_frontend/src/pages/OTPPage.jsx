import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function OTPPage() {
  const navigate = useNavigate();
  const email    = localStorage.getItem("pending_email") || "";
  const [otp,     setOtp]     = useState("");
  const [error,   setError]   = useState("");
  const [msg,     setMsg]     = useState("");
  const [loading, setLoading] = useState(false);

  const verifyOTP = async () => {
    if (otp.length !== 6) { setError("Please enter the 6-digit OTP."); return; }
    setError(""); setMsg(""); setLoading(true);
    try {
      const res = await API.post("auth/verify-otp/", { email, otp });
      localStorage.setItem("access_token",  res.data.tokens.access);
      localStorage.setItem("refresh_token", res.data.tokens.refresh);
      localStorage.setItem("user_role",     res.data.role || "vendor");
      localStorage.removeItem("pending_email");
      navigate(res.data.role === "admin" ? "/admin-dashboard" : "/vendor-dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP. Please try again.");
    } finally { setLoading(false); }
  };

  const resendOTP = async () => {
    setError(""); setMsg("");
    try {
      const res = await API.post("auth/resend-otp/", { email });
      setMsg(res.data.message || "OTP resent to your email.");
    } catch (err) {
      setError(err.response?.data?.error || "Resend failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 text-center">Check your email</h1>
          <p className="text-slate-500 text-sm text-center mt-2">
            We sent a 6-digit code to<br />
            <span className="font-semibold text-slate-700">{email}</span>
          </p>

          {error && (
            <div className="mt-5 flex gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}
          {msg && (
            <div className="mt-5 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{msg}</div>
          )}

          <div className="mt-6">
            <input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-2xl tracking-[0.5em] font-mono outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <button
            onClick={verifyOTP}
            disabled={loading || otp.length !== 6}
            className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition"
          >
            {loading ? "Verifying…" : "Verify code"}
          </button>

          <button
            onClick={resendOTP}
            className="mt-3 w-full rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Resend code
          </button>

          <button
            onClick={() => navigate("/")}
            className="mt-3 w-full text-sm text-slate-400 hover:text-slate-600 transition"
          >
            ← Back to login
          </button>
        </div>
      </div>
    </div>
  );
}