#!/usr/bin/env node
// One-off translation helper. Reads source HTML and applies an ordered
// list of Russian → target replacements. Order is long-to-short so
// substrings don't get re-translated.
//
// Run:
//   node scripts/translate-locale.cjs uz uz.html
//   node scripts/translate-locale.cjs en en.html

const fs = require('fs');
const path = require('path');

const [, , locale, outFile] = process.argv;
if (!locale || !outFile) {
  console.error('Usage: node translate-locale.cjs <uz|en> <out.html>');
  process.exit(1);
}

const src = fs.readFileSync(path.join(__dirname, '..', outFile), 'utf8');

const UZ = {
  // ── header / nav ────────────────────────────────────────
  'Сменить тему оформления': 'Mavzu turini almashtirish',
  'Сменить тему': 'Mavzu almashtirish',
  '>Генератор<': '>Generator<',
  '>Избранное\n        ': '>Saqlanganlar\n        ',
  'naming</span>': 'naming</span>',  // logo subtitle stays

  // ── hero ────────────────────────────────────────────────
  'Придумайте <em>имя</em> для бренда': 'Brend uchun <em>nom</em> tanlang',
  'Шаг 1 из 4 к полноценному бренду': 'To‘liq brendga — 4 ta bosqichdan birinchisi',
  'Опишите идею — соберём 8 вариантов с автопроверкой <strong>.uz</strong>, <strong>Telegram</strong> и <strong>Instagram</strong>.':
    'G‘oyangizni yozing — <strong>.uz</strong>, <strong>Telegram</strong> va <strong>Instagram</strong> tekshiruvi bilan 8 ta variantni yig‘amiz.',

  // ── search box ──────────────────────────────────────────
  'кофе, доставка, Ташкент...': 'qahva, yetkazib berish, Toshkent...',
  '>Сгенерировать<': '>Yaratish<',
  'Очистить поле ввода': 'Maydonni tozalash',

  // ── stats ───────────────────────────────────────────────
  'имён за раз': 'nomlar bir vaqtda',
  'канала проверки': 'tekshiruv kanali',
  'языка теглайнов': 'tagline tili',

  // ── filter panels ───────────────────────────────────────
  'Стиль нейминга': 'Nomlash uslubi',
  '>Авто</span>': '>Avto</span>',
  '>Случайность<': '>Tasodifiylik<',
  '>Средняя</span>': '>O‘rta</span>',
  '>Источник вдохновения<': '>Ilhom manbai<',
  '>Не выбран</span>': '>Tanlanmagan</span>',

  // ── loader ──────────────────────────────────────────────
  'ИИ генерирует названия': 'AI nomlarni yaratmoqda',

  // ── empty / errors ──────────────────────────────────────
  'Введите ключевые слова<br><strong>например: «органическая косметика Ташкент»</strong>':
    'Kalit so‘zlarni kiriting<br><strong>masalan: «Toshkentdagi organik kosmetika»</strong>',

  // ── modal ───────────────────────────────────────────────
  'Закрыть окно': 'Oynani yopish',
  '>Подробнее\n          <svg': '>Batafsil\n          <svg',
  '>Копировать\n          </button>': '>Nusxa olish\n          </button>',

  // ── seo: how it works ──────────────────────────────────
  'Как работает': 'Qanday ishlaydi',
  'От идеи до имени за <em>10 секунд</em>': 'G‘oyadan nomgacha — <em>10 soniyada</em>',
  '>Опишите идею</h3>': '>G‘oyangizni yozing</h3>',
  'Введите ключевые слова о бренде: сфера, ценности, аудитория, регион. Можно по-русски или на узбекском.':
    'Brend haqida kalit so‘zlarni kiriting: yo‘nalish, qadriyatlar, auditoriya, mintaqa. O‘zbek yoki rus tilida bo‘lishi mumkin.',
  '>Выберите стиль</h3>': '>Uslubni tanlang</h3>',
  'Брендовые, ассоциативные, составные, узбекские корни — 8 направлений нейминга на выбор.':
    'Brendli, assotsiativ, qo‘shma, o‘zbek o‘zaklari — 8 ta nomlash yo‘nalishidan tanlang.',
  '>AI создаёт 8 имён</h3>': '>AI 8 ta nom yaratadi</h3>',
  'Claude генерирует названия с теглайнами на русском и узбекском за несколько секунд.':
    'Claude bir necha soniyada o‘zbek va rus tilidagi tagline’lar bilan nomlarni yaratadi.',
  '>Проверяем доступность</h3>': '>Mavjudligini tekshiramiz</h3>',
  'Автопроверка домена .uz, юзернейма в Telegram и Instagram в реальном времени.':
    '.uz domen, Telegram va Instagram’dagi foydalanuvchi nomini real vaqtda avtomatik tekshirish.',

  // ── seo: why ───────────────────────────────────────────
  'Почему MAZE Naming': 'Nega aynan MAZE Naming',
  'Не просто генератор слов — <em>инструмент брендинга</em>':
    'Oddiy so‘z generatori emas — <em>brending vositasi</em>',
  '<b>Первый на узбекском языке</b>': '<b>O‘zbek tilidagi birinchi</b>',
  'Единственный AI-генератор имён бренда, обученный на корпусе узбекских корней. Поддержка кириллицы и латиницы.':
    'O‘zbek o‘zaklari korpusi asosida o‘qitilgan yagona AI brend nomi generatori. Kirill va lotin yozuvini qo‘llaydi.',
  '<b>Проверка .uz, Telegram, Instagram</b>': '<b>.uz, Telegram, Instagram tekshiruvi</b>',
  'RDAP-проверка домена .uz, верификация юзернеймов в соцсетях — всё за один заход без переключения вкладок.':
    '.uz domen uchun RDAP tekshiruvi, ijtimoiy tarmoqlardagi foydalanuvchi nomlari — bir joyda, ilovalararo o‘tmasdan.',
  '<b>8 вариантов за один запрос</b>': '<b>Bir so‘rovda 8 ta variant</b>',
  'Не одно имя, а целый шортлист. С теглайнами на русском и узбекском для презентации команде или клиенту.':
    'Bitta emas, balki butun bir ro‘yxat. Jamoaga yoki mijozga taqdim etish uchun o‘zbek va rus tilidagi tagline’lar bilan.',
  '<b>Бесплатно, без регистрации</b>': '<b>Bepul, ro‘yxatsiz</b>',
  'Никаких форм, аккаунтов или подписок. Открыли сайт — и работаете.':
    'Hech qanday forma, akkaunt yoki obuna shart emas. Saytni ochasiz — va ishlaysiz.',
  '<b>8 стилей нейминга</b>': '<b>8 ta nomlash uslubi</b>',
  'Брендовые (Google, Rolex), ассоциативные (RedBull), составные (FedEx), реальные слова (Apple), узбекские корни (Nurli, Baxtzor) и др.':
    'Brendli (Google, Rolex), assotsiativ (RedBull), qo‘shma (FedEx), haqiqiy so‘zlar (Apple), o‘zbek o‘zaklari (Nurli, Baxtzor) va boshqalar.',
  '<b>От ведущей студии Узбекистана</b>': '<b>O‘zbekistondagi yetakchi studiyadan</b>',
  'MAZE Studio — брендинг и дизайн в Ташкенте с 2020 года. 200+ проектов, клиенты: Kapital Bank, Beeline, Payme.':
    'MAZE Studio — 2020 yildan beri Toshkentda brending va dizayn bilan shug‘ullanadi. 200+ loyiha, mijozlar: Kapital Bank, Beeline, Payme.',

  // ── seo: faq ───────────────────────────────────────────
  'Частые вопросы о генераторе названий': 'Nom generatori haqida tez-tez beriladigan savollar',
  'Как работает AI-генератор названий MAZE?': 'MAZE AI nom generatori qanday ishlaydi?',
  'Опишите идею бренда — AI создаст 8 уникальных названий и автоматически проверит доступность домена .uz, Telegram и Instagram.':
    'Brend g‘oyasini tasvirlab bering — AI 8 ta noyob nom yaratadi va .uz domen, Telegram va Instagram’da nomning bo‘shligini avtomatik tekshiradi.',
  'Это бесплатно?': 'Bu bepulmi?',
  'Да, генератор названий MAZE Naming полностью бесплатный. Без регистрации, без лимитов на количество запросов.':
    'Ha, MAZE Naming nom generatori to‘liq bepul. Ro‘yxatdan o‘tish shart emas, so‘rovlar soniga chek qo‘yilmagan.',
  'На каких языках работает генератор?': 'Generator qaysi tillarda ishlaydi?',
  'MAZE Naming — первый AI-генератор названий с поддержкой узбекского языка (корпус узбекских корней: нур, меҳр, ақл, юлдуз и др.). Также поддерживает русский и английский.':
    'MAZE Naming — o‘zbek tilini qo‘llab-quvvatlovchi birinchi AI nom generatori (o‘zbek o‘zaklari korpusi: nur, mehr, aql, yulduz va boshqalar). Rus va ingliz tillarini ham qo‘llaydi.',
  'Что делать после того, как я нашёл название?': 'Nom topganimdan keyin nima qilish kerak?',
  'Следующий шаг — построить вокруг названия бренд: логотип, фирменный стиль, упаковку. Студия <a href="https://www.maze.uz/" target="_blank" rel="noopener noreferrer">MAZE</a> специализируется на этом — 200+ проектов, клиенты Kapital Bank, Beeline, Payme. <a href="https://www.maze.uz/brief" target="_blank" rel="noopener noreferrer">Заполните бриф проекта</a> — ответим за 24 часа.':
    'Keyingi qadam — nom atrofida brend qurish: logotip, firma uslubi, qadoq. <a href="https://www.maze.uz/" target="_blank" rel="noopener noreferrer">MAZE</a> studiyasi shu bilan shug‘ullanadi — 200+ loyiha, mijozlari Kapital Bank, Beeline, Payme. <a href="https://www.maze.uz/brief" target="_blank" rel="noopener noreferrer">Loyihalovchi briefni to‘ldiring</a> — 24 soat ichida javob beramiz.',
  'Можно ли использовать сгенерированные названия коммерчески?': 'Yaratilgan nomlardan tijoriy maqsadda foydalanish mumkinmi?',
  'Да. Перед регистрацией торговой марки рекомендуется проверить уникальность через Агентство по интеллектуальной собственности Республики Узбекистан.':
    'Ha. Savdo belgisini ro‘yxatdan o‘tkazishdan oldin O‘zbekiston Respublikasi Intellektual mulk agentligi orqali nomning noyobligini tekshirish tavsiya etiladi.',

  // ── seo: about ─────────────────────────────────────────
  'О студии': 'Studiya haqida',
  'MAZE — брендинг из <em>Ташкента</em>': 'MAZE — <em>Toshkent</em>dan brending',
  'MAZE Naming — часть экосистемы <a href="https://www.maze.uz/" target="_blank" rel="noopener noreferrer">MAZE Studio</a>, брендинг- и дизайн-агентства из Ташкента с 2020 года. Команда разрабатывает <a href="https://www.maze.uz/services#naming" target="_blank" rel="noopener noreferrer">услуги нейминга</a>, фирменный стиль, упаковку и веб-дизайн для клиентов в Узбекистане и Центральной Азии. Среди них — Kapital Bank, Beeline, Payme и ещё 80+ компаний. Посмотрите <a href="https://www.maze.uz/portfolio" target="_blank" rel="noopener noreferrer">портфолио брендинга MAZE</a>, узнайте больше <a href="https://www.maze.uz/about" target="_blank" rel="noopener noreferrer">о студии MAZE</a> или сразу <a href="https://www.maze.uz/brief" target="_blank" rel="noopener noreferrer">заполните бриф проекта</a> — ответим в течение 24 часов.':
    'MAZE Naming — <a href="https://www.maze.uz/" target="_blank" rel="noopener noreferrer">MAZE Studio</a> ekotizimining bir qismi, 2020 yildan beri Toshkentda faoliyat yurituvchi brending va dizayn agentligi. Jamoa O‘zbekiston va Markaziy Osiyodagi mijozlar uchun <a href="https://www.maze.uz/services#naming" target="_blank" rel="noopener noreferrer">nomlash xizmatlari</a>, firma uslubi, qadoq va veb-dizayn ishlab chiqadi. Mijozlar orasida — Kapital Bank, Beeline, Payme va yana 80+ ta kompaniya. <a href="https://www.maze.uz/portfolio" target="_blank" rel="noopener noreferrer">MAZE brending portfolioni</a> ko‘ring, <a href="https://www.maze.uz/about" target="_blank" rel="noopener noreferrer">MAZE studiyasi haqida</a> ko‘proq bilib oling yoki to‘g‘ridan-to‘g‘ri <a href="https://www.maze.uz/brief" target="_blank" rel="noopener noreferrer">loyiha briefini to‘ldiring</a> — 24 soat ichida javob beramiz.',

  // ── nxt section ────────────────────────────────────────
  '>СЛЕДУЮЩИЙ ШАГ<': '>KEYINGI QADAM<',
  'У тебя есть имя.<br>Теперь нужна личность.': 'Sizda nom bor.<br>Endi shaxsiyat kerak.',
  'Логотип. Цвета. Типографика. Брендбук. MAZE превращает имена в бренды — <span data-maze-years>6 лет</span>, 200+ проектов. Заполни бриф за 3 минуты — ответим за 24 часа.':
    'Logotip. Ranglar. Tipografiya. Brendbook. MAZE nomlarni brendlarga aylantiradi — <span data-maze-years>6 yil</span>, 200+ loyiha. Briefni 3 daqiqada to‘ldiring — 24 soat ichida javob beramiz.',
  'Заполнить бриф →': 'Briefni to‘ldirish →',
  'Смотреть работы MAZE': 'MAZE ishlarini ko‘rish',

  // ── footer cta ─────────────────────────────────────────
  'Давайте создадим<br><em>смелый</em> бренд.': 'Birgalikda yaratamiz<br><em>jasur</em> brend.',
  'Заполнить бриф ↗': 'Briefni to‘ldirish ↗',
  '200+ брендов · Ташкент, Узбекистан': '200+ ta brend · Toshkent, O‘zbekiston',
  'Контакты MAZE Studio': 'MAZE Studio bilan aloqa',

  // ── toast ──────────────────────────────────────────────
  '>Имя сохранено.<': '>Nom saqlandi.<',
  'Следующий шаг — заполнить бриф. Это займёт 3 минуты.': 'Keyingi qadam — briefni to‘ldirish. Bu 3 daqiqa oladi.',
  '>Закрыть<': '>Yopish<',
  '>\n    Заполнить бриф →\n  </a>': '>\n    Briefni to‘ldirish →\n  </a>',

  // ── noscript ───────────────────────────────────────────
  '<strong>Для генерации названий включите JavaScript.</strong>': '<strong>Nom yaratish uchun JavaScript’ni yoqing.</strong>',
  'Информационные разделы ниже доступны и без него.': 'Quyidagi axborot bo‘limlari JavaScript’siz ham mavjud.',

  // ── favorites view ─────────────────────────────────────
  '>\n          Избранное\n          ': '>\n          Saqlanganlar\n          ',
  'Ваши сохранённые названия': 'Saqlangan nomlaringiz',
  '"Скопировать все"': '"Hammasini nusxa olish"',
  'Скопировать все': 'Hammasini nusxa olish',
  '"Очистить список"': '"Ro‘yxatni tozalash"',
  '>\n          Очистить\n        </button>': '>\n          Tozalash\n        </button>',
  'Список избранного пуст': 'Saqlanganlar ro‘yxati bo‘sh',
  'Нажимайте <strong>В избранное</strong> на карточках, чтобы сохранять понравившиеся названия':
    'Yoqqan nomlarni saqlash uchun karta ustida <strong>Saqlash</strong> tugmasini bosing',

  // ── JS strings: ST array ──────────────────────────────
  "{id:'auto',       l:'Авто',                   badge:'new', desc:'Все стили — ИИ выбирает лучший'}":
    "{id:'auto',       l:'Avto',                   badge:'new', desc:'Barcha uslublar — AI eng yaxshisini tanlaydi'}",
  "{id:'brandable',  l:'Брендовые',                           desc:'как Google и Rolex'}":
    "{id:'brandable',  l:'Brendli',                            desc:'Google va Rolex kabi'}",
  "{id:'evocative',  l:'Ассоциативные',                       desc:'как RedBull и Forever21'}":
    "{id:'evocative',  l:'Assotsiativ',                        desc:'RedBull va Forever21 kabi'}",
  "{id:'compound',   l:'Составные слова',                     desc:'как FedEx и Microsoft'}":
    "{id:'compound',   l:'Qo‘shma so‘zlar',                    desc:'FedEx va Microsoft kabi'}",
  "{id:'alternate',  l:'Изменённое написание',                 desc:'как Lyft и Fiverr'}":
    "{id:'alternate',  l:'O‘zgartirilgan yozuv',               desc:'Lyft va Fiverr kabi'}",
  "{id:'nonEnglish', l:'Нейтральные слова',                   desc:'как Toyota и Audi'}":
    "{id:'nonEnglish', l:'Neytral so‘zlar',                    desc:'Toyota va Audi kabi'}",
  "{id:'real_words', l:'Реальные слова',                      desc:'как Apple и Amazon'}":
    "{id:'real_words', l:'Haqiqiy so‘zlar',                    desc:'Apple va Amazon kabi'}",
  "{id:'uzbek_roots',l:'🇺🇿 Узбекские корни',                  desc:'как Nurli и Baxtzor'}":
    "{id:'uzbek_roots',l:'🇺🇿 O‘zbek o‘zaklari',               desc:'Nurli va Baxtzor kabi'}",

  // ── JS strings: RAND array ────────────────────────────
  "{id:'low',    l:'Низкая',   desc:'Прямые и очевидные названия. Меньше неожиданностей'}":
    "{id:'low',    l:'Past',     desc:'To‘g‘ridan-to‘g‘ri, ravshan nomlar. Kutilmagan natijalar kam'}",
  "{id:'medium', l:'Средняя',  desc:'Сбалансировано. Более креативные результаты'}":
    "{id:'medium', l:'O‘rta',    desc:'Muvozanatli. Yanada ijodiy natijalar'}",
  "{id:'high',   l:'Высокая',  desc:'Случайные идеи. Максимум разнообразия и риска'}":
    "{id:'high',   l:'Yuqori',   desc:'Tasodifiy g‘oyalar. Maksimal turli-tumanlik va xavf'}",

  // ── JS strings: INSP array ────────────────────────────
  "{id:'',             l:'Не выбран',       desc:'Стандартная генерация — без специального семантического корпуса', enabled:true,  short:'Не выбран'}":
    "{id:'',             l:'Tanlanmagan',     desc:'Standart yaratish — maxsus semantik korpus ishlatilmaydi', enabled:true,  short:'Tanlanmagan'}",
  "{id:'uzbek_modern', l:'🇺🇿 Узбекские корни', desc:'Курированный словарь узбекских корней (нур, меҳр, ақл, юлдуз и т.д.) как семантические якоря. Каждое имя сопровождается переводом смысла на 3 языках', enabled:true,  short:'🇺🇿 Узбекский'}":
    "{id:'uzbek_modern', l:'🇺🇿 O‘zbek o‘zaklari', desc:'Tanlangan o‘zbek o‘zaklari lug‘ati (nur, mehr, aql, yulduz va h.k.) semantik tayanch sifatida. Har bir nom 3 tildagi ma’no izohi bilan keladi', enabled:true,  short:'🇺🇿 O‘zbek'}",
  "{id:'turkic',       l:'🌙 Тюркский',     desc:'Общетюркский пласт корней. Скоро', enabled:false, short:'🌙 Тюркский'}":
    "{id:'turkic',       l:'🌙 Turkiy',       desc:'Umumiy turkiy o‘zaklar qatlami. Tez orada', enabled:false, short:'🌙 Turkiy'}",
  "{id:'arabic',       l:'🕌 Арабский',     desc:'Арабские корни культурного слоя. Скоро', enabled:false, short:'🕌 Арабский'}":
    "{id:'arabic',       l:'🕌 Arabcha',      desc:'Madaniy qatlamning arab o‘zaklari. Tez orada', enabled:false, short:'🕌 Arabcha'}",
  "{id:'persian',      l:'✨ Персидский',   desc:'Персидские корни поэтического слоя. Скоро', enabled:false, short:'✨ Персидский'}":
    "{id:'persian',      l:'✨ Forscha',      desc:'She’riy qatlamning fors o‘zaklari. Tez orada', enabled:false, short:'✨ Forscha'}",

  // ── JS: "скоро" pill ──────────────────────────────────
  "<span class=\"sc-soon\">скоро</span>": "<span class=\"sc-soon\">tez orada</span>",

  // ── JS: chip / meaning labels ─────────────────────────
  "<span class=\"meaning-label\">Смысл</span>": "<span class=\"meaning-label\">Ma’no</span>",

  // ── JS: dynamic strings ───────────────────────────────
  "' вариантов</div><div class=\"rh-sub\">Проверяем домены в реальном времени</div>": "' ta variant</div><div class=\"rh-sub\">Domenlarni real vaqtda tekshiramiz</div>",
  "Ошибка: '+(e&&e.message?e.message:'неизвестная')": "Xato: '+(e&&e.message?e.message:'noma’lum')",
  "<p>Что-то пошло не так.<br><strong>Детали выше ↑</strong></p>": "<p>Nimadir noto‘g‘ri ketdi.<br><strong>Tafsilotlar yuqorida ↑</strong></p>",
  "'<span>'+(isFv?'Сохранено':'В избранное')+'</span>'": "'<span>'+(isFv?'Saqlangan':'Saqlash')+'</span>'",
  "Удалить из избранного": "Saqlanganlardan olib tashlash",
  "title=\"Копировать\"": "title=\"Nusxa olish\"",
  "Подробнее'+\n        '</a>": "Batafsil'+\n        '</a>",
  "Подробнее</a>": "Batafsil</a>",
  "'<svg width=\"12\" height=\"12\" viewBox=\"0 0 12 12\" fill=\"none\"><path d=\"M2 6l3 3 5-5\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg> Скопировано!'": "'<svg width=\"12\" height=\"12\" viewBox=\"0 0 12 12\" fill=\"none\"><path d=\"M2 6l3 3 5-5\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg> Nusxalandi!'",
  "btn.innerHTML='✓ Скопировано'": "btn.innerHTML='✓ Nusxalandi'",
  "проверяем...</span>": "tekshiruv...</span>",
  ".uz — свободен ✓": ".uz — bo‘sh ✓",
  ".uz — занят ✗": ".uz — band ✗",
  ".uz — свободен</span>": ".uz — bo‘sh</span>",
  ".uz — занят</span>": ".uz — band</span>",
  "ошибка проверки": "tekshiruv xatosi",
  " — свободен ✓": " — bo‘sh ✓",
  " — занят ✗": " — band ✗",
};

