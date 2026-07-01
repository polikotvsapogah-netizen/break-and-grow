# Break & Grow — архитектура и ресёрч

Дата ресёрча: 2 июля 2026. Все цены и факты — из открытых источников на эту дату (ссылки внизу).

---

## 1. Видение продукта

Фокус-таймер с мотивационным ядром: приложение не просто отсчитывает помодоро, а связывает каждую рабочую сессию с **глобальной целью пользователя** («ради чего я это делаю») и телесной перезарядкой (зарядка/йога). Атмосферу задают любимые отрезки музыки и видеофоны. На этапе 2 — генерация и монтаж персональных мотивационных видео под цель пользователя.

Формула: *Pomodoro × дофаминовая среда (музыка+видео) × визуализация цели*.

## 2. Конкуренты и ценовая политика (2026)

| Продукт | Что делает | Цена | Чего у них нет из нашего |
|---|---|---|---|
| **Flocus** | эстетичный дашборд: помодоро, фоны, эмбиент-звуки | щедрый free, премиум-подписка за продвинутые фичи | целей-«зачем», отрезков своих треков, персонального видео |
| **LifeAt** | иммерсивные воркспейсы: живые обои, фокус-музыка, задачи | ≈ $8/мес | мотивационного слоя целей, генерации видео |
| **Brain.fm** | нейро-музыка для фокуса | $9.99–14.99/мес, ~$69.99–99.99/год | таймер-ритуалов, целей, видео |
| **Endel** | адаптивные саундскейпы | ≈ $6.99/мес, $49.99/год (акции до $39.99), lifetime ~$90 | то же |
| **Forest** | геймификация фокуса (дерево растёт) | $3.99 разово (iOS), Android free + Pro $1.99 | среды (музыка/видео), целей |
| **Focusmate** | ко-воркинг по видео для подотчётности | free 3 сессии/нед, ~$6.99–9.99/мес | всего нашего стека |
| **FlowFocus / Pomofocus** | простые эстетичные веб-таймеры | free / donate | почти всего |

**Выводы для нас:**
1. Ниша «таймер + смысл (цель/зачем) + телесная перезарядка + персональное AI-видео цели» — **не занята**. Конкуренты делают либо звук (Brain.fm, Endel), либо эстетику (Flocus, LifeAt), либо геймификацию (Forest).
2. Рыночный коридор цены: **$4–10/мес**, годовая скидка ~40–50%, lifetime как акция. Рекомендация: free-tier (таймер+цели+градиенты) → Pro $5–7/мес (видеофоны, отрезки, статистика) → AI-кредиты на генерацию видео отдельно (см. §8).
3. Forest доказывает: разовая покупка тоже работает на мобильных — вариант для входа в сторы.

## 3. Принципы архитектуры

1. **Local-first.** Всё работает без аккаунта и сервера: state в localStorage, медиа в IndexedDB. Сервер добавляет ценность (синк, AI), а не является требованием. Это же даёт офлайн и приватность.
2. **Ядро отделено от платформы.** Доменная логика (таймер, цели, плейлисты, контент перерывов) — чистый TS/JS без DOM-зависимостей. Платформенные вещи (уведомления, файлы, аудио) — за интерфейсами-адаптерами. Это ключ к пункту «заложить все платформы».
3. **Медиа — это адаптеры источников.** `MusicSource: local | youtube | spotify`, `BackgroundSource: gradient | video | youtube | generated`. Добавление Spotify или AI-видео на этапе 2 не меняет ядро — добавляется адаптер.
4. **UI — React.** Один UI-код для web/desktop/мобильных webview-оболочек.

## 4. Этап 1 — MVP (готов, в этом репозитории)

**Стек:** React 18 + Vite, чистый CSS (дизайн-токены в CSS-переменных), без бэкенда. Сборка `vite-plugin-singlefile` — приложение целиком в одном `dist/index.html`.

**Модель данных (localStorage `bag-state-v1`):**

```ts
settings: { lang, theme, accent, focusMin, mode: 'goals'|'exercise'|'yoga',
            breakMin: {goals, exercise, yoga}, autoBreak, autoFocus, autoPlayMusic,
            sound, notify, volume, bg: {type, gradient, ytUrl, hasVideo}, dim }
goals:    [{ id, title, why }] + currentGoalId       // цель и «зачем»
music:    { source, tracks: [{id, name, start, end}], activeId, ytUrl, ytStart, ytEnd, volume }
stats:    { day, sessions, focusedMin }               // статистика дня
// таймер отдельно (bag-timer-v1): { phase, endsAt, paused, remainMs } — переживает reload
```

