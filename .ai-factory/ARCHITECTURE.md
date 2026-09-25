# Архитектура: Feature-модули (Structured Modules)

## Обзор

Код организуется вокруг фич, а не технических слоёв: первична фича (чтение, поиск, закладки, настройки), внутри неё живут собственные UI-компоненты, хуки и доступ к данным. Это адаптация паттерна Structured Modules под React Native: роль Application Services выполняют кастомные хуки, роль репозиториев — api-модули фич, роль контроллеров — тонкие маршруты expo-router.

Паттерн выбран потому, что у проекта независимые фичи и почти нет сложных доменных правил (офлайн-читалка), нужен быстрый старт, а фичевая организация — фактический стандарт среднего React Native-приложения. Эволюционный путь открыт: при появлении настоящих доменных правил внутри фичи заводится `domain/`, и проект незаметно перейдёт к Explicit Architecture без переписывания.

## Обоснование выбора

- **Тип проекта:** офлайн-приложение без бэкенда, один разработчик
- **Стек:** TypeScript, React Native + Expo (expo-router, expo-sqlite)
- **Ключевой фактор:** независимые фичи при простом домене; высокая связность внутри фичи важнее формальных границ между слоями

## Структура папок

```
app/                        маршруты expo-router — тонкие файлы-обёртки
├── _layout.tsx             корневой layout: тема, шрифты, провайдеры
├── index.tsx               домашний экран
├── chapter/[book]/[chapter].tsx   экран главы
├── search.tsx              экран поиска
├── bookmarks.tsx           экран закладок
└── settings.tsx            экран настроек

features/
├── reading/                фича «чтение»
│   ├── components/         VerseList, VerseRow, ChapterHeader
│   ├── hooks/              useChapter, useReadingProgress
│   ├── api/                chapterRepository.ts — весь SQL этой фичи
│   └── index.ts            публичный API фичи
├── search/                 та же внутренняя структура
├── bookmarks/              та же внутренняя структура
└── settings/               та же внутренняя структура

components/                 общие UI-компоненты без доменной логики
db/                         подключение SQLite, схема, миграции, FTS-таблицы
theme/                      дизайн-токены: цвета, отступы, типографика
lib/                        утилиты без доменной логики
```

Путь-алиас `@/` указывает на корень проекта (tsconfig paths): `@/features/reading`, `@/db`, `@/theme`.

## Правила зависимостей

- ✅ `app/` (маршруты) → публичный API фичи (`features/<name>/index.ts`)
- ✅ `features/<name>` → `components/`, `theme/`, `db/`, `lib/`
- ✅ внутри фичи: `components/ → hooks/ → api/` (строго вниз)
- ❌ `features/a` → внутренности `features/b` (только через публичный `index.ts`)
- ❌ `components/` → `features/` (общие компоненты не знают о фичах)
- ❌ `hooks/` или `api/` → `components/` фичи (логика не тянет UI)
- ❌ SQL где-либо, кроме `api/` фичи
- ❌ `db/`, `theme/`, `lib/` → `features/` (общие модули не зависят от фич)

## Взаимодействие модулей

- Маршрут expo-router — тонкая обёртка: импортирует экран фичи через `index.ts` и передаёт параметры навигации
- Хук фичи — «контроллер»: владеет состоянием экрана, вызывает api-функции, возвращает данные и колбэки компонентам
- Api-модуль фичи — единственное место с SQL: принимает подключение из `db/`, возвращает типизированные модели
- Межфичевое взаимодействие — через публичный API чужой фичи; если связь становится тесной — общий код поднимается в `components/`, `db/`, `lib/`
- Глобальное состояние (тема, настройки) — React Context в корневом layout; стейт-менеджеры вводятся только при измеримой необходимости

## Ключевые принципы

1. **Тонкие экраны:** JSX маршрута только рендерит; логика — в хуках фичи
2. **SQL изолирован:** запросы живут только в `api/` фичи, экраны про SQL не знают
3. **Публичный API фичи:** наружу торчит только `index.ts` фичи
4. **Состояние по возрастанию сложности:** локальное в компоненте → Context для глобального → стейт-менеджер по необходимости (YAGNI)
5. **Дизайн-токены:** цвета, отступы и шрифты — из `theme/`, никаких магических значений в компонентах
6. **Эволюция без переписывания:** доменные правила, когда появятся, заводятся как `domain/` внутри фичи

## Примеры кода

### Структура фичи: api → hook → экран

```ts
// features/reading/api/chapterRepository.ts
import { getDatabase } from '@/db';

export interface Verse {
  id: number;
  number: number;
  text: string;
}

export async function getChapter(bookId: number, chapter: number): Promise<Verse[]> {
  const db = getDatabase();
  return db.getAllAsync<Verse>(
    'SELECT id, number, text FROM verses WHERE book_id = ? AND chapter = ? ORDER BY number',
    [bookId, chapter],
  );
}
```

```ts
// features/reading/hooks/useChapter.ts
import { useEffect, useState } from 'react';
import { getChapter, type Verse } from '../api/chapterRepository';

export function useChapter(bookId: number, chapter: number) {
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    getChapter(bookId, chapter)
      .then((rows) => {
        if (!cancelled) setVerses(rows);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause);
      });
    return () => {
      cancelled = true;
    };
  }, [bookId, chapter]);

  return { verses, error };
}
```

```tsx
// app/chapter/[book]/[chapter].tsx — маршрут-обёртка
import { ChapterScreen } from '@/features/reading';

export default function ChapterPage() {
  return <ChapterScreen />;
}
```

### Правило зависимостей: так нельзя, так можно

```tsx
// ❌ НЕЛЬЗЯ: SQL прямо в маршруте, минуя фичу
const db = useSQLiteContext();
const rows = await db.getAllAsync('SELECT * FROM verses WHERE ...');

// ✅ маршрут использует публичный API фичи
import { ChapterScreen } from '@/features/reading';
```

## Антипаттерны

- ❌ Толстый маршрут: логика и SQL прямо в файле экрана
- ❌ Импорт внутренностей чужой фичи (`features/search` → `features/reading/hooks/...`)
- ❌ Общий компонент, знающий о конкретной фиче
- ❌ Магические цвета/размеры в компонентах вместо токенов `theme/`
- ❌ Введение Redux/Zustand до появления измеримой проблемы
- ❌ Inline-стили и нестабильные колбэки в элементах FlatList — вынесены в `StyleSheet.create` и стабилизированы (см. скиллы vercel-react-native-skills и react-native-best-practices)
