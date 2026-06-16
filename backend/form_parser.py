import pandas as pd
import re
import os
import json

SURVEY_FILES = {
    "business": "PKS Doanh nghiệp (Câu trả lời) (1).xlsx",
    "teacher": "KS Ý KIẾN GV (Câu trả lời).xlsx",
    "alumni": "KS Ý KIẾN cựu SV (Câu trả lời).xlsx",
}

SURVEY_INFO = {
    "alumni": {
        "title": "Khảo sát Cựu Sinh viên",
        "description": "Đánh giá của cựu sinh viên về chương trình đào tạo, tình hình việc làm và các chuẩn đầu ra.",
        "skip_cols": [0],
        "text_cols": [5, 6],
    },
    "teacher": {
        "title": "Khảo sát Giảng viên",
        "description": "Phản hồi của giảng viên về chương trình đào tạo, phương pháp giảng dạy và cơ sở vật chất.",
        "skip_cols": [0],
        "text_cols": [5, 6],
    },
    "business": {
        "title": "Khảo sát Doanh nghiệp",
        "description": "Đánh giá của doanh nghiệp về chất lượng nhân viên tốt nghiệp từ Khoa CKCN.",
        "skip_cols": [0],
        "text_cols": [3, 4],
    },
}

SURVEY_EVALUATE_COL = {
    "alumni": 32,
    "teacher": 6,
    "business": 45,
}


def extract_prefix(col_name: str):
    m = re.match(r"^(\d+/\d+)\s*\.?\s*([^\[]*)", str(col_name))
    if m:
        return m.group(1).strip()
    m = re.match(r"^(PLO\s*\d+)", str(col_name))
    if m:
        return m.group(1).strip()
    m = re.match(r"^(Tiêu chí\s*\d+)", str(col_name))
    if m:
        return m.group(1).strip()
    return None


def extract_numbered_prefix(col_name: str):
    m = re.match(r"^(\d+(?:-\d+)?/\d+)", str(col_name))
    if m:
        return m.group(1)
    return None


def extract_plo_number(col_name: str):
    m = re.match(r"^PLO\s*(\d+)", str(col_name))
    if m:
        return int(m.group(1))
    return None


def extract_tieu_chi_number(col_name: str):
    m = re.match(r"^Tiêu chí\s*(\d+)", str(col_name))
    if m:
        return int(m.group(1))
    return None


def is_plo_col(col_name: str):
    return bool(re.match(r"^PLO\s*\d+", str(col_name)))


def is_tieu_chi_col(col_name: str):
    return bool(re.match(r"^Tiêu chí\s*\d+", str(col_name)))


def get_question_type(col_name, vals, n_unique, dtype, col_idx=None, text_cols=None):
    if text_cols and col_idx is not None and col_idx in text_cols:
        return {
            "type": "textarea",
            "required": True,
        }
    if dtype in ("float64", "int64"):
        return {
            "type": "rating",
            "min": 1,
            "max": 5,
            "required": True,
        }
    elif n_unique <= 1:
        return {
            "type": "checkbox",
            "label": "",
            "required": False,
        }
    elif n_unique <= 15 and n_unique > 1:
        options = sorted(
            [str(v) for v in vals.unique() if str(v) not in ("", "nan")],
            key=lambda x: str(x),
        )
        return {
            "type": "radio",
            "options": options,
            "required": True,
        }
    else:
        input_type = "textarea" if len(str(col_name)) > 80 else "text"
        return {
            "type": input_type,
            "required": True,
        }


def get_evaluate_majors(name: str, base_dir: str):
    fname = SURVEY_FILES.get(name)
    if not fname:
        return []
    path = os.path.join(base_dir, fname)
    if not os.path.exists(path):
        return []
    eval_col = SURVEY_EVALUATE_COL.get(name)
    if eval_col is None:
        return []
    df = pd.read_excel(path)
    if eval_col >= len(df.columns):
        return []
    vals = df.iloc[:, eval_col].dropna().unique()
    return sorted([str(v).strip() for v in vals if str(v).strip()])


