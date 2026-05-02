# CLAUDE.md — naming.maze.uz

Правила работы с этим репозиторием для Claude Code и любых AI-ассистентов.
Любой PR, нарушающий правила ниже, считается невалидным и должен быть переделан.

## 1. Тех-стек и языки

- **Backend** — TypeScript **strict mode** во всех новых файлах (`functions/api/**`, `lib/**`, `tests/**`).
  - `tsconfig.json` с `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true`.
  - Wrangler нативно компилирует `.ts` для Cloudflare Pages Functions — отдельный билд-шаг для бэка не нужен.
  - Никаких `any`, `as unknown as X`, `// @ts-ignore`. Если тип не выводится — нужен честный тип или Zod-схема.
- **Frontend** — текущий vanilla JS в `public/index.html` остаётся; новые модули фронта пишем как отдельные `.ts`-файлы в `public/js/` и компилируем в JS через `esbuild` (один скрипт `npm run build:web`). Любой новый код фронта — TS strict.
- **Runtime** — Cloudflare Workers / Pages Functions. Никаких Node-специфичных API без явного обоснования.

## 2. Git-дисциплина

- **Каждая фича = отдельный коммит** с осмысленным сообщением (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
- Один коммит = одна логическая правка. Не смешиваем добавление промпта, UI-компонента и теста в один коммит.
- Все работы ведутся на ветке `claude/enhance-naming-tool-yS0IN` (или ветках, явно одобренных владельцем).
- Никаких force-push в `main`. Никаких `--no-verify`.

## 3. Тесты

- Тесты на **Vitest**. Структура — `tests/**/*.test.ts` зеркалит `lib/**`.
- **Логика проверки коннотаций — критичная зона. Покрытие тестами обязательно.**
  - Минимум 30 кейсов в `tests/connotation.test.ts`: явные негативы на UZ/RU/EN, фонетические совпадения с крупными брендами (apple, google, coca, pepsi, nike), ложные срабатывания (имена которые ДОЛЖНЫ пройти).
  - Изменение `lib/connotation/**` без обновления тестов запрещено.
- Зодовские схемы для всех внешних JSON-ответов (Anthropic API, платёжные webhooks).
- `npm test` должен проходить локально и в CI до мержа.

## 4. UI и дизайн-система MAZE

- Используем существующие токены из `public/index.html` `:root` (тёмная) и `[data-theme="light"]` (светлая):
  - шрифты: `Syne` (display), `DM Sans` (body), `DM Mono` (моно/пилюли)
  - акцент тёмной темы — `#7fff6e`, светлой — `#2db81a`
  - радиусы `--radius-sm: 8px`, `--radius: 14px`, `--radius-lg: 20px`
- Новые компоненты должны переиспользовать существующие классы (`.fp`, `.card`, `.modal-card`, `.fp-pill` и т. д.) или расширять их через `--`-переменные. Никаких чужеродных шрифтов/цветов без обновления токенов.
- Превью имён (Фича 3) — отдельная палитра ч/б (`#0a0a0a`/`#fafafa`/один серый), но карточка-обёртка использует общие токены. Стиль — Apple/Linear, не Canva.
- Поддерживаем обе темы (light/dark) для каждого нового компонента.

## 5. Промпты к Claude API

- **Все промпты к Claude API хранятся в `lib/prompts/` как отдельные файлы.**
  - Пример: `lib/prompts/generate.ts`, `lib/prompts/analyse.ts`, `lib/prompts/connotation-check.ts`, `lib/prompts/inspiration/uzbek.ts`.
  - Каждый файл экспортирует чистую функцию `(input) => { system, user }` либо именованные строковые константы.
- Inline-промпты в `functions/api/*.ts` запрещены. В роуте — только сборка input → вызов промпт-функции → вызов API → парсинг через Zod.
- Используем `prompt caching` (`cache_control`) для системных промптов, которые не меняются между запросами.
- Дефолтные модели:
  - генерация имён: `claude-sonnet-4-6`
  - проверка коннотаций (критично): `claude-opus-4-7`
  - анализ имени: `claude-sonnet-4-6`
- ID моделей зашиты в `lib/anthropic/models.ts` — не дублировать строку в нескольких файлах.

## 6. Никаких placeholder-данных в финальном коде

- В мерж-коде запрещены: `TODO`, `FIXME`, `lorem ipsum`, `Имя примера`, `example.com`, hardcoded `"sample"` имена, мок-объекты, возвращаемые из продакшен-роутов.
- Если в фиче нужен demo-режим (например, платежи без реальных ключей) — он включается **только** через `env.PAYMENTS_MODE === 'demo'` и явно описан в README. Демо-ветка не должна быть путём по умолчанию в production.
- Тестовые фикстуры живут в `tests/fixtures/**` и не импортируются из `lib/` или `functions/`.

## 7. Структура каталогов (после рефакторинга)

```
functions/api/        # Cloudflare Pages Functions (роуты, .ts)
lib/
  prompts/            # все промпты к Claude API
  connotation/        # blacklist + логика проверки
  payments/           # Click / Payme / Stripe провайдеры
  pdf/                # шаблон и рендер PDF-брифа
  anthropic/          # клиент + ID моделей
  domains/            # проверка .com / .uz / .com.uz
public/
  index.html          # legacy vanilla — постепенно вычищается
  js/                 # новый TS-код фронта (компилируется в public/dist/)
tests/                # Vitest, зеркалит lib/
src/index.js          # Worker-роутер (тонкая обёртка)
```

## 8. Проверки перед коммитом

1. `npm run typecheck` — `tsc --noEmit` зелёный
2. `npm test` — все тесты проходят
3. Ручная проверка изменённого UI в обеих темах
4. Никаких секретов / `.env` / API-ключей в diff
