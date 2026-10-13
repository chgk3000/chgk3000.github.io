const chat = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const botStatus = document.getElementById('botStatus');
let currentQuestion = null, startTime = null, questionAnswered = false;

const getTimeString = () => new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
const scrollToBottom = () => chat.scrollTop = chat.scrollHeight;

const db = [
    { q: "По мнению Юзефа Булатовича, ЕЙ тяжелее всего в первые тридцать лет. Назовите ЕЁ словом на букву Ж.", a: "Жизнь", c: "Известный афоризм." },
    { q: "Назовите работающий с 1840 года без проводов и батареек экспонат лондонского Музея науки двумя словами.", a: "Оксфордский колокольчик", c: "Сухой гальванический элемент." },
    { q: "Раскрываемость какого популярного ореха по принятым мировым стандартам обязана быть не менее 95%?", a: "Фисташки", c: "Преступника выдала скорлупа фисташек." },
    { q: "В известном фразеологизме утверждается, что абсолютно все дороги ведут именно туда. Назовите это место тремя буквами.", a: "Рим", c: "Крылатая фраза древности." },
    { q: "Она была изобретена в 1893 году Уиткомбом Джадсоном как застежка для обуви. Как мы называем её сейчас?", a: "Молния", c: "Застежка-молния." },
    { q: "Какое препятствие заставило участников автопробега 1908 года ехать через Сибирь, а не через Аляску?", a: "Берингов пролив", c: "Он не замерз до нужной толщины льда." },
    { q: "Какое слово, изначально означавшее 'плетеный щит', сегодня используется для обозначения защиты компьютера?", a: "Брандмауэр", c: "От немецкого Brandmauer — капитальная стена." },
    { q: "Герой Марка Твена говорил, что ЕГО легче всего бросить, ведь лично он делал это раз тридцать. Назовите ЕГО.", a: "Курить", c: "Я сам бросал тысячу раз." },
    { q: "Что в России традиционно измеряли 'вершками', 'аршинами' и 'саженями'?", a: "Длину", c: "Старинные русские меры." },
    { q: "В средние века этот предмет гардероба носили исключительно мужчины для закрепления чулок. Что это?", a: "Пояс", c: "Пояс для чулок." },
    { q: "Какое животное, если верить латинской пословице, 'дважды не ловит мух'?", a: "Орел", c: "Aquila non capit muscas — крупные фигуры не размениваются на мелочи." },
    { q: "Какую деталь одежды придумал Ришелье, чтобы мушкетеры не вытирали носы об рукава камзолов?", a: "Пуговицы", c: "Их нашивали на внешнюю сторону рукава." },
    { q: "Какой химический элемент был назван в честь злого духа гор из немецкого фольклора?", a: "Никель", c: "От имени духа Никеля." },
    { q: "В рассказе Конан Дойла Холмс определил, что человек приехал из Индии по загарy на ОДНОЙ части тела. На какой?", a: "Запястье", c: "Там, где наручные часы прикрывали кожу." },
    { q: "Какое изобретение Луи Браиля позволило незрячим людям читать книги?", a: "Шрифт", c: "Рельефно-точечный шрифт Браиля." },
    { q: "Имя какого великого завоевателя переводится с монгольского просто как 'Океан-правитель'?", a: "Чингисхан", c: "Чингис — океан или бескрайнее море." },
    { q: "Какое изобретение братьев Люмьер в 1895 году перевернуло мир развлечений?", a: "Кинематограф", c: "Или просто кино." },
    { q: "В Японии ЕГО называют 'кораблем пустыни', хотя в самой Японии пустынь нет. Кто это?", a: "Верблюд", c: "Классическое поэтическое сравнение." },
    { q: "Какой суп кулинары называют 'смесь', а музыканты используют это слово для соединения мелодий?", a: "Попурри", c: "От французского pot-pourri." }
];

function loadNewQuestion() {
    botStatus.textContent = 'печатает...';
    userInput.disabled = true; userInput.value = ''; questionAnswered = false;
    document.querySelectorAll('.inline-keyboard:not(.reactions)').forEach(kb => kb.style.display = 'none');
    currentQuestion = db[Math.floor(Math.random() * db.length)];
    setTimeout(() => {
        const id = Date.now();
        chat.innerHTML += `<div class="message-row"><div class="bot-avatar">чгк</div><div><div class="message-box"><div class="message-text">❓ <b>Внимание, вопрос!</b>\n\n${currentQuestion.q}</div><div class="message-meta">${getTimeString()}</div></div><div class="inline-keyboard" id="kb-${id}"><button class="tg-btn" onclick="forceReveal('${id}')">Ответ</button><button class="tg-btn" onclick="loadNewQuestion()">Дальше</button></div></div></div>`;
        scrollToBottom(); startTime = new Date(); botStatus.textContent = 'bot'; userInput.disabled = false; userInput.focus();
    }, 400);
}

function sendUserMessage() {
    const text = userInput.value.trim(); if (!text || questionAnswered) return;
    userInput.value = '';
    chat.innerHTML += `<div class="message-row out"><div class="message-box"><div class="message-text">${text}</div><div class="message-meta out-meta">${getTimeString()} ✔️</div></div></div>`;
    scrollToBottom(); checkAnswer(text);
}

function checkAnswer(userAns) {
    questionAnswered = true; userInput.disabled = true;
    const diff = Math.round((new Date() - startTime) / 1000);
    const timeStr = diff > 60 ? `${Math.floor(diff / 60)} мин. ${diff % 60} с.` : `${diff} с.`;
    const clean = str => str.toLowerCase().replace(/[^а-яа-ё0-9]/g, '').trim();
    const isCorrect = clean(userAns) === clean(currentQuestion.a) || (userAns.length > 3 && clean(currentQuestion.a).includes(clean(userAns)));

    setTimeout(() => {
        chat.innerHTML += `<div class="message-row"><div class="bot-avatar">чгк</div><div><div class="message-box"><div class="message-text">${isCorrect ? '⭐ <b>Правильно!</b>\n' : '❌ Неверно.\n\n🏁 <b>Ответ:</b> '}"${currentQuestion.a}"\n⏳ Время: ${timeStr}.\n\n<b>Инфо:</b> ${currentQuestion.c}</div><div class="message-meta">${getTimeString()}</div></div><div class="inline-keyboard reactions"><button class="tg-btn" onclick="this.disabled=true">👍</button><button class="tg-btn" onclick="loadNewQuestion()">Дальше</button></div></div></div>`;
        scrollToBottom();
    }, 500);
}

function forceReveal(kbId) {
    if (questionAnswered) return;
    questionAnswered = true; userInput.disabled = true;
    const kb = document.getElementById(`kb-${kbId}`); if (kb) kb.style.display = 'none';
    chat.innerHTML += `<div class="message-row"><div class="bot-avatar">чгк</div><div><div class="message-box"><div class="message-text">💡 <b>Капитуляция!</b>\n\n🏁 <b>Ответ:</b> "${currentQuestion.a}"\n\n<b>Инфо:</b> ${currentQuestion.c}</div><div class="message-meta">${getTimeString()}</div></div><div class="inline-keyboard reactions"><button class="tg-btn" onclick="this.disabled=true">👍</button><button class="tg-btn" onclick="loadNewQuestion()">Дальше</button></div></div></div>`;
    scrollToBottom();
}

window.onload = loadNewQuestion;
