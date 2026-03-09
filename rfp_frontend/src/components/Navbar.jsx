import { useNavigate } from "react-router-dom";

export default function Navbar({ label }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("pending_email");
    localStorage.removeItem("user_role");
    navigate("/");
  };

  return (
    <div className="mb-6 flex items-center justify-between rounded-2xl bg-slate-800 px-5 py-4 text-white shadow-sm">
      <div>
        <h2 className="text-xl font-bold">RFP_DFP</h2>
        <p className="text-sm text-slate-300">{label}</p>
      </div>
      <button
        onClick={logout}
        className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}