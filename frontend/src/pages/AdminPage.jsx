import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3, Download, Users, GraduationCap, Building2, Filter,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AdminLayout from "../components/AdminLayout";
import StatCard from "../components/StatCard";

const SURVEY_KEYS = ["alumni", "teacher", "business"];
const SURVEY_LABELS = { alumni: "Cựu SV", teacher: "Giảng viên", business: "Doanh nghiệp" };
const ICON_MAP = { alumni: GraduationCap, teacher: Users, business: Building2 };
const COLORS = { alumni: "bg-emerald-500", teacher: "bg-yellow-500", business: "bg-lightBlue-500" };

export default function AdminPage() {
  const { user, isDean, isCoordinator, userMajor } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSurvey, setSelectedSurvey] = useState("alumni");
  const [selectedMajor, setSelectedMajor] = useState("");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (!isDean && !isCoordinator) { navigate("/"); return; }
  }, [user, navigate, isDean, isCoordinator]);

  useEffect(() => {
    setLoading(true);
    const majorParam = isCoordinator ? userMajor : selectedMajor;
    let url = "/api/admin/responses";
    if (majorParam) url += `?major=${encodeURIComponent(majorParam)}`;
    fetch(url, { headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {} })
      .then((r) => r.json())
      .then((resp) => { setData({ responses: resp }); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user?.token, selectedMajor, isCoordinator, userMajor]);

  const handleExport = async () => {
    const majorParam = isCoordinator ? userMajor : selectedMajor;
    let url = `/api/admin/export?survey=${selectedSurvey}`;
    if (majorParam) url += `&major=${encodeURIComponent(majorParam)}`;
    try {
      const res = await fetch(url, { headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {} });
      if (!res.ok) { alert("Không thể xuất dữ liệu"); return; }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${selectedSurvey}_export.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch { alert("Lỗi khi xuất dữ liệu"); }
  };

  if (!user || (!isDean && !isCoordinator)) return null;

  const respData = data?.responses || {};

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-20 text-blueGray-400">Đang tải...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {isCoordinator && userMajor && (
        <div className="flex items-center gap-2 mb-6 px-4 py-3 bg-lightBlue-50 rounded-lg border border-lightBlue-200">
          <span className="text-lightBlue-700 text-sm font-semibold">Ngành phụ trách: <strong>{userMajor}</strong></span>
        </div>
      )}

      {isDean && (
        <div className="flex items-center gap-3 flex-wrap mb-6 px-4 py-3 bg-blueGray-50 rounded-lg border border-blueGray-200">
          <Filter size={16} className="text-blueGray-500" />
          <span className="text-blueGray-600 text-sm font-semibold">Lọc ngành:</span>
          <select value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)}
            className="border-0 px-3 py-2 bg-white rounded text-sm shadow focus:outline-none focus:ring text-blueGray-600">
            <option value="">Tất cả ngành</option>
            {respData.alumni?.columns && (
              (respData.alumni?.rows || []).map((r) => r[3]).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))
            )}
          </select>
        </div>
      )}

      {isDean && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-all ${
              activeTab === "overview" ? "bg-blueGray-800 text-white shadow" : "bg-white text-blueGray-600 border border-blueGray-300"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            <BarChart3 size={14} /> Tổng quan
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-all ${
              activeTab === "data" ? "bg-blueGray-800 text-white shadow" : "bg-white text-blueGray-600 border border-blueGray-300"
            }`}
            onClick={() => setActiveTab("data")}
          >
            <Users size={14} /> Dữ liệu phản hồi
          </button>
        </div>
      )}

      {(activeTab === "overview" || isCoordinator) && (
        <>
          <div className="flex flex-wrap -mx-4">
            {SURVEY_KEYS.map((key) => {
              const sv = respData[key];
              const Icon = ICON_MAP[key];
              return sv ? (
                <div key={key} className="w-full md:w-4/12 px-4">
                  <StatCard
                    icon={Icon}
                    title={SURVEY_LABELS[key]}
                    value={`${sv.count}`}
                    color={COLORS[key]}
                    subtitle={`${sv.count} phản hồi`}
                  />
                </div>
              ) : null;
            })}
          </div>

          {isDean && respData?.alumni?.columns && (
            <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded mt-4">
              <div className="px-4 py-5 flex-auto">
                <h3 className="text-blueGray-700 text-lg font-semibold mb-4">Phản hồi theo ngành (Cựu SV)</h3>
                <div className="flex flex-col gap-2">
                  {(respData.alumni.rows || []).map((r) => r[3]).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).map((m) => {
                    const count = respData.alumni.rows.filter((r) => r[3] && String(r[3]).trim() === m).length || 0;
                    const total = respData.alumni.count || 1;
                    const pct = ((count / total) * 100).toFixed(1);
                    return (
                      <div key={m} className="flex items-center gap-3">
                        <span className="text-sm text-blueGray-600 w-48 flex-shrink-0">{m}</span>
                        <div className="flex-1 h-5 bg-blueGray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-lightBlue-500 to-emerald-500 rounded-full transition-all duration-300" style={{ width: `${pct}%`, minWidth: 4 }} />
                        </div>
                        <span className="text-xs text-blueGray-500 w-24 text-right">{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {(activeTab === "data" || isCoordinator) && (
        <>
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <span className="text-blueGray-600 text-sm font-semibold">Chọn khảo sát:</span>
            <select value={selectedSurvey} onChange={(e) => setSelectedSurvey(e.target.value)}
              className="border-0 px-3 py-2 bg-white rounded text-sm shadow focus:outline-none focus:ring text-blueGray-600">
              {SURVEY_KEYS.map((k) => (<option key={k} value={k}>{SURVEY_LABELS[k]}</option>))}
            </select>
            <button onClick={handleExport}
              className="bg-emerald-500 text-white active:bg-emerald-600 text-xs font-bold uppercase px-4 py-2 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150 flex items-center gap-1 ml-auto">
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="relative flex flex-col min-w-0 break-words bg-white w-full shadow-lg rounded overflow-x-auto">
            <table className="w-full text-sm text-blueGray-600">
              <thead>
                <tr className="bg-blueGray-50">
                  <th className="px-4 py-3 text-left font-semibold">#</th>
                  {respData[selectedSurvey]?.columns?.slice(1, 9).map((col, i) => (
                    <th key={i} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{String(col).substring(0, 30)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(respData[selectedSurvey]?.rows || []).slice(0, 100).map((row, i) => (
                  <tr key={i} className="border-t border-blueGray-100 hover:bg-blueGray-50">
                    <td className="px-4 py-2">{i + 1}</td>
                    {row.slice(1, 9).map((cell, ci) => (
                      <td key={ci} className="px-4 py-2 max-w-[200px] truncate">{cell != null ? String(cell).substring(0, 50) : ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!respData[selectedSurvey]?.rows?.length && (
              <p className="text-center py-8 text-blueGray-400">Không có dữ liệu</p>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}