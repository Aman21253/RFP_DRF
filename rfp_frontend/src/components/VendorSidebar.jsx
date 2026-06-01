import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  ShieldCheck,
  LogOut,
} from "lucide-react";

export default function VendorSidebar({
  active = "dashboard",
  setActive,
  onLogout,
}) {
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
        <p className="text-sm text-slate-500">Vendor Panel</p>
      </div>

      <nav className="space-y-2">
        <button
          onClick={() => setActive("dashboard")}
          className={itemClass("dashboard")}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>

        <button
          onClick={() => setActive("rfps")}
          className={itemClass("rfps")}
        >
          <FileText size={18} />
          Assigned RFPs
        </button>

        <button
          onClick={() => setActive("quotes")}
          className={itemClass("quotes")}
        >
          <ClipboardList size={18} />
          My Quotes
        </button>

        <button
          onClick={() => setActive("security")}
          className={itemClass("security")}
        >
          <ShieldCheck size={18} />
          Security
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