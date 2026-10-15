// Core-логика случайного подбора: источники (колоды без повторов)
// + фильтры на выдаче. Политика «без повторов» живёт в deck.js,
// чистая фильтрация — в filters.js; здесь только конвейер.

import { catalogs } from "../data/catalog.js?v=2";
import { applyFilters, availableGenres } from "./filters.js?v=2";
import { getSource, initSources } from "./sources.js?v=2";

export { initSources };

export const categories = Object.keys(catalogs);

/** Текущие фильтры по категориям: { movies: {genre, minRating}, ... } */
const activeFilters = {};

/**
 * Устанавливает фильтры категории (применяются на выдаче).
 */
export function setFilters(category, criteria) {
  activeFilters[category] = criteria;
}

/**
 * Подбирает случайную рекомендацию без повторов.
 * reason объясняет null: 'empty-pool' (фильтры) | 'exhausted'.
 */
export function pickRecommendation(category) {
  // «Что угодно»: выбираем категорию с остатком до всех проверок.
  if (!category) {
    if (!anyRemaining()) {
      return { category: "", item: null, reason: "exhausted" };
    }
    category = pickSourceCategory();
  }

  const criteria = activeFilters[category] ?? {};

  // Пустой пул по фильтрам определяем до раздачи, чтобы не сжигать
  // колоду впустую: если под критерии не подходит ни одна позиция
  // каталога, ни один элемент не будет выдан.
  if (applyFilters(catalogs[category], criteria).length === 0) {
    return { category, item: null, reason: "empty-pool" };
  }

  const source = getSource(category);
  if (source.isExhausted()) {
    return { category, item: null, reason: "exhausted" };
  }

  // До N попыток: элемент может не подойти под фильтры.
  const MAX_TRIES = 40;
  for (let i = 0; i < MAX_TRIES; i++) {
    const item = source.next();
    if (!item) {
      return { category, item: null, reason: "exhausted" };
    }
    const [filtered] = applyFilters([item], criteria);
    if (filtered) return { category, item: filtered, reason: null };
  }
  return { category, item: null, reason: "exhausted" };
}

/** Сколько уникальных вариантов осталось в категории. */
export function remainingIn(category) {
  return getSource(category).remaining();
}

/** Все ли варианты категории показаны. */
export function isExhausted(category) {
  return getSource(category).isExhausted();
}

/** Есть ли хоть одна категория с оставшимися вариантами. */
export function anyRemaining() {
  return categories.some((c) => !isExhausted(c));
}

/** Полный сброс всех источников: новый круг по всем категориям. */
export function resetDecks() {
  for (const c of categories) getSource(c).reset();
}

/**
 * Категория, из которой можно взять следующий вариант:
 * случайная среди категорий с остатком; null, если исчерпано всё.
 */
function pickSourceCategory() {
  const available = categories.filter((c) => !isExhausted(c));
  if (available.length === 0) return null;
  const index = Math.floor(Math.random() * available.length);
  return available[index];
}

/** Жанры для селекта: объединение жанров всех каталогов. */
export function genresFor(category) {
  return availableGenres(catalogs[category]);
}
