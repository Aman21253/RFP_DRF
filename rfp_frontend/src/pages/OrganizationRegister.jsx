import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function OrganizationRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    company_name: "",
    company_email: "",
    company_phone: "",
    admin_email: "",
    password: "",
    confirm_password: "",
    accept_terms: false,
  });

  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const getPasswordStrength = () => {
    const pwd = form.password;

    if (!pwd) return 0;

    let score = 0;

    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[!@#$%^&*]/.test(pwd)) score += 25;

    return score;
  };

  const getStrengthColor = () => {
    const strength = getPasswordStrength();

    if (strength <= 25) return "bg-red-500";
    if (strength <= 50) return "bg-yellow-500";
    if (strength <= 75) return "bg-blue-500";

    return "bg-green-500";
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMsg("");

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!form.accept_terms) {
      setError("Please accept Terms & Conditions.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        company_name: form.company_name,
        company_email: form.company_email,
        company_phone: form.company_phone,
        admin_email: form.admin_email,
        password: form.password,
        confirm_password: form.confirm_password,
      };

      const res = await API.post(
        "auth/organization-register/",
        payload
      );

      setMsg(
        `${res.data.message || "Organisation registered successfully."}
         Login using Admin Email: ${form.admin_email}`
      );

      setForm({
        company_name: "",
        company_email: "",
        company_phone: "",
        admin_email: "",
        password: "",
        confirm_password: "",
        accept_terms: false,
      });

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const Field = ({
    label,
    name,
    type = "text",
    placeholder,
    required = false,
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
        {required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>

      <input
        name={name}
        type={type}
        value={form[name]}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="
          w-full
          rounded-xl
          border
          border-slate-200
          bg-slate-50
          px-4
          py-3
          text-sm
          outline-none
          transition
          focus:border-blue-500
          focus:bg-white
          focus:ring-4
          focus:ring-blue-100
        "
      />
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Left Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-12 text-white flex-col justify-between">
        <div>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"
              />
            </svg>
          </div>

          <h1 className="mt-8 text-5xl font-bold leading-tight">
            Manage RFPs
            <br />
            Smarter
          </h1>

          <p className="mt-6 text-lg text-blue-100">
            Create your organisation workspace and
            start managing vendors, tenders and
            procurement workflows from one platform.
          </p>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span>✓</span>
            <span>Vendor Management</span>
          </div>

          <div className="flex items-center gap-3">
            <span>✓</span>
            <span>RFP Tracking</span>
          </div>

          <div className="flex items-center gap-3">
            <span>✓</span>
            <span>Secure Authentication</span>
          </div>

          <div className="flex items-center gap-3">
            <span>✓</span>
            <span>Real-Time Updates</span>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900">
                Create Organisation
              </h2>

              <p className="text-slate-500 mt-2">
                Setup your workspace and admin account
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {msg && (
              <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {msg}
                <p className="mt-2 font-semibold">
                  Redirecting to Login Page... 
                </p>
              </div>
            )}

            <form
              onSubmit={onSubmit}
              className="space-y-6"
            >
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                  Company Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Field
                      label="Company Name"
                      name="company_name"
                      placeholder="Acme Corporation"
                      required
                    />
                  </div>

                  <Field
                    label="Company Email"
                    name="company_email"
                    type="email"
                    placeholder="info@company.com"
                    required
                  />

                  <Field
                    label="Phone Number"
                    name="company_phone"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                  Admin Account
                </h3>

                <div className="space-y-4">
                  <Field
                    label="Admin Email"
                    name="admin_email"
                    type="email"
                    placeholder="admin@company.com"
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Password
                    </label>

                    <div className="relative">
                      <input
                        type={
                          showPwd
                            ? "text"
                            : "password"
                        }
                        name="password"
                        value={form.password}
                        onChange={onChange}
                        placeholder="Minimum 8 characters"
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-200
                          bg-slate-50
                          px-4
                          py-3
                          pr-12
                          outline-none
                          focus:border-blue-500
                          focus:ring-4
                          focus:ring-blue-100
                        "
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPwd(!showPwd)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                      >
                        {showPwd ? "🙈" : "👁️"}
                      </button>
                    </div>

                    <div className="mt-3">
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          style={{
                            width: `${getPasswordStrength()}%`,
                          }}
                          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        />
                      </div>

                      <p className="text-xs text-slate-500 mt-2">
                        Password Strength:{" "}
                        {getPasswordStrength()}%
                      </p>
                    </div>
                  </div>

                  <Field
                    label="Confirm Password"
                    name="confirm_password"
                    type={
                      showPwd
                        ? "text"
                        : "password"
                    }
                    placeholder="Repeat password"
                    required
                  />
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="accept_terms"
                  checked={form.accept_terms}
                  onChange={onChange}
                  className="mt-1"
                />

                <p className="text-sm text-slate-600">
                  I agree to the Terms &
                  Conditions and Privacy
                  Policy.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full
                  rounded-xl
                  bg-gradient-to-r
                  from-blue-600
                  to-indigo-600
                  py-3
                  font-semibold
                  text-white
                  transition
                  hover:shadow-lg
                  disabled:opacity-60
                "
              >
                {loading
                  ? "Creating Workspace..."
                  : "Create Organisation"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  py-3
                  text-slate-700
                  font-medium
                  hover:bg-slate-50
                "
              >
                Back to Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}