import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function GoogleAuthLoginPage() {
  const navigate = useNavigate();
  const email = localStorage.getItem("pending_email") || "";
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await API.post("auth/google-login-verify/", {
        email,
        totp_code: totpCode,
      });

      localStorage.setItem("access_token", res.data.tokens.access);
      localStorage.setItem("refresh_token", res.data.tokens.refresh);
      localStorage.setItem("user_role", res.data.role || "vendor");
      localStorage.removeItem("pending_email");

      navigate("/vendor-dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800">Google Authenticator</h1>
          <p className="mt-2 text-slate-500">Enter the 6-digit code from your app</p>
          <p className="mt-1 text-sm text-slate-400">{email}</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Enter 6-digit code"
          value={totpCode}
          onChange={(e) => setTotpCode(e.target.value)}
          maxLength={6}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 mb-4 text-center text-xl tracking-widest"
        />

        <button
          onClick={onVerify}
          disabled={loading || totpCode.length !== 6}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </div>
    </div>
  );
}