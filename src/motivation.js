/* Система мотивации. Фразы — прикладные принципы продуктивности
   (консолидация памяти, закон Паркинсона, implementation intentions,
   цена переключения контекста, поведенческая активация), без абстракций.
   Контракт под будущий API-провайдер: getPhrase(ctx, {name, goal, liked}). */

export const PHRASES = {
  ru: [
    // Почему перерыв важен (наука отдыха)
    { id: 'r1', ctx: ['breakStart'], text: 'Мозг переносит выученное в долгую память именно в паузах. Перерыв — часть работы, а не побег от неё.' },
    { id: 'r2', ctx: ['breakStart'], text: 'Рост происходит не во время нагрузки, а во время восстановления. Это правило спортсменов работает и для головы.' },
    { id: 'r3', ctx: ['breakStart'], text: '{name}, правило 20-20-20: каждые 20 минут — 20 секунд смотреть на 20 шагов вдаль. Глаза скажут спасибо.' },
    { id: 'r4', ctx: ['breakStart'], text: 'Уставший мозг принимает худшие решения, но не сообщает об этом. Пауза — страховка от дорогих ошибок.' },
    { id: 'r5', ctx: ['breakStart'], text: 'Встань, разгони кровь, глотни воды. Физиология внимания проще, чем кажется: кислород и движение.' },
    // Не пропускай перерыв
    { id: 'r6', ctx: ['breakSkip'], text: 'Пропуская перерыв, ты занимаешь внимание у вечера под высокий процент. Невыгодная сделка.' },
    { id: 'r7', ctx: ['breakSkip'], text: 'Работа заполняет всё отведённое время — закон Паркинсона. Перерыв ставит границу и ускоряет тебя.' },
    { id: 'r8', ctx: ['breakSkip'], text: 'Усталость копится тихо, а обваливается сразу. 5 минут сейчас дешевле выгоревшей недели потом.' },
    { id: 'r9', ctx: ['breakSkip'], text: '{name}, лучшие удерживают темп годами не силой воли, а расписанием отдыха.' },
    // Сгорание линии (завершение)
    { id: 'r10', ctx: ['lineClear'], text: 'Ряд закрыт. Мозг любит завершённые контуры — закрой сегодня ещё один в «{goal}».' },
    { id: 'r11', ctx: ['lineClear'], text: 'Большие цели складываются как линии: не героизмом, а полными маленькими рядами.' },
    { id: 'r12', ctx: ['lineClear'], text: 'Сделанное маленькое сильнее идеального несделанного.' },
    { id: 'r13', ctx: ['lineClear'], text: 'Прогресс виден, когда слой закрыт. Отмечай завершения — это топливо мотивации.' },
    // Пауэрапы (действие рождает мотивацию)
    { id: 'r14', ctx: ['powerup'], text: 'Мотивация приходит ПОСЛЕ начала действия, а не до. Ты только что это доказала.' },
    { id: 'r15', ctx: ['powerup'], text: 'Сложное становится лёгким примерно на 12-й минуте. Ты уже внутри — не выходи.' },
    { id: 'r16', ctx: ['powerup', 'ambient'], text: 'Энергия любит движение: сделай следующий маленький шаг, пока разогналась.' },
    // Амбиент (практики фокуса)
    { id: 'r17', ctx: ['ambient'], text: 'Одна задача за раз: каждое переключение контекста съедает до 20% времени.' },
    { id: 'r18', ctx: ['ambient'], text: 'Реши заранее: «когда случится X — я сделаю Y». Намерения с триггером выполняются вдвое чаще.' },
    { id: 'r19', ctx: ['ambient'], text: 'Отвлекла мысль? Запиши её за две секунды и вернись. Списку она нужнее, чем голове.' },
    { id: 'r20', ctx: ['ambient'], text: 'Прокрастинация — не лень, а избегание дискомфорта. Уменьши шаг до смешного — и дискомфорт исчезнет.' },
    { id: 'r21', ctx: ['ambient'], text: 'Ты работаешь ради: {why}. Держи это перед глазами, когда тянет отвлечься.' },
    { id: 'r22', ctx: ['ambient'], text: 'Телефон в другой комнате повышает результат теста внимания. Расстояние — лучший блокировщик.' },
    // Старт фокуса
    { id: 'r23', ctx: ['focusStart'], text: 'Начни с шага настолько маленького, что отказаться стыдно. Старт обманывает сопротивление.' },
    { id: 'r24', ctx: ['focusStart'], text: 'Определи финиш заранее: сессия без критерия «готово» не заканчивается никогда.' },
  ],
  en: [
    { id: 'e1', ctx: ['breakStart'], text: 'Your brain files new learning into long-term memory during pauses. Breaks are part of the work.' },
    { id: 'e2', ctx: ['breakStart'], text: 'Growth happens in recovery, not in effort. Athletes know it — so does your brain.' },
    { id: 'e3', ctx: ['breakStart'], text: '{name}, rule 20-20-20: every 20 minutes, 20 seconds looking 20 feet away.' },
    { id: 'e4', ctx: ['breakStart'], text: 'A tired brain makes worse calls and never warns you. A pause is insurance against costly mistakes.' },
    { id: 'e6', ctx: ['breakSkip'], text: 'Skipping breaks borrows attention from your evening at a terrible rate.' },
    { id: 'e7', ctx: ['breakSkip'], text: 'Work expands to fill the time available — Parkinson’s law. A break sets the boundary.' },
    { id: 'e8', ctx: ['breakSkip'], text: 'Fatigue builds silently and collapses at once. 5 minutes now beats a burned-out week later.' },
    { id: 'e10', ctx: ['lineClear'], text: 'Row closed. Brains love closed loops — close one more in “{goal}” today.' },
    { id: 'e11', ctx: ['lineClear'], text: 'Big goals stack like lines: not heroics, just small complete rows.' },
    { id: 'e12', ctx: ['lineClear'], text: 'A small thing done beats a perfect thing undone.' },
    { id: 'e14', ctx: ['powerup'], text: 'Motivation arrives AFTER action starts, not before. You just proved it.' },
    { id: 'e17', ctx: ['ambient'], text: 'One task at a time: every context switch costs up to 20% of your time.' },
    { id: 'e18', ctx: ['ambient'], text: 'Decide in advance: “when X happens — I do Y.” Triggered intentions double follow-through.' },
    { id: 'e19', ctx: ['ambient'], text: 'Distracting thought? Capture it in two seconds and return. The list needs it more than your head.' },
    { id: 'e23', ctx: ['focusStart'], text: 'Start with a step too small to refuse. Starting tricks resistance.' },
    { id: 'e24', ctx: ['focusStart'], text: 'Define “done” before you start: sessions without a finish line never end.' },
  ],
}

