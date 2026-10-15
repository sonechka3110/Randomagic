# Статический сервер для разработки: раздаёт файлы проекта без кэширования,
# чтобы правки кода сразу доходили до браузера.
# Запуск:  python server.py [порт]   (по умолчанию 8002)

import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, *args):
        pass  # тихие логи: окно консоли и так растёт бесконечно


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8002
    server = ThreadingHTTPServer(("127.0.0.1", port), NoCacheHandler)
    print(f"Serving on http://127.0.0.1:{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
