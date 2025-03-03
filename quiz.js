const fs = require('fs');
const path = require('path');

const quizData = JSON.parse(fs.readFileSync(path.join(__dirname, 'quiz_questions.json')));

async function startQuiz(message, client) {
    let randomQuestion = quizData[Math.floor(Math.random() * quizData.length)];
    await message.channel.send(`❓ ${randomQuestion.question} (Masz 15 sekund na odpowiedź!)`);

    const filter = response => {
        console.log(`🔎 Sprawdzam: ${response.content} od ${response.author.username}`);
        return response.author.id === message.author.id && !response.author.bot;
    };

    try {
        const collected = await message.channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] });

        const userResponse = collected.first().content.trim().toLowerCase();
        const correctAnswer = randomQuestion.answer.trim().toLowerCase();

        console.log(`✅ Użytkownik: ${collected.first().author.username}, wpisał: ${userResponse}, prawidłowa: ${correctAnswer}`);

        if (userResponse === correctAnswer) {
            let user = collected.first().author;
            let points = updateScore(user.id);
            return message.channel.send(`✅ Brawo **${user.username}**! Odpowiedź: **${randomQuestion.answer}**. Masz teraz **${points}** punktów.`);
        } else {
            return message.channel.send(`❌ Niestety, **${collected.first().content}** to zła odpowiedź. Prawidłowa to **${randomQuestion.answer}**.`);
        }
    } catch (error) {
        console.log(`⏳ Czas minął lub błąd: ${error}`);
        return message.channel.send(`⏳ Czas minął! Prawidłowa odpowiedź to **${randomQuestion.answer}**.`);
    }
}

function updateScore(userId) {
    let scores = {};
    let filePath = path.join(__dirname, 'quiz_scores.json');

    if (fs.existsSync(filePath)) {
        try {
            let rawData = fs.readFileSync(filePath, 'utf8'); // Wymuszenie UTF-8
            scores = JSON.parse(rawData);
        } catch (error) {
            console.error("❌ Błąd w quiz_scores.json. Resetuję plik!", error);
            scores = {}; // Resetowanie wyników, jeśli plik był uszkodzony
        }
    }

    scores[userId] = (scores[userId] || 0) + 1;

    // ✅ Poprawny zapis JSON bez BOM
    fs.writeFileSync(filePath, JSON.stringify(scores, null, 2), { encoding: 'utf8' });

    return scores[userId];
}


module.exports = { startQuiz };
