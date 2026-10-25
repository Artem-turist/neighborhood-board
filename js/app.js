// ==========================================================================
// Комп'ютерний практикум №7: Маніпуляція DOM за допомогою JavaScript
// Варіант №18: Дошка сусідських оголошень
// Студент: Музиченко А.А., група ІП-55
// ==========================================================================

// Крок 4 (з практ. 6): Масив даних оголошень
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
        daysAgo: 16 // > 14 днів -> клас outdated
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
        daysAgo: 22 // > 14 днів -> клас outdated
    },
    {
        title: "Послуги репетитора з англійської",
        description: "Розмовна англійська для школярів та дорослих, підготовка до іспитів онлайн.",
        category: "Послуги",
        badgeClass: "badge--services",
        daysAgo: 4
    }
];

// Допоміжна стрілкова функція форматування тексту (з практикуму 6)
const shorten = (text, n) => text.length > n ? text.slice(0, n) + '…' : text;

// --------------------------------------------------------------------------
// КРОКИ ПРАКТИЧНОЇ РОБОТИ №7:
// --------------------------------------------------------------------------

// Крок 3: Вибір контейнера списку оголошень за селектором #listings-list
const listContainer = document.querySelector('#listings-list');

// Крок 9 (вибір): Елемент підсумку для відображення кількості активних оголошень
const countElement = document.querySelector('#listings-count');

// Крок 2: Програмне видалення статичного прикладу (заглушки) з розмітки
const staticPlaceholder = document.querySelector('#static-placeholder');
if (staticPlaceholder) {
    staticPlaceholder.remove();
    console.log('Статичний приклад успішно видалено з DOM через .remove()');
}

// Крок 4: Функція динамічного рендерингу карток оголошень
function renderAds(adsList) {
    // Очищуємо контейнер перед рендером
    listContainer.innerHTML = '';

    let activeCount = 0; // Лічильник активних оголошень

    // Проходимо по масиву оголошень циклом for...of
    for (const ad of adsList) {
        // Крок 5: Створення кореневого елемента картки <article>
        const card = document.createElement('article');

        // Крок 6: Встановлення data-атрибута data-days-ago
        card.dataset.daysAgo = ad.daysAgo;

        // Крок 6: Додавання класу за умовою варіанта: outdated, якщо daysAgo > 14
        if (ad.daysAgo > 14) {
            card.classList.add('outdated');
        } else {
            activeCount++; // Рахуємо тільки активні оголошення
        }

        // Створення внутрішніх елементів картки:
        // 1. Шапка картки (header, h3, time)
        const cardHeader = document.createElement('header');
        const title = document.createElement('h3');
        title.textContent = ad.title;

        const time = document.createElement('time');
        time.textContent = `${ad.daysAgo} дн. тому`;

        cardHeader.append(title, time);

        // 2. Текст опису (p)
        const desc = document.createElement('p');
        desc.textContent = ad.description;

        // 3. Підвал картки з кольоровим бейджем (footer, span.badge)
        const cardFooter = document.createElement('footer');
        const badge = document.createElement('span');
        badge.classList.add('badge', ad.badgeClass);
        badge.textContent = ad.category;
        cardFooter.append(badge);

        // Збираємо картку разом
        card.append(cardHeader, desc, cardFooter);

        // Крок 7: Додаємо готову картку в контейнер
        listContainer.append(card);
    }

    // Крок 9: Оновлення підсумкового елемента p#listings-count
    if (countElement) {
        countElement.textContent = `Активних оголошень: ${activeCount} з ${adsList.length}`;
    }
}

// Крок 8: Виклик функції рендерингу з реальним масивом даних
renderAds(ads);