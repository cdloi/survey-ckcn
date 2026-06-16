import hmac
import hashlib
import base64
import json
import time
from fastapi import HTTPException, Request

SECRET_KEY = "khoa-ckcn-survey-secret-2024"
TOKEN_EXPIRE = 86400 * 7

MAJORS = [
    "CHUYÊN NGÀNH CƠ KHÍ NÔNG LÂM",
    "CƠ KHÍ CHẾ BIẾN VÀ BẢO QUẢN NÔNG SẢN THỰC PHẨM",
    "CÔNG NGHỆ KỸ THUẬT CƠ KHÍ - CHƯƠNG TRÌNH NÂNG CAO",
    "CÔNG NGHỆ KỸ THUẬT Ô TÔ",
    "CÔNG NGHỆ KỸ THUẬT CƠ ĐIỆN TỬ",
    "CÔNG NGHỆ KỸ THUẬT NHIỆT",
    "KỸ THUẬT ĐIỀU KHIỂN VÀ TỰ ĐỘNG HÓA",
    "CÔNG NGHỆ KỸ THUẬT NĂNG LƯỢNG TÁI TẠO",
]

USERS = {
    "admin": {"password": "admin123", "role": "admin", "name": "Ban lãnh đạo Khoa", "major": None},
    "ql_cknl": {"password": "cknl2024", "role": "manager", "name": "PTCN Cơ khí Nông lâm", "major": "CHUYÊN NGÀNH CƠ KHÍ NÔNG LÂM"},
    "ql_ckcb": {"password": "ckcb2024", "role": "manager", "name": "PTCN Cơ khí Chế biến", "major": "CƠ KHÍ CHẾ BIẾN VÀ BẢO QUẢN NÔNG SẢN THỰC PHẨM"},
    "ql_nangcao": {"password": "nc2024", "role": "manager", "name": "PTCN Cơ khí CT NC", "major": "CÔNG NGHỆ KỸ THUẬT CƠ KHÍ - CHƯƠNG TRÌNH NÂNG CAO"},
    "ql_oto": {"password": "oto2024", "role": "manager", "name": "PTCN Kỹ thuật Ô tô", "major": "CÔNG NGHỆ KỸ THUẬT Ô TÔ"},
    "ql_ckdt": {"password": "ckdt2024", "role": "manager", "name": "PTCN Cơ điện tử", "major": "CÔNG NGHỆ KỸ THUẬT CƠ ĐIỆN TỬ"},
    "ql_nhiet": {"password": "nhiet2024", "role": "manager", "name": "PTCN Kỹ thuật Nhiệt", "major": "CÔNG NGHỆ KỸ THUẬT NHIỆT"},
    "ql_tdh": {"password": "tdh2024", "role": "manager", "name": "PTCN Tự động hóa", "major": "KỸ THUẬT ĐIỀU KHIỂN VÀ TỰ ĐỘNG HÓA"},
    "ql_nlt": {"password": "nlt2024", "role": "manager", "name": "PTCN Năng lượng Tái tạo", "major": "CÔNG NGHỆ KỸ THUẬT NĂNG LƯỢNG TÁI TẠO"},
}

def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _b64_decode(s: str) -> bytes:
    s += "=" * (4 - len(s) % 4)
    return base64.urlsafe_b64decode(s)

def create_token(username: str) -> str:
    header = _b64_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64_encode(json.dumps({
        "sub": username,
        "iat": int(time.time()),
        "exp": int(time.time()) + TOKEN_EXPIRE,
    }).encode())
    sig = _b64_encode(hmac.new(SECRET_KEY.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest())
    return f"{header}.{payload}.{sig}"

def verify_token(token: str):
    parts = token.split(".")
    if len(parts) != 3:
        return None
    header, payload, sig = parts
    expected = _b64_encode(hmac.new(SECRET_KEY.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        data = json.loads(_b64_decode(payload))
    except Exception:
        return None
    if data.get("exp", 0) < time.time():
        return None
    return data.get("sub")

def get_current_user(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    username = verify_token(auth[7:])
    if not username or username not in USERS:
        return None
    return {**USERS[username], "username": username}

def require_admin(request: Request):
    user = get_current_user(request)
    if not user or user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return user

def require_manager(request: Request):
    user = get_current_user(request)
    if not user or user["role"] not in ("admin", "manager"):
        raise HTTPException(status_code=403, detail="Forbidden")
    return user

def require_any(request: Request):
    user = get_current_user(request)
    return user