const EN = {
  // ── header / nav ────────────────────────────────────────
  'Сменить тему оформления': 'Toggle theme',
  'Сменить тему': 'Toggle theme',
  '>Генератор<': '>Generator<',
  '\n        Избранное\n        ': '\n        Saved\n        ',

  // ── hero ────────────────────────────────────────────────
  'Придумайте <em>имя</em> для бренда': 'Find a <em>name</em> for your brand',
  'Шаг 1 из 4 к полноценному бренду': 'Step 1 of 4 toward a full brand',
  'Опишите идею — соберём 8 вариантов с автопроверкой <strong>.uz</strong>, <strong>Telegram</strong> и <strong>Instagram</strong>.':
    'Describe the idea — we’ll surface 8 candidates with live <strong>.uz</strong>, <strong>Telegram</strong> and <strong>Instagram</strong> availability checks.',

  // ── search box ──────────────────────────────────────────
  'кофе, доставка, Ташкент...': 'coffee, delivery, Tashkent...',
  '>Сгенерировать<': '>Generate<',
  'Очистить поле ввода': 'Clear input',

  // ── stats ───────────────────────────────────────────────
  'имён за раз': 'names per run',
  'канала проверки': 'channels checked',
  'языка теглайнов': 'tagline languages',

  // ── filter panels ───────────────────────────────────────
  'Стиль нейминга': 'Naming style',
  '>Авто</span>': '>Auto</span>',
  '>Случайность<': '>Randomness<',
  '>Средняя</span>': '>Medium</span>',
  '>Источник вдохновения<': '>Inspiration source<',
  '>Не выбран</span>': '>None</span>',

  // ── loader ──────────────────────────────────────────────
  'ИИ генерирует названия': 'AI is generating names',

  // ── empty / errors ──────────────────────────────────────
  'Введите ключевые слова<br><strong>например: «органическая косметика Ташкент»</strong>':
    'Enter your keywords<br><strong>e.g. “organic cosmetics, Tashkent”</strong>',

  // ── modal ───────────────────────────────────────────────
  'Закрыть окно': 'Close window',
  '>Подробнее\n          <svg': '>Details\n          <svg',
  '>Копировать\n          </button>': '>Copy\n          </button>',

  // ── seo: how it works ──────────────────────────────────
  'Как работает': 'How it works',
  'От идеи до имени за <em>10 секунд</em>': 'From idea to brand name in <em>10 seconds</em>',
  '>Опишите идею</h3>': '>Describe the idea</h3>',
  'Введите ключевые слова о бренде: сфера, ценности, аудитория, регион. Можно по-русски или на узбекском.':
    'Enter keywords about the brand: industry, values, audience, region. Type in English, Uzbek or Russian.',
  '>Выберите стиль</h3>': '>Pick a style</h3>',
  'Брендовые, ассоциативные, составные, узбекские корни — 8 направлений нейминга на выбор.':
    'Brandable, evocative, compound, Uzbek roots — 8 distinct naming approaches.',
  '>AI создаёт 8 имён</h3>': '>AI returns 8 names</h3>',
  'Claude генерирует названия с теглайнами на русском и узбекском за несколько секунд.':
    'Claude generates names with Russian and Uzbek taglines in a few seconds.',
  '>Проверяем доступность</h3>': '>We check availability</h3>',
  'Автопроверка домена .uz, юзернейма в Telegram и Instagram в реальном времени.':
    'Real-time check of .uz domain plus Telegram and Instagram handles.',

  // ── seo: why ───────────────────────────────────────────
  'Почему MAZE Naming': 'Why MAZE Naming',
  'Не просто генератор слов — <em>инструмент брендинга</em>':
    'Not just a word generator — <em>a branding tool</em>',
  '<b>Первый на узбекском языке</b>': '<b>First Uzbek-language generator</b>',
  'Единственный AI-генератор имён бренда, обученный на корпусе узбекских корней. Поддержка кириллицы и латиницы.':
    'The only AI brand name generator trained on a curated corpus of Uzbek roots. Cyrillic and Latin scripts.',
  '<b>Проверка .uz, Telegram, Instagram</b>': '<b>.uz, Telegram, Instagram checks</b>',
  'RDAP-проверка домена .uz, верификация юзернеймов в соцсетях — всё за один заход без переключения вкладок.':
    'RDAP-backed .uz domain lookups plus social handle verification — all in one place, no tab switching.',
  '<b>8 вариантов за один запрос</b>': '<b>8 candidates per request</b>',
  'Не одно имя, а целый шортлист. С теглайнами на русском и узбекском для презентации команде или клиенту.':
    'Not a single name but a full shortlist. With Russian and Uzbek taglines, ready to present to a team or client.',
  '<b>Бесплатно, без регистрации</b>': '<b>Free, no signup</b>',
  'Никаких форм, аккаунтов или подписок. Открыли сайт — и работаете.':
    'No forms, accounts or subscriptions. Open the site and start working.',
  '<b>8 стилей нейминга</b>': '<b>8 naming styles</b>',
  'Брендовые (Google, Rolex), ассоциативные (RedBull), составные (FedEx), реальные слова (Apple), узбекские корни (Nurli, Baxtzor) и др.':
    'Brandable (Google, Rolex), evocative (RedBull), compound (FedEx), real words (Apple), Uzbek roots (Nurli, Baxtzor) and more.',
  '<b>От ведущей студии Узбекистана</b>': '<b>From a leading Uzbek studio</b>',
  'MAZE Studio — брендинг и дизайн в Ташкенте с 2020 года. 200+ проектов, клиенты: Kapital Bank, Beeline, Payme.':
    'MAZE Studio — branding and design in Tashkent since 2020. 200+ projects, clients include Kapital Bank, Beeline, Payme.',

  // ── seo: faq ───────────────────────────────────────────
  'Частые вопросы о генераторе названий': 'Brand name generator — FAQ',
  'Как работает AI-генератор названий MAZE?': 'How does the MAZE AI brand name generator work?',
  'Опишите идею бренда — AI создаст 8 уникальных названий и автоматически проверит доступность домена .uz, Telegram и Instagram.':
    'Describe the brand idea — the AI returns 8 unique names and automatically checks .uz, Telegram and Instagram availability.',
  'Это бесплатно?': 'Is it free?',
  'Да, генератор названий MAZE Naming полностью бесплатный. Без регистрации, без лимитов на количество запросов.':
    'Yes, MAZE Naming is fully free. No signup, no per-request limits.',
  'На каких языках работает генератор?': 'Which languages does the generator support?',
  'MAZE Naming — первый AI-генератор названий с поддержкой узбекского языка (корпус узбекских корней: нур, меҳр, ақл, юлдуз и др.). Также поддерживает русский и английский.':
    'MAZE Naming is the first AI brand name generator with Uzbek-language support (a curated corpus of Uzbek roots: nur, mehr, aql, yulduz and more). Russian and English are supported as well.',
  'Что делать после того, как я нашёл название?': 'What do I do after I find a name?',
  'Следующий шаг — построить вокруг названия бренд: логотип, фирменный стиль, упаковку. Студия <a href="https://www.maze.uz/" target="_blank" rel="noopener noreferrer">MAZE</a> специализируется на этом — 200+ проектов, клиенты Kapital Bank, Beeline, Payme. <a href="https://www.maze.uz/brief" target="_blank" rel="noopener noreferrer">Заполните бриф проекта</a> — ответим за 24 часа.':
    'Next, build a brand around it: logo, identity, packaging. <a href="https://www.maze.uz/" target="_blank" rel="noopener noreferrer">MAZE</a> studio specialises in exactly that — 200+ projects, clients include Kapital Bank, Beeline, Payme. <a href="https://www.maze.uz/brief" target="_blank" rel="noopener noreferrer">Fill in the project brief</a> — we reply within 24 hours.',
  'Можно ли использовать сгенерированные названия коммерчески?': 'Can I use the generated names commercially?',
  'Да. Перед регистрацией торговой марки рекомендуется проверить уникальность через Агентство по интеллектуальной собственности Республики Узбекистан.':
    'Yes. Before trademark registration, we recommend verifying uniqueness with the Intellectual Property Agency of the Republic of Uzbekistan.',

  // ── seo: about ─────────────────────────────────────────
  'О студии': 'About the studio',
  'MAZE — брендинг из <em>Ташкента</em>': 'MAZE — branding from <em>Tashkent</em>',
  'MAZE Naming — часть экосистемы <a href="https://www.maze.uz/" target="_blank" rel="noopener noreferrer">MAZE Studio</a>, брендинг- и дизайн-агентства из Ташкента с 2020 года. Команда разрабатывает <a href="https://www.maze.uz/services#naming" target="_blank" rel="noopener noreferrer">услуги нейминга</a>, фирменный стиль, упаковку и веб-дизайн для клиентов в Узбекистане и Центральной Азии. Среди них — Kapital Bank, Beeline, Payme и ещё 80+ компаний. Посмотрите <a href="https://www.maze.uz/portfolio" target="_blank" rel="noopener noreferrer">портфолио брендинга MAZE</a>, узнайте больше <a href="https://www.maze.uz/about" target="_blank" rel="noopener noreferrer">о студии MAZE</a> или сразу <a href="https://www.maze.uz/brief" target="_blank" rel="noopener noreferrer">заполните бриф проекта</a> — ответим в течение 24 часов.':
    'MAZE Naming is part of the <a href="https://www.maze.uz/" target="_blank" rel="noopener noreferrer">MAZE Studio</a> ecosystem — a branding and design agency from Tashkent, founded in 2020. The team delivers <a href="https://www.maze.uz/services#naming" target="_blank" rel="noopener noreferrer">naming services</a>, identity systems, packaging and web design for clients across Uzbekistan and Central Asia. Past clients include Kapital Bank, Beeline, Payme and 80+ other companies. Browse the <a href="https://www.maze.uz/portfolio" target="_blank" rel="noopener noreferrer">MAZE branding portfolio</a>, learn more <a href="https://www.maze.uz/about" target="_blank" rel="noopener noreferrer">about MAZE</a> or go straight to <a href="https://www.maze.uz/brief" target="_blank" rel="noopener noreferrer">filling in the project brief</a> — we reply within 24 hours.',

  // ── nxt section ────────────────────────────────────────
  '>СЛЕДУЮЩИЙ ШАГ<': '>NEXT STEP<',
  'У тебя есть имя.<br>Теперь нужна личность.': 'You have a name.<br>Now you need an identity.',
  'Логотип. Цвета. Типографика. Брендбук. MAZE превращает имена в бренды — <span data-maze-years>6 лет</span>, 200+ проектов. Заполни бриф за 3 минуты — ответим за 24 часа.':
    'Logo. Colours. Typography. Brand book. MAZE turns names into brands — <span data-maze-years>6 years</span>, 200+ projects. Fill in the brief in 3 minutes — we’ll reply within 24 hours.',
  'Заполнить бриф →': 'Fill in the brief →',
  'Смотреть работы MAZE': 'See MAZE’s work',

  // ── footer cta ─────────────────────────────────────────
  'Давайте создадим<br><em>смелый</em> бренд.': 'Let’s build<br>a <em>bold</em> brand.',
  'Заполнить бриф ↗': 'Fill in the brief ↗',
  '200+ брендов · Ташкент, Узбекистан': '200+ brands · Tashkent, Uzbekistan',
  'Контакты MAZE Studio': 'MAZE Studio contact',

  // ── toast ──────────────────────────────────────────────
  '>Имя сохранено.<': '>Name saved.<',
  'Следующий шаг — заполнить бриф. Это займёт 3 минуты.': 'Next, fill in the brief. It takes 3 minutes.',
  '>Закрыть<': '>Close<',
  '>\n    Заполнить бриф →\n  </a>': '>\n    Fill in the brief →\n  </a>',

  // ── noscript ───────────────────────────────────────────
  '<strong>Для генерации названий включите JavaScript.</strong>': '<strong>Please enable JavaScript to use the generator.</strong>',
  'Информационные разделы ниже доступны и без него.': 'The information sections below work without JavaScript.',

  // ── favorites view ─────────────────────────────────────
  '>\n          Избранное\n          ': '>\n          Saved\n          ',
  'Ваши сохранённые названия': 'Your saved names',
  '"Скопировать все"': '"Copy all"',
  'Скопировать все': 'Copy all',
  '"Очистить список"': '"Clear list"',
  '>\n          Очистить\n        </button>': '>\n          Clear\n        </button>',
  'Список избранного пуст': 'No saved names yet',
  'Нажимайте <strong>В избранное</strong> на карточках, чтобы сохранять понравившиеся названия':
    'Tap <strong>Save</strong> on a card to keep names you like',

  // ── JS strings: ST array ──────────────────────────────
  "{id:'auto',       l:'Авто',                   badge:'new', desc:'Все стили — ИИ выбирает лучший'}":
    "{id:'auto',       l:'Auto',                   badge:'new', desc:'All styles — AI picks the best'}",
  "{id:'brandable',  l:'Брендовые',                           desc:'как Google и Rolex'}":
    "{id:'brandable',  l:'Brandable',                          desc:'like Google and Rolex'}",
  "{id:'evocative',  l:'Ассоциативные',                       desc:'как RedBull и Forever21'}":
    "{id:'evocative',  l:'Evocative',                          desc:'like RedBull and Forever21'}",
  "{id:'compound',   l:'Составные слова',                     desc:'как FedEx и Microsoft'}":
    "{id:'compound',   l:'Compound',                           desc:'like FedEx and Microsoft'}",
  "{id:'alternate',  l:'Изменённое написание',                 desc:'как Lyft и Fiverr'}":
    "{id:'alternate',  l:'Alternate spelling',                 desc:'like Lyft and Fiverr'}",
  "{id:'nonEnglish', l:'Нейтральные слова',                   desc:'как Toyota и Audi'}":
    "{id:'nonEnglish', l:'Neutral words',                      desc:'like Toyota and Audi'}",
  "{id:'real_words', l:'Реальные слова',                      desc:'как Apple и Amazon'}":
    "{id:'real_words', l:'Real words',                         desc:'like Apple and Amazon'}",
  "{id:'uzbek_roots',l:'🇺🇿 Узбекские корни',                  desc:'как Nurli и Baxtzor'}":
    "{id:'uzbek_roots',l:'🇺🇿 Uzbek roots',                    desc:'like Nurli and Baxtzor'}",

  // ── JS strings: RAND array ────────────────────────────
  "{id:'low',    l:'Низкая',   desc:'Прямые и очевидные названия. Меньше неожиданностей'}":
    "{id:'low',    l:'Low',      desc:'Direct, obvious names. Fewer surprises'}",
  "{id:'medium', l:'Средняя',  desc:'Сбалансировано. Более креативные результаты'}":
    "{id:'medium', l:'Medium',   desc:'Balanced. More creative results'}",
  "{id:'high',   l:'Высокая',  desc:'Случайные идеи. Максимум разнообразия и риска'}":
    "{id:'high',   l:'High',     desc:'Random ideas. Maximum variety and risk'}",

  // ── JS strings: INSP array ────────────────────────────
  "{id:'',             l:'Не выбран',       desc:'Стандартная генерация — без специального семантического корпуса', enabled:true,  short:'Не выбран'}":
    "{id:'',             l:'None',            desc:'Standard generation — no special semantic corpus', enabled:true,  short:'None'}",
  "{id:'uzbek_modern', l:'🇺🇿 Узбекские корни', desc:'Курированный словарь узбекских корней (нур, меҳр, ақл, юлдуз и т.д.) как семантические якоря. Каждое имя сопровождается переводом смысла на 3 языках', enabled:true,  short:'🇺🇿 Узбекский'}":
    "{id:'uzbek_modern', l:'🇺🇿 Uzbek roots',  desc:'A curated dictionary of Uzbek roots (nur, mehr, aql, yulduz, etc.) as semantic anchors. Every name comes with meaning translated into 3 languages', enabled:true,  short:'🇺🇿 Uzbek'}",
  "{id:'turkic',       l:'🌙 Тюркский',     desc:'Общетюркский пласт корней. Скоро', enabled:false, short:'🌙 Тюркский'}":
    "{id:'turkic',       l:'🌙 Turkic',       desc:'Pan-Turkic root layer. Coming soon', enabled:false, short:'🌙 Turkic'}",
  "{id:'arabic',       l:'🕌 Арабский',     desc:'Арабские корни культурного слоя. Скоро', enabled:false, short:'🕌 Арабский'}":
    "{id:'arabic',       l:'🕌 Arabic',       desc:'Cultural-layer Arabic roots. Coming soon', enabled:false, short:'🕌 Arabic'}",
  "{id:'persian',      l:'✨ Персидский',   desc:'Персидские корни поэтического слоя. Скоро', enabled:false, short:'✨ Персидский'}":
    "{id:'persian',      l:'✨ Persian',      desc:'Poetic-layer Persian roots. Coming soon', enabled:false, short:'✨ Persian'}",

  "<span class=\"sc-soon\">скоро</span>": "<span class=\"sc-soon\">soon</span>",
  "<span class=\"meaning-label\">Смысл</span>": "<span class=\"meaning-label\">Meaning</span>",

  "' вариантов</div><div class=\"rh-sub\">Проверяем домены в реальном времени</div>": "' results</div><div class=\"rh-sub\">Checking domains in real time</div>",
  "Ошибка: '+(e&&e.message?e.message:'неизвестная')": "Error: '+(e&&e.message?e.message:'unknown')",
  "<p>Что-то пошло не так.<br><strong>Детали выше ↑</strong></p>": "<p>Something went wrong.<br><strong>Details above ↑</strong></p>",
  "'<span>'+(isFv?'Сохранено':'В избранное')+'</span>'": "'<span>'+(isFv?'Saved':'Save')+'</span>'",
  "Удалить из избранного": "Remove from saved",
  "title=\"Копировать\"": "title=\"Copy\"",
  "Подробнее'+\n        '</a>": "Details'+\n        '</a>",
  "Подробнее</a>": "Details</a>",
  "'<svg width=\"12\" height=\"12\" viewBox=\"0 0 12 12\" fill=\"none\"><path d=\"M2 6l3 3 5-5\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg> Скопировано!'": "'<svg width=\"12\" height=\"12\" viewBox=\"0 0 12 12\" fill=\"none\"><path d=\"M2 6l3 3 5-5\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg> Copied!'",
  "btn.innerHTML='✓ Скопировано'": "btn.innerHTML='✓ Copied'",
  "проверяем...</span>": "checking...</span>",
  ".uz — свободен ✓": ".uz — available ✓",
  ".uz — занят ✗": ".uz — taken ✗",
  ".uz — свободен</span>": ".uz — available</span>",
  ".uz — занят</span>": ".uz — taken</span>",
  "ошибка проверки": "check error",
  " — свободен ✓": " — available ✓",
  " — занят ✗": " — taken ✗",
};

const map = locale === 'uz' ? UZ : locale === 'en' ? EN : null;
if (!map) { console.error('Unknown locale:', locale); process.exit(1); }

let out = src;
// Sort by key length descending to avoid partial overlap
const entries = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
let appliedCount = 0;
let missCount = 0;
for (const [from, to] of entries) {
  if (out.includes(from)) {
    out = out.split(from).join(to);
    appliedCount++;
  } else {
    missCount++;
    console.warn(`MISS: ${JSON.stringify(from.slice(0, 60))}`);
  }
}

fs.writeFileSync(path.join(__dirname, '..', outFile), out);
console.log(`\n${locale}: wrote ${outFile} (${appliedCount} applied, ${missCount} missed)`);
