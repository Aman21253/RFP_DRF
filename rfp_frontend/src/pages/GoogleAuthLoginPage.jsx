import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function GoogleAuthLoginPage() {
  const navigate = useNavigate();
  const email    = localStorage.getItem("pending_email") || "";
  const [totpCode, setTotpCode] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const onVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await API.post("auth/google-login-verify/", { email, totp_code: totpCode });
      localStorage.setItem("access_token",  res.data.tokens.access);
      localStorage.setItem("refresh_token", res.data.tokens.refresh);
      localStorage.setItem("user_role",     res.data.role || "vendor");
      localStorage.removeItem("pending_email");
      navigate("/vendor-dashboard");
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || "Verification failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 text-center">Two-factor authentication</h1>
          <p className="text-slate-500 text-sm text-center mt-2">
            Open Google Authenticator and enter the code for<br />
            <span className="font-semibold text-slate-700">{email}</span>
          </p>

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="mt-6">
            <input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-2xl tracking-[0.5em] font-mono outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition"
            />
          </div>

          <button
            onClick={onVerify}
            disabled={loading || totpCode.length !== 6}
            className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition"
          >
            {loading ? "Verifying…" : "Verify code"}
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