import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await API.post("auth/login/", {
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (res.data.requires_google_auth) {
        localStorage.setItem("pending_email", res.data.email);
        navigate("/google-auth-login");
        return;
      }

      if (res.data.email && !res.data.tokens) {
        localStorage.setItem("pending_email", res.data.email);
        navigate("/otp");
        return;
      }

      if (res.data.tokens?.access) {
        localStorage.setItem("access_token",  res.data.tokens.access);
        localStorage.setItem("refresh_token", res.data.tokens.refresh);
        localStorage.setItem("user_role",     res.data.role || "");
        if (res.data.organization) {
          localStorage.setItem("org_slug", res.data.organization.slug);
          localStorage.setItem("org_name", res.data.organization.name);
        }
        navigate(res.data.role === "admin" ? "/admin-dashboard" : "/vendor-dashboard");
      } else {
        setError("Unexpected login response.");
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        "Login failed. Check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">RFP Platform</h1>
          <p className="text-slate-400 mt-1 text-sm">Procurement made simple</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="you@company.com"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={onChange}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPwd ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 transition"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  Signing in…
                </span>
              ) : "Sign in"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
            <button
              onClick={() => navigate("/vendor-register")}
              className="w-full rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Register as vendor
            </button>
            <button
              onClick={() => navigate("/organization-register")}
              className="w-full rounded-xl border border-blue-200 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
            >
              Register your organisation         
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}