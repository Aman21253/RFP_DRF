import { useState } from "react";
import API from "../api";

export default function SetupGoogleAuth() {
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [step, setStep] = useState("idle"); // idle | qr | done
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
            1. Open the <strong>Google Authenticator</strong> app on your phone.
            <br />
            2. Tap <strong>+</strong> → <strong>Scan a QR code</strong>.
            <br />
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
        <div className="text-center text-green-700 font-semibold">
          ✅ Google Authenticator is now active on your account!
        </div>
      )}
    </div>
  );
}