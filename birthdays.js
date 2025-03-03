const puppeteer = require('puppeteer');

async function fetchBirthdaysWithPuppeteer(url) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Najpierw rozwijamy "See More", jeśli istnieje
    const seeMoreSelector = '.events .event[data-ajax-url]';
    if (await page.$(seeMoreSelector)) {
        console.log("🔄 Kliknięcie w 'See More'...");
        await page.evaluate(selector => {
            document.querySelector(selector)?.click();
        }, seeMoreSelector);

        await page.waitForFunction(() => {
            return document.querySelectorAll('.events .event').length > 5;
        });
        console.log("✅ Rozwinięto 'See More'!");
    }

    // Powolne przewijanie w dół
    async function slowScrollToBottom() {
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 50;
                const scrollInterval = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight) {
                        clearInterval(scrollInterval);
                        resolve();
                    }
                }, 100);
            });
        });
    }

    console.log("🔄 Powolne przewijanie strony...");
    await slowScrollToBottom();
    await new Promise(resolve => setTimeout(resolve, 3000)); // Dłuższe czekanie na zdjęcia
    console.log("✅ Wszystkie zdjęcia powinny być załadowane!");

    // Pobranie pełnej listy urodzin
    let birthdays = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.events .event')).map(event => {
            const name = event.querySelector('h5 a')?.innerText.trim();
            const group = event.querySelector('strong')?.innerText.trim();
            const age = event.querySelector('aside span')?.innerText.trim();
            const imageUrl = event.querySelector('a.bg')?.style.backgroundImage.match(/url\("(.+?)"\)/)?.[1];

            return name && age ? {
                name,
                group,
                age,
                imageUrl: imageUrl ? `https://kpopping.com${imageUrl}` : null
            } : null;
        }).filter(Boolean);
    });

    await browser.close();

    // Odwracamy kolejność pobranych idoli, aby ostatni był wysyłany jako pierwszy
    return birthdays.reverse();
}

async function checkBirthdays(client) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const month = today.getUTCMonth() + 1;
    const day = today.getUTCDate() + 1;

    const url = `https://kpopping.com/calendar/detailed/${month}-${day}`;
    console.log(`📅 Pobieranie urodzin dla: ${month}-${day}`);

    const birthdays = await fetchBirthdaysWithPuppeteer(url);

    if (birthdays.length > 0) {
        const channel = client.channels.cache.find(ch => ch.name === '🎂│urodziny-idoli');
        if (channel) {
            // Teraz używamy normalnej pętli forEach(), bo lista już jest odwrócona
            birthdays.forEach(async (idol) => {
                const embed = {
                    title: `🎂 ${idol.name} - ${idol.age} lat`,
                    description: `Grupa: **${idol.group}**`,
                    color: 0xffcc00,
                    image: { url: idol.imageUrl || "https://via.placeholder.com/150" }, // Jeśli brak zdjęcia, placeholder
                };

                await channel.send({ embeds: [embed] });
            });
        } else {
            console.error('⚠️ Kanał #🎂│urodziny-idoli nie został znaleziony!');
        }
    } else {
        console.log('ℹ️ Dziś żaden idol nie obchodzi urodzin.');
    }
}

// Eksportowanie funkcji do głównego pliku
module.exports = { checkBirthdays };
