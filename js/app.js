// ==========================================================================
// Комп'ютерний практикум №8: Обробка подій та форми, клієнтська валідація
// ==========================================================================

// Масив даних оголошень
const ads = [
    {
        title: "Знайдено ключі біля 2-го під'їзду",
        description: "Знайшов зв'язку ключів від квартири на лавці. Звертайтеся в 45 квартиру.",
        category: "Бюро знахідок",
        badgeClass: "badge--lost-found",
        daysAgo: 2
    },
    {
        title: "Допомога з ремонтом сантехніки",
        description: "Сусід з 12 квартири. Можу допомогти замінити змішувач або прочистити труби у вихідні.",
        category: "Послуги",
        badgeClass: "badge--services",
        daysAgo: 16 // > 14 днів -> застаріле
    },
    {
        title: "Віддам дитячий самокат",
        description: "Справний, дитина виросла. Самовивіз, 3 поверх.",
        category: "Віддам / Продам",
        badgeClass: "badge--sales",
        daysAgo: 7
    },
    {
        title: "Загублено чорний гаманець біля пошти",
        description: "Всередині були документи на ім'я Сергій. Прошу повернути за винагороду.",
        category: "Бюро знахідок",
        badgeClass: "badge--lost-found",
        daysAgo: 22 // > 14 днів -> застаріле
    },
    {
        title: "Послуги репетитора з англійської",
        description: "Розмовна англійська для школярів та дорослих, підготовка до іспитів онлайн.",
        category: "Послуги",
        badgeClass: "badge--services",
        daysAgo: 4
    }
];

// Селектори ключових елементів DOM
const listContainer = document.querySelector('#listings-list');
const countElement = document.querySelector('#listings-count');
const staticPlaceholder = document.querySelector('#static-placeholder');

// Видалення статичної заглушки з практикуму 7
if (staticPlaceholder) {
    staticPlaceholder.remove();
}

// --------------------------------------------------------------------------
// ФУНКЦІЯ РЕНДЕРИНГУ КАРТОК (Практикум №7)
// --------------------------------------------------------------------------
function renderAds(adsList) {
    listContainer.innerHTML = '';
    let activeCount = 0;

    for (const ad of adsList) {
        const card = document.createElement('article');
        card.dataset.daysAgo = ad.daysAgo;

        if (ad.daysAgo > 14) {
            card.classList.add('outdated');
        } else {
            activeCount++;
        }

        // Шапка картки
        const cardHeader = document.createElement('header');
        const title = document.createElement('h3');
        title.textContent = ad.title;

        const time = document.createElement('time');
        time.textContent = ad.daysAgo === 0 ? 'Сьогодні' : `${ad.daysAgo} дн. тому`;

        cardHeader.append(title, time);

        // Текст опису
        const desc = document.createElement('p');
        desc.textContent = ad.description;

        // Підвал з кольоровим бейджем
        const cardFooter = document.createElement('footer');
        const badge = document.createElement('span');
        badge.classList.add('badge', ad.badgeClass);
        badge.textContent = ad.category;
        cardFooter.append(badge);

        card.append(cardHeader, desc, cardFooter);
        listContainer.append(card);
    }

    if (countElement) {
        countElement.textContent = `Активних оголошень: ${activeCount} з ${adsList.length}`;
    }
}

// Початковий рендеринг при завантаженні сторінки
renderAds(ads);

// ==========================================================================
// ПРАКТИЧНА РОБОТА №8: ОБРОБКА ПОДІЙ ТА ВАЛІДАЦІЯ (Варіант №18)
// ==========================================================================

// Селектори елементів форми
const toggleFormBtn = document.querySelector('#toggle-form-btn');
const addAdSection = document.querySelector('#add-ad-section');
const addAdForm = document.querySelector('#add-ad-form');
const descTextarea = document.querySelector('#ad-description');
const charsLeftSpan = document.querySelector('#chars-left');
const charCounterDiv = document.querySelector('#char-counter');

// 1. ПОДІЯ CLICK (Варіант 18: показ/приховування форми без окремої сторінки)
toggleFormBtn.addEventListener('click', (event) => {
    event.preventDefault(); // Запобігаємо переходу за якірним посиланням #add-ad
    addAdSection.classList.toggle('visible');

    // Якщо форма відкрилася — автоматично фокусуємося на першому полі
    if (addAdSection.classList.contains('visible')) {
        document.querySelector('#ad-title').focus();
    }
});

// 2. ПОДІЯ INPUT (Варіант 18: лічильник залишкових символів для description)
const MAX_CHARS = 200;

descTextarea.addEventListener('input', () => {
    const currentLength = descTextarea.value.length;
    const remaining = MAX_CHARS - currentLength;

    charsLeftSpan.textContent = remaining;

    // Якщо залишилося менше 20 символів — підсвічуємо червоним кольором
    if (remaining <= 20) {
        charCounterDiv.classList.add('near-limit');
    } else {
        charCounterDiv.classList.remove('near-limit');
    }
});

// 3. ПОДІЯ SUBMIT (Варіант 18: обробка форми без перезавантаження)
addAdForm.addEventListener('submit', (event) => {
    // Крок 3: Скасування стандартного перезавантаження сторінки браузером
    event.preventDefault();

    // Крок 4: Зчитування та очищення значень полів
    const titleValue = document.querySelector('#ad-title').value.trim();
    const categorySelect = document.querySelector('#ad-category');
    const categoryValue = categorySelect.value;
    const descValue = descTextarea.value.trim();

    // Співставлення технічного значення категорії з гарною назвою та класом бейджа
    let categoryName = "Послуги";
    let badgeClass = "badge--services";

    if (categoryValue === "lost-found") {
        categoryName = "Бюро знахідок";
        badgeClass = "badge--lost-found";
    } else if (categoryValue === "sales") {
        categoryName = "Віддам / Продам";
        badgeClass = "badge--sales";
    }

    // Крок 5: Формування нового об'єкта оголошення (daysAgo: 0 для нового запису)
    const newAd = {
        title: titleValue,
        description: descValue,
        category: categoryName,
        badgeClass: badgeClass,
        daysAgo: 0 // Свіже оголошення, щойно створене
    };

    // Додаємо нове оголошення на початок масиву
    ads.unshift(newAd);

    // Крок 6: Перемальовуємо список оголошень за допомогою функції рендерингу
    renderAds(ads);

    // Крок 7: Очищення полів форми та скидання лічильника символів
    addAdForm.reset();
    charsLeftSpan.textContent = MAX_CHARS;
    charCounterDiv.classList.remove('near-limit');

    // Ховаємо форму після успішного додавання та сповіщаємо в консоль
    addAdSection.classList.remove('visible');
    console.log('Нове оголошення успішно додано без перезавантаження сторінки:', newAd);
});