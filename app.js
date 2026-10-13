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

// Загрузка нового случайного вопроса из базы без блокировок
async function loadNewQuestion() {
    botStatus.textContent = 'печатает вопрос...';
    userInput.disabled = true;
    userInput.value = '';
    questionAnswered = false;

    document.querySelectorAll('.inline-keyboard:not(.reactions)').forEach(kb => kb.style.display = 'none');

    try {
        // Запрос к стабильному API случайных вопросов интеллектуальных игр
        const response = await fetch('https://allorigins.win' + encodeURIComponent('https://chgk.info'));
        if (!response.ok) throw new Error();
        
        const data = await response.json();
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        
        // Находим элементы вопроса на странице
        const qNode = doc.querySelector('.question');
        if (!qNode) throw new Error();

        // Извлекаем и очищаем текст вопроса
        let qText = qNode.innerHTML.replace(/<p>/gi, '').replace(/<\/p>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<\/?[^>]+(>|\$)/g, "").replace(/Вопрос \d+:/gi, '').trim();
        
        let answerText = 'Точный ответ не найден';
        let commentText = '';
        let sibling = qNode.nextElementSibling;
        
        // Перебираем блоки, чтобы вытащить ответ и комментарий
        while (sibling) {
            if (sibling.classList.contains('answer')) answerText = sibling.textContent.replace('Ответ:', '').trim();
            if (sibling.classList.contains('comments')) commentText = sibling.textContent.replace('Комментарий:', '').trim();
            if (sibling.classList.contains('question') || sibling.classList.contains('tour_title')) break;
            sibling = sibling.nextElementSibling;
        }

        let tourTitle = 'Случайный турнир';
        const tourNode = (qNode.closest('.box') || doc).querySelector('.tour_title a, h2 a');
        if (tourNode) tourTitle = tourNode.textContent.trim();

        currentQuestion = { question: qText, answer: answerText, comment: commentText, tournament: tourTitle };
        renderBlock();
    } catch (e) {
        // Если внешняя база временно лежит, используем расширенный пул
        const backupPool = [
            { question: "По мнению Юзефа Булатовича, ЕЙ тяжелее всего в первые тридцать лет. Назовите ЕЁ словом на букву Ж.", answer: "Жизнь", comment: "Известный афоризм.", tournament: "Синхрон ЧГК" },
            { question: "Назовите предмет без проводов и батареек, работающий в лондонском Музее науки без перерыва с 1840 года двумя словами.", answer: "Оксфордский колокольчик", comment: "Экспериментальный сухой элемент.", tournament: "Кубок Европы" },
            { question: "Раскрываемость какого ореха по стандартам должна быть не менее 95%?", answer: "Фисташки", comment: "Преступника выдала скорлупа фисташек.", tournament: "Всероссийский чемпионат" },
            { question: "Какое слово на букву 'А' скрыто в известном выражении 'Все дороги ведут в ...'?", answer: "Рим", comment: "Обычно говорят про Рим, но это шуточный вопрос.", tournament: "Шуточный турнир" }
        ];
        currentQuestion = backupPool[Math.floor(Math.random() * backupPool.length)];
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
