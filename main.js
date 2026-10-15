// main.js — единственный владелец состояния приложения.
// Связывает core-логику (колоды + фильтры + «без повторов») с UI:
// слушает действия пользователя, хранит историю, решает,
// когда и что перерисовать.

import {
  pickRecommendation,
  remainingIn,
  setFilters,
  genresFor,
  resetDecks,
  initSources
} from "./core/picker.js?v=2";
import { fetchWikiPoster } from "./data/wiki.js?v=4";
import { ui } from "./ui/ui.js?v=4";

const STORAGE_HISTORY = "picker.history";
const STORAGE_FILTERS = "picker.filters";

const state = {
  history: [],
  isSpinning: false,
  cycleExhausted: false,
  filters: { genre: "", minRating: null, maxAge: null }
};

let catalogs = { movies: [], series: [], games: [] };

function bindCatalogSource(source) {
  catalogs = source;
}

/** Сериализуемые фильтры: то, что сохраняется между визитами. */
function filterKey() {
  const f = state.filters;
  return JSON.stringify({
    genre: f.genre || null,
    minRating: f.minRating != null ? Number(f.minRating) : null,
    maxAge: f.maxAge != null ? Number(f.maxAge) : null
  });
}

function writeFilters() {
  try {
    localStorage.setItem(STORAGE_FILTERS, filterKey());
  } catch {
    /* переполнение — фильтры живут только текущей сессией */
  }
}

function readFilters() {
  try {
    const raw = localStorage.getItem(STORAGE_FILTERS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const genre = typeof parsed.genre === "string" ? parsed.genre : null;
    const minRating =
      parsed.minRating != null && !isNaN(Number(parsed.minRating))
        ? Number(parsed.minRating)
        : null;
    const maxAge =
      parsed.maxAge != null && !isNaN(Number(parsed.maxAge)) ? Number(parsed.maxAge) : null;
    return { genre, minRating, maxAge };
  } catch {
    return null;
  }
}

function restoreFilters() {
  const saved = readFilters();
  if (!saved) return;
  state.filters.genre = saved.genre ?? "";
  state.filters.minRating = saved.minRating ?? null;
  state.filters.maxAge = saved.maxAge ?? null;
}

const MAX_HISTORY = 8;
const categoryLabels = { movies: "Фильм", series: "Сериал", games: "Игра" };
const categoryLabelsLower = { movies: "фильм", series: "сериал", games: "игра" };

function countCatalog() {
  let n = 0;
  for (const cat of ["movies", "series", "games"]) {
    try {
      n += catalogs[cat].length;
    } catch {
      /* каталог ещё не загружен — ничего не показываем */
    }
  }
  return n;
}

function renderHeroStats() {
  const el = document.getElementById("hero-count");
  if (!el) return;
  const n = countCatalog();
  el.textContent = n > 0 ? n : "—";
}

/** Тайтл, который сейчас показан на карточке (для открытия модалки). */
let currentRec = null;

function currentCriteria() {
  const criteria = {};
  if (state.filters.genre) criteria.genre = state.filters.genre;
  if (state.filters.minRating != null) criteria.minRating = state.filters.minRating;
  if (state.filters.maxAge != null) criteria.maxAge = state.filters.maxAge;
  return criteria;
}

function applyFiltersToAll() {
  const criteria = currentCriteria();
  for (const category of ["movies", "series", "games"]) {
    setFilters(category, criteria);
  }
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_HISTORY)) ?? [];
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(state.history.slice(0, MAX_HISTORY)));
}

function pushHistory(rec) {
  state.history.unshift({
    title: rec.item.title,
    categoryLabel: categoryLabelsLower[rec.category] ?? "позиция"
  });
  if (state.history.length > MAX_HISTORY) state.history.pop();
  saveHistory();
}

