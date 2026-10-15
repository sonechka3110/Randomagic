# Как запустить сайт «Случайный подбор»

Статический сайт без сборки и зависимостей: чистые ES-модули, раздаёт любой
статический сервер. Репroduce артефактов не требует — все файлы в репозитории.

## Запуск сервера

Из корня проекта (`C:\Users\user\Desktop\Софья Ф\gen`), в фоне (Windows):

```powershell
powershell -NoProfile -Command "(Start-Process -FilePath 'python.exe' -ArgumentList 'server.py','8002' -WorkingDirectory 'C:\Users\user\Desktop\Софья Ф\gen' -RedirectStandardOutput '.freebuff\preview.log' -RedirectStandardError '.freebuff\preview.log.err' -WindowStyle Hidden -PassThru).Id"
```

- Запускать `server.py`, а не `python -m http.server`: скрипт отдаёт
  `Cache-Control: no-store`, иначе браузер закэширует ES-модули и правки
  перестанут доходить (с этим уже промучились — кэш переживал даже ?v=).
- Порт 8002 выбран потому, что 8000/8001 исторически занимались; если занят —
  взять любой свободный, превью перерегистрировать на новый URL.
- stdout и stderr обязательно в разные файлы (ограничение Start-Process).
- Проверка живости: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8002/index.html`
  → ожидается `200`.

## Структура проекта

- `index.html`, `styles.css`, `main.js` — разметка, тема, владелец состояния
- `core/` — логика: `picker.js` (подбор), `sources.js` (колоды по категориям),
  `deck.js` (колода без повторов), `filters.js` (жанр/рейтинг/возраст)
- `data/catalog.js` — встроенные каталоги: 30 фильмов, 30 сериалов, 30 игр,
  у каждой позиции `age` (возраст 0/6/12/16/18), `desc` (краткое содержание)
  и `wiki` (статья Википедии)
- `data/wiki.js` — только постер из Википедии (Action API, без ключей),
  кэш в localStorage `wiki.cache.v3`; описание всегда локальное (`desc`)
- `ui/ui.js` — единственный слой, знающий про DOM

Сайт работает только на встроенном каталоге: API-ключи и внешние
источники (TMDB/RAWG) удалены по требованию пользователя.
