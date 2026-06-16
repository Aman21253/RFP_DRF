import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function AddRFPPage() {
  const navigate = useNavigate();
  const today    = new Date().toISOString().split("T")[0];

  const [categories,      setCategories]      = useState([]);
  const [categoryVendors, setCategoryVendors] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [form, setForm] = useState({
    title: "", last_date: "", min_amount: "", max_amount: "", assigned_vendors: [],
  });

  useEffect(() => {
    API.get("admin/categories/")
      .then((r) => setCategories(r.data.filter((c) => c.status === "ACTIVE")))
      .catch(console.error);
  }, []);

  const goToStep2 = async () => {
    if (!selectedCategory) { setError("Please select a category."); return; }
    setError("");
    setLoading(true);
    try {
      const r = await API.get(`admin/vendors/category/${selectedCategory}/`);
      setCategoryVendors(r.data || []);
      setStep(2);
    } catch { setCategoryVendors([]); setStep(2); }
    finally { setLoading(false); }
  };

  const toggleVendor = (id) =>
    setForm((p) => ({
      ...p,
      assigned_vendors: p.assigned_vendors.includes(id)
        ? p.assigned_vendors.filter((x) => x !== id)
        : [...p.assigned_vendors, id],
    }));

  const selectAll = () =>
    setForm((p) => ({
      ...p,
      assigned_vendors: categoryVendors.map((v) => v.id),
    }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title || !form.last_date || !form.min_amount || !form.max_amount) {
      setError("All fields are required."); return;
    }
    if (new Date(form.last_date) <= new Date(today)) {
      setError("Last date must be a future date."); return;
    }
    if (parseFloat(form.max_amount) <= parseFloat(form.min_amount)) {
      setError("Maximum amount must be greater than minimum."); return;
    }
    if (form.assigned_vendors.length === 0) {
      setError("Select at least one vendor."); return;
    }
    setLoading(true);
    try {
      await API.post("admin/rfp/create/", {
        title:             form.title,
        category:          parseInt(selectedCategory),
        last_date:         form.last_date,
        min_amount:        parseFloat(form.min_amount),
        max_amount:        parseFloat(form.max_amount),
        assigned_vendors:  form.assigned_vendors,
      });
      navigate("/admin-dashboard");
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || "Failed to create RFP.");
    } finally { setLoading(false); }
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition";

  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                step >= s ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
              }`}>{s}</div>
              <span className={`text-sm font-medium ${step >= s ? "text-blue-600" : "text-slate-400"}`}>
                {s === 1 ? "Select category" : "RFP details & vendors"}
              </span>
              {s < 2 && <div className={`w-12 h-0.5 ${step > s ? "bg-blue-600" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Select a category</h2>
              <p className="text-slate-500 text-sm mb-6">Only approved vendors from this category will be shown.</p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={inputClass}>
                  <option value="">Choose a category…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex gap-3">
                <button onClick={goToStep2} disabled={loading} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition flex items-center gap-2">
                  {loading ? "Loading…" : <>Continue <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></>}
                </button>
                <button onClick={() => navigate("/admin-dashboard")} className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={onSubmit}>
              <h2 className="text-xl font-bold text-slate-800 mb-1">RFP details</h2>
              <p className="text-slate-500 text-sm mb-6">Fill in the details and select which vendors to invite.</p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Title <span className="text-red-500">*</span></label>
                  <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Office furniture supply Q3 2026" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Closing date <span className="text-red-500">*</span></label>
                  <input type="date" min={today} value={form.last_date} onChange={(e) => setForm((p) => ({ ...p, last_date: e.target.value }))} className={inputClass} />
                </div>
                <div />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Minimum budget (₹) <span className="text-red-500">*</span></label>
                  <input type="number" min="0" step="0.01" value={form.min_amount} onChange={(e) => setForm((p) => ({ ...p, min_amount: e.target.value }))} placeholder="0.00" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Maximum budget (₹) <span className="text-red-500">*</span></label>
                  <input type="number" min="0" step="0.01" value={form.max_amount} onChange={(e) => setForm((p) => ({ ...p, max_amount: e.target.value }))} placeholder="0.00" className={inputClass} />
                </div>
              </div>

              {/* Vendors */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-700">
                    Invite vendors <span className="text-red-500">*</span>
                    <span className="ml-2 text-slate-400 font-normal">({form.assigned_vendors.length} selected)</span>
                  </label>
                  {categoryVendors.length > 0 && (
                    <button type="button" onClick={selectAll} className="text-xs text-blue-600 hover:underline">
                      Select all ({categoryVendors.length})
                    </button>
                  )}
                </div>

                {categoryVendors.length === 0 ? (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-4 text-sm text-amber-700">
                    No approved vendors in this category. Approve vendors first, or select a different category.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200 p-3">
                    {categoryVendors.map((v) => (
                      <label key={v.id} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer border transition ${
                        form.assigned_vendors.includes(v.id)
                          ? "bg-blue-50 border-blue-200"
                          : "bg-slate-50 border-transparent hover:border-slate-200"
                      }`}>
                        <input type="checkbox" checked={form.assigned_vendors.includes(v.id)} onChange={() => toggleVendor(v.id)} className="rounded text-blue-600" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{v.first_name} {v.last_name}</p>
                          <p className="text-xs text-slate-500 truncate">{v.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Back
                </button>
                <button type="submit" disabled={loading} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition">
                  {loading ? "Creating…" : "Create RFP"}
                </button>
                <button type="button" onClick={() => navigate("/admin-dashboard")} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}