**Ключевые механики:**
- Таймер считает от `endsAt` (абсолютное время), а не декрементом — не дрейфует, переживает сон вкладки и перезагрузку.
- Отрезки A–B: для локальных файлов — `timeupdate` + seek на `start`; для YouTube — IFrame API + поллинг 500 мс (параметр `end` работает только при первом запуске).
- Уведомления: Notification API + WebAudio-колокольчик + полноэкранный оверлей (работает даже при запрете уведомлений).
- Wake Lock во время фокуса, тикающий заголовок вкладки.

## 5. Путь на все платформы (этап 1.5–2)

Цель: Web → macOS + Windows → iOS + Android. Варианты:

| Вариант | Плюсы | Минусы | Вердикт |
|---|---|---|---|
| **Tauri 2** (Rust + системный WebView) | 6 платформ одним кодом (Win/mac/Linux + iOS/Android с v2.0, окт. 2024); бандл 2.5–10 МБ против 80–150 МБ у Electron; наш React-код переносится как есть; плагины notifications/fs/tray | Rust в командных навыках; мобильная часть моложе, чем RN/Flutter | **Рекомендую**: desktop-first с mobile-reach — ровно наш случай |
| Electron (desktop) + Capacitor (mobile) | максимально зрелые webview-обёртки, тот же React | два тулчейна; Electron тяжёлый (RAM, размер) | запасной, если Tauri-мобайл упрётся |
| Flutter | лучший чисто-мобильный перф (Impeller, 46% рынка кросс-мобайл) | полная переписка UI с React на Dart — теряем весь MVP | нет для нас |
| React Native + RN-desktop | нативные контролы, знакомый React | RN-desktop (Windows/macOS) нишевый; всё равно частичная переписка | нет на старте |

**Рекомендуемая структура монорепо (когда придёт время):**

```
packages/
  core/        # доменная логика: таймер, цели, плейлисты (чистый TS, без DOM)
  ui/          # React-компоненты и дизайн-токены
  adapters/    # notifications, storage, audio — web/tauri реализации
apps/
  web/         # текущий MVP (Vite)
  desktop/     # Tauri 2 (Win + macOS): трей, автозапуск, нативные уведомления
  mobile/      # Tauri 2 mobile или Capacitor (iOS + Android)
services/
  api/         # этап 2: аккаунты, синк, AI-джобы
```

Рефакторинг текущего кода под это — механический: `store.jsx` делится на `core/timer.ts` + React-биндинг; компоненты уезжают в `ui/`.

## 6. Уведомления по платформам (важные ограничения из ресёрча)

- **Web (десктоп-браузеры):** Notification API — ок, уже в MVP.
- **iOS web-push:** работает только для PWA, добавленной на домашний экран (iOS 16.4+), **в ЕС Apple отключила PWA-push** (DMA, iOS 17.4+); аудитория web-push в ~10–15 раз меньше нативной. Вывод: PWA — промежуточный шаг, надёжные напоминания на телефонах = нативная оболочка (Tauri mobile/Capacitor local notifications — работают локально, без сервера).
- **Desktop (Tauri):** нативные уведомления + трей + автозапуск — главная причина делать desktop-версию: напоминание «встань и разомнись» должно пробивать полноэкранный IDE, браузерная вкладка это не может.

## 7. Музыкальные интеграции — как правильно

- **Свои файлы** (в MVP): блобы в IndexedDB, отрезки A–B. Юридически чисто.
- **YouTube** (в MVP): официальный IFrame Player API. Правила: нельзя скрывать факт проигрывания и скачивать аудио; embed может быть отключён владельцем ролика — обрабатываем фолбэк.
- **Spotify (этап 2, «правильный способ»):** Web Playback SDK превращает приложение в устройство Spotify Connect. Требования: OAuth 2.0 PKCE, у пользователя — **Premium**. Отрезки реализуются легально: `seek(startMs)` + пауза на `endMs` (поллинг позиции). **Нельзя**: скачивать, кэшировать, резать аудио — только управление воспроизведением. Значит фича «отрезок трека» для Spotify = «луп фрагмента через seek», код адаптера изолирован в `MusicSource.spotify`.
- Той же схемой позже добавляется Apple Music (MusicKit JS, подписка Apple Music у пользователя).

## 8. Этап 2 — генерация и монтаж видео под цель

Пользователь описывает цель («дом у моря для семьи») или даёт свои фото/видео — получает персональный мотивационный ролик-фон.

**Пайплайн:**

```
клиент → services/api (очередь джобов) → провайдер AI-видео → пост-обработка ffmpeg
       → CDN/Storage → клиент кэширует в IndexedDB как обычный видеофон
```

