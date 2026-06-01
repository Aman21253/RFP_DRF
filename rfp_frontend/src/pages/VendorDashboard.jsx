import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import VendorSidebar from "../components/VendorSidebar";

function SetupGoogleAuth() {
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [step, setStep] = useState("idle");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const startSetup = async () => {
    setError("");
    try {
      const res = await API.post("auth/setup-google-auth/");
      setQrCode(res.data.qr_code);
      setSecret(res.data.secret);
      setStep("qr");
    } catch (err) {
      setError(err.response?.data?.error || "Setup failed");
    }
  };

  const confirmSetup = async () => {
    setError("");
    try {
      const res = await API.post("auth/verify-google-auth/", {
        totp_code: totpCode,
      });
      setMsg(res.data.message);
      setStep("done");
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-2">
        Google Authenticator Setup
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        Enable TOTP-based 2FA using Google Authenticator for more secure logins.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {msg && (
        <div className="mb-4 rounded-lg bg-green-100 px-4 py-3 text-sm text-green-700">
          {msg}
        </div>
      )}

      {step === "idle" && (
        <button
          onClick={startSetup}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Setup Google Authenticator
        </button>
      )}

      {step === "qr" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            1. Open the <strong>Google Authenticator</strong> app on your phone.<br />
            2. Tap <strong>+</strong> → <strong>Scan a QR code</strong>.<br />
            3. Scan the image below.
          </p>

          <div className="flex justify-center">
            <img src={qrCode} alt="QR Code" className="w-48 h-48 border rounded-lg" />
          </div>

          <details className="text-xs text-slate-400">
            <summary className="cursor-pointer">Can't scan? Enter manually</summary>
            <p className="mt-1 font-mono break-all bg-slate-50 p-2 rounded">{secret}</p>
          </details>

          <p className="text-sm text-slate-600 font-medium">
            4. Enter the 6-digit code shown in the app to confirm:
          </p>

          <input
            type="text"
            placeholder="6-digit code"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            maxLength={6}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 text-center text-xl tracking-widest"
          />

          <button
            onClick={confirmSetup}
            disabled={totpCode.length !== 6}
            className="w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            Confirm & Enable
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="text-center text-green-700 font-semibold text-lg">
          ✅ Google Authenticator is now active on your account!
        </div>
      )}
    </div>
  );
}

