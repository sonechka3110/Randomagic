// Колода: единственное место, где живёт политика «без повторов».
// Элементы выдаются без повторов; когда колода исчерпана, next()
// возвращает null — автоматического пересмешивания больше нет.
// Начать новый круг можно только явно, через reset().

/**
 * Создаёт колоду из элементов.
 * @template T
 * @param {T[]} items непустой массив элементов
 * @returns {{ next(): T | null, remaining(): number, isExhausted(): boolean, reset(): void }}
 */
export function createDeck(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("createDeck: ожидается непустой массив");
  }

  let bag = [];

  function shuffle() {
    bag = [...items];
    // Тасование Фишера—Йетса.
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }

  shuffle();

  return {
    /** Следующий элемент или null, если колода исчерпана. */
    next() {
      if (bag.length === 0) return null;
      return bag.pop();
    },
    /** Сколько уникальных элементов осталось. */
    remaining() {
      return bag.length;
    },
    /** Колода исчерпана — все элементы выданы. */
    isExhausted() {
      return bag.length === 0;
    },
    /** Новый круг: перемешать полную колоду заново. */
    reset() {
      shuffle();
    }
  };
}
