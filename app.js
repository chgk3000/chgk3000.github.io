const chat = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const botStatus = document.getElementById('botStatus');

let currentQuestion = null;
let startTime = null;
let questionAnswered = false;

const getTimeString = () => {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
};

const scrollToBottom = () => chat.scrollTop = chat.scrollHeight;

// Загрузка случайного вопроса
async function loadNewQuestion() {
    botStatus.textContent = 'печатает вопрос...';
    userInput.disabled = true;
    userInput.value = '';
    questionAnswered = false;

    // Прячем кнопки на предыдущих ходах
    document.querySelectorAll('.inline-keyboard:not(.reactions)').forEach(kb => kb.style.display = 'none');

    try {
        const randomPage = Math.floor(Math.random() * 500) + 1;
        const targetUrl = `https://chgk.info{randomPage}`;
        const response = await fetch(`https://allorigins.win{encodeURIComponent(targetUrl)}`);
        
        if (!response.ok) throw new Error();
        const data = await response.json();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        const questionsList = doc.querySelectorAll('.question');
        
        if (!questionsList.length) throw new Error();
        
        const questionNode = questionsList[Math.floor(Math.random() * questionsList.length)];
        let qText = questionNode.innerHTML.replace(/<p>/gi, '').replace(/<\/p>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<\/?[^>]+(>|\$)/g, "").replace(/Вопрос \d+:/gi, '').trim();
        
        let answerText = 'Точный ответ не найден';
        let commentText = '';
        let sibling = questionNode.nextElementSibling;
        
        while (sibling) {
            if (sibling.classList.contains('answer')) answerText = sibling.textContent.replace('Ответ:', '').trim();
            if (sibling.classList.contains('comments')) commentText = sibling.textContent.replace('Комментарий:', '').trim();
            if (sibling.classList.contains('question') || sibling.classList.contains('tour_title')) break;
            sibling = sibling.nextElementSibling;
        }

        let tourTitle = 'Случайный синхронный турнир';
        const tourNode = (questionNode.closest('.box') || doc).querySelector('.tour_title a, h2 a');
        if (tourNode) tourTitle = tourNode.textContent.trim();

        currentQuestion = { question: qText, answer: answerText, comment: commentText, tournament: tourTitle };
        renderBlock();
    } catch (e) {
        // Запасной вопрос, если база недоступна
        currentQuestion = {
            question: "В одном произведении детектив смог раскрыть преступление из-за пристрастия преступника к НИМ. В соответствии с принятыми стандартами, ИХ раскрываемость должна составлять не менее 95%. Назовите ИХ.",
            answer: "Фисташки",
            comment: "На месте преступления была найдена скорлупа от фисташек.",
            tournament: "Открытый Всероссийский синхронный чемпионат"
        };
        renderBlock();
    }
}

function renderBlock() {
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
                    <button class="tg-btn" onclick="forceReveal('${kbId}')">Ответ</button>
                    <button class="tg-btn" onclick="loadNewQuestion()">Дальше</button>
                </div>
            </div>
        </div>
    `;
    scrollToBottom();
    startTime = new Date();
    botStatus.textContent = 'bot';
    userInput.disabled = false;
    userInput.focus();
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
    checkAnswer(text);
}

function checkAnswer(userAns) {
    questionAnswered = true;
    userInput.disabled = true;
    
    const diff = Math.round((new Date() - startTime) / 1000);
    const timeStr = diff > 60 ? `${Math.floor(diff / 60)} мин. ${diff % 60} с.` : `${diff} с.`;

    const clean = str => str.toLowerCase().replace(/[^а-яа-ё0-9]/g, '').trim();
    const isCorrect = clean(userAns) === clean(currentQuestion.answer) || (userAns.length > 3 && clean(currentQuestion.answer).includes(clean(userAns)));

    setTimeout(() => {
        chat.innerHTML += `
            <div class="message-row">
                <div class="bot-avatar">чгк</div>
                <div>
                    <div class="message-box">
                        <div class="message-text">${isCorrect ? '⭐ <b>Молодец!</b>\n' : '❌ неверный ответ.\n\n🏁 <b>Правильный ответ:</b> '}"${currentQuestion.answer}"\n⏳ Время: ${timeStr}.\n\n<b>Комментарий:</b>\n${currentQuestion.comment || 'Отсутствует.'}</div>
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
    }, 600);
}

function forceReveal(kbId) {
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

window.onload = loadNewQuestion;
