
// Крок 3: URL ендпоінта для отримання даних (Варіант 18)
const API_URL = 'https://jsonplaceholder.typicode.com/posts?userId=3';

// Масив оголошень у пам'яті (заповнюватиметься з API та форми)
let ads = [];

// Селектори DOM
const listContainer = document.querySelector('#listings-list');
const countElement = document.querySelector('#listings-count');
const statusMessage = document.querySelector('#status-message');
const reloadBtn = document.querySelector('#reload-btn');

// --------------------------------------------------------------------------
// ФУНКЦІЯ РЕНДЕРИНГУ КАРТОК У DOM (з Практикуму №7)
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

        // Підвал з бейджем категорії
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

// --------------------------------------------------------------------------
// АСИНХРОННЕ ЗАВАНТАЖЕННЯ ДАНИХ З API (Практикум №9)
// --------------------------------------------------------------------------
async function loadAdsFromAPI() {
    // Крок 7: Візуальний стан завантаження
    statusMessage.textContent = '⏳ Завантаження свіжих оголошень з сервера...';
    statusMessage.className = 'status-message loading';
    reloadBtn.disabled = true;

    try {
        // Крок 3: Виконання HTTP-запиту через fetch
        const response = await fetch(API_URL);

        // Крок 4: Перевірка HTTP-статусу (200-299)
        if (!response.ok) {
            throw new Error(`Сервер відповів зі статусом помилки: ${response.status}`);
        }

        // Крок 5: Розбір відповіді як JSON
        const remotePosts = await response.json();
        console.log('Дані успішно отримано від API:', remotePosts);

        // Крок 6: Адаптація отриманих полів (title, body) під формат нашого застосунку
        const categories = [
            { name: "Послуги", badge: "badge--services" },
            { name: "Бюро знахідок", badge: "badge--lost-found" },
            { name: "Віддам / Продам", badge: "badge--sales" }
        ];

        ads = remotePosts.map((post, index) => {
            const cat = categories[index % categories.length];
            return {
                title: post.title.slice(0, 50), // Заголовок з API
                description: post.body,          // Опис (body з API)
                category: cat.name,
                badgeClass: cat.badge,
                daysAgo: (index * 4) % 25        // Різні дати для демонстрації застарілих
            };
        });

        // Виводимо отримані дані в DOM
        renderAds(ads);

        // При успішному завантаженні приховуємо блок повідомлення
        statusMessage.className = 'status-message';
        statusMessage.textContent = '';

    } catch (error) {
        // Крок 8: Коректна обробка помилок (вимога варіанта 18)
        console.error('Помилка при завантаженні оголошень з API:', error);

        // Виводимо зрозуміле повідомлення за завданням варіанта 18
        statusMessage.textContent = '⚠️ Оголошення тимчасово недоступні. Перевірте з\'єднання з мережею.';
        statusMessage.className = 'status-message error';

        listContainer.innerHTML = '';
        if (countElement) {
            countElement.textContent = 'Помилка мережі';
        }
    } finally {
        // Крок 7: Вимикаємо стан блокування кнопки незалежно від результату
        reloadBtn.disabled = false;
    }
}

// Крок 10: Повторний виклик loadAdsFromAPI за кліком на кнопку «Оновити»
reloadBtn.addEventListener('click', () => {
    loadAdsFromAPI();
});

// Початковий запуск завантаження при старті застосунку
loadAdsFromAPI();

// ==========================================================================
// ФОРМА ДОДАВАННЯ ОГОЛОШЕННЯ ТА ВЛАСНА ВАЛІДАЦІЯ (Виправлення зауважень)
// ==========================================================================
const toggleFormBtn = document.querySelector('#toggle-form-btn');
const addAdSection = document.querySelector('#add-ad-section');
const addAdForm = document.querySelector('#add-ad-form');

const titleInput = document.querySelector('#ad-title');
const categorySelect = document.querySelector('#ad-category');
const descTextarea = document.querySelector('#ad-description');

const titleError = document.querySelector('#title-error');
const categoryError = document.querySelector('#category-error');
const descError = document.querySelector('#desc-error');

