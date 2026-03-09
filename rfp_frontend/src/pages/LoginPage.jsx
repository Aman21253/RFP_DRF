import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("auth/login/", form);

      if (res.data.email) {
        localStorage.setItem("pending_email", res.data.email);
        navigate("/otp");
        return;
      }

      if (res.data.tokens?.access) {
        localStorage.setItem("access_token", res.data.tokens.access);
        localStorage.setItem("refresh_token", res.data.tokens.refresh);

        const role = res.data.role || "";
        localStorage.setItem("user_role", role);

        if (role === "admin") {
          navigate("/admin-dashboard");
        } else if (role === "vendor") {
          navigate("/vendor-dashboard");
        } else {
          setError("Unknown user role from server");
        }
      } else {
        setError("Login response invalid");
      }
    } catch (err) {
      console.log("LOGIN ERROR:", err.response?.data || err.message);

      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.response?.data?.non_field_errors?.[0] ||
        "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800">RFP_DFP</h1>
          <p className="mt-2 text-slate-500">Sign in to continue</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="Enter email"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder="Enter password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
          >
            {loading ? "Please wait..." : "Login"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/vendor-register")}
            className="w-full rounded-xl border border-blue-600 px-4 py-3 font-semibold text-blue-600 hover:bg-blue-50"
          >
            Register as Vendor
          </button>
        </form>
      </div>
    </div>
  );
}