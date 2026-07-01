// Контент перерывов: упражнения, йога, аффирмации. RU/EN.
export const exercises = {
  ru: [
    { name: 'Вращения плечами', detail: '10 раз вперёд и назад' },
    { name: 'Наклоны головы в стороны', detail: 'по 15 сек на сторону' },
    { name: 'Приседания', detail: '15 раз, спина прямая' },
    { name: 'Наклоны к носкам', detail: '10 раз, колени мягкие' },
    { name: 'Планка', detail: '30–45 секунд' },
    { name: 'Круги руками', detail: '15 раз в каждую сторону' },
    { name: 'Подъёмы на носки', detail: '20 раз' },
    { name: 'Разминка запястий и глаз', detail: '20 сек + взгляд вдаль' },
    { name: 'Прогиб в грудном отделе', detail: 'руки в замок за спиной, 20 сек' },
    { name: 'Марш на месте', detail: '45 секунд, колени выше' },
  ],
  en: [
    { name: 'Shoulder rolls', detail: '10 forward and back' },
    { name: 'Neck side stretches', detail: '15 sec each side' },
    { name: 'Squats', detail: '15 reps, straight back' },
    { name: 'Toe touches', detail: '10 reps, soft knees' },
    { name: 'Plank', detail: '30–45 seconds' },
    { name: 'Arm circles', detail: '15 each direction' },
    { name: 'Calf raises', detail: '20 reps' },
    { name: 'Wrists & eyes reset', detail: '20 sec + look far away' },
    { name: 'Chest opener', detail: 'hands clasped behind, 20 sec' },
    { name: 'March in place', detail: '45 seconds, knees high' },
  ],
}

export const yoga = {
  ru: [
    { name: 'Поза ребёнка (Баласана)', detail: '60 секунд, расслабь спину' },
    { name: 'Кошка–корова', detail: '8 медленных циклов с дыханием' },
    { name: 'Собака мордой вниз', detail: '30–45 секунд' },
    { name: 'Скручивание сидя', detail: 'по 30 сек в каждую сторону' },
    { name: 'Наклон стоя (Уттанасана)', detail: '45 секунд, шея свободна' },
    { name: 'Поза горы + дыхание', detail: '5 глубоких вдохов' },
    { name: 'Лёгкий прогиб (Сфинкс)', detail: '40 секунд' },
  ],
  en: [
    { name: 'Child’s pose (Balasana)', detail: '60 seconds, relax the back' },
    { name: 'Cat–cow', detail: '8 slow cycles with breath' },
    { name: 'Downward dog', detail: '30–45 seconds' },
    { name: 'Seated twist', detail: '30 sec each side' },
    { name: 'Standing fold (Uttanasana)', detail: '45 seconds, loose neck' },
    { name: 'Mountain pose + breath', detail: '5 deep breaths' },
    { name: 'Gentle backbend (Sphinx)', detail: '40 seconds' },
  ],
}

export const affirmations = {
  ru: [
    'Каждая сессия — кирпич в фундамент твоей мечты.',
    'Ты уже ближе, чем была утром.',
    'Дисциплина — это любовь к себе будущей.',
    'Маленькие шаги каждый день сильнее рывков раз в месяц.',
    'Отдых — часть работы. Перезарядись и вернись сильнее.',
  ],
  en: [
    'Every session is a brick in the foundation of your dream.',
    'You are closer than you were this morning.',
    'Discipline is love for your future self.',
    'Small daily steps beat monthly sprints.',
    'Rest is part of the work. Recharge and come back stronger.',
  ],
}

export function pickRandom(arr, n) {
  const copy = [...arr]
  const out = []
  while (copy.length && out.length < n) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0])
  }
  return out
}