/* КАРКАС ДЛЯ НЕЙРОНКИ (этап 2): единственное место интеграции API.
   Личность промпта собирается из профиля: имя, цели с «зачем»,
   лайкнутые фразы как стиль-ориентир. Провайдер вернёт {id, text} —
   контракт тот же, что у getPhrase, UI не меняется. */
export function buildPrompt(ctx, { name = '', goals = [], liked = [], lang = 'ru' } = {}) {
  const likedTexts = (PHRASES[lang] || PHRASES.ru)
    .filter((p) => liked.includes(p.id)).map((p) => `«${p.text}»`)
  const goalsStr = goals.map((g) => g.why ? `${g.title} (зачем: ${g.why})` : g.title).join('; ')
  return [
    `Ты — точный коуч продуктивности (без клише и пафоса). Язык ответа: ${lang}.`,
    `Контекст показа: ${ctx} (breakStart=почему пауза важна, breakSkip=мягко отговорить пропускать отдых, lineClear=завершение слоя работы, powerup=momentum, ambient=техника фокуса, focusStart=начало сессии).`,
    name && `Имя пользователя: ${name} — обращайся лично, но не в каждой фразе.`,
    goalsStr && `Цели пользователя: ${goalsStr}. Обыграй ЦЕЛЬ конкретно: покажи связь этой минуты с целью, дроби её на «ряды», напоминай «зачем».`,
    likedTexts.length && `Фразы, которые пользователю зашли (повтори их ДУХ, не слова): ${likedTexts.join(' ')}`,
    'Сгенерируй ОДНУ фразу до 140 символов, опирающуюся на науку продуктивности (консолидация памяти, закон Паркинсона, implementation intentions, поведенческая активация). Верни только текст фразы.',
  ].filter(Boolean).join('\n')
}

const recent = []

export function getPhrase(ctx, { lang = 'ru', name = '', goal = null, liked = [] } = {}) {
  const pool = (PHRASES[lang] || PHRASES.ru).filter((p) => p.ctx.includes(ctx))
  if (!pool.length) return null
  const likedPool = pool.filter((p) => liked.includes(p.id))
  let candidates = (likedPool.length && Math.random() < 0.35) ? likedPool : pool
  const fresh = candidates.filter((p) => !recent.includes(p.id))
  if (fresh.length) candidates = fresh
  const p = candidates[Math.floor(Math.random() * candidates.length)]
  recent.push(p.id)
  if (recent.length > 6) recent.shift()
  const text = p.text
    .replaceAll('{name}', name || (lang === 'ru' ? 'друг' : 'friend'))
    .replaceAll('{goal}', goal?.title || (lang === 'ru' ? 'твоей цели' : 'your goal'))
    .replaceAll('{why}', goal?.why || goal?.title || (lang === 'ru' ? 'твоей мечты' : 'your dream'))
  return { id: p.id, text }
}
