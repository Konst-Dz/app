# Implementation Plan: Каркас Expo-проекта

Branch: feature/expo-scaffold
Created: 2026-09-25

## Original Request
каркас Expo-проекта

+ делаем init git

## Settings
- Testing: no
- Logging: verbose (но в каркасе логики нет; действует правило base.md — console.* только в dev)
- Docs: no (WARN [docs] only; README входит в задачи плана)

## Roadmap Linkage
Milestone: "Каркас Expo-проекта"
Rationale: План закрывает первый этап роадмапа — проект открывается в Expo Go на телефоне.

## Заметки по стратегии генерации

Корень проекта непустой (контекст AI Factory, AGENTS.md, .gitignore), поэтому `create-expo-app` запускается во временную папку, и файлы шаблона переносятся в репозиторий без затирания существующих. Конфликты (`.gitignore`) решаются ручным слиянием.

## Commit Plan
- **Commit 1** (после задач 1–2): `feat: scaffold expo app with strict typescript`
- **Commit 2** (после задач 3–6): `feat: feature folders, theme and tab navigation`
- **Commit 3** (после задач 7–9): `docs: add readme and push to github`

## Tasks

### Phase 1: Скелет Expo
- [ ] Task 1: Сгенерировать шаблон Expo и влить его в репозиторий
  - `npx create-expo-app@latest /tmp/expo-scaffold --template default --no-install`
  - Перенести все файлы шаблона из /tmp/expo-scaffold в корень проекта, КРОМЕ `.gitignore` и служебных (.git, node_modules)
  - Влить Expo-специфичные строки шаблонного `.gitignore` в существующий (если их там нет)
  - Удалить примеры шаблона: демонстрационные экраны в `app/`, примеры в `components/`, `hooks/`, `constants/` (оставить минимальный `app/_layout.tsx`)
  - `npm install` в корне проекта
  - Файлы: `package.json`, `app.json`, `app/`, `assets/`, `.gitignore`
  - Логирование: не требуется (нет логики)
- [ ] Task 2: Включить TypeScript strict и алиас путей (зависит от Task 1)
  - `tsconfig.json`: extends `expo/tsconfig.base`, `"strict": true`, `paths: { "@/*": ["./*"] }`
  - Проверка: `npx tsc --noEmit` проходит без ошибок
  - Логирование: не требуется

### Phase 2: Структура и тема
- [ ] Task 3: Создать структуру папок по архитектуре (зависит от Task 2)
  - `features/reading/`, `features/search/`, `features/bookmarks/`, `features/settings/` — в каждой `components/`, `hooks/`, `api/` и публичный `index.ts`
  - `db/database.ts`: открытие базы `openDatabaseSync('bible.db')` без схемы (схема — этап 2 роадмапа)
  - `theme/tokens.ts`, `lib/` — создать при задачах 4 и далее; пустые папки не коммитить
  - Файлы: `features/*/index.ts`, `db/database.ts`
  - Логирование: не требуется
- [ ] Task 4: Дизайн-токены и тема (зависит от Task 3)
  - `theme/tokens.ts`: палитра light/dark, отступы, размеры шрифта
  - `theme/ThemeContext.tsx`: Provider + хук `useTheme` (Context, без стейт-менеджера)
  - Подключение Provider в `app/_layout.tsx`
  - Логирование: не требуется
- [ ] Task 5: Таб-навигация и экраны-заглушки фич (зависит от Task 4)
  - Bottom tabs: Чтение / Поиск / Закладки / Настройки
  - Каждый таб — тонкий маршрут в `app/`, рендерит PlaceholderScreen из `features/<name>/index.ts`
  - `app/index.tsx` — экран чтения (первый таб)
  - Файлы: `app/_layout.tsx`, `app/index.tsx`, `app/search.tsx`, `app/bookmarks.tsx`, `app/settings.tsx`, `features/*/components/PlaceholderScreen.tsx`
  - Логирование: не требуется
- [ ] Task 6: ESLint и Prettier (зависит от Task 5)
  - `npx expo lint` (eslint-config-expo), `.prettierrc`
  - Скрипты `package.json`: `lint`, `format`, `typecheck`
  - Все предупреждения линтера устранены
  - Логирование: не требуется

### Phase 3: Витрина и GitHub
- [ ] Task 7: README для GitHub-витрины (зависит от Task 5)
  - На английском (публичный артефакт портфолио): описание, стек, запуск (`npm install`, `npx expo start`), раздел Roadmap
  - Файл: `README.md`
  - Логирование: не требуется
- [ ] Task 8: Проверка запуска в Expo Go (зависит от Task 6)
  - `npx expo start`, открыть по QR на телефоне
  - Чек-лист: приложение стартует, табы переключаются, тема применяется, `npm run typecheck` и `npm run lint` зелёные
  - Ручной шаг пользователя; агент помогает разбирать ошибки запуска
  - Логирование: ошибки запуска — вывод Metro в терминал
- [ ] Task 9: Создать репозиторий на GitHub и запушить (зависит от Task 8)
  - Проверить `gh auth status`; при отсутствии авторизации — вывести инструкцию `gh auth login`
  - `gh repo create <имя> --source . --push` (имя и видимость private/public уточнить у пользователя в момент выполнения)
  - Запушить `main` и `feature/expo-scaffold`
  - Логирование: вывод git remote/gh

<!-- Commit checkpoint: tasks 1-2 -->
<!-- Commit checkpoint: tasks 3-6 -->
<!-- Commit checkpoint: tasks 7-9 -->
