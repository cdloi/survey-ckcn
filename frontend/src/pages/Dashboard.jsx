import { useNavigate } from "react-router-dom";
import {
  Building2, Users, GraduationCap,
  LogIn, Shield, ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const SURVEY_TYPES = [
  {
    key: "alumni", label: "Cựu Sinh viên", icon: GraduationCap,
    color: "bg-emerald-500", textColor: "text-emerald-600",
    desc: "Đánh giá của cựu sinh viên về chương trình đào tạo, tình hình việc làm và các chuẩn đầu ra.",
    features: ["Tình hình việc làm", "Mức thu nhập", "Đánh giá PLO", "Mức độ hài lòng"],
  },
  {
    key: "teacher", label: "Giảng viên", icon: Users,
    color: "bg-yellow-500", textColor: "text-yellow-600",
    desc: "Phản hồi của giảng viên về chương trình đào tạo, phương pháp giảng dạy và cơ sở vật chất.",
    features: ["Đánh giá PLO", "Chất lượng phòng học", "Chất lượng xưởng TH", "Tư liệu giảng dạy"],
  },
  {
    key: "business", label: "Doanh nghiệp", icon: Building2,
    color: "bg-lightBlue-500", textColor: "text-lightBlue-600",
    desc: "Đánh giá của doanh nghiệp về chất lượng nhân viên tốt nghiệp từ Khoa CKCN.",
    features: ["Chất lượng nhân viên", "Xu hướng tuyển dụng", "Mức độ phù hợp CĐR"],
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <Navbar />

      <div className="pt-20">
        <section className="bg-gradient-to-br from-blueGray-800 to-blueGray-900 text-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <span className="inline-block bg-white/10 text-blueGray-200 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              Khảo sát các bên liên quan 2024-2025
            </span>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Đánh giá chất lượng chương trình đào tạo
            </h1>
            <p className="text-blueGray-300 text-base max-w-2xl leading-relaxed">
              Khoa Cơ Khí - Công Nghệ (CKCN) trân trọng kính mời Quý doanh nghiệp, Quý thầy cô
              cùng các anh chị cựu sinh viên tham gia khảo sát ý kiến. Những phản hồi của Quý vị
              là cơ sở quan trọng để Khoa không ngừng cải tiến và nâng cao chất lượng đào tạo.
            </p>

          </div>
        </section>

        <section className="py-16 bg-blueGray-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-6">
              {SURVEY_TYPES.map((st) => {
                const Icon = st.icon;
                return (
                  <div
                    key={st.key}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl cursor-pointer transition-all hover:-translate-y-1 flex flex-col"
                    onClick={() => navigate(`/respond`)}
                  >
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`text-white p-3 rounded-full ${st.color}`}>
                          <Icon size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-blueGray-700">{st.label}</h3>
                      </div>
                      <p className="text-blueGray-500 text-sm mb-4 leading-relaxed">{st.desc}</p>
                      <ul className="space-y-1 mb-4 flex-1">
                        {st.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-blueGray-600">
                            <ChevronRight size={14} className={st.textColor} />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <span className={`${st.textColor} text-sm font-semibold`}>
                        Tham gia khảo sát →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-blueGray-800 py-14">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <Shield size={28} className="text-blueGray-400 mx-auto mb-3" />
            {user ? (
              <>
                <p className="text-blueGray-300 text-lg mb-4">Chào mừng, {user.name}</p>
                <button
                  onClick={() => navigate("/admin")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-lg uppercase text-sm shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <Shield size={16} /> Vào trang quản trị
                </button>
              </>
            ) : (
              <>
                <p className="text-blueGray-300 text-lg mb-4">Cán bộ quản lý Khoa?</p>
                <button
                  onClick={() => navigate("/login")}
                  className="bg-blueGray-700 hover:bg-blueGray-600 text-white font-bold px-8 py-4 rounded-lg uppercase text-sm shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <LogIn size={16} /> Đăng nhập
                </button>
              </>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}