import { useState } from "react";
import API from "../api";
import { X, Plus, Trash2 } from "lucide-react";

export default function QuoteForm({ rfp, onClose, onSuccess }) {
  const [amount, setAmount]   = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    try {
      await API.post(`vendor/rfp/${rfp.id}/quote/`, { amount, remarks });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Quote submission failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Submit Quote</h2>
            <p className="mt-1 text-sm text-slate-500">{rfp.title}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* RFP Budget Reference */}
        <div className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Budget range: <span className="font-semibold">₹{rfp.min_amount}</span>
          {" "}–{" "}
          <span className="font-semibold">₹{rfp.max_amount}</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Your Quote Amount *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              step="0.01"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Add any notes or remarks..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit Quote"}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}