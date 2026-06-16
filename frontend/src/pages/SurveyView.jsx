import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#4a6cf7", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
const majorCols = { alumni: 3, teacher: 6, business: 45 };

export default function SurveyView() {
  const { name } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const majorParam = searchParams.get("major") || "";
  const [data, setData] = useState(null);
  const [groupedSummary, setGroupedSummary] = useState(null);
  const [summaryError, setSummaryError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  const [showDetailTable, setShowDetailTable] = useState(false);

  const majorColIdx = majorCols[name];

  useEffect(() => {
    setLoading(true);
    setSummaryError(""); setActiveSection(0); setShowDetailTable(false);
    const majorQ = majorParam ? `?major=${encodeURIComponent(majorParam)}` : "";
    Promise.all([
      fetch(`/api/survey/${name}`).then((r) => r.json()),
      fetch(`/api/survey/${name}/grouped-summary${majorQ}`).then((r) => r.json()),
    ]).then(([d, g]) => {
      setData(d);
      if (g.error) { setSummaryError(g.error); setGroupedSummary(null); }
      else setGroupedSummary(g);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [name, majorParam]);

  const sections = groupedSummary?.sections || [];

  const availableMajors = useMemo(() => {
    if (!data || majorColIdx == null || majorColIdx >= (data.columns?.length || 0)) return [];
    const vals = new Set();
    for (const row of data.rows) {
      const v = row[majorColIdx];
      if (v != null && v !== "") vals.add(String(v).trim());
    }
    return Array.from(vals).sort();
  }, [data, majorColIdx]);

  const filteredRows = useMemo(() => {
    if (!data) return [];
    let rows = data.rows;
    if (majorParam && majorColIdx != null && majorColIdx < (data.columns?.length || 0)) {
      rows = rows.filter((r) => String(r[majorColIdx] ?? "").trim().toLowerCase() === majorParam.trim().toLowerCase());
    }
    return rows;
  }, [data, majorParam, majorColIdx]);

  const visibleColumns = useMemo(() => {
    if (!data) return [];
    return data.columns.filter((c, i) => {
      if (!c) return false;
      const lower = c.toLowerCase().trim();
      const meta = ["email", "số điện thoại", "sđt", "điện thoại", "họ tên", "họ và tên",
        "mssv", "mã số sinh viên", "giới tính", "tuổi", "năm sinh",
        "thời gian", "timestamp", "dấu thời gian", "phone", "mobile"];
      return !meta.some((kw) => lower.includes(kw)) && lower.length >= 3 && i >= 2;
    });
  }, [data]);

  const surveyLabels = { business: "Doanh nghiệp", teacher: "Giảng viên", alumni: "Cựu SV" };
  const label = surveyLabels[name] || name;
  const currentSection = sections[activeSection];

  if (loading) return <div className="max-w-6xl mx-auto px-6 py-20 text-center text-blueGray-400">Đang tải dữ liệu...</div>;
  if (!data) return <div className="max-w-6xl mx-auto px-6 py-20 text-center text-red-500">Không thể tải dữ liệu khảo sát.</div>;

  return (
    <>
      <nav className="bg-gradient-to-r from-blueGray-800 to-blueGray-900 text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <Link to="/" className="text-blueGray-300 hover:text-white text-sm flex items-center gap-1 transition-colors">
              <ArrowLeft size={16} /> Trang chủ
            </Link>
            <h1 className="text-lg font-bold mt-1">Khảo sát {label}</h1>
            <p className="text-blueGray-400 text-xs mt-0.5">
              {groupedSummary?.total_responses ?? filteredRows.length} phản hồi &middot; {sections.length} nhóm câu hỏi
            </p>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {availableMajors.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap px-4 py-3 bg-white rounded-lg border border-blueGray-200 mb-5">
            <label className="text-sm font-semibold text-blueGray-600">Lọc theo ngành:</label>
            <select value={majorParam} onChange={(e) => { const v = e.target.value; if (v) setSearchParams({ major: v }); else setSearchParams({}); }}
              className="px-3 py-2 border border-blueGray-200 rounded-lg text-sm bg-white text-blueGray-600 focus:outline-none focus:ring-2 focus:ring-blueGray-400">
              <option value="">Tất cả</option>
              {availableMajors.map((m) => (<option key={m} value={m}>{m}</option>))}
            </select>
            {majorParam && (
              <span className="text-xs bg-blueGray-100 text-blueGray-700 px-3 py-1 rounded-full font-semibold">
                Đang lọc: <strong>{majorParam}</strong>
              </span>
            )}
          </div>
        )}

        {summaryError && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm mb-4">{summaryError}</div>
        )}
        {filteredRows.length === 0 && !loading && !summaryError && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm mb-4">Không có dữ liệu cho lựa chọn này.</div>
        )}

        {filteredRows.length > 0 && sections.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            {sections.map((s, i) => (
              <button key={i} onClick={() => setActiveSection(i)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${i === activeSection ? "bg-blueGray-800 text-white shadow" : "bg-white text-blueGray-600 border border-blueGray-200 hover:bg-blueGray-50"}`}>
                {s.label.substring(0, 35)}{s.label.length > 35 ? "..." : ""}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${i === activeSection ? "bg-white/20" : "bg-blueGray-200"}`}>{s.items?.length || 0}</span>
              </button>
            ))}
          </div>
        )}

        {filteredRows.length > 0 && currentSection && (
          <div className="mb-6">
            <h4 className="text-base font-semibold text-blueGray-700 mb-4 pb-2 border-b border-blueGray-200">{currentSection.label}</h4>
            {(() => {
              const isPlomatrix = currentSection.type === "plo" && (() => {
                const ploNums = new Set();
                for (const item of currentSection.items) {
                  const m = item.text.match(/PLO\s*(\d+)/i);
                  if (m) ploNums.add(m[1]);
                }
                return ploNums.size >= 4;
              })();
              const isRatingGroup = currentSection.type === "rating_group" || (currentSection.type === "plo" && !isPlomatrix && currentSection.items.every(i => i.type === "numeric") && currentSection.items.length >= 2);
              if (isPlomatrix) return <Plomatrix items={currentSection.items} />;
              if (isRatingGroup) return <RatingGroup items={currentSection.items} />;
              return (
                <div className="grid md:grid-cols-2 gap-4">
                  {currentSection.items.map((item) => <ChartCard key={item.id} item={item} />)}
                </div>
              );
            })()}
          </div>
        )}

        {filteredRows.length > 0 && visibleColumns.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-blueGray-100 mt-8">
            <div className="flex items-center gap-2 px-5 py-4 cursor-pointer select-none" onClick={() => setShowDetailTable(!showDetailTable)}>
              <h3 className="text-sm font-semibold text-blueGray-700 flex-1">Dữ liệu chi tiết ({filteredRows.length} dòng)</h3>
              {showDetailTable ? <ChevronUp size={16} className="text-blueGray-400" /> : <ChevronDown size={16} className="text-blueGray-400" />}
            </div>
            {showDetailTable && (
              <div className="overflow-auto max-h-96 px-5 pb-4">
                <table className="w-full text-sm text-blueGray-600">
                  <thead>
                    <tr className="bg-blueGray-50">
                      {visibleColumns.slice(0, 12).map((c, i) => (
                        <th key={i} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{c.substring(0, 25)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.slice(0, 100).map((row, ri) => (
                      <tr key={ri} className="border-t border-blueGray-100">
                        {row.filter((_, ci) => {
                          const c = data.columns[ci];
                          if (!c) return false;
                          const lower = c.toLowerCase().trim();
                          const meta = ["email", "số điện thoại", "sđt", "điện thoại", "họ tên", "họ và tên",
                            "mssv", "mã số sinh viên", "giới tính", "tuổi", "năm sinh",
                            "thời gian", "timestamp", "dấu thời gian", "phone", "mobile"];
                          return !meta.some((kw) => lower.includes(kw)) && lower.length >= 3 && ci >= 2;
                        }).slice(0, 12).map((cell, ci) => (
                          <td key={ci} className="px-3 py-2 max-w-[200px] truncate">{cell != null ? String(cell).substring(0, 40) : ""}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

function truncate(text, max = 70) {
  return text && text.length > max ? text.substring(0, max) + "..." : text;
}

function ChartCard({ item }) {
  const isNumeric = item.type === "numeric";

  if (isNumeric) {
    const distData = (item.distribution || []).map((d) => ({ name: d.value, value: d.count }));
    if (distData.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-md border border-blueGray-100 p-5">
          <h3 className="text-sm font-semibold text-blueGray-700 mb-3" title={item.text}>{truncate(item.text)}</h3>
          <div className="py-5 text-center text-blueGray-400 text-sm">Không có dữ liệu</div>
        </div>
      );
    }
    const barColor = item.mean >= 4 ? "#10b981" : item.mean >= 3 ? "#f59e0b" : "#ef4444";
    return (
      <div className="bg-white rounded-xl shadow-md border border-blueGray-100 p-5">
        <h3 className="text-sm font-semibold text-blueGray-700 mb-3" title={item.text}>{truncate(item.text)}</h3>
        <div className="flex gap-4 mb-3 text-xs text-blueGray-500">
          <span>TB: <strong className="text-blueGray-700">{item.mean.toFixed(2)}</strong></span>
          <span>T.t: <strong className="text-blueGray-700">{item.min.toFixed(1)}</strong></span>
          <span>C.n: <strong className="text-blueGray-700">{item.max.toFixed(1)}</strong></span>
          <span>({item.count} p/hồi)</span>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={barColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  const chartData = (item.distribution || []).map((d) => ({ name: d.value, value: d.count }));
  if (chartData.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-md border border-blueGray-100 p-5">
      <h3 className="text-sm font-semibold text-blueGray-700 mb-3" title={item.text}>{truncate(item.text, 80)}</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
              {chartData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RatingGroup({ items }) {
  const data = items.map((item) => {
    const shortName = item.text.replace(/^[\d./\s-]+/, "").substring(0, 40);
    return { name: shortName, mean: item.mean, min: item.min, max: item.max, count: item.count, full: item.text };
  });
  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-md border border-blueGray-100 p-5">
      <div style={{ height: Math.max(200, data.length * 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 40 }}>
            <XAxis type="number" domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
            <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v, n, p) => [v.toFixed(2), p.payload.full || p.payload.name]} />
            <Bar dataKey="mean" radius={[0, 4, 4, 0]}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.mean >= 4 ? "#10b981" : entry.mean >= 3 ? "#f59e0b" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 mt-3 text-xs text-blueGray-500">
        {data.map((d, i) => (
          <span key={i} title={d.full}>{i + 1}. {d.name.substring(0, 25)}: <strong className="text-blueGray-700">{d.mean.toFixed(2)}</strong> ({d.count})</span>
        ))}
      </div>
    </div>
  );
}

function Plomatrix({ items }) {
  if (!items || items.length === 0) return <p className="text-blueGray-400 text-sm">Không có dữ liệu PLO.</p>;

  const numericItems = items.filter((item) => item.type === "numeric");
  if (numericItems.length === 0) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {items.map((item) => <ChartCard key={item.id} item={item} />)}
      </div>
    );
  }

  const rows = numericItems.map((item) => {
    const m = item.text.match(/PLO\s*(\d+)/i);
    const ploNum = m ? parseInt(m[1]) : null;
    return { plo: ploNum ? `PLO ${ploNum}` : item.text.substring(0, 40), ...item };
  });
  rows.sort((a, b) => { const na = parseInt(a.plo.replace(/\D/g, "")) || 0; const nb = parseInt(b.plo.replace(/\D/g, "")) || 0; return na - nb; });

  const getColor = (val) => {
    if (val >= 4.5) return "#064e3b";
    if (val >= 4.0) return "#10b981";
    if (val >= 3.5) return "#a3e635";
    if (val >= 3.0) return "#facc15";
    if (val >= 2.5) return "#fb923c";
    return "#ef4444";
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-blueGray-100 p-5">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-blueGray-600" style={{ minWidth: 500 }}>
          <thead>
            <tr className="bg-blueGray-50">
              <th className="px-3 py-2 text-left font-semibold" style={{ minWidth: 100 }}>PLO</th>
              <th className="px-3 py-2 text-center font-semibold">Điểm TB</th>
              <th className="px-3 py-2 text-center font-semibold">Thấp</th>
              <th className="px-3 py-2 text-center font-semibold">Cao</th>
              <th className="px-3 py-2 text-center font-semibold">Số p/hồi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-blueGray-100">
                <td className="px-3 py-2 font-semibold text-xs" title={row.text}>{row.plo}</td>
                <td className="px-3 py-2 text-center">
                  <span className="inline-block px-3 py-0.5 rounded-full text-white font-bold text-sm" style={{ background: getColor(row.mean) }}>
                    {row.mean.toFixed(2)}
                  </span>
                </td>
                <td className="px-3 py-2 text-center text-xs text-blueGray-400">{row.min.toFixed(1)}</td>
                <td className="px-3 py-2 text-center text-xs text-blueGray-400">{row.max.toFixed(1)}</td>
                <td className="px-3 py-2 text-center text-xs text-blueGray-400">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}