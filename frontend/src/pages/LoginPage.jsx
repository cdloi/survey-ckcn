import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) { setError("Vui lòng nhập tên đăng nhập và mật khẩu"); return; }
    setBusy(true);
    try {
      const user = await login(username, password);
      navigate(user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blueGray-800 to-blueGray-900 flex flex-col">
      <nav className="w-full px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-white text-sm font-bold uppercase">
            Khoa CKCN
          </Link>
          <Link to="/" className="text-blueGray-300 hover:text-white text-xs uppercase font-bold transition-colors">
            ← Trang chủ
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-blueGray-200 rounded-lg shadow-xl">
            <div className="px-6 py-6">
              <h6 className="text-blueGray-500 text-sm font-bold text-center">Đăng nhập</h6>
              <hr className="mt-4 border-blueGray-300" />
            </div>
            <div className="px-6 pb-8">
              <p className="text-blueGray-400 text-center text-xs font-bold mb-6">
                Ban lãnh đạo Khoa / Cán bộ phụ trách ngành
              </p>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-3 bg-white rounded text-sm text-blueGray-600 shadow focus:outline-none focus:ring-2 focus:ring-blueGray-400 placeholder-blueGray-300"
                    placeholder="Tên đăng nhập"
                    autoFocus
                  />
                </div>
                <div className="mb-4">
                  <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-3 bg-white rounded text-sm text-blueGray-600 shadow focus:outline-none focus:ring-2 focus:ring-blueGray-400 placeholder-blueGray-300 pr-10"
                      placeholder="Mật khẩu"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blueGray-400 hover:text-blueGray-600"
                      onClick={() => setShowPw(!showPw)}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-blueGray-800 hover:bg-blueGray-700 text-white text-sm font-bold uppercase px-6 py-3 rounded shadow-lg transition-all disabled:opacity-50"
                >
                  {busy ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}