def detect_plo_ranges(cols, evaluate_col):
    if evaluate_col is None or evaluate_col >= len(cols) - 1:
        return []
    first_col_idx = evaluate_col + 1
    prefix_list = []
    for i in range(first_col_idx, len(cols)):
        p = extract_prefix(str(cols[i]))
        if p is None:
            break
        prefix_list.append((i, p))
    if not prefix_list:
        return []
    first_prefix = prefix_list[0][1]
    boundaries = [first_col_idx]
    for i in range(1, len(prefix_list)):
        col_idx, p = prefix_list[i]
        if p == first_prefix and prefix_list[i-1][1] != first_prefix:
            boundaries.append(col_idx)
    last_idx = prefix_list[-1][0] + 1
    boundaries.append(last_idx)
    groups = []
    for i in range(len(boundaries) - 1):
        groups.append((boundaries[i], boundaries[i+1]))
    if len(groups) > 1:
        expected_size = groups[0][1] - groups[0][0]
        for i in range(len(groups)):
            actual = groups[i][1] - groups[i][0]
            if actual > expected_size:
                groups[i] = (groups[i][0], groups[i][0] + expected_size)
    return groups


def build_form(name: str, base_dir: str, major: str = ""):
    fname = SURVEY_FILES.get(name)
    if not fname:
        return None
    path = os.path.join(base_dir, fname)
    if not os.path.exists(path):
        return None

    df = pd.read_excel(path)
    cols = list(df.columns)
    info = SURVEY_INFO.get(name, {})
    skip_cols = info.get("skip_cols", [0])
    text_cols = info.get("text_cols", [])

    exclude_cols = set(skip_cols)
    evaluate_col = SURVEY_EVALUATE_COL.get(name)

    if major and evaluate_col is not None:
        exclude_cols.add(evaluate_col)
        majors = get_evaluate_majors(name, base_dir)
        plo_ranges = detect_plo_ranges(cols, evaluate_col)
        if major in majors:
            major_idx = majors.index(major)
            for g_idx, (start, end) in enumerate(plo_ranges):
                if g_idx != major_idx:
                    for c in range(start, end):
                        exclude_cols.add(c)

    questions = []
    for i, col_name in enumerate(cols):
        if i in exclude_cols:
            continue
        vals = df[col_name].dropna()
        if len(vals) == 0:
            continue
        n_unique = vals.nunique()
        dtype = df[col_name].dtype
        qtype = get_question_type(col_name, vals, n_unique, dtype, col_idx=i, text_cols=text_cols)
        questions.append({
            "id": i,
            "text": col_name,
            **qtype,
        })

    sections = group_into_sections(questions, cols)
    total_questions = len(questions)

    return {
        "survey_type": name,
        "title": info.get("title", name),
        "description": info.get("description", ""),
        "total_questions": total_questions,
        "sections": sections,
    }


def group_into_sections(questions, cols):
    sections = []
    plo_groups = {}
    tieu_chi_groups = {}
    numbered_sections = {}
    general_questions = []

    for q in questions:
        col_name = cols[q["id"]]
        plo_num = extract_plo_number(col_name)
        tc_num = extract_tieu_chi_number(col_name)
        num_prefix = extract_numbered_prefix(col_name)

        if plo_num is not None:
            key = f"PLO {plo_num}"
            if key not in plo_groups:
                plo_groups[key] = {"label": f"Đánh giá PLO {plo_num}", "questions": []}
            plo_groups[key]["questions"].append(q)
        elif tc_num is not None:
            key = f"Tiêu chí {tc_num}"
            if key not in tieu_chi_groups:
                tieu_chi_groups[key] = {"label": f"Tiêu chí {tc_num}", "questions": []}
            tieu_chi_groups[key]["questions"].append(q)
        elif num_prefix:
            if num_prefix not in numbered_sections:
                numbered_sections[num_prefix] = {"label": f"Câu {num_prefix}", "questions": []}
            numbered_sections[num_prefix]["questions"].append(q)
        else:
            general_questions.append(q)

    for key in sorted(plo_groups.keys(), key=lambda k: int(k.split()[1])):
        sections.append(plo_groups[key])

    for key in sorted(tieu_chi_groups.keys(), key=lambda k: int(k.split()[1])):
        sections.append(tieu_chi_groups[key])

    numbered_keys = sorted(numbered_sections.keys(), key=lambda k: [int(x.split("-")[0]) for x in k.split("/")])
    for key in numbered_keys:
        sections.append(numbered_sections[key])

    if general_questions:
        sections.append({"label": "Thông tin chung", "questions": general_questions})

    return sections


