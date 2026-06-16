const ratingColor = (val) => {
  if (val >= 4.5) return "#064e3b";
  if (val >= 4.0) return "#10b981";
  if (val >= 3.5) return "#a3e635";
  if (val >= 3.0) return "#facc15";
  if (val >= 2.5) return "#fb923c";
  return "#ef4444";
};

export function DistributionTable({ table }) {
  if (!table?.data?.length) return null;
  const total = table.total || table.data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="bg-white rounded-xl shadow-md border border-blueGray-100 p-4">
      <h3 className="text-sm font-semibold text-blueGray-700 mb-3">{table.title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-blueGray-600" style={{ minWidth: 300 }}>
          <thead>
            <tr className="bg-blueGray-50">
              <th className="px-3 py-2 text-left font-semibold">Giá trị</th>
              <th className="px-3 py-2 text-center font-semibold" style={{ width: 80 }}>SL</th>
              <th className="px-3 py-2 text-center font-semibold" style={{ width: 80 }}>Tỉ lệ</th>
              <th style={{ width: 200 }}></th>
            </tr>
          </thead>
          <tbody>
            {table.data.map((row, i) => (
              <tr key={i} className="border-t border-blueGray-100">
                <td className="px-3 py-2 text-xs">{row.label}</td>
                <td className="px-3 py-2 text-center font-semibold">{row.count}</td>
                <td className="px-3 py-2 text-center text-blueGray-400">{row.percent}%</td>
                <td className="px-3 py-2">
                  <div className="h-5 bg-blueGray-100 rounded overflow-hidden">
                    <div className="h-full bg-blueGray-500 rounded transition-all duration-300" style={{ width: `${Math.min(row.percent, 100)}%` }} />
                  </div>
                </td>
              </tr>
            ))}
            <tr className="font-bold bg-blueGray-50 border-t border-blueGray-200">
              <td className="px-3 py-2 text-xs">Tổng</td>
              <td className="px-3 py-2 text-center">{total}</td>
              <td className="px-3 py-2 text-center">100%</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RatingTable({ table }) {
  if (!table?.data?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-md border border-blueGray-100 p-4">
      <h3 className="text-sm font-semibold text-blueGray-700 mb-3">{table.title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-blueGray-600" style={{ minWidth: 400 }}>
          <thead>
            <tr className="bg-blueGray-50">
              <th className="px-3 py-2 text-left font-semibold" style={{ minWidth: 180 }}>Tiêu chí</th>
              <th className="px-3 py-2 text-center font-semibold" style={{ width: 80 }}>ĐTB</th>
              <th className="px-3 py-2 text-center font-semibold" style={{ width: 60 }}>Min</th>
              <th className="px-3 py-2 text-center font-semibold" style={{ width: 60 }}>Max</th>
              <th className="px-3 py-2 text-center font-semibold" style={{ width: 60 }}>SL</th>
              <th style={{ width: 160 }}></th>
            </tr>
          </thead>
          <tbody>
            {table.data.map((row, i) => (
              <tr key={i} className="border-t border-blueGray-100">
                <td className="px-3 py-2 text-xs" title={row.label}>
                  {row.label.length > 50 ? row.label.substring(0, 50) + "..." : row.label}
                </td>
                <td className="px-3 py-2 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-white font-bold text-sm" style={{ background: ratingColor(row.mean) }}>
                    {row.mean.toFixed(2)}
                  </span>
                </td>
                <td className="px-3 py-2 text-center text-xs text-blueGray-400">{row.min.toFixed(1)}</td>
                <td className="px-3 py-2 text-center text-xs text-blueGray-400">{row.max.toFixed(1)}</td>
                <td className="px-3 py-2 text-center text-xs text-blueGray-400">{row.count}</td>
                <td className="px-3 py-2">
                  <div className="h-4 bg-blueGray-100 rounded relative overflow-hidden">
                    <div className="h-full rounded transition-all duration-300" style={{ width: `${((row.mean - 1) / 4) * 100}%`, background: ratingColor(row.mean) }} />
                    <span className="absolute top-0 left-1 text-[10px] leading-4" style={{ color: row.mean >= 3.5 ? "#fff" : "#666" }}>
                      {row.mean.toFixed(2)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PLOCombinedTable({ table }) {
  if (!table?.data?.length) return null;
  const hasDualCol = table.data[0].danh_gia !== undefined;
  const getPill = (val) => ({ background: ratingColor(val), color: "#fff", fontWeight: 700, fontSize: 14, textAlign: "center" });

  return (
    <div className="bg-white rounded-xl shadow-md border border-blueGray-100 p-4">
      <h3 className="text-sm font-semibold text-blueGray-700 mb-3">{table.title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-blueGray-600" style={{ minWidth: hasDualCol ? 500 : 350 }}>
          <thead>
            <tr className="bg-blueGray-50">
              <th className="px-3 py-2 text-left font-semibold" style={{ minWidth: 80 }}>PLO</th>
              {hasDualCol ? (
                <>
                  <th className="px-3 py-2 text-center font-semibold" style={{ minWidth: 100 }}>Trang bị (TB)</th>
                  <th className="px-3 py-2 text-center font-semibold" style={{ minWidth: 100 }}>Đánh giá (TB)</th>
                </>
              ) : (
                <th className="px-3 py-2 text-center font-semibold" style={{ minWidth: 100 }}>Mức độ (TB)</th>
              )}
              <th className="px-3 py-2 text-center font-semibold" style={{ width: 60 }}>SL</th>
            </tr>
          </thead>
          <tbody>
            {table.data.map((row, i) => (
              <tr key={i} className="border-t border-blueGray-100">
                <td className="px-3 py-2 font-semibold text-xs">{row.plo}</td>
                {hasDualCol ? (
                  <>
                    <td className="px-3 py-2 text-center font-bold text-sm" style={{ background: ratingColor(row.trang_bi || 0), color: "#fff" }}>
                      {(row.trang_bi || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-sm" style={{ background: ratingColor(row.danh_gia || 0), color: "#fff" }}>
                      {(row.danh_gia || 0).toFixed(2)}
                    </td>
                  </>
                ) : (
                  <td className="px-3 py-2 text-center font-bold text-sm" style={{ ...getPill(row.muc_do || row.mean || 0) }}>
                    {(row.muc_do || row.mean || 0).toFixed(2)}
                  </td>
                )}
                <td className="px-3 py-2 text-center text-xs text-blueGray-400">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}