// UI-слой: единственное место, которое знает про DOM.
// Никакой логики выбора здесь нет — только перевод результата core
// в разметку и обработка действий пользователя.
//
// Модалка «Подробнее» показывает локальное краткое содержание (item.desc);
// постер догружается из Wikipedia (fetch выполняет data/wiki.js);
// при ошибке сети — остаётся только локальное описание.

/** Метка возрастного рейтинга: «12+» или null, если ограничений нет. */
function ageLabel(item) {
  return item.age ? `${item.age}+` : null;
}

export const ui = {
  els: {},

  init() {
    this.els.card = document.getElementById("card");
    this.els.status = document.getElementById("status");
    this.els.categoryLabel = document.getElementById("category-label");
    this.els.title = document.getElementById("title");
    this.els.meta = document.getElementById("meta");
    this.els.note = document.getElementById("note");
    this.els.remaining = document.getElementById("remaining");
    this.els.recent = document.getElementById("recent");
    this.els.reroll = document.getElementById("reroll");
    this.els.rerollLabel = document.getElementById("reroll-label");
    this.els.clearRecent = document.getElementById("clear-recent");
    this.els.genreSelect = document.getElementById("genre-filter");
    this.els.ratingSelect = document.getElementById("rating-filter");
    this.els.ageSelect = document.getElementById("age-filter");
    this.els.resetFilters = document.getElementById("reset-filters");

    // Модалка «Подробнее»
    this.els.modal = document.getElementById("modal-backdrop");
    this.els.modalBackdrop = document.getElementById("modal-backdrop");
    this.els.modalClose = document.getElementById("modal-close");
    this.els.modalPoster = document.getElementById("modal-poster");
    this.els.modalCategory = document.getElementById("modal-category");
    this.els.modalTitle = document.getElementById("modal-title");
    this.els.modalMeta = document.getElementById("modal-meta");
    this.els.modalDesc = document.getElementById("modal-desc");
    this.els.modalSpinner = document.getElementById("modal-spinner");

    this.currentItem = null;

    this.els.modalClose.addEventListener("click", () => this.hideModal());
    this.els.modalBackdrop.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) this.hideModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.hideModal();
    });
  },

  status(text) {
    this.els.status.textContent = text ?? "";
  },

  setLoading(isLoading) {
    this.els.card.classList.toggle("is-loading", isLoading);
    this.els.reroll.disabled = isLoading;
    if (isLoading) {
      this.status("Ищу вариант…");
      this.showPlaceholder();
    }
  },

  /** Плейсхолдер вместо карточки на время «рулетки». */
  showPlaceholder() {
    this.els.card.classList.remove("is-visible");
    this.els.categoryLabel.textContent = "";
    this.els.title.textContent = "…";
    this.els.meta.textContent = "";
    this.els.note.textContent = "";
    this.els.remaining.textContent = "";
    this.els.card.classList.add("is-visible");
  },

  renderGenreOptions(genres, selected) {
    this.els.genreSelect.innerHTML = "";
    this.els.genreSelect.appendChild(new Option("Любой жанр", ""));
    for (const g of genres) {
      this.els.genreSelect.appendChild(new Option(g, g));
    }
    this.els.genreSelect.value = selected ?? "";
  },

  /** Клик по карточке (или Enter/Space) открывает модалку. */
  bindCardClick(onOpenDetails) {
    this.onOpenDetails = onOpenDetails;
    this.els.card.classList.add("clickable");
    this.els.card.addEventListener("click", () => this._open());
    this.els.card.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target === this.els.card) {
        e.preventDefault();
        this._open();
      }
    });
  },

  _open() {
    if (this.els.card.classList.contains("is-loading")) return;
    if (this.onOpenDetails) this.onOpenDetails();
  },

  /** Заполняет модалку данными тайтла; wikiInfo можно подгрузить позже. */
  showModal(item, categoryLabel, wikiTitle, getWikiInfo) {
    this.currentItem = { item, categoryLabel, wikiTitle, getWikiInfo };

    this.els.modalCategory.textContent = categoryLabel;
    this.els.modalTitle.textContent = item.title;
    this.els.modalMeta.textContent =
      [item.year, item.genre, ageLabel(item), item.rating != null ? `★ ${item.rating}` : null]
        .filter(Boolean)
        .join("  ·  ");
    this.els.modalDesc.textContent = item.desc ?? item.note;
    this.els.modalPoster.classList.add("hidden");
    this.els.modalSpinner.classList.add("hidden");
    this.els.modal.classList.add("open");
    document.body.style.overflow = "hidden";

    this.loadWiki(wikiTitle);
  },

  /** Догружает постер из Википедии; описание всегда локальное (item.desc). */
  async loadWiki(wikiTitle) {
    if (!wikiTitle || !this.currentItem || this.currentItem.wikiTitle !== wikiTitle) return;
    const token = wikiTitle;
    this.els.modalSpinner.classList.remove("hidden");

    try {
      const poster = await this.currentItem.getWikiInfo(wikiTitle);
      if (this.currentItem?.wikiTitle !== token) return; // открыли другой тайтл
      this.els.modalSpinner.classList.add("hidden");
      if (poster) {
        this.els.modalPoster.src = poster;
        this.els.modalPoster.classList.remove("hidden");
      }
    } catch {
      if (this.currentItem?.wikiTitle !== token) return;
      this.els.modalSpinner.classList.add("hidden");
      // Оставляем локальные desc/poster как есть.
    }
  },

  hideModal() {
    this.els.modal.classList.remove("open");
    document.body.style.overflow = "";
    this.currentItem = null;
  },

  render(rec, remaining) {
    const labels = { movies: "Фильм", series: "Сериал", games: "Игра" };
    this.els.categoryLabel.textContent = labels[rec.category] ?? rec.category;
    this.els.title.textContent = rec.item.title;
    this.els.meta.textContent =
      [rec.item.year, rec.item.genre, ageLabel(rec.item), rec.item.rating != null ? `★ ${rec.item.rating}` : null]
        .filter(Boolean)
        .join("  ·  ");
    this.els.note.textContent = rec.item.note;
    if (rec.item.note && rec.item.note.length > 80) {
      this.els.note.title = rec.item.note;
    }
    this.els.remaining.textContent = `Ещё ${remaining} без повторов`;
    this.status("Готово! Клик по карточке — подробнее");
    this.reveal();
  },

  renderEmpty(rec) {
    const labels = { movies: "фильмов", series: "сериалов", games: "игр" };
    if (rec.reason === "exhausted") {
      this.els.categoryLabel.textContent = "Категория пройдена";
      this.els.title.textContent = `Все ${labels[rec.category] ?? "позиции"} уже показаны 🎉`;
      this.els.meta.textContent = "Ни один тайтл не повторился — так и задумано";
      this.els.note.textContent = "Выбери другую категорию, нажми «Что угодно» или начни новый круг.";
    } else {
      this.els.categoryLabel.textContent = "Ничего не найдено";
      this.els.title.textContent = "Под фильтры ничего не подошло";
      this.els.meta.textContent = `В категории «${labels[rec.category] ?? rec.category}» нет подходящих вариантов`;
      this.els.note.textContent = "Попробуй ослабить фильтры.";
    }
    this.els.remaining.textContent = "";
    this.status("");
    this.reveal();
  },

  renderExhausted() {
    this.els.categoryLabel.textContent = "Всё просмотрено";
    this.els.title.textContent = "Весь каталог без единого повтора 🎉";
    this.els.meta.textContent = "Каждый фильм, сериал и игра показали себя один раз";
    this.els.note.textContent = "Хочешь пройти круг заново — нажми кнопку ниже.";
    this.els.remaining.textContent = "";
    this.status("");
    this.els.rerollLabel.textContent = "Начать новый круг";
    this.reveal();
  },

  resetRerollLabel() {
    this.els.rerollLabel.textContent = "Что угодно";
  },

  /** Показ карточки с анимацией: сброс и следующий кадр — плавное появление. */
  reveal() {
    this.els.card.classList.remove("is-visible");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.els.card.classList.add("is-visible"));
    });
  },

  renderRecent(history) {
    this.els.recent.innerHTML = "";
    if (history.length === 0) {
      const li = document.createElement("li");
      li.className = "recent-empty";
      li.textContent = "Пока ничего не выпадало";
      this.els.recent.appendChild(li);
      return;
    }
    for (const entry of history) {
      const li = document.createElement("li");
      li.textContent = entry.categoryLabel
        ? `${entry.title} — ${entry.categoryLabel}`
        : entry.title;
      this.els.recent.appendChild(li);
    }
  },

  clear() {
    this.status("");
  }
};
