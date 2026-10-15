// Источники данных для категорий: колоды из встроенного каталога.
// Остальной код (picker) работает через один интерфейс:
// next() / remaining() / isExhausted() / reset().

import { catalogs } from "../data/catalog.js?v=2";
import { createDeck } from "./deck.js?v=2";

/**
 * @typedef {{ next(): object|null, remaining(): number,
 *             isExhausted(): boolean, reset(): void }} Source
 */

const sources = {};

export function initSources() {
  for (const category of Object.keys(catalogs)) {
    sources[category] = createDeck(catalogs[category]);
  }
  dispatchCatalogReady();
}

function dispatchCatalogReady() {
  window.dispatchEvent(new CustomEvent("catalog:ready"));
}

export function getSource(category) {
  const s = sources[category];
  if (!s) throw new Error(`Источники не инициализированы (initSources)`);
  return s;
}
