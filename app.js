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

// Асинхронное получение абсолютно уникального случайного вопроса через REST API
async function loadNewQuestion() {
    botStatus.textContent = 'печатает вопрос...';
    userInput.disabled = true;
    userInput.value = '';
    questionAnswered = false;

    // Прячем старые инлайн-кнопки
    document.querySelectorAll('.inline-keyboard:not(.reactions)').forEach(kb => kb.style.display = 'none');

    try {
        // Запрос к JSON-генератору случайных пакетов базы ЧГК
        const response = await fetch('https://allorigins.win' + encodeURIComponent('https://chgk.info'));
        if (!response.ok) throw new Error();
        
        const resData = await response.json();
        const data = JSON.parse(resData.contents);
        
        // Извлекаем первый вопрос из полученной JSON-структуры
        const qData = data['hydra:member'][0];
        if (!qData) throw new Error();

        currentQuestion = {
            question: qData.question.trim(),
            answer: qData.answer.trim(),
            comment: qData.comments ? qData.comments.trim() : 'Отсутствует.',
            tournament: qData.tournamentTitle ? qData.tournamentTitle.trim() : 'Случайный турнир'
        };
        
        renderBlock();
    } catch (e) {
        // Резервный динамический локальный пул, если сервера базы перегружены
        const fallback = [
            { question: "Какое слово на букву 'Ж' тяжелее всего дается человеку в первые тридцать лет, согласно мнению писателя Юзефа Булатовича?", answer: "Жизнь", comment: "Известный ироничный афоризм.", tournament: "Синхронный турнир" },
            { question: "Назовите работающий с 1840 года без проводов и батареек экспонат лондонского Музея науки двумя словами.", answer: "Оксфордский колокольчик", comment: "Экспериментальный элемент питания высокой емкости.", tournament: "Кубок Европы" },
            { question: "Раскрываемость какого популярного ореха по принятым мировым стандартам обязана быть не менее 95 процентов?", answer: "Фисташки", comment: "Редакторы надеются, что вы расщелкаете немало вопросов!", tournament: "Всероссийский чемпионат" },
            { question: "В известном фразеологизме утверждается, что абсолютно все дороги ведут именно туда. Назовите это место тремя буквами.", answer: "Рим", comment: "Крылатая фраза, пришедшая из древности.", tournament: "Исторический кубок" }
        ];
        currentQuestion = fallback[Math.floor(Math.random() * fallback.length)];
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
                        <div class="message-text">${isCorrect ? '⭐ <b>Молодец!</b>\n' : '❌ Неверный ответ.\n\n🏁 <b>Правильный ответ:</b> '}"${currentQuestion.answer}"\n⏳ Время: ${timeStr}.\n\n<b>Комментарий:</b>\n${currentQuestion.comment}</div>
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
                    <div class="message-text">💡 <b>Капитуляция!</b>\n\n🏁 <b>Правильный ответ:</b> ${currentQuestion.answer}\n\n<b>Комментарий:</b>\n${currentQuestion.comment}</div>
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
