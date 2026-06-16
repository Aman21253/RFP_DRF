const palette = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-700",   num: "text-blue-800",   dot: "bg-blue-500" },
  green:  { bg: "bg-emerald-50",text: "text-emerald-700",num: "text-emerald-800", dot: "bg-emerald-500" },
  yellow: { bg: "bg-amber-50",  text: "text-amber-700",  num: "text-amber-800",  dot: "bg-amber-500" },
  red:    { bg: "bg-red-50",    text: "text-red-700",    num: "text-red-800",    dot: "bg-red-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", num: "text-purple-800", dot: "bg-purple-500" },
  slate:  { bg: "bg-slate-50",  text: "text-slate-600",  num: "text-slate-800",  dot: "bg-slate-400" },
};

export default function StatCard({ title, value, color = "blue", subtitle }) {
  const c = palette[color] ?? palette.blue;
  return (
    <div className={`rounded-2xl ${c.bg} p-5 border border-white`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${c.text}`}>{title}</span>
      </div>
      <div className={`text-3xl font-bold ${c.num} tabular-nums`}>{value}</div>
      {subtitle && <p className={`text-xs mt-1 ${c.text} opacity-75`}>{subtitle}</p>}
    </div>
  );
}