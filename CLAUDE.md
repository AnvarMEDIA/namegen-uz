# CLAUDE.md — naming.maze.uz

Правила работы с этим репозиторием для Claude Code и любых AI-ассистентов.
Любой PR, нарушающий правила ниже, считается невалидным и должен быть переделан.

Этот файл описывает **РЕАЛЬНЫЙ продакшен** [naming.maze.uz](https://naming.maze.uz/),
а не какие-то ранние эскизы. Дизайн-система зафиксирована в `index.html` и
`name.html` корня репозитория. Любой новый код обязан вписываться в эту систему.

## 1. Тех-стек и языки

### Что есть сейчас (продакшен)

- **Frontend** — vanilla HTML/CSS/JS в `index.html` и `name.html` в корне
  репозитория. Все стили инлайн в `<style>`, скрипты в `<script>`. Сборки нет.
- **Backend** — Vercel Serverless Functions в `api/**/*.js` (vanilla JS,
  CommonJS-style `module.exports`). Дополнительно `server.js` (Express)
  — **только** для локального dev, в продакшене не используется.
- **Runtime** — Vercel Node.js Serverless Functions. Edge включаем явно через
  `export const config = { runtime: 'edge' }` только когда есть измеримый выигрыш.

### Что добавляем (общее правило для нового кода)

- **TypeScript strict mode** во всех **новых** файлах под `api/**`, `lib/**`,
  `tests/**`. Существующие `api/*.js` не переписываем «походя» — миграция файла
  на `.ts` идёт **отдельным коммитом**, без смены поведения.
  - `tsconfig.json` с `"strict": true`, `"noUncheckedIndexedAccess": true`,
    `"noImplicitOverride": true`, `"exactOptionalPropertyTypes": true`.
  - Никаких `any`, `as unknown as X`, `// @ts-ignore`. Если тип не выводится —
    нужен честный тип или Zod-схема.
  - Vercel компилирует `.ts` нативно, отдельный билд-шаг для бэка не нужен.
- **Vercel.json** обязан содержать `framework: null`, `buildCommand: null`,
  `outputDirectory: null`, чтобы Vercel не пытался авто-детектить как Node app.
- **Никаких новых зависимостей фронта** без явного согласования. Если
  понадобится TS на фронте — компилируем `public/js/**.ts` через `esbuild`
  одним скриптом `npm run build:web`, без Webpack/Vite/Next.

## 2. Дизайн-система MAZE (зафиксирована, не отступаем)

### Шрифты

- **Manrope** — display + body. Веса в проде: `400, 500, 600, 700, 800` (900
  только в `.logo-mark`). Подгружается через Google Fonts, см. `<head>`.
- **JetBrains Mono** — все микро-метки, eyebrow-строки, mono-пилюли,
  technical-метаданные. Веса `400, 500`.
- Никаких **Syne, DM Sans, Fraunces, Inter, IBM Plex** и т. п. без
  согласования + расширения этого раздела.

### Палитра — DARK (default)

```
--bg          #0A0A0D    ← cool blue-undertone
--bg2         #111114
--bg3         #17171B
--bg4         #1F1F24
--border      #1E1E22
--border2     #2A2A30
--border3     #3D3D44
--text        #F2F2EE    ← warm off-white, не чистый #FFF
--text2       #A0A0A6
--text3       #5C5C63
--text4       #2E2E33
--accent      #C4FF3F    ← electric lime
--accent2     #D9FF6E    ← lighter lime для hover2
--accent-deep #A7E12B    ← richer lime для hover
--ink         #0A0A0D    ← цвет текста на accent-фоне
```

### Палитра — LIGHT

```
--bg          #FFFFFF    ← pure white
--bg2         #F7F7F5
--bg3         #EFEFEC
--bg4         #E2E2DE
--border      #EAEAE5
--border2     #D5D5CF
--border3     #A8A8A2
--text        #0A0A0C
--text2       #4A4A4D
--text3       #8A8A85
--text4       #C8C8C2
--accent      #3D7A0E    ← darker lime для WCAG-контраста
--accent2     #4D8F18
--accent-deep #2E5C0A
--ink         #FFFFFF
```

### Радиусы

```
--radius-sm   8px
--radius     12px
--radius-lg  18px
--radius-xl  28px
```

### Прочие токены

- `--header-bg` — полупрозрачный фон шапки с `backdrop-filter: blur(18px)
  saturate(160%)`.
- `--shadow-card`, `--shadow-accent`, `--focus-ring` — единые тени и outline.
- `--grid-line` — фоновая сетка `64px×64px` с radial-mask, рендерится в
  `body::before`.
- `--scr-shadow` — свечение под `.scr-word` (loader, hero accent).
- Дополнительные кастомные переменные для конкретных компонентов
  (`--uz-free-*`, `--card-fv-*`, `--sc-*`, `--eyebrow-border`, `--adim`,
  `--aglow`) — переиспользуем, не вводим новых дублей.

### Существующие компоненты для переиспользования

Все ниже **уже есть** в `index.html` / `name.html`. Новый код **обязан**
переиспользовать эти классы или расширять их через CSS-переменные. Никаких
новых одноразовых стилей.

- **Layout / chrome:** `.marquee`, `.marquee-track`, `header`, `.logo`,
  `.logo-mark`, `.logo-slash`, `.logo-sub`, `.theme-btn`, `nav`, `.nbtn`,
  `.badge`, `main`.
- **Hero:** `.hero`, `.hero-eyebrow`, `.hero h1`, `.hero p`, `.hero-stats`,
  `.stat`, `.stat-num`, `.stat-lbl`.
- **Search box:** `.sbox`, `.irow`, `.inp-wrap`, `.inp`, `.inp-icon`,
  `.clr-btn`, `.gbtn`.
- **Filter panels:** `.filter-panels`, `.fp`, `.fp-header`, `.fp-title`,
  `.fp-pill`, `.fp-chevron`, `.fp-body`, `.style-grid`, `.rand-list`,
  `.sc`, `.sc-radio`, `.sc-text`, `.sc-name`, `.sc-desc`, `.sc-badge`.
- **Loader:** `.loader-wrap`, `.scr-word`, `.loader-msg`, `.loader-bar`,
  `.loader-fill`.
- **Состояния:** `.empty`, `.empty-icon`, `.errbox`, `.rh`, `.rh-count`,
  `.rh-sub`.
- **Карточки результатов:** `.grid` (4 колонки), `.card`, плюс модалка
  карточки.

### Темы

- Поддерживаем **обе темы** (light/dark) для каждого нового компонента.
- Переключение — через атрибут `data-theme="light"` на `<html>`. Без хака
  `prefers-color-scheme` в CSS — только через токены.
- Новые компоненты не должны задавать цвета хардкодом (`#fff`, `#000`,
  `rgba(255,255,255,…)`). Только через `var(--…)`.

### Превью имён (Фича 3)

- Превью — отдельный визуальный «остров» внутри карточки результата и в
  модалке детальной страницы.
- Использует **те же шрифты что и весь сайт** (Manrope display + JetBrains
  Mono labels) — никакого Fraunces/Syne.
- Фон острова — `var(--bg)` поверх `var(--bg2)` карточки, hairline через
  `1px solid var(--border)`. Никакого хардкода `#fff`/`#000`.
- В обеих темах смотрится одинаково «строго», без нарушения общей палитры.
- Состав: 2 строки в карточке (display + label/mono), 3 строки в модалке.

## 3. Безопасность — продакшен-инварианты (НЕ ослаблять)

В `api/generate.js` и `vercel.json` уже есть набор защит. **Любой новый код
обязан их сохранять**. Ослабление = блокировка PR.

- **Rate-limit** в `api/generate.js` (in-memory bucket, по IP). При миграции
  на TS — переносим логику 1:1.
- **Origin allow-list**: `Origin` header проверяется на `naming.maze.uz` и
  локалхост. Чужие Origin → 403.
- **Prompt-injection protection**: пользовательский ввод (`description`,
  `style`, `randomness`) санитизируется и проверяется по white-list **до**
  включения в prompt. Никакого «вставим userInput в system».
- **Strict enum validation**: `style` и `randomness` валидируются как
  enum-значения (только из списка). Любое другое → 400.
- **Structured security logging**: события (rate-limit-hit, origin-denied,
  enum-rejected, prompt-injection-suspected) логируются в `console.error`
  c полем `event` для grep-а в Vercel-логах.
- **Security headers** в `vercel.json`:
  - `Content-Security-Policy` (строгий, без `unsafe-eval`)
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`

При добавлении любого нового `api/**` файла — те же защиты применяются и
к нему. Если нужен дополнительный inbound, расширяем CSP `connect-src`
явно с обоснованием в коммите.

## 4. Git-дисциплина

- **Каждая фича = отдельный коммит** с осмысленным сообщением (`feat:`,
  `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `security:`).
- Один коммит = одна логическая правка. Не смешиваем добавление промпта,
  UI-компонента и теста в один коммит.
- Все работы ведутся на ветке `claude/enhance-from-current` (или ветках,
  явно одобренных владельцем).
- **Старые ветки не трогаем**: `claude/migrate-to-maze-subdomain-05f7h`
  (продакшен), `claude/enhance-naming-tool-yS0IN` (старые наработки) —
  read-only архив.
- Никаких force-push в `main`. Никаких `--no-verify`.

## 5. Тесты

- Тесты на **Vitest**. Структура — `tests/**/*.test.ts` зеркалит `lib/**`.
- **Логика проверки коннотаций — критичная зона. Покрытие тестами обязательно.**
  - Минимум 30 кейсов в `tests/connotation.test.ts`: явные негативы на UZ/RU/EN,
    фонетические совпадения с крупными брендами (apple, google, coca, pepsi,
    nike), ложные срабатывания (имена которые ДОЛЖНЫ пройти).
  - Изменение `lib/connotation/**` без обновления тестов запрещено.
- Зодовские схемы для всех внешних JSON-ответов (Anthropic API, платёжные
  webhooks).
- `npm test` должен проходить локально и в CI до мержа.
- CI (`.github/workflows/deploy.yml`) запускает `npm run typecheck` и
  `npm test` на каждый push/PR.

## 6. Промпты к Claude API

- **Все промпты к Claude API хранятся в `lib/prompts/` как отдельные файлы.**
  - Пример: `lib/prompts/generate.ts`, `lib/prompts/analyse.ts`,
    `lib/prompts/connotation-check.ts`, `lib/prompts/inspiration/uzbek.ts`.
  - Каждый файл экспортирует чистую функцию `(input) => { system, user }` либо
    именованные строковые константы.
- Inline-промпты в `api/*.{js,ts}` запрещены. В роуте — только сборка input →
  вызов промпт-функции → вызов API → парсинг через Zod.
- Используем `prompt caching` (`cache_control`) для системных промптов, которые
  не меняются между запросами.
- **Дефолтные модели** (зашиты в `lib/anthropic/models.ts`, не дублировать):
  - генерация имён: `claude-sonnet-4-6`
  - проверка коннотаций (критично): `claude-opus-4-7`
  - анализ имени: `claude-sonnet-4-6`

## 7. Никаких placeholder-данных в финальном коде

- В мерж-коде запрещены: `TODO`, `FIXME`, `lorem ipsum`, `Имя примера`,
  `example.com`, hardcoded `"sample"` имена, мок-объекты, возвращаемые из
  продакшен-роутов.
- Если в фиче нужен demo-режим (например, платежи без реальных ключей) — он
  включается **только** через `env.PAYMENTS_MODE === 'demo'` и явно описан в
  README. Демо-ветка не должна быть путём по умолчанию в production.
- Тестовые фикстуры живут в `tests/fixtures/**` и не импортируются из
  `lib/` или `api/`.

## 8. Структура каталогов

Текущая (после миграции на Vercel + naming.maze.uz):

```
api/                         # Vercel Serverless Functions (file-system routing)
  generate.js                # POST /api/generate  (продакшен, JS — мигрируем в .ts отдельным коммитом)
  check-uz/[name].js         # GET  /api/check-uz/:name
  check-tg/[name].js         # GET  /api/check-tg/:name
  check-ig/[name].js         # GET  /api/check-ig/:name
lib/                         # общий TS-код (создаётся по мере миграции)
  anthropic/                 # клиент + ID моделей (models.ts, client.ts)
  prompts/                   # все промпты к Claude API
  schemas/                   # Zod-схемы и нормализация ответов AI
  connotation/               # blacklist + логика проверки (Фича 2)
  payments/                  # Click / Payme / Stripe провайдеры (Фича 5)
  pdf/                       # шаблон и рендер PDF-брифа (Фича 4)
  domains/                   # проверка .com / .uz / .com.uz
public/                      # статика, отдаваемая Vercel-ом 1:1 (если появится)
  js/                        # новый TS-код фронта (компилируется в public/dist/)
tests/                       # Vitest, зеркалит lib/
index.html                   # production-фронт (vanilla, в корне)
name.html                    # детальная страница имени (в корне)
server.js                    # Express, ТОЛЬКО для локального dev
vercel.json                  # конфиг Vercel
```

## 9. Проверки перед коммитом

1. `npm run typecheck` — `tsc --noEmit` зелёный (после добавления TS).
2. `npm test` — все тесты проходят (после добавления Vitest).
3. **Ручная проверка изменённого UI в обеих темах** (light + dark)
   на двух разрешениях: 1280px и 360px.
4. Никаких секретов / `.env` / API-ключей в diff.
5. Прод-инварианты безопасности из §3 не ослаблены.
6. Все новые цвета/шрифты/радиусы — через существующие CSS-токены §2.
