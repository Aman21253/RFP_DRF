function RFPTable({ rfps, onQuoteClick }) {
  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-semibold text-slate-800">Assigned RFPs</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Last Date</th>
              <th className="px-4 py-3">Min</th>
              <th className="px-4 py-3">Max</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rfps.map((rfp) => (
              <tr key={rfp.id} className="border-t">
                <td className="px-4 py-3">{rfp.title}</td>
                <td className="px-4 py-3">{rfp.category}</td>
                <td className="px-4 py-3">{rfp.last_date}</td>
                <td className="px-4 py-3">{rfp.min_amount}</td>
                <td className="px-4 py-3">{rfp.max_amount}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onQuoteClick(rfp)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    Submit Quote
                  </button>
                </td>
              </tr>
            ))}
            {rfps.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-slate-500">
                  No RFPs assigned.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RFPTable;