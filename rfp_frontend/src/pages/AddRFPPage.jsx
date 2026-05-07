import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function AddRFPPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [categoryVendors, setCategoryVendors] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    last_date: "",
    min_amount: "",
    max_amount: "",
    assigned_vendors: [],
  });

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await API.get("admin/categories/");
      setCategories(res.data.filter((cat) => cat.status === "ACTIVE"));
    } catch (err) {
      console.log("CATEGORY LOAD ERROR:", err.response?.data || err.message);
    }
  };

  const loadCategoryVendors = async (categoryId) => {
    try {
      const res = await API.get(`admin/vendors/category/${categoryId}/`);
      setCategoryVendors(res.data || []);
    } catch (err) {
      console.log("CATEGORY VENDORS ERROR:", err.response?.data || err.message);
      setCategoryVendors([]);
    }
  };

  const handleCategorySelect = async () => {
    if (!selectedCategory) {
      setError("Please select a category");
      return;
    }

    setError("");
    await loadCategoryVendors(selectedCategory);
    setStep(2);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVendorSelection = (vendorId) => {
    setForm((prev) => {
      const exists = prev.assigned_vendors.includes(vendorId);

      return {
        ...prev,
        assigned_vendors: exists
          ? prev.assigned_vendors.filter((id) => id !== vendorId)
          : [...prev.assigned_vendors, vendorId],
      };
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.title || !form.last_date || !form.min_amount || !form.max_amount) {
      setError("Please fill all fields");
      setLoading(false);
      return;
    }

    if (new Date(form.last_date) <= new Date(today)) {
      setError("Last date must be a future date.");
      setLoading(false);
      return;
    }

    if (parseFloat(form.max_amount) <= parseFloat(form.min_amount)) {
      setError("Maximum amount must be greater than minimum amount.");
      setLoading(false);
      return;
    }

    if (form.assigned_vendors.length === 0) {
      setError("Please select at least one vendor");
      setLoading(false);
      return;
    }

    try {
      await API.post("admin/rfp/create/", {
        title: form.title,
        category: parseInt(selectedCategory),
        last_date: form.last_date,
        min_amount: parseFloat(form.min_amount),
        max_amount: parseFloat(form.max_amount),
        assigned_vendors: form.assigned_vendors,
      });

      alert("RFP created successfully!");
      navigate("/admin-dashboard");
    } catch (err) {
      console.log("ADD RFP ERROR:", err.response?.data || err.message);
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Failed to create RFP"
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-800">RFP Select Category</h1>
              <p className="mt-2 text-slate-500">Choose a category to create RFP</p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Category*
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => navigate("/admin-dashboard")}
                  className="rounded-lg border border-slate-300 px-8 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCategorySelect}
                  className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">RFP Create</h1>
            <p className="mt-2 text-slate-500">Create RFP and assign vendors</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Title*
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  placeholder="Enter RFP title"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Last Date*
                </label>
                <input
                  type="date"
                  value={form.last_date}
                  onChange={handleInputChange}
                  name="last_date"
                  min={today}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Minimum Price*
                </label>
                <input
                  type="number"
                  name="min_amount"
                  value={form.min_amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Maximum Price*
                </label>
                <input
                  type="number"
                  name="max_amount"
                  value={form.max_amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                Vendors in Selected Category*
              </label>

              <div className="rounded-lg border border-slate-300 p-4">
                {categoryVendors.length === 0 ? (
                  <p className="text-slate-500">No approved vendors found in this category.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {categoryVendors.map((vendor) => (
                      <label
                        key={vendor.id}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3"
                      >
                        <input
                          type="checkbox"
                          checked={form.assigned_vendors.includes(vendor.id)}
                          onChange={() => handleVendorSelection(vendor.id)}
                        />
                        <span className="text-sm text-slate-700">
                          {vendor.first_name} {vendor.last_name} ({vendor.email})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex gap-3 border-t border-slate-200 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
              >
                {loading ? "Creating..." : "Submit"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin-dashboard")}
                className="rounded-lg border border-slate-300 px-8 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}