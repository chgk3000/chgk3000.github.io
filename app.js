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

// Загрузка нового случайного вопроса через чистое API
async function loadNewQuestion() {
    botStatus.textContent = 'печатает вопрос...';
    userInput.disabled = true;
    userInput.value = '';
    questionAnswered = false;

    // Прячем старые inline-кнопки
    document.querySelectorAll('.inline-keyboard:not(.reactions)').forEach(kb => kb.style.display = 'none');

    try {
        // Запрос к запасному CORS-прокси и официальной JSON-выгрузке базы
        const response = await fetch('https://allorigins.win' + encodeURIComponent('https://chgk.info'));
        if (!response.ok) throw new Error();
        
        const data = await response.json();
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        
        // Извлекаем чистые данные из структуры документа
        const qNode = doc.querySelector('.Question');
        const aNode = doc.querySelector('.Answer');
        const cNode = doc.querySelector('.Comments');
        const tNode = doc.querySelector('.Title');

        if (!qNode || !aNode) throw new Error();

        currentQuestion = {
            question: qNode.textContent.replace(/Вопрос \d+:/gi, '').trim(),
            answer: aNode.textContent.replace('Ответ:', '').trim(),
            comment: cNode ? cNode.textContent.replace('Комментарий:', '').trim() : '',
            tournament: tNode ? tNode.textContent.trim() : 'Случайный турнир'
        };
        
        renderBlock();
    } catch (e) {
        // Локальный пул на случай сбоев сети (вопросы будут меняться в любом случае)
        const localPool = [
            {
                question: "Писатель Юзеф Булатович заметил: «ЕЙ тяжелее всего в первые тридцать лет». Назовите ЕЁ словом, начинающимся на букву Ж.",
                answer: "Жизнь",
                comment: "Известный ироничный афоризм о преодолении трудностей.",
                tournament: "Чемпионат по спортивному ЧГК"
            },
            {
                question: "В одном из залов лондонского Музея науки посетителям предлагают ознакомиться с экспонатом, который называют «самым долговечным источником энергии». У этого устройства нет проводов, батареек, и оно работает без перерыва с 1840 года. Назовите этот предмет двумя словами.",
                answer: "Оксфордский колокольчик",
                comment: "Это экспериментальный сухой гальванический элемент, работающий уже почти два века.",
                tournament: "Синхронный турнир - Кубок Городов"
            },
            {
                question: "В одном произведении детектив смог раскрыть преступление из-за пристрастия преступника к НИМ. В соответствии с принятыми стандартами, ИХ раскрываемость должна составлять не менее 95%. Назовите ИХ.",
                answer: "Фисташки",
                comment: "На месте преступления была найдена скорлупа от фисташек. Стандарты требуют, чтобы у спелых орехов раскрывалось 95% скорлупы.",
                tournament: "Открытый Всероссийский синхронный чемпионат"
            }
        ];
        currentQuestion = localPool[Math.floor(Math.random() * localPool.length)];
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
                        <div class="message-text">${isCorrect ? '⭐ <b>Молодец!</b>\n' : '❌ Неверный ответ.\n\n🏁 <b>Правильный ответ:</b> '}"${currentQuestion.answer}"\n⏳ Время: ${timeStr}.\n\n<b>Комментарий:</b>\n${currentQuestion.comment || 'Отсутствует.'}</div>
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
