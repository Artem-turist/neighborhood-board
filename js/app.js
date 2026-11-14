const API_URL = 'https://jsonplaceholder.typicode.com/posts?userId=3';

const AdCard = {
    name: 'AdCard',
    props: {
        title: { type: String, required: true },
        category: { type: String, required: true },
        description: { type: String, required: true },
        daysAgo: { type: Number, required: true },
        badgeClass: { type: String, default: 'badge--services' }
    },
    data() {
        return {
            // Локальний реактивний стан компонента (розгортання/згортання опису)
            isExpanded: false
        };
    },
    computed: {
        isOutdated() {
            return this.daysAgo > 14;
        },
        timeLabel() {
            return this.daysAgo === 0 ? 'Сьогодні' : `${this.daysAgo} дн. тому`;
        }
    },
    methods: {
        // Інтерактивна подія варіанта 18: перемикання деталей оголошення
        toggleDetails() {
            this.isExpanded = !this.isExpanded;
        }
    },
    template: `
        <article :class="{ outdated: isOutdated }" :data-days-ago="daysAgo">
            <header>
                <h3>{{ title }}</h3>
                <time>{{ timeLabel }}</time>
            </header>

            <!-- Кнопка-спойлер для розгортання/згортання деталей (Варіант 18) -->
            <button @click="toggleDetails" class="btn-toggle-details" type="button">
                {{ isExpanded ? '▲ Згорнути опис' : '▼ Показати деталі' }}
            </button>

            <!-- Опис відображається декларативно завдяки v-if і стану isExpanded -->
            <div v-if="isExpanded" class="card-details">
                <p>{{ description }}</p>
            </div>

            <footer>
                <span class="badge" :class="badgeClass">{{ category }}</span>
            </footer>
        </article>
    `
};


const app = Vue.createApp({
    components: {
        AdCard
    },
    data() {
        return {
            // Реактивний масив оголошень у стані компонента
            ads: [],
            isLoading: false,
            errorMessage: ''
        };
    },
    computed: {
        // Похідне значення: автоматичний підрахунок кількості активних оголошень
        activeCountText() {
            if (this.isLoading) return 'Завантаження...';
            if (this.errorMessage) return 'Помилка мережі';
            const active = this.ads.filter(ad => ad.daysAgo <= 14).length;
            return `Активних оголошень: ${active} з ${this.ads.length}`;
        }
    },
    methods: {
        // Асинхронне отримання даних з API (Практикум №9)
        async loadAdsFromAPI() {
            this.isLoading = true;
            this.errorMessage = '';

            try {
                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error(`Сервер відповів зі статусом: ${response.status}`);
                }

                const remotePosts = await response.json();

                const categories = [
                    { name: "Послуги", badge: "badge--services" },
                    { name: "Бюро знахідок", badge: "badge--lost-found" },
                    { name: "Віддам / Продам", badge: "badge--sales" }
                ];

                // Оновлюємо реактивний масив
                this.ads = remotePosts.map((post, index) => {
                    const cat = categories[index % categories.length];
                    return {
                        id: post.id,
                        title: post.title.slice(0, 50),
                        description: post.body,
                        category: cat.name,
                        badgeClass: cat.badge,
                        daysAgo: (index * 4) % 25
                    };
                });
            } catch (error) {
                console.error('Помилка завантаження з API:', error);
                this.errorMessage = '⚠️ Оголошення тимчасово недоступні. Перевірте з\'єднання з мережею.';
            } finally {
                this.isLoading = false;
            }
        },

        // Метод для додавання нового оголошення з форми у реактивний стан
        addNewAd(newAd) {
            this.ads.unshift({
                id: Date.now(),
                ...newAd
            });
        }
    },
    mounted() {
        // Автоматичне завантаження даних при монтуванні додатка
        this.loadAdsFromAPI();
    }
});

// Монтуємо додаток у контейнер #app
const vm = app.mount('#app');


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

// Лічильник залишку символів
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

// Відправка форми: валідація та передача об'єкта в реактивний стан Vue
addAdForm.addEventListener('submit', (event) => {
    event.preventDefault();

    let isValid = true;
    const titleVal = titleInput.value.trim();
    const categoryVal = categorySelect.value;
    const descVal = descTextarea.value.trim();

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

    if (!categoryVal) {
        categoryError.textContent = '⚠️ Будь ласка, оберіть категорію зі списку!';
        categorySelect.classList.add('input-error');
        isValid = false;
    } else {
        categoryError.textContent = '';
        categorySelect.classList.remove('input-error');
    }

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

    if (!isValid) return;

    let categoryName = "Послуги";
    let badgeClass = "badge--services";

    if (categoryVal === "lost-found") {
        categoryName = "Бюро знахідок";
        badgeClass = "badge--lost-found";
    } else if (categoryVal === "sales") {
        categoryName = "Віддам / Продам";
        badgeClass = "badge--sales";
    }

    // Додаємо нове оголошення прямо в реактивний стан Vue-додатка!
    vm.addNewAd({
        title: titleVal,
        description: descVal,
        category: categoryName,
        badgeClass: badgeClass,
        daysAgo: 0
    });

    addAdForm.reset();
    charsLeftSpan.textContent = MAX_CHARS;
    charCounterDiv.classList.remove('near-limit');
    addAdSection.classList.remove('visible');
    console.log('Нове оголошення передано в реактивний стан Vue 3!');
});