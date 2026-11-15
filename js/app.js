const API_URL = 'https://jsonplaceholder.typicode.com/posts?userId=3';
const DB_NAME = 'NeighborhoodBoardDB';
const DB_VERSION = 1;
const STORE_NAME = 'posts'; // Варіант 18: сховище "posts"

// --------------------------------------------------------------------------
// ЕТАП 1: РОБОТА З LOCALSTORAGE (Кроки 2-4)
// --------------------------------------------------------------------------
function saveToLocalStorage(items) {
    try {
        localStorage.setItem('neighborhood_ads', JSON.stringify(items));
    } catch (error) {
        console.error('Помилка збереження в localStorage:', error);
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

        // Створення object store при першому відкритті бази (Крок 6)
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // Варіант 18: сховище "posts", keyPath "id"
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                console.log(`[IndexedDB] Сховище "${STORE_NAME}" успішно створено з keyPath "id"`);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Додавання або оновлення оголошення в IndexedDB (put)
async function putPostDB(post) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(post);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Отримання всіх оголошень з IndexedDB (getAll)
async function getAllPostsDB() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Видалення оголошення з IndexedDB за id (delete) - Варіант 18
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
        console.log(`[Міграція] Перенесення ${localData.length} записів із localStorage в IndexedDB...`);
        for (const item of localData) {
            await putPostDB(item);
        }
        localStorage.setItem('migrated_to_idb', 'true');
        console.log('[Міграція] Одноразову міграцію успішно завершено!');
    }
}

const AdCard = {
    name: 'AdCard',
    props: {
        id: { type: [Number, String], required: true },
        title: { type: String, required: true },
        category: { type: String, required: true },
        description: { type: String, required: true },
        daysAgo: { type: Number, required: true },
        badgeClass: { type: String, default: 'badge--services' }
    },
    emits: ['delete-ad'],
    data() {
        return {
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
        toggleDetails() {
            this.isExpanded = !this.isExpanded;
        },
        handleDelete() {
            // Передаємо подію видалення батьківському компоненту
            this.$emit('delete-ad', this.id);
        }
    },
    template: `
        <article :class="{ outdated: isOutdated }" :data-days-ago="daysAgo">
            <header>
                <h3>{{ title }}</h3>
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
                <!-- Видалення за варіантом 18 (особливо актуально для застарілих) -->
                <button @click="handleDelete" class="btn-delete-ad" title="Видалити це оголошення">
                    🗑️ Видалити
                </button>
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
        // Оновлення списку (читання безпосередньо з IndexedDB)
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

        // Видалення оголошення (CRUD: Delete) - Варіант 18
        async removeAd(id) {
            try {
                await deletePostDB(id);
                // Оновлюємо стан у пам'яті та синхронізуємо localStorage
                this.ads = this.ads.filter(ad => ad.id !== id);
                saveToLocalStorage(this.ads);
                console.log(`[IndexedDB] Оголошення id: ${id} успішно видалено!`);
            } catch (err) {
                console.error('[IndexedDB] Помилка видалення:', err);
                alert('Не вдалося видалити оголошення з бази даних.');
            }
        },

        // Додавання нового оголошення (CRUD: Create/Put) - Варіант 18
        async addNewAd(newAd) {
            try {
                const post = {
                    id: Date.now(),
                    ...newAd
                };
                await putPostDB(post);
                this.ads.unshift(post);
                saveToLocalStorage(this.ads);
                console.log('[IndexedDB] Нове оголошення додано в базу:', post);
            } catch (err) {
                console.error('[IndexedDB] Помилка додавання:', err);
            }
        },

        // Початкова ініціалізація даних при старті
        async initData() {
            this.isLoading = true;
            this.errorMessage = '';

            try {
                // 1. Спроба виконати одноразову міграцію з localStorage
                await migrateFromLocalStorage();

                // 2. Читаємо актуальні дані з IndexedDB
                let dbPosts = await getAllPostsDB();

                // 3. Якщо база зовсім порожня (перший запуск) - підвантажуємо з API і зберігаємо
                if (!dbPosts || dbPosts.length === 0) {
                    console.log('[IndexedDB] База порожня, завантаження початкових даних з API...');
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

                    // Зберігаємо завантажені дані в обидва сховища
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

    // Додаємо оголошення (викликається збереження в IndexedDB та localStorage!)
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
