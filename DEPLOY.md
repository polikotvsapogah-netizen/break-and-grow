# Деплой Break & Grow на твой GitHub (Pages)

Git-репозиторий уже создан локально (ветка `main`, первый коммит есть), workflow автодеплоя лежит в `.github/workflows/deploy.yml`. Осталось три шага.

## 1. Создай пустой репозиторий на GitHub

Открой https://github.com/new → имя, например `break-and-grow` → **не** добавляй README/.gitignore (репозиторий должен быть пустым) → Create repository.

## 2. Запушь проект

В терминале, в папке проекта:

```bash
cd ~/myai/BreakAndGrow2
git remote add origin https://github.com/ТВОЙ_ЛОГИН/break-and-grow.git
git push -u origin main
```

Если git спросит логин — используй Personal Access Token вместо пароля (GitHub → Settings → Developer settings → Tokens) или залогинься через GitHub Desktop / `gh auth login`.

## 3. Включи Pages

Репозиторий на GitHub → **Settings → Pages** → Source: **GitHub Actions**.

Всё: пуш в `main` уже запустил workflow (вкладка Actions). Через ~1 минуту приложение будет жить на

```
https://ТВОЙ_ЛОГИН.github.io/break-and-grow/
```

## Что получишь на URL

- Полноценный веб-апп: открывается с любого устройства
- PWA: в Chrome/Edge — кнопка «Установить» в адресной строке; на iPhone — Safari → Поделиться → «На экран Домой». Своя иконка, работает офлайн (service worker)
- Каждый следующий `git push` в `main` автоматически передеплоит сайт

## Проверка обновлений локально

```bash
npm install        # один раз
npm run dev        # разработка: http://localhost:5173
npm run build      # прод-сборка в dist/ (один файл + PWA-ассеты)
npm run preview    # посмотреть прод-сборку локально
```

Если хочешь — могу провести тебя по шагам 1–3 прямо в браузере (через расширение Claude in Chrome).
