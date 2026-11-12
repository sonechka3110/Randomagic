@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Запускаю локальный сервер: http://127.0.0.1:5173
echo Закрыть — Ctrl+C или просто закройте это окно.
start "" "http://127.0.0.1:5173/"
python -m http.server 5173 --bind 127.0.0.1
pause
