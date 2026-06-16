@echo off
cd /d "%~dp0"
echo Building frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b %errorlevel%
)
cd ..\backend
echo Starting server at http://0.0.0.0:8000
uvicorn main:app --host 0.0.0.0 --port 8000
pause