export default function VendorDashboard() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("dashboard");
  const [vendor, setVendor] = useState(null);
  const [summary, setSummary] = useState({});
  const [rfps, setRfps] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRfp, setSelectedRfp] = useState("");
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;

  const loadVendorData = async () => {
    try {
      setLoading(true);

      const [dashboardRes, rfpRes, quoteRes] = await Promise.all([
        API.get("vendor/dashboard/"),
        API.get("vendor/rfp/"),
        API.get("vendor/quotes/"),
      ]);

      setVendor(dashboardRes.data.vendor || null);
      setSummary(dashboardRes.data.summary || {});
      setRfps(rfpRes.data || []);
      setQuotes(quoteRes.data || []);
    } catch (error) {
      console.log("VENDOR DASHBOARD ERROR:", error?.response?.data || error.message);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendorData();
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const paginatedRfps = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return rfps.slice(start, start + perPage);
  }, [rfps, currentPage]);

  const totalPages = Math.ceil(rfps.length / perPage);

  const appliedRfps = useMemo(() => {
    return new Set(quotes.map((q) => q.rfp));
  }, [quotes]);

  const openApplyForm = (rfpId) => {
    setSelectedRfp(String(rfpId));
    setActiveSection("apply");
    setMsg("");
    setError("");
    setAmount("");
    setRemarks("");
  };

  const submitQuote = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    if (!selectedRfp) {
      setError("Please select an RFP.");
      return;
    }

    if (!amount) {
      setError("Please enter amount.");
      return;
    }

    try {
      const res = await API.post(`vendor/rfp/${selectedRfp}/quote/`, {
        amount,
        remarks,
      });

      setMsg(res.data.message || "Quote submitted successfully.");
      setAmount("");
      setRemarks("");
      await loadVendorData();
      setActiveSection("rfps");
    } catch (err) {
      console.log("QUOTE SUBMIT ERROR:", err.response?.data || err.message);
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          JSON.stringify(err.response?.data) ||
          "Failed to submit quote"
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <VendorSidebar
        active={activeSection}
        setActive={setActiveSection}
        onLogout={logout}
      />

      <main className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Vendor Dashboard</h2>
            <p className="mt-1 text-slate-500">
              Manage assigned RFPs and submit quotes
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-sm text-slate-500">Logged in as</p>
            <p className="font-semibold text-slate-800">
              {vendor ? `${vendor.first_name} ${vendor.last_name}` : ""}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm">
            Loading dashboard...
          </div>
        ) : (
          <>
            {activeSection === "dashboard" && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-2xl font-semibold text-slate-800">
                  Welcome {vendor?.first_name} {vendor?.last_name}
                </h3>
                <p className="mt-2 text-slate-600">Status: {vendor?.status}</p>
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Assigned RFPs</p>
                    <h4 className="mt-2 text-3xl font-bold text-slate-800">
                      {summary?.assigned_rfps || 0}
                    </h4>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Quotes Submitted</p>
                    <h4 className="mt-2 text-3xl font-bold text-slate-800">
                      {summary?.quotes_submitted || 0}
                    </h4>
                  </div>
                </div>
              </section>
            )}

            {activeSection === "rfps" && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-2xl font-semibold text-slate-800">RFP List</h3>
                  <p className="text-sm text-slate-500">Home / RFP List</p>
                </div>

                {msg && (
                  <div className="mb-4 rounded-lg bg-green-100 px-4 py-3 text-green-700">
                    {msg}
                  </div>
                )}

                {error && (
                  <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-red-700">
                    {error}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="px-4 py-4 text-left">RFP No.</th>
                        <th className="px-4 py-4 text-left">RFP Title</th>
                        <th className="px-4 py-4 text-left">RFP Last Date</th>
                        <th className="px-4 py-4 text-left">Min Amount</th>
                        <th className="px-4 py-4 text-left">Max Amount</th>
                        <th className="px-4 py-4 text-left">Status</th>
                        <th className="px-4 py-4 text-left">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedRfps.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-6 text-center text-slate-500">
                            No RFPs assigned.
                          </td>
                        </tr>
                      ) : (
                        paginatedRfps.map((rfp) => (
                          <tr key={rfp.id} className="border-b border-slate-200 bg-white">
                            <td className="px-4 py-4">{rfp.id}</td>
                            <td className="px-4 py-4">{rfp.title}</td>
                            <td className="px-4 py-4">{rfp.last_date}</td>
                            <td className="px-4 py-4">{rfp.min_amount}</td>
                            <td className="px-4 py-4">{rfp.max_amount}</td>
                            <td className="px-4 py-4">
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                {rfp.status}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              {appliedRfps.has(rfp.id) ? (
                                <span className="font-semibold text-blue-600">Applied</span>
                              ) : (
                                <button
                                  onClick={() => openApplyForm(rfp.id)}
                                  className="font-medium text-green-500 hover:text-green-600"
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

                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <button
                        key={index + 1}
                        onClick={() => setCurrentPage(index + 1)}
                        className={`h-10 w-10 rounded border ${
                          currentPage === index + 1
                            ? "border-slate-500 bg-slate-100 text-slate-800"
                            : "border-slate-300 text-slate-500"
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeSection === "quotes" && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-2xl font-semibold text-slate-800">My Quotes</h3>
                <p className="mt-1 text-sm text-slate-500">View submitted quotes</p>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="px-4 py-4 text-left">Quote No.</th>
                        <th className="px-4 py-4 text-left">RFP Title</th>
                        <th className="px-4 py-4 text-left">Amount</th>
                        <th className="px-4 py-4 text-left">Remarks</th>
                        <th className="px-4 py-4 text-left">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotes.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-6 text-center text-slate-500">
                            No quotes submitted yet.
                          </td>
                        </tr>
                      ) : (
                        quotes.map((quote) => (
                          <tr key={quote.id} className="border-b border-slate-200">
                            <td className="px-4 py-4">{quote.id}</td>
                            <td className="px-4 py-4">{quote.rfp_title}</td>
                            <td className="px-4 py-4">{quote.amount}</td>
                            <td className="px-4 py-4">{quote.remarks || "-"}</td>
                            <td className="px-4 py-4">{quote.created_at || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeSection === "apply" && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-2xl font-semibold text-slate-800">Apply Quote</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Submit your quote for assigned RFP
                </p>

                {msg && (
                  <div className="mt-4 rounded-lg bg-green-100 px-4 py-3 text-green-700">
                    {msg}
                  </div>
                )}

                {error && (
                  <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={submitQuote} className="mt-6 max-w-2xl space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Select RFP
                    </label>
                    <select
                      value={selectedRfp}
                      onChange={(e) => setSelectedRfp(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                    >
                      <option value="">Choose assigned RFP</option>
                      {rfps
                        .filter((rfp) => !appliedRfps.has(rfp.id) || String(rfp.id) === String(selectedRfp))
                        .map((rfp) => (
                          <option key={rfp.id} value={rfp.id}>
                            {rfp.title}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter quote amount"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Remarks
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows="4"
                      placeholder="Enter remarks"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Submit Quote
                  </button>
                </form>
              </section>
            )}

            {/* Google Authenticator Setup Section */}
            {activeSection === "security" && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-2xl font-semibold text-slate-800 mb-1">Security</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Manage two-factor authentication for your account
                </p>
                <SetupGoogleAuth />
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}