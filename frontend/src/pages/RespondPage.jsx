import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, Send, CheckCircle, BookOpen } from "lucide-react";

const SURVEY_TYPES = [
  { key: "alumni", label: "Cựu Sinh viên", desc: "Dành cho cựu sinh viên các ngành của Khoa CKCN" },
  { key: "teacher", label: "Giảng viên", desc: "Dành cho giảng viên đang giảng dạy tại Khoa CKCN" },
  { key: "business", label: "Doanh nghiệp", desc: "Dành cho doanh nghiệp có nhân viên tốt nghiệp từ Khoa CKCN" },
];

export default function RespondPage() {
  const [searchParams] = useSearchParams();
  const preselectedType = searchParams.get("type") || "";
  const [step, setStep] = useState(preselectedType ? "select_major" : "select");
  const [surveyType, setSurveyType] = useState(preselectedType);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [majors, setMajors] = useState([]);
  const [majorLabel, setMajorLabel] = useState("Ngành khảo sát");
  const [email, setEmail] = useState("");
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [sectionIdx, setSectionIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const selectSurvey = (key) => {
    setSurveyType(key);
    setLoading(true);
    setError("");
    fetch(`/api/survey/${key}/evaluate-majors`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
        } else if (d.majors && d.majors.length > 0) {
          setMajors(d.majors);
          setMajorLabel(d.label || "Ngành khảo sát");
          setStep("select_major");
        } else {
          setStep("form");
          loadForm(key, "");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Không thể tải danh sách ngành");
        setLoading(false);
      });
  };

  const selectMajor = (major) => {
    setSelectedMajor(major);
    loadForm(surveyType, major);
  };

  const loadForm = (stype, smajor) => {
    setLoading(true);
    const url = smajor ? `/api/survey/${stype}/form?major=${encodeURIComponent(smajor)}` : `/api/survey/${stype}/form`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
        } else {
          setForm(d);
          const initial = {};
          d.sections.forEach((sec) => {
            sec.questions.forEach((q) => {
              if (q.type === "checkbox") initial[q.id] = false;
              else initial[q.id] = "";
            });
          });
          setAnswers(initial);
          setSectionIdx(0);
          setStep("form");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Không thể tải form khảo sát");
        setLoading(false);
      });
  };

  const setAnswer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const currentSection = form?.sections?.[sectionIdx];

  const validateSection = () => {
    if (!currentSection) return true;
    for (const q of currentSection.questions) {
      if (q.required) {
        const val = answers[q.id];
        if (val === "" || val === null || val === undefined) return false;
      }
    }
    return true;
  };

  const nextSection = () => {
    if (!validateSection()) { alert("Vui lòng trả lời tất cả câu hỏi bắt buộc trong phần này."); return; }
    if (sectionIdx < form.sections.length - 1) setSectionIdx((i) => i + 1);
  };

  const prevSection = () => { if (sectionIdx > 0) setSectionIdx((i) => i - 1); };

  const handleSubmit = async () => {
    if (!validateSection()) { alert("Vui lòng trả lời tất cả câu hỏi bắt buộc trong phần này."); return; }
    if (!email) { alert("Vui lòng nhập email."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/response/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, survey_type: surveyType, major: selectedMajor, answers }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else { setResult(data); setStep("done"); }
    } catch { setError("Không thể gửi phản hồi. Vui lòng thử lại."); }
    setSubmitting(false);
  };

  const renderQuestion = (q) => {
    switch (q.type) {
      case "rating":
        return (
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <label key={v} className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-sm font-semibold cursor-pointer transition-all ${answers[q.id] === v ? "bg-blueGray-800 border-blueGray-800 text-white" : "border-blueGray-200 text-blueGray-500 hover:border-blueGray-400"}`}>
                <input type="radio" name={`q_${q.id}`} value={v} checked={answers[q.id] === v} onChange={() => setAnswer(q.id, v)} className="hidden" />
                {v}
              </label>
            ))}
            <span className="ml-2 text-sm text-blueGray-400">{answers[q.id] ? `${answers[q.id]}/5` : "Chọn"}</span>
          </div>
        );
      case "radio":
        return (
          <div className="flex flex-wrap gap-2">
            {q.options.map((opt) => (
              <label key={opt} className={`px-4 py-2 rounded-lg border-2 text-sm cursor-pointer transition-all ${answers[q.id] === opt ? "bg-blueGray-800 border-blueGray-800 text-white" : "border-blueGray-200 text-blueGray-500 hover:border-blueGray-400"}`}>
                <input type="radio" name={`q_${q.id}`} value={opt} checked={answers[q.id] === opt} onChange={() => setAnswer(q.id, opt)} className="hidden" />
                {opt}
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <label className="flex items-start gap-3 text-sm text-blueGray-600 cursor-pointer">
            <input type="checkbox" checked={answers[q.id] || false} onChange={(e) => setAnswer(q.id, e.target.checked)} className="mt-0.5 accent-blueGray-700" />
            {q.label || q.text}
          </label>
        );
      case "textarea":
        return (
          <textarea value={answers[q.id] || ""} onChange={(e) => setAnswer(q.id, e.target.value)} placeholder="Nhập câu trả lời của bạn..." rows={3}
            className="w-full px-3 py-2 border border-blueGray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blueGray-400" />
        );
      default:
        return (
          <input type="text" value={answers[q.id] || ""} onChange={(e) => setAnswer(q.id, e.target.value)} placeholder="Nhập câu trả lời của bạn..."
            className="w-full px-3 py-2 border border-blueGray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blueGray-400" />
        );
    }
  };

  const renderHeader = (title, subtitle) => (
    <nav className="bg-gradient-to-r from-blueGray-800 to-blueGray-900 text-white px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div>
          <Link to="/" className="text-blueGray-300 hover:text-white text-sm flex items-center gap-1 transition-colors">
            <ArrowLeft size={16} /> Trang chủ
          </Link>
          <h1 className="text-lg font-bold mt-1">{title}</h1>
          {subtitle && <p className="text-blueGray-400 text-xs mt-0.5">{subtitle}</p>}
        </div>
        <ClipboardList size={24} className="opacity-50" />
      </div>
    </nav>
  );

  if (step === "done") {
    return (
      <>
        {renderHeader("Hoàn thành")}
        <main className="max-w-4xl mx-auto px-6 py-16 text-center">
          <CheckCircle size={56} className="text-emerald-500 mx-auto" />
          <h2 className="text-xl font-bold text-blueGray-700 mt-4">Khảo sát đã được ghi nhận!</h2>
          <p className="text-blueGray-500 mt-2">{result?.message || "Cảm ơn bạn đã tham gia khảo sát."}</p>
          <Link to="/" className="inline-block mt-6 bg-blueGray-800 hover:bg-blueGray-700 text-white font-bold px-6 py-3 rounded-lg text-sm uppercase transition-all">
            Về trang chủ
          </Link>
        </main>
      </>
    );
  }

  if (step === "select") {
    return (
      <>
        {renderHeader("Tham gia khảo sát", "Chọn đối tượng khảo sát phù hợp với bạn")}
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="grid md:grid-cols-3 gap-6">
            {SURVEY_TYPES.map((st) => (
              <button key={st.key} onClick={() => selectSurvey(st.key)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl p-6 text-left transition-all hover:-translate-y-1 border border-blueGray-100">
                <h3 className="text-lg font-semibold text-blueGray-700">{st.label}</h3>
                <p className="text-sm text-blueGray-500 mt-2">{st.desc}</p>
                <span className="text-blueGray-700 text-sm font-semibold mt-4 block">Bắt đầu →</span>
              </button>
            ))}
          </div>
        </main>
      </>
    );
  }

  if (step === "select_major") {
    return (
      <>
        {renderHeader(SURVEY_TYPES.find((s) => s.key === surveyType)?.label || "Khảo sát", `Vui lòng chọn ${majorLabel.toLowerCase()}`)}
        <main className="max-w-4xl mx-auto px-6 py-8">
          {loading ? (
            <p className="text-center text-blueGray-400">Đang tải danh sách ngành...</p>
          ) : (
            <>
              <p className="text-sm text-blueGray-500 mb-6 text-center">
                {`Vui lòng chọn ${majorLabel.toLowerCase()} mà bạn muốn tham gia khảo sát:`}
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {majors.map((major) => (
                  <button key={major} onClick={() => selectMajor(major)}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl p-5 text-left transition-all hover:-translate-y-1 border border-blueGray-100 flex items-start gap-4">
                    <BookOpen size={24} className="text-blueGray-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-base font-semibold text-blueGray-700">{major}</h3>
                      <span className="text-blueGray-500 text-sm font-semibold mt-2 block">Chọn →</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="text-center mt-6">
                <button onClick={() => setStep("select")}
                  className="text-sm text-blueGray-400 hover:text-blueGray-600 underline">
                  ← Quay lại chọn loại khảo sát
                </button>
              </div>
            </>
          )}
        </main>
      </>
    );
  }

  if (loading) {
    return (
      <>
        {renderHeader("Đang tải...")}
        <main className="max-w-4xl mx-auto px-6 py-16 text-center text-blueGray-400">Đang tải form khảo sát...</main>
      </>
    );
  }

  if (error) {
    return (
      <>
        {renderHeader("Lỗi")}
        <main className="max-w-4xl mx-auto px-6 py-16 text-center text-red-500">{error}</main>
      </>
    );
  }

  if (!form) {
    return (
      <>
        {renderHeader("Đang tải...")}
        <main className="max-w-4xl mx-auto px-6 py-16 text-center text-blueGray-400">Đang tải form khảo sát...</main>
      </>
    );
  }

  const isFirst = sectionIdx === 0;
  const isLast = sectionIdx === form.sections.length - 1;
  const progress = ((sectionIdx + 1) / form.sections.length) * 100;

  return (
    <>
      {renderHeader(form?.title, form?.description)}
      <main className="max-w-4xl mx-auto px-6 py-6">
        <div className="mb-4">
          <div className="h-2 bg-blueGray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blueGray-500 to-emerald-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-blueGray-400 text-right mt-1">
            Phần {sectionIdx + 1}/{form.sections.length} &middot; {form.total_questions} câu hỏi
          </p>
        </div>

        <div className="flex items-center gap-3 bg-blueGray-50 border border-blueGray-200 rounded-xl px-5 py-4 mb-6">
          <label className="text-sm font-semibold text-blueGray-600 whitespace-nowrap">Email của bạn:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nhap@email.com" required
            className="flex-1 px-3 py-2 border border-blueGray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blueGray-400" />
        </div>

        {selectedMajor && (
          <div className="flex items-center gap-2 bg-blueGray-50 border border-blueGray-200 rounded-xl px-5 py-3 mb-6 text-sm text-blueGray-600">
            <BookOpen size={16} />
            <span className="font-medium">{majorLabel}:</span> {selectedMajor}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md border border-blueGray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-blueGray-700 pb-3 mb-4 border-b border-blueGray-100">{currentSection?.label}</h2>
          <div className="space-y-5">
            {currentSection?.questions.map((q) => (
              <div key={q.id} className={q.type === "radio" || q.type === "rating" ? "pb-4 mb-4 border-b border-blueGray-100 last:border-0 last:mb-0 last:pb-0" : ""}>
                <label className="block text-sm font-medium text-blueGray-700 mb-2">
                  {q.text}
                  {q.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderQuestion(q)}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mb-10">
          <button onClick={prevSection} disabled={isFirst}
            className="px-5 py-2.5 border border-blueGray-200 rounded-lg text-sm text-blueGray-600 bg-white hover:border-blueGray-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            ← Phần trước
          </button>
          <span className="text-xs text-blueGray-400">{isLast ? "Đây là phần cuối" : `${form.sections.length - sectionIdx - 1} phần còn lại`}</span>
          {isLast ? (
            <button onClick={handleSubmit} disabled={submitting}
              className="bg-blueGray-800 hover:bg-blueGray-700 text-white font-bold px-6 py-2.5 rounded-lg text-sm uppercase shadow transition-all disabled:opacity-50 flex items-center gap-2">
              {submitting ? "Đang gửi..." : <><Send size={15} /> Gửi khảo sát</>}
            </button>
          ) : (
            <button onClick={nextSection}
              className="bg-blueGray-800 hover:bg-blueGray-700 text-white font-bold px-6 py-2.5 rounded-lg text-sm uppercase shadow transition-all">
              Phần tiếp theo →
            </button>
          )}
        </div>
      </main>
    </>
  );
}
