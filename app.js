(() => {
  "use strict";

  const KIND = {
    movie:  { label: "фильм",   emoji: "🎬", searchLabel: "Найти на Кинопоиске", search: t => "https://www.kinopoisk.ru/index.php?kp_query=" + encodeURIComponent(t) },
    game:   { label: "игра",    emoji: "🎮", searchLabel: "Найти в Steam",       search: t => "https://store.steampowered.com/search/?term=" + encodeURIComponent(t) },
    series: { label: "сериал",  emoji: "📺", searchLabel: "Найти на Кинопоиске", search: t => "https://www.kinopoisk.ru/index.php?kp_query=" + encodeURIComponent(t) }
  };

  const items = window.CATALOG_RAW.map(([title, year, kind, genres, rating, desc, meta]) => ({
    id: kind + ":" + title,
    title, year, kind, genres, rating, desc, meta
  }));
  const byId = new Map(items.map(item => [item.id, item]));

  const STORAGE = { favs: "random-evening:favs:v1", hist: "random-evening:history:v1" };

  const state = {
    kind: "all",
    genre: "all",
    noRepeat: true,
    current: null,
    favorites: [],
    history: [],
    spinning: false
  };

  const $ = id => document.getElementById(id);
  const els = {
    body: document.body,
    stage: $("stage"),
    modeSwitch: $("modeSwitch"),
    genreChips: $("genreChips"),
    noRepeat: $("noRepeat"),
    poster: $("poster"),
    posterEmoji: $("posterEmoji"),
    posterLabel: $("posterLabel"),
    posterTitle: $("posterTitle"),
    posterYear: $("posterYear"),
    kindPill: $("kindPill"),
    yearPill: $("yearPill"),
    resultTitle: $("resultTitle"),
    resultRating: $("resultRating"),
    resultMeta: $("resultMeta"),
    resultGenres: $("resultGenres"),
    resultDesc: $("resultDesc"),
    searchLink: $("searchLink"),
    roulette: $("roulette"),
    rouletteText: $("rouletteText"),
    spinBtn: $("spinBtn"),
    spinLabel: $("spinLabel"),
    favBtn: $("favBtn"),
    favHeart: $("favHeart"),
    favLabel: $("favLabel"),
    hint: $("hint"),
    dbCount: $("dbCount"),
    favList: $("favList"),
    favCount: $("favCount"),
    favEmpty: $("favEmpty"),
    histList: $("histList"),
    histEmpty: $("histEmpty"),
    clearHistory: $("clearHistory"),
    toast: $("toast")
  };

  let toastTimer = null;
  let spinToken = 0;

  /* ---------- Хранилище ---------- */
  function load(key) {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(id => byId.has(id)) : [];
    } catch {
      return [];
    }
  }

  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* приватный режим */ }
  }

  /* ---------- Фильтры ---------- */
  function matchingKind(kind) {
    return items.filter(item => kind === "all" || item.kind === kind);
  }

  function genresForKind() {
    const counts = new Map();
    for (const item of matchingKind(state.kind)) {
      for (const genre of item.genres) counts.set(genre, (counts.get(genre) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ru"))
      .slice(0, 14)
      .map(([genre]) => genre);
  }

  function pool() {
    return matchingKind(state.kind).filter(item =>
      state.genre === "all" || item.genres.includes(state.genre)
    );
  }

  /* ---------- Отрисовка фильтров ---------- */
  function renderGenres() {
    const genres = genresForKind();
    if (state.genre !== "all" && !genres.includes(state.genre)) state.genre = "all";

    els.genreChips.textContent = "";
    const entries = [["all", "Все жанры"], ...genres.map(genre => [genre, genre])];

    for (const [value, label] of entries) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip" + (state.genre === value ? " is-active" : "");
      chip.textContent = label;
      chip.dataset.genre = value;
      chip.setAttribute("aria-pressed", String(state.genre === value));
      els.genreChips.appendChild(chip);
    }
  }

  function updateHint() {
    const available = pool().length;
    const genreNote = state.genre === "all" ? "" : ` · жанр: ${state.genre}`;
    els.hint.textContent = `Доступно вариантов: ${available}${genreNote} · Пробел — ещё вариант`;
  }

  /* ---------- Отрисовка карточки ---------- */
  function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function paintPoster(item) {
    const h = hash(item.title + item.year);
    const h1 = 15 + (h % 330);
    const h2 = (h1 + 45 + ((h >>> 9) % 110)) % 360;
    els.poster.style.setProperty("--h1", String(h1));
    els.poster.style.setProperty("--h2", String(h2));
  }

  function isFavorite(item) {
    return state.favorites.includes(item.id);
  }

  function renderItem(item, { animate = true } = {}) {
    const kind = KIND[item.kind];

    state.current = item;
    els.body.dataset.kind = state.kind === "all" ? item.kind : state.kind;

    paintPoster(item);
    els.posterEmoji.textContent = kind.emoji;
    els.posterLabel.textContent = kind.label;
    els.posterTitle.textContent = item.title;
    els.posterYear.textContent = item.year;

    els.kindPill.textContent = kind.label;
    els.yearPill.textContent = item.year;
    els.resultTitle.textContent = item.title;
    els.resultRating.textContent = item.rating.toFixed(1);
    els.resultMeta.textContent = item.meta;

    els.resultGenres.textContent = "";
    for (const genre of item.genres) {
      const tag = document.createElement("span");
      tag.className = "genre";
      tag.textContent = genre;
      els.resultGenres.appendChild(tag);
    }
    els.resultDesc.textContent = item.desc;

    els.searchLink.href = kind.search(item.title);
    els.searchLink.textContent = "";
    const arrow = document.createElement("span");
    arrow.textContent = "↗";
    els.searchLink.append(kind.searchLabel + " ", arrow);

    renderFavButton(item);
    updateHint();

    if (animate) {
      els.stage.classList.remove("is-enter");
      void els.stage.offsetWidth;
      els.stage.classList.add("is-enter");
      window.setTimeout(() => els.stage.classList.remove("is-enter"), 600);
    }
  }

  function renderFavButton(item) {
    const favorite = item ? isFavorite(item) : false;
    els.favBtn.classList.toggle("is-fav", favorite);
    els.favHeart.textContent = favorite ? "♥" : "♡";
    els.favLabel.textContent = favorite ? "В избранном" : "В избранное";
    els.favBtn.disabled = !item;
    els.favBtn.setAttribute("aria-pressed", String(favorite));
  }

  /* ---------- Списки ---------- */
  function buildMiniItem(item, withRemove) {
    const li = document.createElement("li");
    li.className = "mini-item";

    const open = document.createElement("button");
    open.type = "button";
    open.className = "mini-open";
    open.dataset.open = item.id;

    const emoji = document.createElement("span");
    emoji.className = "mini-emoji";
    emoji.textContent = KIND[item.kind].emoji;

    const text = document.createElement("span");
    text.className = "mini-text";
    const strong = document.createElement("strong");
    strong.textContent = item.title;
    const small = document.createElement("small");
    small.textContent = `${item.year} · ${KIND[item.kind].label}`;
    text.append(strong, small);

    open.append(emoji, text);
    li.appendChild(open);

    if (withRemove) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "mini-remove";
      remove.dataset.remove = item.id;
      remove.title = "Убрать из избранного";
      remove.setAttribute("aria-label", `Убрать «${item.title}» из избранного`);
      remove.textContent = "×";
      li.appendChild(remove);
    }

    return li;
  }

  function renderLists() {
    els.favList.textContent = "";
    els.histList.textContent = "";

    for (const id of state.favorites) {
      const item = byId.get(id);
      if (item) els.favList.appendChild(buildMiniItem(item, true));
    }
    for (const id of state.history) {
      const item = byId.get(id);
      if (item) els.histList.appendChild(buildMiniItem(item, false));
    }

    els.favCount.textContent = state.favorites.length;
    els.favEmpty.hidden = state.favorites.length > 0;
    els.histEmpty.hidden = state.history.length > 0;
    els.clearHistory.hidden = state.history.length === 0;
  }

  /* ---------- Выбор и рулетка ---------- */
  function randomOf(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function pick() {
    let candidates = pool();
    if (!candidates.length) return null;

    if (state.noRepeat && candidates.length > 1) {
      const recent = new Set(state.history.slice(0, 10));
      if (state.current) recent.add(state.current.id);
      const fresh = candidates.filter(item => !recent.has(item.id));
      if (fresh.length) candidates = fresh;
    }

    if (candidates.length > 1 && state.current) {
      const withoutCurrent = candidates.filter(item => item.id !== state.current.id);
      if (withoutCurrent.length) candidates = withoutCurrent;
    }

    return randomOf(candidates);
  }

  function spin() {
    if (state.spinning) return;
    const candidates = pool();
    if (!candidates.length) {
      showToast("Под такие фильтры ничего не нашлось — выберите другой жанр");
      return;
    }

    state.spinning = true;
    const token = ++spinToken;
    els.stage.classList.add("is-spinning");
    els.spinBtn.disabled = true;
    els.spinLabel.textContent = "Крутим…";

    const started = performance.now();
    const duration = 900;

    const tick = () => {
      if (token !== spinToken) return;
      const elapsed = performance.now() - started;
      if (elapsed < duration) {
        els.rouletteText.textContent = randomOf(candidates).title;
        window.setTimeout(tick, 65 + Math.random() * 45);
        return;
      }

      const choice = pick();
      state.spinning = false;
      els.stage.classList.remove("is-spinning");
      els.spinBtn.disabled = false;
      els.spinLabel.textContent = "Крутить ещё раз";

      if (choice) {
        renderItem(choice);
        addToHistory(choice);
      }
    };

    window.setTimeout(tick, 60);
  }

  function addToHistory(item) {
    state.history = [item.id, ...state.history.filter(id => id !== item.id)].slice(0, 10);
    save(STORAGE.hist, state.history);
    renderLists();
  }

  /* ---------- Действия ---------- */
  function toggleFavorite() {
    const item = state.current;
    if (!item) return;

    if (isFavorite(item)) {
      state.favorites = state.favorites.filter(id => id !== item.id);
      showToast(`«${item.title}» убрали из избранного`);
    } else {
      state.favorites = [item.id, ...state.favorites];
      showToast(`«${item.title}» в избранном`);
    }
    save(STORAGE.favs, state.favorites);
    renderFavButton(item);
    renderLists();
  }

  function syncModeButtons() {
    for (const button of els.modeSwitch.querySelectorAll(".mode")) {
      const active = button.dataset.kind === state.kind;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  }

  function setKind(kind) {
    if (state.kind === kind) return;
    state.kind = kind;
    state.genre = "all";

    syncModeButtons();
    els.body.dataset.kind = kind;
    renderGenres();
    updateHint();
    spin();
  }

  function setGenre(genre) {
    if (state.genre === genre) return;
    state.genre = genre;
    for (const chip of els.genreChips.querySelectorAll(".chip")) {
      const active = chip.dataset.genre === genre;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", String(active));
    }
    updateHint();
    spin();
  }

  function openSaved(id) {
    const item = byId.get(id);
    if (!item || state.spinning) return;

    // Показываем сохранённое без конфликта с текущими фильтрами.
    if (state.kind !== "all" && state.kind !== item.kind) {
      state.kind = item.kind;
      state.genre = "all";
      syncModeButtons();
      renderGenres();
    } else if (state.genre !== "all" && !item.genres.includes(state.genre)) {
      state.genre = "all";
      renderGenres();
    }

    renderItem(item);
    if (window.innerWidth < 940) {
      els.stage.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => els.toast.classList.remove("is-visible"), 2400);
  }

  /* ---------- События ---------- */
  els.modeSwitch.addEventListener("click", event => {
    const button = event.target.closest(".mode");
    if (button) setKind(button.dataset.kind);
  });

  els.genreChips.addEventListener("click", event => {
    const chip = event.target.closest(".chip");
    if (chip) setGenre(chip.dataset.genre);
  });

  els.spinBtn.addEventListener("click", spin);
  els.favBtn.addEventListener("click", toggleFavorite);

  els.noRepeat.addEventListener("change", () => {
    state.noRepeat = els.noRepeat.checked;
    showToast(state.noRepeat ? "Повторы отключены" : "Повторы включены");
  });

  els.favList.addEventListener("click", event => {
    const remove = event.target.closest("[data-remove]");
    if (remove) {
      const id = remove.dataset.remove;
      state.favorites = state.favorites.filter(fav => fav !== id);
      save(STORAGE.favs, state.favorites);
      renderLists();
      if (state.current) renderFavButton(state.current);
      return;
    }
    const open = event.target.closest("[data-open]");
    if (open) openSaved(open.dataset.open);
  });

  els.histList.addEventListener("click", event => {
    const open = event.target.closest("[data-open]");
    if (open) openSaved(open.dataset.open);
  });

  els.clearHistory.addEventListener("click", () => {
    state.history = [];
    save(STORAGE.hist, state.history);
    renderLists();
    showToast("История очищена");
  });

  document.addEventListener("keydown", event => {
    if (event.code !== "Space" || event.repeat) return;
    const tag = (event.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;
    if (tag === "button" || tag === "a") return;
    event.preventDefault();
    spin();
  });

  /* ---------- Запуск ---------- */
  state.favorites = load(STORAGE.favs);
  state.history = load(STORAGE.hist);

  els.dbCount.textContent = String(items.length);
  els.noRepeat.checked = state.noRepeat;
  els.body.dataset.kind = state.kind;
  renderGenres();
  renderLists();

  renderItem(randomOf(items), { animate: false });
  updateHint();
})();
