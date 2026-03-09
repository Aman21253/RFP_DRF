export default function StatCard({ title, value, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${colors[color]}`}
      >
        {title}
      </div>
      <div className="mt-4 text-3xl font-bold text-slate-800">{value}</div>
    </div>
  );
}