require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const puppeteer = require('puppeteer');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const { startQuiz } = require('./quiz');
const { checkBirthdays } = require('./birthdays'); // Importowanie funkcji urodzin

client.once('ready', () => {
    console.log(`✅ Zalogowano jako ${client.user.tag}!`);

    setInterval(checkBirthdays, 24 * 60 * 60 * 1000); // Sprawdza codziennie
});






client.once('ready', async () => {
    const guild = client.guilds.cache.first();
    if (!guild) return console.log("Bot nie jest na żadnym serwerze!");

    let quizChannel = guild.channels.cache.find(channel => channel.name === "🧠│quiz");

    if (!quizChannel) {
        quizChannel = await guild.channels.create({
            name: "🧠│quiz",
            type: 0, // 0 oznacza kanał tekstowy
            permissionOverwrites: [
                {
                    id: guild.id,
                    allow: ['ViewChannel'],
                    deny: ['SendMessages'], // Opcjonalnie: zablokuj pisanie innym użytkownikom
                }
            ]
        });
        console.log(`Kanał #🧠│quiz utworzony!`);
    }
});

// Jeden listener `messageCreate`, zamiast wielu!
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content.toLowerCase();
    if (content === '!birthday') {
        // Sprawdzamy, czy użytkownik ma uprawnienia moderatora (lub administratora)
        if (!message.member.permissions.has('ManageMessages')) {
            return message.reply("❌ Tylko moderatorzy mogą używać tej komendy!");
        }

        checkBirthdays(client)
    }


    if (content === '!bias') {
        return message.reply('Kto jest Twoim biasem? 🥰');
    }



    if (content === '!ranking') {
        let scoresFile = 'quiz_scores.json';

        if (!fs.existsSync(scoresFile)) {
            return message.channel.send(`🏆 **Ranking Quizu K-pop** 🏆\nJeszcze nikt nie zdobył punktów!`);
        }

        let scores = JSON.parse(fs.readFileSync(scoresFile));
        let ranking = Object.entries(scores)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5) // Top 5 graczy
            .map(([id, score], index) => `#${index + 1} <@${id}> - ${score} pkt`)
            .join("\n");

        return message.channel.send(`🏆 **Ranking Quizu K-pop** 🏆\n${ranking}`);
    }
});

client.on('messageCreate', message => {
    if (message.author.bot) return; // Ignorowanie wiadomości od botów

    const quizChannel = message.guild.channels.cache.find(channel => channel.name === "🧠│quiz");

    if (message.content.toLowerCase() === '!quiz') {
        if (message.channel.id !== quizChannel.id) {
            return message.reply("❌ Ta komenda działa tylko na kanale **#🧠│quiz**!");
        }
            return startQuiz(message, client);

    }
});

client.login(process.env.TOKEN);


