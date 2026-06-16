import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import Sidebar from "../components/SideBar";
import StatCard from "../components/StatCard";

const Badge = ({ status }) => {
  const map = {
    ACTIVE:   "bg-emerald-100 text-emerald-700",
    INACTIVE: "bg-slate-100 text-slate-600",
    APPROVED: "bg-emerald-100 text-emerald-700",
    PENDING:  "bg-amber-100 text-amber-700",
    REJECTED: "bg-red-100 text-red-700",
    OPEN:     "bg-blue-100 text-blue-700",
    CLOSED:   "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
};

const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const EmptyRow = ({ cols, message }) => (
  <tr>
    <td colSpan={cols} className="py-12 text-center text-sm text-slate-400">{message}</td>
  </tr>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const orgName  = localStorage.getItem("org_name") || "Admin";

  const [section,      setSection]      = useState("dashboard");
  const [reports,      setReports]      = useState(null);
  const [categories,   setCategories]   = useState([]);
  const [vendors,      setVendors]      = useState([]);
  const [rfps,         setRfps]         = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [newCategory,  setNewCategory]  = useState("");
  const [loading,      setLoading]      = useState(true);
  const [catLoading,   setCatLoading]   = useState(false);
  const [vendorFilter, setVendorFilter] = useState("");

  const logout = () => { localStorage.clear(); navigate("/"); };

  const load = async () => {
    try {
      setLoading(true);
      const [r, c, v, rfp, logs] = await Promise.all([
        API.get("admin/reports/"),
        API.get("admin/categories/"),
        API.get("admin/vendors/"),
        API.get("admin/rfp/"),
        API.get("admin/activity-logs/"),
      ]);
      setReports(r.data);
      setCategories(c.data);
      setVendors(v.data);
      setRfps(rfp.data);
      setActivityLogs(Array.isArray(logs.data) ? logs.data : logs.data.results || []);
    } catch (e) {
      if (e.response?.status === 401) navigate("/");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    setCatLoading(true);
    try {
      await API.post("admin/categories/", { name: newCategory.trim(), status: "ACTIVE" });
      setNewCategory("");
      load();
    } catch (e) { alert(e.response?.data?.error || "Failed to add category."); }
    finally { setCatLoading(false); }
  };

  const toggleCategory = async (id) => {
    try { await API.patch(`admin/categories/${id}/`); load(); }
    catch (e) { alert(e.response?.data?.error || "Failed."); }
  };

  const setVendorStatus = async (id, status) => {
    try { await API.patch(`admin/vendors/${id}/`, { status }); load(); }
    catch (e) { alert(e.response?.data?.error || "Failed."); }
  };

  const toggleRFP = async (id) => {
    try { await API.patch(`admin/rfp/${id}/`); load(); }
    catch (e) { alert(e.response?.data?.error || "Failed."); }
  };

  const filteredVendors = vendorFilter
    ? vendors.filter((v) => v.status === vendorFilter)
    : vendors;

  const thClass = "px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide";
  const tdClass = "px-4 py-3 text-sm text-slate-600";

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar active={section} setActive={setSection} onLogout={logout} orgName={orgName} />

      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 capitalize">{section.replace("-", " ")}</h2>
            <p className="text-xs text-slate-400 mt-0.5">RFP Platform · Admin</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-slate-700">{orgName}</span>
            </div>
          </div>
        </div>

        <div className="px-8 py-7">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-3 text-slate-500">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                Loading…
              </div>
            </div>
          ) : (
            <>
              {/* ── DASHBOARD ── */}
              {section === "dashboard" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                    <StatCard title="Categories"    value={reports?.total_categories ?? 0}   color="blue" />
                    <StatCard title="Total vendors"  value={reports?.total_vendors ?? 0}       color="slate" />
                    <StatCard title="Approved"        value={reports?.approved_vendors ?? 0}   color="green" />
                    <StatCard title="Pending review"  value={reports?.pending_vendors ?? 0}    color="yellow" />
                    <StatCard title="Total RFPs"      value={reports?.total_rfps ?? 0}          color="blue" />
                    <StatCard title="Open RFPs"       value={reports?.open_rfps ?? 0}           color="green" />
                    <StatCard title="Closed RFPs"     value={reports?.closed_rfps ?? 0}         color="red" />
                    <StatCard title="Quotes received" value={reports?.total_quotes ?? 0}        color="purple" />
                  </div>

                  {/* Quick tables */}
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                      <h4 className="font-semibold text-slate-700 mb-4 text-sm">Vendors by category</h4>
                      <div className="space-y-2">
                        {(reports?.category_wise_vendors || []).map((c) => (
                          <div key={c.id} className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">{c.name}</span>
                            <span className="text-sm font-semibold text-slate-800 tabular-nums">{c.total}</span>
                          </div>
                        ))}
                        {!reports?.category_wise_vendors?.length && <p className="text-sm text-slate-400">No data yet.</p>}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                      <h4 className="font-semibold text-slate-700 mb-4 text-sm">RFPs by category</h4>
                      <div className="space-y-2">
                        {(reports?.category_wise_rfps || []).map((c) => (
                          <div key={c.id} className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">{c.name}</span>
                            <span className="text-sm font-semibold text-slate-800 tabular-nums">{c.total}</span>
                          </div>
                        ))}
                        {!reports?.category_wise_rfps?.length && <p className="text-sm text-slate-400">No data yet.</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── CATEGORIES ── */}
              {section === "categories" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <SectionHeader title="Categories" subtitle="Manage vendor service categories" />

                  <div className="flex gap-3 mb-6">
                    <input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCategory()}
                      placeholder="New category name…"
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                    />
                    <button
                      onClick={addCategory}
                      disabled={catLoading || !newCategory.trim()}
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition"
                    >
                      {catLoading ? "Adding…" : "Add category"}
                    </button>
                  </div>

                  <table className="w-full">
                    <thead className="border-b border-slate-100">
                      <tr>
                        <th className={thClass}>ID</th>
                        <th className={thClass}>Name</th>
                        <th className={thClass}>Status</th>
                        <th className={thClass}>Created</th>
                        <th className={thClass}>Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {categories.length === 0 ? (
                        <EmptyRow cols={5} message="No categories yet. Add one above." />
                      ) : categories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-slate-50 transition">
                          <td className={tdClass + " font-mono text-xs text-slate-400"}>{cat.id}</td>
                          <td className={`${tdClass} font-medium text-slate-800`}>{cat.name}</td>
                          <td className={tdClass}><Badge status={cat.status} /></td>
                          <td className={tdClass}>{new Date(cat.created_at).toLocaleDateString()}</td>
                          <td className={tdClass}>
                            <button
                              onClick={() => toggleCategory(cat.id)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                cat.status === "ACTIVE"
                                  ? "bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {cat.status === "ACTIVE" ? "Deactivate" : "Activate"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── VENDORS ── */}
              {section === "vendors" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <SectionHeader
                    title="Vendors"
                    subtitle="Review and approve vendor registrations"
                    action={
                      <select
                        value={vendorFilter}
                        onChange={(e) => setVendorFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 transition"
                      >
                        <option value="">All statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    }
                  />

                  <table className="w-full">
                    <thead className="border-b border-slate-100">
                      <tr>
                        <th className={thClass}>Vendor</th>
                        <th className={thClass}>Email</th>
                        <th className={thClass}>Category</th>
                        <th className={thClass}>Status</th>
                        <th className={thClass}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredVendors.length === 0 ? (
                        <EmptyRow cols={5} message="No vendors found." />
                      ) : filteredVendors.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50 transition">
                          <td className={`${tdClass} font-medium text-slate-800`}>
                            {v.first_name} {v.last_name}
                          </td>
                          <td className={tdClass}>{v.email}</td>
                          <td className={tdClass}>{v.category_name || "—"}</td>
                          <td className={tdClass}><Badge status={v.status} /></td>
                          <td className={tdClass}>
                            <div className="flex gap-2">
                              {v.status !== "APPROVED" && (
                                <button
                                  onClick={() => setVendorStatus(v.id, "APPROVED")}
                                  className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                                >
                                  Approve
                                </button>
                              )}
                              {v.status !== "REJECTED" && (
                                <button
                                  onClick={() => setVendorStatus(v.id, "REJECTED")}
                                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                                >
                                  Reject
                                </button>
                              )}
                              {v.status === "REJECTED" && (
                                <button
                                  onClick={() => setVendorStatus(v.id, "PENDING")}
                                  className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── RFPs ── */}
              {section === "rfps" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <SectionHeader
                    title="RFPs"
                    subtitle="Create and manage requests for proposals"
                    action={
                      <button
                        onClick={() => navigate("/add-rfp")}
                        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        New RFP
                      </button>
                    }
                  />

                  <table className="w-full">
                    <thead className="border-b border-slate-100">
                      <tr>
                        <th className={thClass}>#</th>
                        <th className={thClass}>Title</th>
                        <th className={thClass}>Category</th>
                        <th className={thClass}>Last date</th>
                        <th className={thClass}>Budget</th>
                        <th className={thClass}>Vendors</th>
                        <th className={thClass}>Status</th>
                        <th className={thClass}>Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {rfps.length === 0 ? (
                        <EmptyRow cols={8} message="No RFPs yet. Create your first one." />
                      ) : rfps.map((rfp) => (
                        <tr key={rfp.id} className="hover:bg-slate-50 transition">
                          <td className={`${tdClass} font-mono text-xs text-slate-400`}>{rfp.id}</td>
                          <td className={`${tdClass} font-medium text-slate-800`}>{rfp.title}</td>
                          <td className={tdClass}>{rfp.category_name || "—"}</td>
                          <td className={tdClass}>{rfp.last_date}</td>
                          <td className={tdClass}>
                            <span className="text-slate-500">₹</span>
                            {Number(rfp.min_amount).toLocaleString()} – ₹{Number(rfp.max_amount).toLocaleString()}
                          </td>
                          <td className={tdClass}>{rfp.assigned_vendor_count ?? 0}</td>
                          <td className={tdClass}><Badge status={rfp.status} /></td>
                          <td className={tdClass}>
                            <button
                              onClick={() => toggleRFP(rfp.id)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                rfp.status === "OPEN"
                                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {rfp.status === "OPEN" ? "Close" : "Reopen"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── REPORTS ── */}
              {section === "reports" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                    <StatCard title="Total vendors"   value={reports?.total_vendors ?? 0}   color="slate" />
                    <StatCard title="Approved vendors" value={reports?.approved_vendors ?? 0} color="green" subtitle={`${reports?.pending_vendors ?? 0} pending`} />
                    <StatCard title="Rejected vendors" value={reports?.rejected_vendors ?? 0} color="red" />
                    <StatCard title="Total categories" value={reports?.total_categories ?? 0} color="blue" />
                    <StatCard title="Total RFPs"       value={reports?.total_rfps ?? 0}       color="blue" />
                    <StatCard title="Open RFPs"        value={reports?.open_rfps ?? 0}        color="green" />
                    <StatCard title="Closed RFPs"      value={reports?.closed_rfps ?? 0}      color="red" />
                    <StatCard title="Total quotes"     value={reports?.total_quotes ?? 0}     color="purple" />
                  </div>

                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h4 className="font-semibold text-slate-700 mb-5 text-sm">Vendors per category</h4>
                      {(reports?.category_wise_vendors || []).map((c) => {
                        const pct = reports?.total_vendors ? Math.round((c.total / reports.total_vendors) * 100) : 0;
                        return (
                          <div key={c.id} className="mb-3">
                            <div className="flex justify-between text-xs text-slate-600 mb-1">
                              <span>{c.name}</span>
                              <span className="font-semibold">{c.total}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h4 className="font-semibold text-slate-700 mb-5 text-sm">RFPs per category</h4>
                      {(reports?.category_wise_rfps || []).map((c) => {
                        const pct = reports?.total_rfps ? Math.round((c.total / reports.total_rfps) * 100) : 0;
                        return (
                          <div key={c.id} className="mb-3">
                            <div className="flex justify-between text-xs text-slate-600 mb-1">
                              <span>{c.name}</span>
                              <span className="font-semibold">{c.total}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ACTIVITY LOGS ── */}
              {section === "activity-logs" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <SectionHeader title="Activity logs" subtitle="Recent actions across your organisation" />

                  <table className="w-full">
                    <thead className="border-b border-slate-100">
                      <tr>
                        <th className={thClass}>User</th>
                        <th className={thClass}>Action</th>
                        <th className={thClass}>Model</th>
                        <th className={thClass}>Object</th>
                        <th className={thClass}>IP address</th>
                        <th className={thClass}>Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {activityLogs.length === 0 ? (
                        <EmptyRow cols={6} message="No activity logged yet." />
                      ) : activityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition">
                          <td className={`${tdClass} font-medium text-slate-800`}>{log.user_email || log.user || "—"}</td>
                          <td className={tdClass}>
                            <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">{log.action}</span>
                          </td>
                          <td className={tdClass}>{log.model_name}</td>
                          <td className={`${tdClass} font-mono text-xs`}>{log.object_id}</td>
                          <td className={`${tdClass} font-mono text-xs text-slate-400`}>{log.ip_address || "—"}</td>
                          <td className={`${tdClass} text-xs text-slate-400`}>{new Date(log.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}