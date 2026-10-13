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

// Полноценный асинхронный запрос к базе за случайным вопросом
async function loadNewQuestion() {
    botStatus.textContent = 'печатает вопрос...';
    userInput.disabled = true;
    userInput.value = '';
    questionAnswered = false;

    // Скрываем старые inline-кнопки предыдущего вопроса, если они были
    const activeKeyboards = document.querySelectorAll('.inline-keyboard:not(.reactions)');
    activeKeyboards.forEach(kb => kb.style.display = 'none');

    try {
        // Запрос к проверенному публичному API случайных вопросов интеллектуальных игр
        const randomPage = Math.floor(Math.random() * 500) + 1;
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://chgk.info' + randomPage)}`);
        
        if (!response.ok) throw new Error('Ошибка сети');
        const data = await response.json();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        
        // Находим первый попавшийся случайный вопрос в документе базы данных
        const questionNode = doc.querySelector('.question');
        
        if (!questionNode) throw new Error('Вопросы на странице не найдены');

        // Достаем текст вопроса, ответа и название турнира
        let qText = questionNode.querySelector('p') ? questionNode.querySelector('p').innerHTML : '';
        qText = qText.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?[^>]+(>|\$)/g, "").trim();
        
        let aText = questionNode.nextElementSibling && questionNode.nextElementSibling.classList.contains('answer') 
            ? questionNode.nextElementSibling.textContent.replace('Ответ:', '').trim() : 'Фисташки';
            
        let commentText = '';
        let sibling = questionNode.nextElementSibling;
        while(sibling) {
            if(sibling.classList.contains('comments')) {
                commentText = sibling.textContent.replace('Комментарий:', '').trim();
                break;
            }
            if(sibling.classList.contains('question')) break;
            sibling = sibling.nextElementSibling;
        }

        const tournamentText = doc.querySelector('.tour_title a') ? doc.querySelector('.tour_title a').textContent.trim() : 'Синхронный турнир';

        currentQuestion = {
            question: qText,
            answer: aText,
            comment: commentText,
            tournament: tournamentText
        };

        renderQuestionBlock();
        startTime = new Date();
        botStatus.textContent = 'bot';
        userInput.disabled = false;
        userInput.focus();
    } catch (error) {
        console.error('Ошибка загрузки нового вопроса:', error);
        // Резервный пул на случай таймаута внешних серверов
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

    const clean = str => str.toLowerCase().replace(/[^а-яа-ё0-9]/g, '').trim();
    const isCorrect = clean(userAns) === clean(currentQuestion.answer) || 
                     (userAns.length > 3 && clean(currentQuestion.answer).includes(clean(userAns)));

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
    }, 600);
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

window.onload = loadNewQuestion;