METADATA_KEYWORDS = [
    "dấu thời gian", "timestamp", "họ và tên", "họ tên", "giới tính",
    "số điện thoại", "điện thoại", "email", "địa chỉ", "khóa đào tạo",
    "mssv", "mã số sinh viên", "ngày sinh", "tuổi", "năm sinh",
    "phone", "mobile", "employee", "mã nhân viên",
]


def is_metadata_col(col_name):
    if not col_name or len(str(col_name).strip()) < 3:
        return True
    lower = str(col_name).lower().strip()
    return any(kw in lower for kw in METADATA_KEYWORDS)


def classify_group(questions, cols, df):
    """Classify a group of columns into display type."""
    if not questions:
        return "unknown"

    col_names = [cols[q["id"]] for q in questions]
    plo_count = sum(1 for c in col_names if "PLO" in c.upper())
    if plo_count == len(questions) and len(questions) >= 3:
        return "plo"

    all_numeric = True
    for q in questions:
        vals = df.iloc[:, q["id"]].dropna()
        if len(vals) > 0 and vals.dtype not in ("float64", "int64"):
            all_numeric = False
            break
    if all_numeric and len(questions) >= 2:
        return "rating_group"

    if len(questions) >= 2:
        return "multi_choice"

    return "single"


def build_grouped_summary(name: str, base_dir: str, major: str = ""):
    """Build a grouped summary of survey data for compact display."""
    import pandas as pd
    from collections import OrderedDict

    fname = SURVEY_FILES.get(name)
    if not fname:
        return None
    path = os.path.join(base_dir, fname)
    if not os.path.exists(path):
        return None

    df = pd.read_excel(path)
    if major:
        col_idx = {
            "alumni": 3,
            "teacher": 6,
            "business": 45,
        }.get(name)
        if col_idx is not None and col_idx < len(df.columns):
            col_name = df.columns[col_idx]
            df = df[df[col_name].astype(str).str.strip().str.lower() == major.strip().lower()].copy()

    cols = list(df.columns)
    info = SURVEY_INFO.get(name, {})
    skip_cols = info.get("skip_cols", [0])
    text_cols = info.get("text_cols", [])

    # Build form to get questions and sections
    form = build_form(name, base_dir)
    if form is None:
        return None

    sections_out = []

    for section in form.get("sections", []):
        questions = section["questions"]
        if not questions:
            continue

        qs = [q for q in questions if q["id"] not in skip_cols and not is_metadata_col(cols[q["id"]])]
        if not qs:
            continue

        group_type = classify_group(qs, cols, df)

        # Build items for this group
        items = []
        for q in qs:
            ci = q["id"]
            vals = df.iloc[:, ci].dropna()
            if len(vals) == 0:
                continue
            cname = cols[ci]
            # Determine if numeric
            is_numeric = vals.dtype in ("float64", "int64")
            if is_numeric:
                mean_v = float(vals.mean()) if not pd.isna(vals.mean()) else 0
                min_v = float(vals.min()) if not pd.isna(vals.min()) else 0
                max_v = float(vals.max()) if not pd.isna(vals.max()) else 0
                vc = vals.value_counts().sort_index()
                items.append({
                    "id": ci,
                    "text": cname,
                    "type": "numeric",
                    "mean": round(mean_v, 2),
                    "min": round(min_v, 1),
                    "max": round(max_v, 1),
                    "count": int(len(vals)),
                    "distribution": [{"value": str(k), "count": int(v)} for k, v in vc.items()],
                })
            else:
                vc = vals.value_counts().head(15)
                items.append({
                    "id": ci,
                    "text": cname,
                    "type": "categorical",
                    "count": int(len(vals)),
                    "distribution": [{"value": str(k), "count": int(v)} for k, v in vc.items()],
                })

        if not items:
            continue

        sections_out.append({
            "label": section["label"],
            "type": group_type,
            "items": items,
        })

    # Remaining single columns not in sections
    section_qids = set()
    for sec in form.get("sections", []):
        for q in sec.get("questions", []):
            section_qids.add(q["id"])
    standalone = []
    for i, cname in enumerate(cols):
        if i in section_qids or i in skip_cols or is_metadata_col(cname):
            continue
        vals = df.iloc[:, i].dropna()
        if len(vals) == 0:
            continue
        is_numeric = vals.dtype in ("float64", "int64")
        if is_numeric:
            mean_v = float(vals.mean()) if not pd.isna(vals.mean()) else 0
            min_v = float(vals.min()) if not pd.isna(vals.min()) else 0
            max_v = float(vals.max()) if not pd.isna(vals.max()) else 0
            vc = vals.value_counts().sort_index()
            standalone.append({
                "id": i, "text": cname, "type": "numeric",
                "mean": round(mean_v, 2), "min": round(min_v, 1), "max": round(max_v, 1),
                "count": int(len(vals)),
                "distribution": [{"value": str(k), "count": int(v)} for k, v in vc.items()],
            })
        else:
            vc = vals.value_counts().head(15)
            standalone.append({
                "id": i, "text": cname, "type": "categorical", "count": int(len(vals)),
                "distribution": [{"value": str(k), "count": int(v)} for k, v in vc.items()],
            })

    if standalone:
        sections_out.append({
            "label": "Thông tin khác",
            "type": "single",
            "items": standalone,
        })

    return {"sections": sections_out, "total_responses": len(df)}