async function roll(category) {
  if (state.isSpinning) return;
  state.isSpinning = true;

  ui.setLoading(true);
  ui.clear();
  ui.resetRerollLabel();

  // Небольшая пауза — анимация «рулетки».
  await new Promise((r) => setTimeout(r, 350));

  const rec = pickRecommendation(category);

  if (rec.item) {
    state.cycleExhausted = false;
    currentRec = rec;
    pushHistory(rec);
    ui.render(rec, remainingIn(rec.category));
  } else if (category) {
    currentRec = null;
    ui.renderEmpty(rec);
  } else {
    state.cycleExhausted = true;
    ui.renderExhausted();
  }

  ui.renderRecent(state.history);
  ui.setLoading(false);
  state.isSpinning = false;
}

function init() {
  ui.init();
  state.history = loadHistory();
  ui.renderRecent(state.history);

  // Восстанавливаем фильтры, записанные на предыдущей сессии.
  restoreFilters();

  // Клик/Enter по карточке → модалка с описанием из каталога и постером из Википедии.
  ui.bindCardClick(() => {
    if (!currentRec) return;
    ui.showModal(
      currentRec.item,
      categoryLabels[currentRec.category] ?? currentRec.category,
      currentRec.item.wiki,
      fetchWikiPoster
    );
  });

  initSources();

  ui.renderGenreOptions(
    [...new Set(["movies", "series", "games"].flatMap(genresFor))].sort((a, b) =>
      a.localeCompare(b, "ru")
    ),
    state.filters.genre
  );

  ui.els.ratingSelect.value = state.filters.minRating != null ? String(state.filters.minRating) : "";
  ui.els.ageSelect.value = state.filters.maxAge != null ? String(state.filters.maxAge) : "";

  applyFiltersToAll();
  writeFilters();

  // Когда каталог станет доступен — пересчитаем счётчик и подложим живой "0 повторов".
  if (catalogs && catalogs.movies) {
    renderHeroStats();
  } else {
    window.addEventListener("catalog:ready", () => {
      renderHeroStats();
    }, { once: true });
  }

  document.getElementById("hero-reset").addEventListener("click", () => {
    resetDecks();
    state.cycleExhausted = false;
    roll();
  });

  // Вставляем текущий счётчик повторов в hero, если элемент уже на странице.
  const repeatsEl = document.querySelector(".hero-repeats");
  if (repeatsEl) {
    repeatsEl.textContent = `0 повторов`;
  }

  ui.els.genreSelect.addEventListener("change", () => {
    state.filters.genre = ui.els.genreSelect.value;
    applyFiltersToAll();
    writeFilters();
  });

  ui.els.ratingSelect.addEventListener("change", () => {
    const v = ui.els.ratingSelect.value;
    state.filters.minRating = v ? Number(v) : null;
    applyFiltersToAll();
    writeFilters();
  });

  ui.els.ageSelect.addEventListener("change", () => {
    const v = ui.els.ageSelect.value;
    state.filters.maxAge = v ? Number(v) : null;
    applyFiltersToAll();
    writeFilters();
  });

  ui.els.resetFilters.addEventListener("click", () => {
    state.filters = { genre: "", minRating: null, maxAge: null };
    ui.els.genreSelect.value = "";
    ui.els.ratingSelect.value = "";
    ui.els.ageSelect.value = "";
    applyFiltersToAll();
    writeFilters();
  });

  document.querySelectorAll("[data-category]").forEach((btn) => {
    btn.addEventListener("click", () => roll(btn.dataset.category));
  });

  ui.els.reroll.addEventListener("click", () => {
    if (state.cycleExhausted) {
      resetDecks();
      state.cycleExhausted = false;
    }
    roll();
  });

  ui.els.clearRecent.addEventListener("click", () => {
    state.history = [];
    saveHistory();
    ui.renderRecent(state.history);
    const repeatsEl = document.querySelector(".hero-repeats");
    if (repeatsEl) repeatsEl.textContent = `0 повторов`;
  });
}

document.addEventListener("DOMContentLoaded", init);
