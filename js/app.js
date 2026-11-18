// ==========================================================================
// Комп'ютерний практикум №12: Анімація та інтерактивні елементи
// Варіант №18: Дошка сусідських оголошень (CSS slide-down + fade-in, badge--new)
// Студент: Музиченко А.А., група ІП-55
// ==========================================================================

const API_URL = 'https://jsonplaceholder.typicode.com/posts?userId=3';
const DB_NAME = 'NeighborhoodBoardDB';
const DB_VERSION = 1;
const STORE_NAME = 'posts';

// --------------------------------------------------------------------------
// LOCALSTORAGE ТА INDEXEDDB (Практикум №11)
// --------------------------------------------------------------------------
function saveToLocalStorage(items) {
    try {
        localStorage.setItem('neighborhood_ads', JSON.stringify(items));
    } catch (error) {
        console.error('Помилка запису в localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const raw = localStorage.getItem('neighborhood_ads');
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error('Пошкоджені дані в localStorage:', error);
        return [];
    }
}

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function putPostDB(post) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(post);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function getAllPostsDB() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deletePostDB(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function migrateFromLocalStorage() {
    const isMigrated = localStorage.getItem('migrated_to_idb');
    if (isMigrated) return;

    const localData = loadFromLocalStorage();
    if (localData && localData.length > 0) {
        for (const item of localData) {
            await putPostDB(item);
        }
        localStorage.setItem('migrated_to_idb', 'true');
    }
}

// --------------------------------------------------------------------------
// КОМПОНЕНТ AdCard (З АНІМАЦІЄЮ ПОЯВИ ТА ЗГАСАЮЧИМ БЕЙДЖЕМ "НОВЕ" - Варіант 18)
// --------------------------------------------------------------------------
const AdCard = {
    name: 'AdCard',
    props: {
        id: { type: [Number, String], required: true },
        title: { type: String, required: true },
        category: { type: String, required: true },
        description: { type: String, required: true },
        daysAgo: { type: Number, required: true },
        badgeClass: { type: String, default: 'badge--services' },
        initialIsNew: { type: Boolean, default: false } // Чи нове оголошення
    },
    emits: ['delete-ad'],
    data() {
        return {
            isExpanded: false,
            // Локальний прапорець для позначки «Нове»
            isNewBadgeVisible: this.initialIsNew
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
    mounted() {
        // Крок 6 і Варіант 18: позначка «Нове» плавно згасає та зникає через 4.5 секунди
        if (this.isNewBadgeVisible) {
            setTimeout(() => {
                this.isNewBadgeVisible = false;
            }, 4500);
        }
    },
    methods: {
        toggleDetails() {
            this.isExpanded = !this.isExpanded;
        },
        handleDelete() {
            this.$emit('delete-ad', this.id);
        }
    },
    template: `
        <article :class="{ outdated: isOutdated, 'card--new': initialIsNew }" :data-days-ago="daysAgo">
            <header>
                <div class="card-title-row">
                    <h3>{{ title }}</h3>
                    <!-- Позначка «Нове» за варіантом 18 (пульсує і плавно згасає) -->
                    <span v-if="isNewBadgeVisible" class="badge--new">🔥 Нове</span>
                </div>
                <time>{{ timeLabel }}</time>
            </header>

            <button @click="toggleDetails" class="btn-toggle-details" type="button">
                {{ isExpanded ? '▲ Згорнути опис' : '▼ Показати деталі' }}
            </button>

            <div v-if="isExpanded" class="card-details">
                <p>{{ description }}</p>
            </div>

            <footer>
                <span class="badge" :class="badgeClass">{{ category }}</span>
                <button @click="handleDelete" class="btn-delete-ad" title="Видалити це оголошення">
                    🗑️ Видалити
                </button>
            </footer>
        </article>
    `
};

// --------------------------------------------------------------------------
// КОРЕНЕВИЙ VUE-ДОДАТОК
// --------------------------------------------------------------------------
const app = Vue.createApp({
    components: {
        AdCard
    },
    data() {
        return {
            ads: [],
            isLoading: false,
            errorMessage: ''
        };
    },
    computed: {
        activeCountText() {
            if (this.isLoading) return 'Завантаження...';
            if (this.errorMessage) return 'Помилка сховища';
            const active = this.ads.filter(ad => ad.daysAgo <= 14).length;
            return `Активних оголошень: ${active} з ${this.ads.length}`;
        }
    },
    methods: {
        async refreshData() {
            this.isLoading = true;
            this.errorMessage = '';
            try {
                this.ads = await getAllPostsDB();
            } catch (err) {
                console.error('[IndexedDB] Помилка читання:', err);
                this.errorMessage = '⚠️ Помилка зчитування даних з локальної бази IndexedDB.';
            } finally {
                this.isLoading = false;
            }
        },

        async removeAd(id) {
            try {
                await deletePostDB(id);
                this.ads = this.ads.filter(ad => ad.id !== id);
                saveToLocalStorage(this.ads);
                console.log(`[IndexedDB] Оголошення id: ${id} успішно видалено!`);
            } catch (err) {
                console.error('[IndexedDB] Помилка видалення:', err);
                alert('Не вдалося видалити оголошення з бази даних.');
            }
        },

        // Додавання нового оголошення з анімацією появи (Варіант 18)
        async addNewAd(newAdData) {
            try {
                const post = {
                    id: Date.now(),
                    ...newAdData,
                    isNew: true // Вмикаємо анімацію slide-down та бейдж «Нове»
                };

                // Зберігаємо в IndexedDB (без прапорця isNew для чистоти бази)
                const dbCopy = { ...post };
                delete dbCopy.isNew;
                await putPostDB(dbCopy);

                // Додаємо на початок масиву для реактивної анімації появи вгорі стрічки
                this.ads.unshift(post);
                saveToLocalStorage(this.ads);

                console.log('[Анімація] Нове оголошення додано вгору стрічки з анімацією slideDownFadeIn:', post);
            } catch (err) {
                console.error('[IndexedDB] Помилка додавання:', err);
            }
        },

        async initData() {
            this.isLoading = true;
            this.errorMessage = '';

            try {
                await migrateFromLocalStorage();
                let dbPosts = await getAllPostsDB();

                if (!dbPosts || dbPosts.length === 0) {
                    const response = await fetch(API_URL);
                    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                    const remotePosts = await response.json();

                    const categories = [
                        { name: "Послуги", badge: "badge--services" },
                        { name: "Бюро знахідок", badge: "badge--lost-found" },
                        { name: "Віддам / Продам", badge: "badge--sales" }
                    ];

                    dbPosts = remotePosts.map((post, index) => {
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

                    saveToLocalStorage(dbPosts);
                    for (const post of dbPosts) {
                        await putPostDB(post);
                    }
                }

                this.ads = dbPosts;
            } catch (err) {
                console.error('[Ініціалізація] Помилка:', err);
                this.errorMessage = '⚠️ Оголошення тимчасово недоступні. Помилка сховища або мережі.';
            } finally {
                this.isLoading = false;
            }
        }
    },
    mounted() {
        this.initData();
    }
});

const vm = app.mount('#app');

// ==========================================================================
// ФОРМА ДОДАВАННЯ ОГОЛОШЕННЯ (З власною валідацією)
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

toggleFormBtn.addEventListener('click', (event) => {
    event.preventDefault();
    addAdSection.classList.toggle('visible');
    if (addAdSection.classList.contains('visible')) {
        titleInput.focus();
    }
});

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

    // Додаємо нове оголошення (запускає анімацію появи та бейдж "Нове"!)
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
});