import { LayoutDashboard, Tags, Users, FileText, BarChart3, LogOut, Activity } from "lucide-react";

export default function Sidebar({ active = "dashboard", setActive, onLogout }) {
  const itemClass = (key) =>
    `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
      active === key
        ? "bg-blue-600 text-white shadow"
        : "text-slate-700 hover:bg-slate-100"
    }`;

  return (
    <aside className="h-screen w-64 border-r border-slate-200 bg-white px-4 py-6">
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold text-slate-800">RFP_DFP</h1>
        <p className="text-sm text-slate-500">Admin Panel</p>
      </div>

      <nav className="space-y-2">
        <button onClick={() => setActive("dashboard")} className={itemClass("dashboard")}>
          <LayoutDashboard size={18} />
          Dashboard
        </button>

        <button onClick={() => setActive("categories")} className={itemClass("categories")}>
          <Tags size={18} />
          Categories
        </button>

        <button onClick={() => setActive("vendors")} className={itemClass("vendors")}>
          <Users size={18} />
          Vendors
        </button>

        <button onClick={() => setActive("rfps")} className={itemClass("rfps")}>
          <FileText size={18} />
          RFPs
        </button>

        <button onClick={() => setActive("reports")} className={itemClass("reports")}>
          <BarChart3 size={18} />
          Reports
        </button>

        <button onClick={() => setActive("activity-logs")} className={itemClass("activity-logs")}>
          <Activity size={18} />
          Activity Logs
        </button>
      </nav>

      <div className="mt-10 border-t pt-4">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}