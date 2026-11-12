 
        // 1. Генерация звезд на фоне
        const starsContainer = document.getElementById('stars');
        const starCount = 150;

        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            
            // Случайные размеры звезд (от 1 до 4px)
            const size = Math.random() * 3 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;

            // Случайная позиция
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            star.style.left = `${x}%`;
            star.style.top = `${y}%`;

            // Разная длительность анимации для мерцания
            const duration = Math.random() * 2 + 1;
            star.style.animationDuration = `${duration}s`;

            starsContainer.appendChild(star);
        }

        // 2. Данные о планетах
        const planets = [
            { name: "Меркурий", color: "#8a7c6d", fact: "Это самая близкая к Солнцу планета." },
            { name: "Венера", color: "#e6e2cf", fact: "На Венере день длиннее года." },
            { name: "Земля", color: "#2b6e9f", fact: "Единственная известная планета с жизнью." },
            { name: "Марс", color: "#a04e3d", fact: "Марс называют Красной планетой из-за оксида железа." },
            { name: "Юпитер", color: "#d4ac6f", fact: "Юпитер — самая большая планета Солнечной системы." },
            { name: "Сатурн", color: "#f4d9a8", fact: "Кольца Сатурна состоят из льда и камней." },
            { name: "Уран", color: "#7ab2c8", fact: "Уран вращается 'на боку' относительно своей орбиты." },
            { name: "Нептун", color: "#3a5f8b", fact: "На Нептуне дуют самые сильные ветры в Солнечной системе." }
        ];

        const container = document.querySelector('.planets-container');

        // 3. Создание карточек планет
        planets.forEach(planet => {
            const card = document.createElement('div');
            card.classList.add('planet-card');
            
            // Стилизация карточки (градиент под цвет планеты)
            card.style.background = `radial-gradient(circle at 30% 30%, ${planet.color}, #111)`;

            const nameSpan = document.createElement('span');
            nameSpan.classList.add('planet-name');
            nameSpan.textContent = planet.name;

            card.appendChild(nameSpan);
            container.appendChild(card);

            // 4. Обработка клика (открытие модального окна)
            card.addEventListener('click', () => {
                openModal(planet.name, planet.fact);
            });
        });

        // Функции для модального окна
        const modalOverlay = document.getElementById('modalOverlay');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');

        function openModal(title, content) {
            modalTitle.textContent = title;
            modalContent.textContent = content;
            modalOverlay.style.display = 'flex';
        }

        function closeModal() {
            modalOverlay.style.display = 'none';
        }

        // Закрытие по клику вне окна
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
   