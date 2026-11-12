#!/usr/bin/env sh
# Запуск сайта на локальном сервере: http://127.0.0.1:5173
cd "$(dirname "$0")" || exit 1
PORT=5173
echo "Сайт: http://127.0.0.1:$PORT  (Ctrl+C — остановить)"
(command -v xdg-open >/dev/null && xdg-open "http://127.0.0.1:$PORT" >/dev/null 2>&1) ||
  (command -v open >/dev/null && open "http://127.0.0.1:$PORT" >/dev/null 2>&1) ||
  true
if command -v python3 >/dev/null; then
  exec python3 -m http.server "$PORT" --bind 127.0.0.1
else
  exec python -m http.server "$PORT" --bind 127.0.0.1
fi