def build_dashboard_tables(name: str, base_dir: str, major: str = ""):
    """Return curated key tables for dashboard display per survey type."""
    import pandas as pd
    import re
    from collections import defaultdict

    fname = SURVEY_FILES.get(name)
    if not fname:
        return None
    path = os.path.join(base_dir, fname)
    if not os.path.exists(path):
        return None

    df = pd.read_excel(path)
    if major:
        col_idx = {"alumni": 3, "teacher": 6, "business": 45}.get(name)
        if col_idx is not None and col_idx < len(df.columns):
            col_name = df.columns[col_idx]
            df = df[df[col_name].astype(str).str.strip().str.lower() == major.strip().lower()].copy()

    cols = list(df.columns)
    tables = []

    def _dist(col_prefix, title):
        match_cols = [c for c in cols if str(c).strip().startswith(col_prefix)]
        if not match_cols:
            return None
        cname = match_cols[0]
        vals = df[cname].dropna()
        if len(vals) == 0:
            return None
        vc = vals.value_counts()
        total = vc.sum()
        data = []
        for k, v in vc.items():
            label = str(k)[:80]
            data.append({"label": label, "count": int(v), "percent": round(float(v) / total * 100, 1)})
        data.sort(key=lambda x: x["count"], reverse=True)
        return {"title": title, "type": "distribution", "total": int(total), "data": data}

    def _rating_group(col_prefix, title):
        match_cols = [c for c in cols if str(c).strip().startswith(col_prefix)]
        if not match_cols:
            return None
        data = []
        for cname in match_cols:
            vals = df[cname].dropna()
            if len(vals) == 0 or vals.dtype not in ("float64", "int64"):
                continue
            label = str(cname).replace(col_prefix, "", 1).strip().lstrip(". ")
            if not label:
                label = str(cname)[:60]
            data.append({
                "label": label[:80],
                "mean": round(float(vals.mean()), 2),
                "min": round(float(vals.min()), 1),
                "max": round(float(vals.max()), 1),
                "count": int(len(vals)),
            })
        if not data:
            return None
        return {"title": title, "type": "rating", "data": data}

    def _plo_matrix(col_prefixes, title, plo_label):
        rows = {}
        for prefix, col_label in col_prefixes:
            match_cols = [c for c in cols if str(c).strip().startswith(prefix)]
            for cname in match_cols:
                m = re.search(r"PLO\s*(\d+)", str(cname), re.IGNORECASE)
                if not m:
                    continue
                plo_num = int(m.group(1))
                vals = df[cname].dropna()
                if len(vals) == 0 or vals.dtype not in ("float64", "int64"):
                    continue
                if plo_num not in rows:
                    rows[plo_num] = {"plo": f"PLO {plo_num}", "count": int(len(vals))}
                rows[plo_num][col_label] = round(float(vals.mean()), 2)
                rows[plo_num]["count"] = max(rows[plo_num]["count"], int(len(vals)))
        if not rows:
            return None
        result = sorted(rows.values(), key=lambda r: int(r["plo"].replace("PLO ", "")))
        return {"title": title, "type": "plo", "data": result}

    def _plo_rating(title):
        match_cols = [c for c in cols if re.match(r"^PLO\s*\d+", str(c), re.IGNORECASE)]
        if not match_cols:
            return None
        plo_groups = defaultdict(list)
        for cname in match_cols:
            m = re.match(r"^(PLO\s*\d+)", str(cname), re.IGNORECASE)
            if m:
                plo_groups[m.group(1)].append(cname)
        data = []
        for plo_key in sorted(plo_groups.keys(), key=lambda k: int(k.replace("PLO ", "").replace("PLO", ""))):
            vals_list = []
            for cname in plo_groups[plo_key]:
                vals = df[cname].dropna()
                if len(vals) > 0 and vals.dtype in ("float64", "int64"):
                    vals_list.extend(vals.tolist())
            if vals_list:
                data.append({
                    "label": plo_key,
                    "mean": round(sum(vals_list) / len(vals_list), 2),
                    "min": round(min(vals_list), 1),
                    "max": round(max(vals_list), 1),
                    "count": len(vals_list),
                })
        if not data:
            return None
        return {"title": title, "type": "rating", "data": data}

    if name == "alumni":
        for t in [
            _dist("1/25", "Tình hình việc làm"),
            _dist("8/25", "Mức thu nhập"),
            _dist("9/25", "Công việc hiện tại"),
        ]:
            if t:
                tables.append(t)

        sat = _rating_group("13-15/25", "Mức độ hài lòng")
        if sat:
            tables.append(sat)

        plo = _plo_matrix(
            [("18/25", "trang_bi"), ("19/25", "danh_gia")],
            "Đánh giá PLO",
            "PLO",
        )
        if plo:
            tables.append(plo)

    elif name == "teacher":
        plo_t = _plo_rating("Đánh giá PLO")
        if plo_t:
            tables.append(plo_t)

        for t in [
            _rating_group("11/17", "Chất lượng phòng học"),
            _rating_group("12/17", "Chất lượng xưởng thực hành"),
            _rating_group("13/17", "Chất lượng tư liệu giảng dạy"),
        ]:
            if t:
                tables.append(t)

    elif name == "business":
        for t in [
            _rating_group("3/18", "Chất lượng nhân viên"),
            _rating_group("11/18", "Xu hướng tuyển dụng"),
        ]:
            if t:
                tables.append(t)

        plo_b = _plo_matrix(
            [("13/18", "muc_do")],
            "Mức độ phù hợp CĐR",
            "CĐR",
        )
        if plo_b:
            tables.append(plo_b)

    return {"survey": name, "tables": tables, "total_responses": len(df)}


def save_response(survey_type: str, email: str, answers: dict, base_dir: str, major: str = ""):
    from datetime import datetime
    import uuid

    resp_dir = os.path.join(base_dir, "data", "responses", survey_type)
    os.makedirs(resp_dir, exist_ok=True)

    record = {
        "id": str(uuid.uuid4()),
        "email": email,
        "survey_type": survey_type,
        "major": major,
        "timestamp": datetime.now().isoformat(),
        "answers": answers,
    }

    fname = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{record['id'][:8]}.json"
    path = os.path.join(resp_dir, fname)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(record, f, ensure_ascii=False, indent=2)
    return record["id"]
