# AGENTS.md

> Карта проекта для AI-агентов. Обновляйте при существенных изменениях структуры проекта.

## Обзор проекта

Офлайн-приложение для чтения Библии на Android (React Native + Expo). Учебный проект-портфолио разработчика с full-stack бэкграундом; целевой результат — публикация в Google Play. Подробности — в `.ai-factory/DESCRIPTION.md`.

## Технологический стек

- **Язык:** TypeScript (strict mode)
- **Фреймворк:** React Native + Expo (expo-router, expo-sqlite)
- **База данных:** SQLite + FTS5, локальная, без сервера
- **Сборка/релиз:** EAS Build → Google Play

## Структура проекта

```
app/                      корень проекта (рабочая папка)
├── .agents/skills/       скиллы: aif-*, vercel-react-native-skills, react-native-best-practices
├── .ai-factory/          контекст агентов: описание, архитектура, правила, планы
├── app/                  маршруты expo-router (тонкие экраны-обёртки)
├── components/           общие UI-компоненты без домена
├── db/                   доступ к SQLite (database.ts)
├── features/             фичи: reading, search, bookmarks, settings (components/hooks/api + index.ts)
├── theme/                дизайн-токены (tokens.ts) и ThemeContext
└── assets/               иконки и сплэш
```

## Ключевые точки входа

| Файл | Назначение |
|------|------------|
| `package.json` | Зависимости (Expo SDK 57, RN 0.86) и скрипты: `start`, `lint`, `format`, `typecheck` |
| `app.json` | Конфигурация Expo (имя Bible Reader, схема biblereader) |
| `tsconfig.json` | Strict-конфигурация TypeScript, алиас `@/*` |
| `eslint.config.js` | ESLint на eslint-config-expo |
| `.ai-factory/config.yaml` | Конфиг AI Factory: языки (ru/ru), пути, git (включён) |

## Документация

| Документ        | Путь                          | Описание                                            |
| --------------- | ----------------------------- | --------------------------------------------------- |
| Спецификация    | `.ai-factory/DESCRIPTION.md`  | Обзор, функции, стек, нефункциональные требования   |
| Архитектура     | `.ai-factory/ARCHITECTURE.md` | Паттерн, слои, правила зависимостей между модулями  |
| Базовые правила | `.ai-factory/rules/base.md`   | Конвенции именования, обработки ошибок, логирования |

## AI Context Files

| Файл                          | Назначение                                        |
| ----------------------------- | ------------------------------------------------- |
| `AGENTS.md`                   | Этот файл — структурная карта проекта для агентов |
| `.ai-factory/DESCRIPTION.md`  | Спецификация проекта                              |
| `.ai-factory/ARCHITECTURE.md` | Архитектурные соглашения                          |
| `.ai-factory/rules/base.md`   | Правила кода, применяются перед реализацией       |

## Правила для агентов

- Разбивать составные shell-команды на отдельные шаги
  - Неправильно: `npm install && npm run start`
  - Правильно: сначала `npm install`, затем `npm run start`
- Язык кода — английский; комментарии в коде не пишутся (см. `.ai-factory/rules/base.md`)
- Общение с пользователем — на русском
- Доступ к SQLite изолировать в `db/`; экраны не пишут SQL
