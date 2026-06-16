import { useState } from "react";
import API from "../api";
import { ShieldCheck } from "lucide-react";

export default function SetupGoogleAuth() {
  const [qrCode,    setQrCode]    = useState("");
  const [secret,    setSecret]    = useState("");
  const [totpCode,  setTotpCode]  = useState("");
  const [step,      setStep]      = useState("idle");
  const [error,     setError]     = useState("");
  const [msg,       setMsg]       = useState("");
  const [loading,   setLoading]   = useState(false);

  const startSetup = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await API.post("auth/setup-google-auth/");
      setQrCode(res.data.qr_code);
      setSecret(res.data.secret);
      setStep("qr");
    } catch (err) {
      setError(err.response?.data?.error || "Setup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmSetup = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await API.post("auth/verify-google-auth/", { totp_code: totpCode });
      setMsg(res.data.message);
      setStep("done");
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed. Check the code and retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <ShieldCheck size={20} className="text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">Google Authenticator</h3>
          <p className="text-sm text-slate-500">TOTP-based two-factor authentication</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {msg && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {msg}
        </div>
      )}

      {step === "idle" && (
        <button
          onClick={startSetup}
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Setting up..." : "Setup Google Authenticator"}
        </button>
      )}

      {step === "qr" && (
        <div className="space-y-5">
          <ol className="space-y-1 text-sm text-slate-600 list-decimal list-inside">
            <li>Open <strong>Google Authenticator</strong> on your phone.</li>
            <li>Tap <strong>+</strong> → <strong>Scan a QR code</strong>.</li>
            <li>Scan the image below.</li>
          </ol>

          <div className="flex justify-center">
            <img
              src={qrCode}
              alt="Google Auth QR Code"
              className="h-48 w-48 rounded-xl border border-slate-200 p-1"
            />
          </div>

          <details className="rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-500">
            <summary className="cursor-pointer font-medium">Can't scan? Enter key manually</summary>
            <p className="mt-2 break-all rounded bg-slate-50 p-2 font-mono">{secret}</p>
          </details>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Enter the 6-digit code from the app to confirm
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-xl tracking-widest outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={confirmSetup}
            disabled={totpCode.length !== 6 || loading}
            className="w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Confirm & Enable"}
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="rounded-xl bg-green-50 px-6 py-5 text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="font-semibold text-green-800">Google Authenticator is active!</p>
          <p className="mt-1 text-sm text-green-700">
            You'll be prompted for a TOTP code on your next login.
          </p>
        </div>
      )}
    </div>
  );
}