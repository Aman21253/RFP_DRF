import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import Sidebar from "../components/SideBar";
import StatCard from "../components/StatCard";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("dashboard");
  const [reports, setReports] = useState(null);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [rfps, setRfps] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      const [reportsRes, categoriesRes, vendorsRes, rfpsRes, logsRes] = await Promise.all([
        API.get("admin/reports/"),
        API.get("admin/categories/"),
        API.get("admin/vendors/"),
        API.get("admin/rfp/"),
        API.get("admin/activity-logs/"),
      ]);

      setReports(reportsRes.data);
      setCategories(categoriesRes.data);
      setVendors(vendorsRes.data);
      setRfps(rfpsRes.data);
      setActivityLogs(
        Array.isArray(logsRes.data)
          ? logsRes.data
          : logsRes.data.results || []
      );
    } catch (error) {
      console.log("ADMIN LOAD ERROR:", error?.response?.data || error.message);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      await API.post("admin/categories/", {
        name: newCategory,
        status: "ACTIVE",
      });
      setNewCategory("");
      loadData();
    } catch (error) {
      console.log("ADD CATEGORY ERROR:", error?.response?.data || error.message);
    }
  };

  const toggleVendor = async (id) => {
    try {
      await API.patch(`admin/vendors/${id}/`);
      loadData();
    } catch (error) {
      console.log("TOGGLE VENDOR ERROR:", error?.response?.data || error.message);
    }
  };

  const toggleRFP = async (id) => {
    try {
      await API.patch(`admin/rfp/${id}/`);
      loadData();
    } catch (error) {
      console.log("TOGGLE RFP ERROR:", error?.response?.data || error.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar
        active={activeSection}
        setActive={setActiveSection}
        onLogout={logout}
      />

      <main className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Admin Dashboard</h2>
            <p className="mt-1 text-slate-500">
              Manage categories, vendors and RFP activity
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-sm text-slate-500">Logged in as</p>
            <p className="font-semibold text-slate-800">Admin</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm">
            Loading dashboard...
          </div>
        ) : (
          <>
            {activeSection === "dashboard" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Categories"
                  value={reports?.total_categories || 0}
                  color="blue"
                />
                <StatCard
                  title="Vendors"
                  value={reports?.total_vendors || 0}
                  color="green"
                />
                <StatCard
                  title="Open RFPs"
                  value={reports?.open_rfps || 0}
                  color="yellow"
                />
                <StatCard
                  title="Closed RFPs"
                  value={reports?.closed_rfps || 0}
                  color="red"
                />
              </div>
            )}

            {activeSection === "categories" && (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-800">Categories</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add and view available categories
                </p>

                <div className="mt-5 flex gap-3">
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter category name"
                    className="flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={addCategory}
                    className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {categories.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                      No categories found.
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-slate-800">{cat.name}</p>
                          <p className="text-xs text-slate-500">ID: {cat.id}</p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            cat.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {cat.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {activeSection === "vendors" && (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-800">Vendors</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Approve or reject vendor accounts
                </p>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-left text-sm text-slate-500">
                        <th className="px-3">Name</th>
                        <th className="px-3">Email</th>
                        <th className="px-3">Status</th>
                        <th className="px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-3 py-4 text-sm text-slate-500">
                            No vendors found.
                          </td>
                        </tr>
                      ) : (
                        vendors.map((vendor) => (
                          <tr key={vendor.id} className="rounded-xl bg-slate-50">
                            <td className="rounded-l-xl px-3 py-4 font-medium text-slate-800">
                              {vendor.first_name} {vendor.last_name}
                            </td>
                            <td className="px-3 py-4 text-slate-600">{vendor.email}</td>
                            <td className="px-3 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  vendor.status === "APPROVED"
                                    ? "bg-green-100 text-green-700"
                                    : vendor.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {vendor.status}
                              </span>
                            </td>
                            <td className="rounded-r-xl px-3 py-4">
                              <button
                                onClick={() => toggleVendor(vendor.id)}
                                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
                              >
                                Toggle
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeSection === "rfps" && (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">RFPs</h3>
                    <p className="mt-1 text-sm text-slate-500">Create and manage RFPs</p>
                  </div>
                  <button
                    onClick={() => navigate("/add-rfp")}
                    className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
                  >
                    + Add RFP
                  </button>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-left text-sm text-slate-500">
                        <th className="px-3">RFP No.</th>
                        <th className="px-3">Title</th>
                        <th className="px-3">Category</th>
                        <th className="px-3">Last Date</th>
                        <th className="px-3">Min Amount</th>
                        <th className="px-3">Max Amount</th>
                        <th className="px-3">Status</th>
                        <th className="px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfps.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-3 py-4 text-sm text-slate-500">
                            No RFPs found.
                          </td>
                        </tr>
                      ) : (
                        rfps.map((rfp) => (
                          <tr key={rfp.id} className="rounded-xl bg-slate-50">
                            <td className="rounded-l-xl px-3 py-4 font-medium text-slate-800">
                              {rfp.id}
                            </td>
                            <td className="px-3 py-4 text-slate-600">{rfp.title}</td>
                            <td className="px-3 py-4 text-slate-600">
                              {rfp.category || "N/A"}
                            </td>
                            <td className="px-3 py-4 text-slate-600">{rfp.last_date}</td>
                            <td className="px-3 py-4 text-slate-600">{rfp.min_amount}</td>
                            <td className="px-3 py-4 text-slate-600">{rfp.max_amount}</td>
                            <td className="px-3 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  rfp.status === "OPEN"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {rfp.status}
                              </span>
                            </td>
                            <td className="rounded-r-xl px-3 py-4">
                              <button
                                onClick={() => toggleRFP(rfp.id)}
                                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
                              >
                                Toggle
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeSection === "reports" && (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-800">Reports</h3>
                <p className="mt-1 text-sm text-slate-500">System summary</p>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Categories"
                    value={reports?.total_categories || 0}
                    color="blue"
                  />
                  <StatCard
                    title="Vendors"
                    value={reports?.total_vendors || 0}
                    color="green"
                  />
                  <StatCard
                    title="Open RFPs"
                    value={reports?.open_rfps || 0}
                    color="yellow"
                  />
                  <StatCard
                    title="Closed RFPs"
                    value={reports?.closed_rfps || 0}
                    color="red"
                  />
                </div>
              </section>
            )}

            {activeSection === "activity-logs" && (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-800">Activity Logs</h3>
                <p className="mt-1 text-sm text-slate-500">Track user actions</p>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-left text-sm text-slate-500">
                        <th className="px-3">User</th>
                        <th className="px-3">Action</th>
                        <th className="px-3">Model</th>
                        <th className="px-3">Object ID</th>
                        <th className="px-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLogs.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-3 py-4 text-sm text-slate-500">
                            No activity logs found.
                          </td>
                        </tr>
                      ) : (
                        Array.isArray(activityLogs) &&
                        activityLogs.map((log) => (
                          <tr key={log.id} className="rounded-xl bg-slate-50">
                            <td className="rounded-l-xl px-3 py-4 font-medium text-slate-800">
                              {log.user}
                            </td>
                            <td className="px-3 py-4 text-slate-600">{log.action}</td>
                            <td className="px-3 py-4 text-slate-600">{log.model_name}</td>
                            <td className="px-3 py-4 text-slate-600">{log.object_id}</td>
                            <td className="rounded-r-xl px-3 py-4 text-slate-600">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}