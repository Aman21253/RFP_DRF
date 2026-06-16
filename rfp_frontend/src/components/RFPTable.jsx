export default function RFPTable({ rfps, onQuoteClick, appliedRfps = new Set() }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-800 text-white">
          <tr>
            <th className="px-4 py-4 text-left text-sm">RFP No.</th>
            <th className="px-4 py-4 text-left text-sm">Title</th>
            <th className="px-4 py-4 text-left text-sm">Category</th>
            <th className="px-4 py-4 text-left text-sm">Last Date</th>
            <th className="px-4 py-4 text-left text-sm">Min</th>
            <th className="px-4 py-4 text-left text-sm">Max</th>
            <th className="px-4 py-4 text-left text-sm">Status</th>
            <th className="px-4 py-4 text-left text-sm">Action</th>
          </tr>
        </thead>
        <tbody>
          {rfps.length === 0 ? (
            <tr>
              <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                No RFPs assigned.
              </td>
            </tr>
          ) : (
            rfps.map((rfp) => (
              <tr key={rfp.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-4 text-sm text-slate-600">{rfp.id}</td>
                <td className="px-4 py-4 text-sm font-medium text-slate-800">{rfp.title}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{rfp.category || "—"}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{rfp.last_date}</td>
                <td className="px-4 py-4 text-sm text-slate-600">₹{rfp.min_amount}</td>
                <td className="px-4 py-4 text-sm text-slate-600">₹{rfp.max_amount}</td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    {rfp.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {appliedRfps.has(rfp.id) ? (
                    <span className="text-sm font-semibold text-blue-600">Applied</span>
                  ) : (
                    <button
                      onClick={() => onQuoteClick(rfp)}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Apply
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}