const charsLeftSpan = document.querySelector('#chars-left');
const charCounterDiv = document.querySelector('#char-counter');

// Відкриття / закриття форми
toggleFormBtn.addEventListener('click', (event) => {
    event.preventDefault();
    addAdSection.classList.toggle('visible');
    if (addAdSection.classList.contains('visible')) {
        titleInput.focus();
    }
});

// Динамічний лічильник символів
const MAX_CHARS = 200;
descTextarea.addEventListener('input', () => {
    const currentLength = descTextarea.value.length;
    const remaining = MAX_CHARS - currentLength;
    charsLeftSpan.textContent = remaining;

    if (remaining <= 20) {
        charCounterDiv.classList.add('near-limit');
    } else {
        charCounterDiv.classList.remove('near-limit');
    }

    if (descTextarea.value.trim() !== '') {
        descError.textContent = '';
        descTextarea.classList.remove('input-error');
    }
});

titleInput.addEventListener('input', () => {
    if (titleInput.value.trim() !== '') {
        titleError.textContent = '';
        titleInput.classList.remove('input-error');
    }
});

categorySelect.addEventListener('change', () => {
    if (categorySelect.value !== '') {
        categoryError.textContent = '';
        categorySelect.classList.remove('input-error');
    }
});

// Відправка форми з ВЛАСНОЮ ВАЛІДАЦІЄЮ (захист від пробілів)
addAdForm.addEventListener('submit', (event) => {
    event.preventDefault();

    let isValid = true;
    const titleVal = titleInput.value.trim();
    const categoryVal = categorySelect.value;
    const descVal = descTextarea.value.trim();

    // 1. Власна валідація заголовка: не порожній, не з самих пробілів, мін. 3 символи
    if (titleVal === '') {
        titleError.textContent = '⚠️ Помилка: заголовок не може бути порожнім або містити лише пробіли!';
        titleInput.classList.add('input-error');
        isValid = false;
    } else if (titleVal.length < 3) {
        titleError.textContent = '⚠️ Заголовок має містити щонайменше 3 символи!';
        titleInput.classList.add('input-error');
        isValid = false;
    } else {
        titleError.textContent = '';
        titleInput.classList.remove('input-error');
    }

    // 2. Власна валідація категорії
    if (!categoryVal) {
        categoryError.textContent = '⚠️ Будь ласка, оберіть категорію зі списку!';
        categorySelect.classList.add('input-error');
        isValid = false;
    } else {
        categoryError.textContent = '';
        categorySelect.classList.remove('input-error');
    }

    // 3. Власна валідація опису: не з самих пробілів
    if (descVal === '') {
        descError.textContent = '⚠️ Помилка: опис не може бути порожнім або складатись з пробілів!';
        descTextarea.classList.add('input-error');
        isValid = false;
    } else if (descVal.length < 5) {
        descError.textContent = '⚠️ Опис занадто короткий (мінімум 5 символів)!';
        descTextarea.classList.add('input-error');
        isValid = false;
    } else {
        descError.textContent = '';
        descTextarea.classList.remove('input-error');
    }

    if (!isValid) return; // Зупиняємо відправку, якщо валідацію не пройдено

    // Формування нового об'єкта при успішній валідації
    let categoryName = "Послуги";
    let badgeClass = "badge--services";

    if (categoryVal === "lost-found") {
        categoryName = "Бюро знахідок";
        badgeClass = "badge--lost-found";
    } else if (categoryVal === "sales") {
        categoryName = "Віддам / Продам";
        badgeClass = "badge--sales";
    }

    const newAd = {
        title: titleVal,
        description: descVal,
        category: categoryName,
        badgeClass: badgeClass,
        daysAgo: 0
    };

    ads.unshift(newAd);
    renderAds(ads);

    addAdForm.reset();
    charsLeftSpan.textContent = MAX_CHARS;
    charCounterDiv.classList.remove('near-limit');
    addAdSection.classList.remove('visible');
    console.log('Нове оголошення успішно пройшло власну валідацію та додане:', newAd);
});