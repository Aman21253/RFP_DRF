import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import VendorSidebar from "../components/VendorSidebar";
import StatCard from "../components/StatCard";

// ── Google Auth Setup (embedded) ──────────────────────────────────────────────
function SetupGoogleAuth() {
  const [qrCode,   setQrCode]   = useState("");
  const [secret,   setSecret]   = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [step,     setStep]     = useState("idle");
  const [error,    setError]    = useState("");
  const [msg,      setMsg]      = useState("");
  const [loading,  setLoading]  = useState(false);

  const startSetup = async () => {
    setError(""); setLoading(true);
    try {
      const r = await API.post("auth/setup-google-auth/");
      setQrCode(r.data.qr_code); setSecret(r.data.secret); setStep("qr");
    } catch (e) { setError(e.response?.data?.error || "Setup failed."); }
    finally { setLoading(false); }
  };

  const confirmSetup = async () => {
    setError(""); setLoading(true);
    try {
      const r = await API.post("auth/verify-google-auth/", { totp_code: totpCode });
      setMsg(r.data.message); setStep("done");
    } catch (e) { setError(e.response?.data?.error || "Verification failed."); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-sm">
      {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
      {msg   && <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{msg}</div>}

      {step === "idle" && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h4 className="font-semibold text-slate-800 mb-1">Protect your account</h4>
          <p className="text-sm text-slate-500 mb-5">Enable Google Authenticator for TOTP-based two-factor login.</p>
          <button onClick={startSetup} disabled={loading} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition">
            {loading ? "Setting up…" : "Set up Google Authenticator"}
          </button>
        </div>
      )}

      {step === "qr" && (
        <div className="space-y-5">
          <ol className="space-y-1 text-sm text-slate-600 list-decimal list-inside">
            <li>Open <strong>Google Authenticator</strong> on your phone.</li>
            <li>Tap <strong>+</strong> → <strong>Scan a QR code</strong>.</li>
            <li>Scan the image below, then enter the code to confirm.</li>
          </ol>
          <div className="flex justify-center">
            <img src={qrCode} alt="Google Auth QR Code" className="h-48 w-48 rounded-xl border border-slate-200 p-1" />
          </div>
          <details className="rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-500">
            <summary className="cursor-pointer font-medium">Can't scan? Enter key manually</summary>
            <p className="mt-2 break-all rounded bg-slate-50 p-2 font-mono">{secret}</p>
          </details>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">6-digit code from the app</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xl tracking-[0.4em] font-mono outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
            />
          </div>
          <button onClick={confirmSetup} disabled={totpCode.length !== 6 || loading} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition">
            {loading ? "Verifying…" : "Confirm & enable"}
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-6 py-8 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-bold text-emerald-800">Google Authenticator is active!</p>
          <p className="mt-1 text-sm text-emerald-700">You'll be prompted for a code on your next login.</p>
        </div>
      )}
    </div>
  );
}

// ── Quote modal ───────────────────────────────────────────────────────────────
function QuoteModal({ rfp, onClose, onSuccess }) {
  const [amount,  setAmount]  = useState("");
  const [remarks, setRemarks] = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!amount || parseFloat(amount) <= 0) { setError("Enter a valid amount."); return; }
    setLoading(true);
    try {
      await API.post(`vendor/rfp/${rfp.id}/quote/`, { amount, remarks });
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || "Submission failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Submit quote</h3>
            <p className="text-sm text-slate-500 mt-0.5 truncate max-w-xs">{rfp.title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mb-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
          Budget range: <span className="font-semibold text-slate-800">₹{Number(rfp.min_amount).toLocaleString()}</span>
          {" – "}
          <span className="font-semibold text-slate-800">₹{Number(rfp.max_amount).toLocaleString()}</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Your quote amount (₹) <span className="text-red-500">*</span></label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" placeholder="0.00" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Remarks</label>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} placeholder="Any notes for the admin…" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none" />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={submit} disabled={loading} className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition">
            {loading ? "Submitting…" : "Submit quote"}
          </button>
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function VendorDashboard() {
  const navigate = useNavigate();

  const [section,  setSection]  = useState("dashboard");
  const [vendor,   setVendor]   = useState(null);
  const [summary,  setSummary]  = useState({});
  const [rfps,     setRfps]     = useState([]);
  const [quotes,   setQuotes]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [quoteRfp, setQuoteRfp] = useState(null);   // RFP for modal
  const [page,     setPage]     = useState(1);
  const perPage = 8;

  const logout = () => { localStorage.clear(); navigate("/"); };

  const load = async () => {
    try {
      setLoading(true);
      const [d, r, q] = await Promise.all([
        API.get("vendor/dashboard/"),
        API.get("vendor/rfp/"),
        API.get("vendor/quotes/"),
      ]);
      setVendor(d.data.vendor || null);
      setSummary(d.data.summary || {});
      setRfps(r.data || []);
      setQuotes(q.data || []);
    } catch (e) {
      if (e.response?.status === 401) navigate("/");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const appliedRfpIds = useMemo(() => new Set(quotes.map((q) => q.rfp)), [quotes]);

  const paginatedRfps = useMemo(() => {
    const s = (page - 1) * perPage;
    return rfps.slice(s, s + perPage);
  }, [rfps, page]);

  const totalPages = Math.ceil(rfps.length / perPage);

  const thClass = "px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide";
  const tdClass = "px-4 py-3 text-sm text-slate-600";

  return (
    <div className="flex min-h-screen bg-slate-100">
      <VendorSidebar
        active={section}
        setActive={(s) => { setSection(s); setPage(1); }}
        onLogout={logout}
        vendorName={vendor ? `${vendor.first_name} ${vendor.last_name}` : ""}
      />

      {quoteRfp && (
        <QuoteModal rfp={quoteRfp} onClose={() => setQuoteRfp(null)} onSuccess={load} />
      )}

      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 capitalize">{section.replace("-", " ")}</h2>
            <p className="text-xs text-slate-400 mt-0.5">RFP Platform · Vendor portal</p>
          </div>
          {vendor && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                {vendor.first_name?.[0]}{vendor.last_name?.[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 leading-none">{vendor.first_name} {vendor.last_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{vendor.category}</p>
              </div>
            </div>
          )}
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
                  {vendor?.status === "PENDING" && (
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      <p className="text-sm text-amber-700"><strong>Account pending approval.</strong> An admin needs to approve your registration before you can access RFPs.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                    <StatCard title="Assigned RFPs"   value={summary.assigned_rfps ?? 0}    color="blue" />
                    <StatCard title="Quotes submitted" value={summary.quotes_submitted ?? 0} color="green" />
                    <StatCard title="Account status"   value={vendor?.status ?? "—"}          color={vendor?.status === "APPROVED" ? "green" : "yellow"} />
                  </div>

                  {vendor && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                      <h3 className="text-sm font-semibold text-slate-700 mb-4">Your profile</h3>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                        {[
                          ["Name",     `${vendor.first_name} ${vendor.last_name}`],
                          ["Email",    vendor.email],
                          ["Category", vendor.category || "—"],
                          ["Status",   vendor.status],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <p className="text-xs text-slate-400 mb-0.5">{k}</p>
                            <p className="font-medium text-slate-800">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── RFPs ── */}
              {section === "rfps" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">Assigned RFPs</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{rfps.length} open RFPs waiting for your quote</p>
                    </div>
                  </div>

                  <table className="w-full">
                    <thead className="border-b border-slate-100">
                      <tr>
                        <th className={thClass}>#</th>
                        <th className={thClass}>Title</th>
                        <th className={thClass}>Category</th>
                        <th className={thClass}>Closing date</th>
                        <th className={thClass}>Budget</th>
                        <th className={thClass}>Status</th>
                        <th className={thClass}>Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {paginatedRfps.length === 0 ? (
                        <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">No RFPs assigned yet.</td></tr>
                      ) : paginatedRfps.map((rfp) => (
                        <tr key={rfp.id} className="hover:bg-slate-50 transition">
                          <td className={`${tdClass} font-mono text-xs text-slate-400`}>{rfp.id}</td>
                          <td className={`${tdClass} font-medium text-slate-800`}>{rfp.title}</td>
                          <td className={tdClass}>{rfp.category || "—"}</td>
                          <td className={tdClass}>{rfp.last_date}</td>
                          <td className={tdClass}>₹{Number(rfp.min_amount).toLocaleString()} – ₹{Number(rfp.max_amount).toLocaleString()}</td>
                          <td className={tdClass}>
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700">{rfp.status}</span>
                          </td>
                          <td className={tdClass}>
                            {appliedRfpIds.has(rfp.id) ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                Applied
                              </span>
                            ) : (
                              <button onClick={() => setQuoteRfp(rfp)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition">
                                Apply
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {totalPages > 1 && (
                    <div className="mt-5 flex items-center justify-center gap-1.5">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPage(i + 1)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                            page === i + 1
                              ? "bg-blue-600 text-white"
                              : "text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── QUOTES ── */}
              {section === "quotes" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-800">My quotes</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{quotes.length} quotes submitted</p>
                  </div>

                  <table className="w-full">
                    <thead className="border-b border-slate-100">
                      <tr>
                        <th className={thClass}>#</th>
                        <th className={thClass}>RFP title</th>
                        <th className={thClass}>Amount</th>
                        <th className={thClass}>Remarks</th>
                        <th className={thClass}>Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {quotes.length === 0 ? (
                        <tr><td colSpan={5} className="py-12 text-center text-sm text-slate-400">No quotes submitted yet. Apply to an RFP to get started.</td></tr>
                      ) : quotes.map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50 transition">
                          <td className={`${tdClass} font-mono text-xs text-slate-400`}>{q.id}</td>
                          <td className={`${tdClass} font-medium text-slate-800`}>{q.rfp_title}</td>
                          <td className={`${tdClass} font-semibold text-slate-800`}>₹{Number(q.amount).toLocaleString()}</td>
                          <td className={tdClass}>{q.remarks || <span className="text-slate-400">—</span>}</td>
                          <td className={`${tdClass} text-xs text-slate-400`}>{q.created_at || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── SECURITY ── */}
              {section === "security" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">Security</h3>
                  <p className="text-sm text-slate-500 mb-6">Manage two-factor authentication for your account.</p>
                  <SetupGoogleAuth />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}