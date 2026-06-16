import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function VendorRegister() {
  const navigate    = useNavigate();
  const [categories, setCategories] = useState([]);
  const [msg,        setMsg]        = useState("");
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [showPwd,    setShowPwd]    = useState(false);
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    password: "", confirm_password: "",
    revenue: "", employees: "", gst_no: "", pan_no: "",
    category_id: "",
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const organizationSlug = "demo-org";
        const res = await API.get("/public/categories/", {
          params: {
            organization: organizationSlug,
          },
        });
        setCategories(res.data);
      } catch (err) {
        console.error(
          "Failed to load categories:",
          err.response?.data || err.message
        );
        setCategories([]);
      }
    };

    loadCategories();

  }, []);

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); setError("");
    if (form.password !== form.confirm_password) { setError("Passwords do not match."); return; }
    if (!form.category_id) { setError("Please select a category."); return; }
    setLoading(true);
    try {
      const res = await API.post("auth/register/", form);
      setMsg(res.data.message || "Registered! Wait for admin approval.");
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || "Registration failed.");
    } finally { setLoading(false); }
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-10 flex items-start justify-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Register as vendor</h1>
          <p className="text-slate-400 mt-1 text-sm">Submit your details for admin approval</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {msg && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              <div>{msg} <button onClick={() => navigate("/")} className="ml-1 font-semibold underline">Back to login →</button></div>
            </div>
          )}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Personal */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Personal info</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">First name <span className="text-red-500">*</span></label>
                  <input name="first_name" value={form.first_name} onChange={onChange} placeholder="Raj" required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Last name</label>
                  <input name="last_name" value={form.last_name} onChange={onChange} placeholder="Sharma" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                  <input name="email" type="email" value={form.email} onChange={onChange} placeholder="raj@vendor.com" required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone <span className="text-red-500">*</span></label>
                  <input name="phone" value={form.phone} onChange={onChange} placeholder="+91 98765 43210" required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input name="password" type={showPwd ? "text" : "password"} value={form.password} onChange={onChange} placeholder="Min. 8 characters" required className={`${inputClass} pr-11`} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password <span className="text-red-500">*</span></label>
                  <input name="confirm_password" type={showPwd ? "text" : "password"} value={form.confirm_password} onChange={onChange} placeholder="Repeat password" required className={inputClass} />
                </div>
              </div>
            </div>

            {/* Business */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Business details</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                  <select name="category_id" value={form.category_id} onChange={onChange} required className={inputClass}>
                    <option value="">Select a category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Revenue last 3 years (₹ lakhs)</label>
                  <input name="revenue" type="number" value={form.revenue} onChange={onChange} placeholder="e.g. 50" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Number of employees</label>
                  <input name="employees" type="number" value={form.employees} onChange={onChange} placeholder="e.g. 25" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">GST number</label>
                  <input name="gst_no" value={form.gst_no} onChange={onChange} placeholder="22ABCDE1234F1Z5" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">PAN number</label>
                  <input name="pan_no" value={form.pan_no} onChange={onChange} placeholder="ABCDE1234F" className={inputClass} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition">
                {loading ? "Submitting…" : "Submit registration"}
              </button>
              <button type="button" onClick={() => navigate("/")} className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}