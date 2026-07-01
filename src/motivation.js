/* Система мотивации.
   АРХИТЕКТУРА ПОД БУДУЩУЮ НЕЙРОНКУ:
   - getPhrase(ctx) — единственная точка получения фразы. Сейчас — локальный датасет,
     позже — провайдер API с тем же контрактом (username + likedIds + goals уходят в промпт).
   - Лайк фразы (клик) → likePhrase(id) в профиле: это сигнал предпочтений пользователя,
     нейронка будет генерировать «в духе лайкнутых».
   Контексты: breakStart (почему перерыв важен), breakSkip (уговор не пропускать),
   lineClear, powerup, ambient, focusStart. {name} и {goal}/{why} подставляются. */

export const PHRASES = {
  ru: [
    { id: 'r1', ctx: ['breakStart'], text: 'Пауза — не остановка. Лук стреляет дальше, когда его отпускают.' },
    { id: 'r2', ctx: ['breakStart'], text: '{name}, мозг записывает выученное именно в перерыве. Это тоже работа.' },
    { id: 'r3', ctx: ['breakStart'], text: 'Отдых — это часть дистанции, а не сход с неё.' },
    { id: 'r4', ctx: ['breakStart'], text: 'Река сильна тем, что умеет замедляться на поворотах.' },
    { id: 'r5', ctx: ['breakSkip'], text: 'Пропустить перерыв — занять энергию у вечернего себя под высокий процент.' },
    { id: 'r6', ctx: ['breakSkip'], text: '{name}, усталость не уходит от игнорирования. Она уходит от отдыха.' },
    { id: 'r7', ctx: ['breakSkip'], text: '5 минут паузы вернут тебе 50 минут фокуса. Это лучшая сделка дня.' },
    { id: 'r8', ctx: ['lineClear', 'ambient'], text: 'Большое складывается из ровных маленьких рядов.' },
    { id: 'r9', ctx: ['lineClear'], text: 'Ряд закрыт. Так же закроется и «{goal}».' },
    { id: 'r10', ctx: ['lineClear'], text: 'Порядок — это скорость. Минус один слой хаоса.' },
    { id: 'r11', ctx: ['powerup', 'ambient'], text: 'Ты растёшь, когда делаешь, а не когда ждёшь настроения.' },
    { id: 'r12', ctx: ['powerup'], text: 'Сила приходит в движении. Лови момент, {name}.' },
    { id: 'r13', ctx: ['ambient'], text: 'Прокрастинация — это страх, притворившийся занятостью.' },
    { id: 'r14', ctx: ['ambient'], text: 'Не жди мотивацию — начни, и она догонит.' },
    { id: 'r15', ctx: ['ambient'], text: 'Каждая минута фокуса — кирпич в «{goal}».' },
    { id: 'r16', ctx: ['ambient'], text: 'Ты здесь ради: {why}. Помни это.' },
    { id: 'r17', ctx: ['focusStart'], text: 'Одна сессия. Один шаг. Достаточно.' },
    { id: 'r18', ctx: ['focusStart'], text: 'Дисциплина — это любовь к себе будущей.' },
    { id: 'r19', ctx: ['breakStart'], text: 'Глаза вдаль, плечи вниз, вдох глубже. Тело скажет спасибо.' },
    { id: 'r20', ctx: ['ambient', 'lineClear'], text: 'Медленно — это плавно. Плавно — это быстро.' },
    { id: 'r21', ctx: ['breakSkip'], text: 'Чемпионы отдыхают по расписанию, а не по падению.' },
    { id: 'r22', ctx: ['ambient'], text: 'Сомнение кричит, дело шепчет. Слушай дело.' },
    { id: 'r23', ctx: ['powerup'], text: 'Заметь: стоило начать — и стало легче.' },
    { id: 'r24', ctx: ['breakStart'], text: 'Пауза превращает усилия в результат, как сон превращает день в память.' },
  ],
  en: [
    { id: 'e1', ctx: ['breakStart'], text: 'A pause is not a stop. A bow shoots farther when released.' },
    { id: 'e2', ctx: ['breakStart'], text: '{name}, the brain saves your progress during breaks. That is work too.' },
    { id: 'e3', ctx: ['breakStart'], text: 'Rest is part of the distance, not a detour.' },
    { id: 'e5', ctx: ['breakSkip'], text: 'Skipping a break is borrowing energy from tonight at a high interest rate.' },
    { id: 'e7', ctx: ['breakSkip'], text: '5 minutes of pause buys back 50 minutes of focus. Best deal today.' },
    { id: 'e8', ctx: ['lineClear', 'ambient'], text: 'Big things are made of small even rows.' },
    { id: 'e9', ctx: ['lineClear'], text: 'Row closed. “{goal}” will close the same way.' },
    { id: 'e11', ctx: ['powerup', 'ambient'], text: 'You grow when you act, not when you wait for the mood.' },
    { id: 'e13', ctx: ['ambient'], text: 'Procrastination is fear dressed as busyness.' },
    { id: 'e14', ctx: ['ambient'], text: 'Don’t wait for motivation — start, and it will catch up.' },
    { id: 'e15', ctx: ['ambient'], text: 'Every focused minute is a brick in “{goal}”.' },
    { id: 'e17', ctx: ['focusStart'], text: 'One session. One step. Enough.' },
    { id: 'e18', ctx: ['focusStart'], text: 'Discipline is love for your future self.' },
    { id: 'e21', ctx: ['breakSkip'], text: 'Champions rest on schedule, not on collapse.' },
    { id: 'e22', ctx: ['ambient'], text: 'Doubt shouts, work whispers. Listen to the work.' },
  ],
}

const recent = []

export function getPhrase(ctx, { lang = 'ru', name = '', goal = null, liked = [] } = {}) {
  const pool = (PHRASES[lang] || PHRASES.ru).filter((p) => p.ctx.includes(ctx))
  if (!pool.length) return null
  // предпочтения: 35% шанс взять лайкнутую подходящую
  const likedPool = pool.filter((p) => liked.includes(p.id))
  let candidates = (likedPool.length && Math.random() < 0.35) ? likedPool : pool
  const fresh = candidates.filter((p) => !recent.includes(p.id))
  if (fresh.length) candidates = fresh
  const p = candidates[Math.floor(Math.random() * candidates.length)]
  recent.push(p.id)
  if (recent.length > 6) recent.shift()
  let text = p.text
    .replaceAll('{name}', name || (lang === 'ru' ? 'друг' : 'friend'))
    .replaceAll('{goal}', goal?.title || (lang === 'ru' ? 'твоя цель' : 'your goal'))
    .replaceAll('{why}', goal?.why || goal?.title || (lang === 'ru' ? 'твоя мечта' : 'your dream'))
  return { id: p.id, text }
}
