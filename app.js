const chat = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const botStatus = document.getElementById('botStatus');

let currentQuestion = null;
let startTime = null;
let questionAnswered = false;

function getTimeString() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}

function scrollToBottom() {
    chat.scrollTop = chat.scrollHeight;
}

// Загрузка случайного вопроса
async function loadNewQuestion() {
    botStatus.textContent = 'печатает вопрос...';
    userInput.disabled = true;
    userInput.value = '';
    questionAnswered = false;

    try {
        // Запрос к API случайных вопросов (обход CORS ограничений через прокси)
        const response = await fetch('https://allorigins.win' + encodeURIComponent('https://chgk.info'));
        const data = await response.json();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        
        const questionText = doc.querySelector('.question p') ? doc.querySelector('.question p').textContent.trim() : 'Текст вопроса не найден';
        const answerText = doc.querySelector('.answer') ? doc.querySelector('.answer').textContent.replace('Ответ:', '').trim() : 'Фисташки';
        const commentNode = doc.querySelector('.comments');
        const commentText = commentNode ? commentNode.textContent.replace('Комментарий:', '').trim() : '';
        const tournamentText = doc.querySelector('.tour_title a') ? doc.querySelector('.tour_title a').textContent.trim() : 'Случайный турнир';

        currentQuestion = {
            question: questionText,
            answer: answerText,
            comment: commentText,
            tournament: tournamentText
        };

        renderQuestionBlock();
        startTime = new Date();
        botStatus.textContent = 'bot';
        userInput.disabled = false;
        userInput.focus();
    } catch (error) {
        console.error('Ошибка сети, загружаем демо-вопрос:', error);
        currentQuestion = {
            question: "В одном произведении детектив смог раскрыть преступление из-за пристрастия преступника к НИМ. В соответствии с принятыми стандартами, ИХ раскрываемость должна составлять не менее 95%. Назовите ИХ.",
            answer: "Фисташки",
            comment: "На месте преступления была найдена скорлупа от фисташек. Редакторы надеются, что вы \"расщелкаете\" немало вопросов.",
            tournament: "Открытый Всероссийский синхронный чемпионат - 2011/12"
        };
        renderQuestionBlock();
        startTime = new Date();
        botStatus.textContent = 'bot';
        userInput.disabled = false;
    }
}

function renderQuestionBlock() {
    const kbId = Date.now();
    chat.innerHTML += `
        <div class="message-row">
            <div class="bot-avatar">чгк</div>
            <div>
                <div class="message-box">
                    <div class="message-text">❓ <b>Внимание, вопрос!</b>\n\n${currentQuestion.question}</div>
                    <span class="tournament-link">🏆 ${currentQuestion.tournament}</span>
                    <div class="message-meta">${getTimeString()}</div>
                </div>
                <div class="inline-keyboard" id="keyboard-${kbId}">
                    <button class="tg-btn" onclick="forceRevealAnswer('${kbId}')">Ответ</button>
                    <button class="tg-btn" onclick="loadNewQuestion()">Дальше</button>
                </div>
            </div>
        </div>
    `;
    scrollToBottom();
}

function sendUserMessage() {
    const text = userInput.value.trim();
    if (!text || questionAnswered) return;

    userInput.value = '';

    chat.innerHTML += `
        <div class="message-row out">
            <div class="message-box">
                <div class="message-text">${text}</div>
                <div class="message-meta out-meta">${getTimeString()} ✔️</div>
            </div>
        </div>
    `;
    scrollToBottom();
    checkUserAnswer(text);
}

function checkUserAnswer(userAns) {
    questionAnswered = true;
    userInput.disabled = true;
    
    const endTime = new Date();
    const diffSeconds = Math.round((endTime - startTime) / 1000);
    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;
    const timeStr = minutes > 0 ? `${minutes} мин. ${seconds} с.` : `${seconds} с.`;

    const clean = str => str.toLowerCase().replace(/[^а-яа-ё0-9]/g, '');
    const isCorrect = clean(userAns) === clean(currentQuestion.answer) || (userAns.length > 3 && currentQuestion.answer.toLowerCase().includes(userAns.toLowerCase()));

    setTimeout(() => {
        if (isCorrect) {
            chat.innerHTML += `
                <div class="message-row">
                    <div class="bot-avatar">чгк</div>
                    <div>
                        <div class="message-box">
                            <div class="message-text">⭐ <b>Молодец!</b>\n"${currentQuestion.answer}" - это абсолютно верный ответ.\n⏳ Время размышления: ${timeStr}.\n\n<b>Комментарий:</b>\n${currentQuestion.comment || 'Отсутствует.'}</div>
                            <div class="message-meta">${getTimeString()}</div>
                        </div>
                        <div class="inline-keyboard reactions">
                            <button class="tg-btn" onclick="this.disabled=true">👍</button>
                            <button class="tg-btn" onclick="loadNewQuestion()">Дальше</button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            chat.innerHTML += `
                <div class="message-row">
                    <div class="bot-avatar">чгк</div>
                    <div>
                        <div class="message-box">
                            <div class="message-text">❌ "${userAns}" - это неверный ответ.\n\n🏁 <b>Правильный ответ:</b> ${currentQuestion.answer}\n\n<b>Комментарий:</b>\n${currentQuestion.comment || 'Отсутствует.'}</div>
                            <div class="message-meta">${getTimeString()}</div>
                        </div>
                        <div class="inline-keyboard reactions">
                            <button class="tg-btn" onclick="this.disabled=true">👍</button>
                            <button class="tg-btn" onclick="loadNewQuestion()">Дальше</button>
                        </div>
                    </div>
                </div>
            `;
        }
        scrollToBottom();
    }, 800);
}

function forceRevealAnswer(kbId) {
    if (questionAnswered) return;
    questionAnswered = true;
    userInput.disabled = true;

    const kb = document.getElementById(`keyboard-${kbId}`);
    if (kb) kb.style.display = 'none';

    chat.innerHTML += `
        <div class="message-row">
            <div class="bot-avatar">чгк</div>
            <div>
                <div class="message-box">
                    <div class="message-text">💡 <b>Капитуляция!</b>\n\n🏁 <b>Правильный ответ:</b> ${currentQuestion.answer}\n\n<b>Комментарий:</b>\n${currentQuestion.comment || 'Отсутствует.'}</div>
                    <div class="message-meta">${getTimeString()}</div>
                </div>
                <div class="inline-keyboard reactions">
                    <button class="tg-btn" onclick="this.disabled=true">👍</button>
                    <button class="tg-btn" onclick="loadNewQuestion()">Дальше</button>
                </div>
            </div>
        </div>
    `;
    scrollToBottom();
}

// Первый запуск при старте сайта
window.onload = loadNewQuestion;
