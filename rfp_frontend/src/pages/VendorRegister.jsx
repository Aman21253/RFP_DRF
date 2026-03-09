import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function VendorRegister() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    revenue: "",
    employees: "",
    gst_no: "",
    pan_no: "",
    phone: "",
    category_id: "",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await API.get("public/categories/");
      setCategories(res.data || []);
    } catch (err) {
      console.log("CATEGORY LOAD ERROR:", err.response?.data || err.message);
    }
  };

  const onChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const registerVendor = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await API.post("auth/register/", form);
      setMsg(res.data.message || "Vendor registered successfully");
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        confirm_password: "",
        revenue: "",
        employees: "",
        gst_no: "",
        pan_no: "",
        phone: "",
        category_id: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Registration failed"
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-blue-100 px-8 py-6">
          <h1 className="text-3xl font-bold text-blue-700">
            Welcome to RFP System!
          </h1>
          <p className="mt-2 font-medium text-blue-600">Register as Vendor</p>
        </div>

        <div className="p-8">
          {msg && (
            <div className="mb-4 rounded-lg bg-green-100 px-4 py-3 text-green-700">
              {msg}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={registerVendor}
            className="grid grid-cols-1 gap-6 md:grid-cols-2"
          >
            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                First name*
              </label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={onChange}
                placeholder="Enter Firstname"
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                Last Name*
              </label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={onChange}
                placeholder="Enter Lastname"
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block font-semibold text-slate-800">
                Email*
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="Enter Email"
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                Password*
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                placeholder="Enter Password"
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                Confirm Password*
              </label>
              <input
                type="password"
                name="confirm_password"
                value={form.confirm_password}
                onChange={onChange}
                placeholder="Enter Confirm Password"
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                Revenue (Last 3 Years in Lacks)*
              </label>
              <input
                name="revenue"
                value={form.revenue}
                onChange={onChange}
                placeholder="Enter Revenue"
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                No of Employees*
              </label>
              <input
                name="employees"
                value={form.employees}
                onChange={onChange}
                placeholder="No of Employees"
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                GST No*
              </label>
              <input
                name="gst_no"
                value={form.gst_no}
                onChange={onChange}
                placeholder="Enter GST No"
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                PAN No*
              </label>
              <input
                name="pan_no"
                value={form.pan_no}
                onChange={onChange}
                placeholder="Enter PAN No"
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                Phone No*
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="Enter Phone No"
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                Categories*
              </label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2 flex gap-3 md:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Register
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="rounded-lg border border-slate-300 px-8 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}