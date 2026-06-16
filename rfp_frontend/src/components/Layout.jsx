export default function Layout({ title, subtitle, right, children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
            {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
          </div>
          {right}
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}