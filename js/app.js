// ==========================================================================
// Практична робота №6: Основи JavaScript
// Варіант №18: Дошка сусідських оголошень
// ==========================================================================

// Крок 3: Перевірка підключення файлу
console.log('--- script.js успішно підключено ---');

// Крок 4: Оголошення даних варіанта (масив об'єктів оголошень)
// Поля: title — заголовок, category — категорія, daysAgo — днів тому
const ads = [
    {
        title: "Знайдено зв'язку ключів від квартири з синім брелоком біля другого під'їзду",
        category: "Бюро знахідок",
        daysAgo: 2
    },
    {
        title: "Допомога з терміновим ремонтом сантехніки та прочищенням труб",
        category: "Послуги",
        daysAgo: 16 // > 14 днів — буде «застаріле»
    },
    {
        title: "Віддам дитячий триколісний самокат у справному стані",
        category: "Віддам / Продам",
        daysAgo: 7
    },
    {
        title: "Загублено окуляри в чорній оправі на дитячому майданчику",
        category: "Бюро знахідок",
        daysAgo: 20 // > 14 днів — буде «застаріле»
    },
    {
        title: "Послуги електрика: заміна розеток, вимикачів, автоматів",
        category: "Послуги",
        daysAgo: 4
    }
];

const shorten = (text, n) => text.length > n ? text.slice(0, n) + '…' : text;

console.log('\nТест стрілкової функції shorten:');
console.log(shorten("Дуже довгий заголовок оголошення, який треба скоротити", 25));

function printAdsByCategory(adsList, targetCategory) {
    console.log(`\n=== Оголошення в категорії: "${targetCategory}" ===`);
    let count = 0;

    for (const ad of adsList) {
        if (ad.category === targetCategory) {
            count++;

            // Крок 6: Умова if/else (тернарний оператор) — перевірка daysAgo > 14
            const status = ad.daysAgo > 14 ? '⚠️ [Застаріле]' : '✅ [Актуальне]';

            // Застосовуємо стрілкову функцію shorten для скорочення заголовка до 40 символів
            const displayTitle = shorten(ad.title, 40);

            console.log(`${count}. ${status} (${ad.daysAgo} дн. тому) -> ${displayTitle}`);
        }
    }

    if (count === 0) {
        console.log(`У категорії "${targetCategory}" оголошень немає.`);
    }
}

// Виклики функції для кожної категорії з нашої дошки
printAdsByCategory(ads, "Бюро знахідок");
printAdsByCategory(ads, "Послуги");
printAdsByCategory(ads, "Віддам / Продам");