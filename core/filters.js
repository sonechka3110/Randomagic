// Чистая фильтрация пула элементов каталога.
// Никакого состояния и DOM: принимает элементы и критерии, возвращает
// подмножество. Используется picker'ом перед сборкой колоды.

/**
 * @typedef {{ genre?: string, minRating?: number, maxAge?: number }} FilterCriteria
 */

/**
 * Отбирает элементы, подходящие под критерии.
 * @template T {{ genre: string, rating: number, age: number }}
 * @param {T[]} items
 * @param {FilterCriteria} criteria
 * @returns {T[]}
 */
export function applyFilters(items, { genre, minRating, maxAge } = {}) {
  return items.filter((item) => {
    if (genre && item.genre !== genre) return false;
    if (minRating != null && item.rating < minRating) return false;
    if (maxAge != null && (item.age ?? 0) > maxAge) return false;
    return true;
  });
}

/**
 * Уникальные жанры из списка элементов, отсортированные по алфавиту.
 * @template T {{ genre: string }}
 * @param {T[]} items
 * @returns {string[]}
 */
export function availableGenres(items) {
  return [...new Set(items.map((item) => item.genre))].sort((a, b) =>
    a.localeCompare(b, "ru")
  );
}
