from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import pandas as pd
import json
import os
import io
import csv
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from auth import USERS, create_token, get_current_user, require_admin, require_manager, require_any
from form_parser import build_form, build_grouped_summary, build_dashboard_tables, save_response, get_evaluate_majors


class LoginBody(BaseModel):
    username: str = ""
    password: str = ""


class SubmitBody(BaseModel):
    email: str = ""
    survey_type: str = ""
    major: str = ""
    answers: dict = {}


app = FastAPI(title="Survey API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(DATA_DIR)

SURVEY_FILES = {
    "business": "PKS Doanh nghiệp (Câu trả lời) (1).xlsx",
    "teacher": "KS Ý KIẾN GV (Câu trả lời).xlsx",
    "alumni": "KS Ý KIẾN cựu SV (Câu trả lời).xlsx",
}

MAJOR_COLUMNS = {
    "alumni": 3,
    "teacher": 6,
    "business": 45,
}

MAJOR_LABELS = {
    "alumni": "Ngành đào tạo",
    "teacher": "Chương trình đào tạo",
    "business": "Chương trình khảo sát",
}

SURVEY_INFO = {
    "alumni": {"title": "Khảo sát Cựu Sinh viên"},
    "teacher": {"title": "Khảo sát Giảng viên"},
    "business": {"title": "Khảo sát Doanh nghiệp"},
}


def get_major_col(name: str):
    return MAJOR_COLUMNS.get(name)


def filter_by_major(df, name: str, major: str):
    col_idx = get_major_col(name)
    if col_idx is None or not major:
        return df
    if col_idx >= len(df.columns):
        return df
    col_name = df.columns[col_idx]
    return df[df[col_name].astype(str).str.strip().str.lower() == major.strip().lower()].copy()


def get_majors_for_survey(name: str):
    col_idx = get_major_col(name)
    if col_idx is None:
        return []
    fname = SURVEY_FILES.get(name)
    path = os.path.join(BASE_DIR, fname)
    if not os.path.exists(path):
        return []
    df = pd.read_excel(path)
    if col_idx >= len(df.columns):
        return []
    vals = df.iloc[:, col_idx].dropna().unique()
    return sorted([str(v).strip() for v in vals if str(v).strip()])


def load_survey(name):
    fname = SURVEY_FILES.get(name)
    if not fname:
        return None
    path = os.path.join(BASE_DIR, fname)
    if not os.path.exists(path):
        return None
    df = pd.read_excel(path)
    df = df.where(pd.notna(df), None)
    cols = list(df.columns)
    data = df.values.tolist()
    data = [[None if isinstance(v, float) and (pd.isna(v) or v != v) else v for v in row] for row in data]
    return {"columns": cols, "rows": data, "shape": list(df.shape)}


def get_user_major_filter(user):
    if not user:
        return ""
    if user.get("role") == "admin":
        return ""
    return user.get("major", "")


@app.get("/api/surveys")
def list_surveys():
    names = {
        "business": "Khảo sát Doanh nghiệp",
        "teacher": "Khảo sát Giảng viên",
        "alumni": "Khảo sát Cựu Sinh viên",
    }
    result = {}
    for key, label in names.items():
        sv = load_survey(key)
        if sv:
            majors = get_majors_for_survey(key)
            result[key] = {
                "label": label,
                "shape": sv["shape"],
                "columns": sv["columns"],
                "major_column": MAJOR_COLUMNS.get(key),
                "major_label": MAJOR_LABELS.get(key),
                "majors": majors,
            }
    return result


@app.get("/api/dashboard")
def get_dashboard(request: Request, major: str = ""):
    user = require_any(request)
    names = {
        "business": "Khảo sát Doanh nghiệp",
        "teacher": "Khảo sát Giảng viên",
        "alumni": "Khảo sát Cựu Sinh viên",
    }
    surveys_data = {}
    total_responses = 0
    total_questions = 0

    if not major and user and user.get("role") == "manager":
        major = user.get("major", "")

    for key, label in names.items():
        fname = SURVEY_FILES.get(key)
        path = os.path.join(BASE_DIR, fname)
        if not os.path.exists(path):
            continue
        df = pd.read_excel(path)
        if major:
            df = filter_by_major(df, key, major)
        num_cols = sum(1 for c in df.columns if df[c].dtype in ["float64", "int64"])
        text_cols = len(df.columns) - num_cols
        surveys_data[key] = {
            "label": label,
            "responses": len(df),
            "questions": len(df.columns),
            "numeric_cols": num_cols,
            "text_cols": text_cols,
        }
        total_responses += len(df)
        total_questions += len(df.columns)

    return {
        "total_responses": total_responses,
        "total_surveys": len(surveys_data),
        "total_questions": total_questions,
        "surveys": surveys_data,
    }


@app.post("/api/login")
def login(body: LoginBody):
    username = body.username
    password = body.password
    if username in USERS and USERS[username]["password"] == password:
        token = create_token(username)
        user = {**USERS[username], "username": username}
        user.pop("password", None)
        return {"token": token, "user": user}
    return {"error": "Sai tên đăng nhập hoặc mật khẩu"}


@app.get("/api/admin/me")
def admin_me(request: Request):
    user = get_current_user(request)
    if not user:
        return {"error": "Unauthorized"}
    user.pop("password", None)
    return {"user": user}


@app.get("/api/admin/majors")
def get_all_majors(request: Request):
    require_admin(request)
    result = {}
    for key in SURVEY_FILES:
        majors = get_majors_for_survey(key)
        if majors:
            result[key] = {"label": MAJOR_LABELS.get(key, ""), "majors": majors}
    return result


@app.get("/api/survey/{name}")
def get_survey(name: str):
    sv = load_survey(name)
    if sv is None:
        return {"error": "Survey not found"}
    return sv


@app.get("/api/survey/{name}/summary")
def get_summary(request: Request, name: str, major: str = ""):
    user = require_any(request)
    if not major and user and user.get("role") == "manager":
        major = user.get("major", "")

    sv = load_survey(name)
    if sv is None:
        return {"error": "Survey not found"}
    df = pd.DataFrame(sv["rows"], columns=sv["columns"])
    if major:
        df = filter_by_major(df, name, major)
        if len(df) == 0:
            return {"error": "Không có dữ liệu cho ngành này", "count": 0}
    summary = {}
    for col in df.columns:
        vals = df[col].dropna()
        if len(vals) == 0:
            continue
        if vals.dtype in ["float64", "int64"]:
            mean_val = vals.mean()
            min_val = vals.min()
            max_val = vals.max()
            if pd.isna(mean_val): mean_val = 0.0
            if pd.isna(min_val): min_val = 0.0
            if pd.isna(max_val): max_val = 0.0
            summary[col] = {
                "type": "numeric",
                "count": int(len(vals)),
                "mean": float(mean_val),
                "min": float(min_val),
                "max": float(max_val),
            }
        else:
            vc = vals.value_counts().head(20)
            summary[col] = {
                "type": "categorical",
                "count": int(len(vals)),
                "top_values": [{"value": str(k), "count": int(v)} for k, v in vc.items()],
            }
    return summary


@app.get("/api/survey/{name}/evaluate-majors")
def get_survey_evaluate_majors(name: str):
    if name not in SURVEY_FILES:
        return {"error": "Survey not found"}
    majors = get_evaluate_majors(name, BASE_DIR)
    return {"majors": majors, "label": MAJOR_LABELS.get(name, "Ngành khảo sát")}


@app.get("/api/survey/{name}/form")
def get_form(name: str, major: str = ""):
    form = build_form(name, BASE_DIR, major)
    if form is None:
        return {"error": "Survey not found"}
    return form


@app.get("/api/survey/{name}/grouped-summary")
def get_grouped_summary(name: str, major: str = ""):
    result = build_grouped_summary(name, BASE_DIR, major)
    if result is None:
        return {"error": "Survey not found"}
    return result


@app.get("/api/dashboard/tables")
def get_dashboard_tables(major: str = ""):
    result = {}
    for key in ["alumni", "teacher", "business"]:
        tables = build_dashboard_tables(key, BASE_DIR, major)
        if tables:
            result[key] = tables
    return result


@app.get("/api/admin/responses")
def list_responses(request: Request, survey: str = "", major: str = ""):
    require_manager(request)
    user = get_current_user(request)
    if user.get("role") == "manager":
        major = user.get("major", "")

    result = {}
    for key in SURVEY_FILES:
        if survey and key != survey:
            continue
        fname = SURVEY_FILES.get(key)
        path = os.path.join(BASE_DIR, fname)
        if not os.path.exists(path):
            continue
        df = pd.read_excel(path)
        if major:
            df = filter_by_major(df, key, major)
        cols = list(df.columns)
        rows = df.where(pd.notna(df), None).astype(object).values.tolist()
        rows = [[None if isinstance(v, float) and (pd.isna(v) or v != v) else v for v in row] for row in rows]
        result[key] = {
            "label": SURVEY_INFO.get(key, {}).get("title", key),
            "columns": cols,
            "rows": rows,
            "count": len(rows),
        }

        json_dir = os.path.join(BASE_DIR, "data", "responses", key)
        new_responses = []
        if os.path.exists(json_dir):
            for rfile in sorted(os.listdir(json_dir)):
                if rfile.endswith(".json"):
                    with open(os.path.join(json_dir, rfile), "r", encoding="utf-8") as f:
                        new_responses.append(json.load(f))
        if new_responses:
            result[key]["new_responses"] = new_responses
            result[key]["new_count"] = len(new_responses)
    return result


@app.get("/api/admin/export")
def export_data(request: Request, survey: str = "alumni", major: str = "", format: str = "csv"):
    require_manager(request)
    user = get_current_user(request)
    if user.get("role") == "manager":
        major = user.get("major", "")

    if survey not in SURVEY_FILES:
        return {"error": "Invalid survey type"}

    fname = SURVEY_FILES.get(survey)
    path = os.path.join(BASE_DIR, fname)
    if not os.path.exists(path):
        return {"error": "No data"}

    df = pd.read_excel(path)
    if major:
        df = filter_by_major(df, survey, major)

    output = io.StringIO()
    if format == "csv":
        writer = csv.writer(output)
        writer.writerow(df.columns)
        for _, row in df.iterrows():
            writer.writerow(row)
        output.seek(0)
        filename = f"{survey}_export.csv"
        media_type = "text/csv"
    else:
        return {"error": "Unsupported format"}

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@app.post("/api/response/submit")
def submit_response(body: SubmitBody):
    if not body.email or not body.survey_type or not body.answers:
        return {"error": "Thiếu thông tin bắt buộc"}
    if body.survey_type not in SURVEY_FILES:
        return {"error": "Loại khảo sát không hợp lệ"}
    resp_id = save_response(body.survey_type, body.email, body.answers, BASE_DIR, body.major)
    return {"success": True, "id": resp_id, "message": "Cảm ơn bạn đã tham gia khảo sát!"}


# Serve frontend static files in production
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")
if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            from fastapi.responses import JSONResponse
            return JSONResponse({"error": "Not found"}, status_code=404)
        index_path = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path)
        return JSONResponse({"error": "Not found"}, status_code=404)