1. **Генерация из текста/фото** — через агрегатор (fal.ai / Replicate), чтобы менять модели без переписки кода. Цены API (апрель–июль 2026): Seedance 2.0 Fast ~$0.09/сек (1080p, самый дешёвый прод-уровень), Kling 3.0 ~$0.10/сек, Runway Gen-4.5 ~$0.15/сек, Veo 3.1 Fast ~$0.15/сек (Standard $0.75/сек — топ качество, 4K+липсинк). Оживление фото пользователя = image-to-video (Kling/Luma — сильны именно в этом).
2. **Экономика:** ролик 10 сек ≈ $0.9–1.5 себестоимости → продавать кредитами (например, 10 генераций в Pro-подписке, дальше пакеты), не безлимитом.
3. **Монтаж своих фото/видео + музыки:** простые склейки/кроссфейды/текст цели — **ffmpeg.wasm прямо на клиенте** (бесплатно, приватно, офлайн); тяжёлый рендер (1080p60, длинные ролики) — серверный ffmpeg-воркер.
4. **Хранение:** Supabase Storage / S3 + CDN; клиент кэширует готовый ролик в IndexedDB — дальше он работает как обычный локальный видеофон (адаптер уже есть).

**Бэкенд-эволюция:** MVP — без сервера → Supabase (Auth + Postgres + Storage + Edge Functions: синк целей/настроек между устройствами, AI-джобы) → отдельный воркер очереди для рендеров. Локальный формат состояния уже сейчас сериализуемый — миграция на синк без боли.

## 9. Дорожная карта

| Фаза | Содержание | Результат |
|---|---|---|
| 1 (готово) | Web MVP: таймер+режимы, цели-«зачем», отрезки треков, видеофоны, кастомизация, RU/EN | проверка идеи на себе/друзьях |
| 1.5 | PWA-манифест, монорепо-рефакторинг (core/ui/adapters), статистика-стрики | установка на телефон, база для оболочек |
| 2a | Tauri 2 desktop (Win+mac): трей, автозапуск, нативные уведомления | «пробивные» напоминания |
| 2b | Supabase: аккаунты + синк; Spotify-адаптер | мультиустройство |
| 2c | AI-видео: генерация по цели, оживление фото, монтаж ffmpeg | ключевой дифференциатор |
| 3 | iOS + Android (Tauri mobile / Capacitor), сторы, монетизация $5–7/мес + кредиты | запуск |

## 10. Источники

- Конкуренты: [Flocus](https://flocus.com/), [LifeAt](https://lifeat.io/), [альтернативы LifeAt — seam](https://getseam.app/blog/lifeat-alternative), [Gridfiti: эстетичные таймеры](https://gridfiti.com/aesthetic-study-timers/), [Zapier: лучшие помодоро-приложения](https://zapier.com/blog/best-pomodoro-apps/), [Forest](https://forestapp.cc/), [обзор Forest 2026](https://calmevo.com/forest-app-review/), [DroidLore: фокус-приложения](https://droidlore.com/productivity/productivity-apps-focus)
- Цены музыки для фокуса: [Brain.fm vs Endel](https://gohomerelax.com/brain-fm-vs-endel/), [обзор Endel](https://www.autonomous.ai/ourblog/endel-app-review), [обзор Brain.fm 2026](https://earlystagemarketing.com/brain-fm-review/)
- Кроссплатформа: [сравнение 2026 (Flutter/RN/Tauri/Electron)](https://codenote.net/en/posts/cross-platform-dev-tools-comparison-2026/), [Tauri vs Electron 2026](https://tech-insider.org/tauri-vs-electron-2026/), [Framework Wars](https://www.moontechnolabs.com/blog/tauri-vs-electron-vs-flutter-vs-react-native/)
- iOS PWA push: [MagicBell: ограничения PWA на iOS](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide), [PWA push на iOS 2026](https://webscraft.org/blog/pwa-pushspovischennya-na-ios-u-2026-scho-realno-pratsyuye?lang=en), [Apple: Web Push docs](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)
- AI-видео API: [buildmvpfast: цены видео-API](https://www.buildmvpfast.com/api-costs/ai-video), [evolink: гид по моделям 2026](https://evolink.ai/blog/best-ai-video-generation-models-2026-pricing-guide), [Atlas Cloud: самые дешёвые API](https://www.atlascloud.ai/blog/guides/cheapest-ai-video-generation-api-2026), [Kling: цены](https://www.eesel.ai/blog/kling-ai-pricing)
