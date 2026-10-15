// Слой данных: постер тайтла из Википедии.
// Action API (w/api.php) разрешает CORS (origin=*) и не требует ключей;
// redirects=1 ловит статьи по любому из имён, piprop=original даёт постер.
// Результаты кэшируются в localStorage, чтобы не дёргать сеть дважды.

const CACHE_KEY = "wiki.cache.v3"; // v3: храним только постер (описание — локальное)
const cache = (() => {
  try {
    return new Map(Object.entries(JSON.parse(localStorage.getItem(CACHE_KEY)) ?? {}));
  } catch {
    return new Map();
  }
})();

let saveTimer = null;

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(cache)));
    } catch {
      /* переполнение localStorage — переживаем без кэша */
    }
  }, 300);
}

/**
 * Возвращает URL постера по названию статьи. Строка пуста, если постера нет.
 * Бросает, если статьи нет или сеть недоступна (вызывающий код откатывается
 * на локальное описание из каталога).
 */
export async function fetchWikiPoster(wikiTitle) {
  if (cache.has(wikiTitle)) return cache.get(wikiTitle);

  const api = `https://ru.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=original&pilicense=any&format=json&origin=*&redirects=1&titles=${encodeURIComponent(wikiTitle)}&_=${Date.now()}`;
  const res = await fetch(api);
  if (!res.ok) throw new Error(`Wiki ${res.status} для «${wikiTitle}»`);

  const data = await res.json();
  const pages = data.query?.pages ?? {};
  const page = Object.values(pages)[0];
  if (!page || page.missing != null) throw new Error(`Статья не найдена: «${wikiTitle}»`);

  const poster = page.original?.source ?? "";
  cache.set(wikiTitle, poster);
  persist();
  return poster;
}
