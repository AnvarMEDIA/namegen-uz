// Uzbek roots inspiration dictionary — Feature 1, Step 1.
//
// Curated by a native Uzbek speaker (replaces the earlier AI-generated
// draft). 230 entries grouped into eight thematic categories:
//
//   nature, power, light, emotion, wisdom, time, heritage, abstract.
//
// Used by lib/prompts/generate.ts (Step 2) as semantic INSPIRATION — the
// AI receives 10–15 sampled roots per request and is free to riff on
// them when proposing brand names. Short roots (e.g. "nur", "gul",
// "aql") are intentional anchors, not direct candidates: the existing
// phonetic + length rules in lib/prompts/styles.ts still constrain the
// FINAL brand-name shape (4..12 chars, /^[a-z0-9]+$/, etc.).
//
// Notes on data shape:
//   - latin: Uzbek Latin spelling. Some entries contain the apostrophe
//     `'` (e.g. "yo'l", "tog'", "ma'no") — that's a legitimate Uzbek
//     letter (modifier marking the soft consonant). Charset for the
//     latin field is /^[a-z']+$/.
//   - cyrillic: standard Uzbek Cyrillic (Ў / Ҳ / Қ / Ғ where appropriate).
//   - meaning_uz: short gloss in Latin-script Uzbek (matches modern
//     Uzbek convention).
//   - meaning_ru: Russian gloss.
//   - meaning_en: English gloss.

export type UzbekCategory =
  | 'nature'
  | 'power'
  | 'light'
  | 'emotion'
  | 'wisdom'
  | 'time'
  | 'heritage'
  | 'abstract';

export const UZBEK_CATEGORIES = [
  'nature',
  'power',
  'light',
  'emotion',
  'wisdom',
  'time',
  'heritage',
  'abstract',
] as const satisfies readonly UzbekCategory[];

export interface UzbekRoot {
  readonly latin: string;
  readonly cyrillic: string;
  readonly meaning_uz: string;
  readonly meaning_ru: string;
  readonly meaning_en: string;
  readonly category: UzbekCategory;
}

export const UZBEK_ROOTS: readonly UzbekRoot[] = [
  // ── nature (32) ─────────────────────────────────────────
  { latin: "sayyor",   cyrillic: "сайёр",   meaning_uz: "yo'lovchi, sayohatchi", meaning_ru: "странник, путник",       meaning_en: "traveler, wanderer",      category: "nature" },
  { latin: "daryo",    cyrillic: "дарё",    meaning_uz: "katta suv oqimi",       meaning_ru: "река",                   meaning_en: "river",                   category: "nature" },
  { latin: "bahor",    cyrillic: "баҳор",   meaning_uz: "yilning birinchi fasli", meaning_ru: "весна",                 meaning_en: "spring",                  category: "nature" },
  { latin: "shafaq",   cyrillic: "шафақ",   meaning_uz: "tong qizilligi",        meaning_ru: "заря",                   meaning_en: "dawn glow",               category: "nature" },
  { latin: "dengiz",   cyrillic: "денгиз",  meaning_uz: "katta suv havzasi",     meaning_ru: "море",                   meaning_en: "sea",                     category: "nature" },
  { latin: "bulut",    cyrillic: "булут",   meaning_uz: "osmondagi suv bug'i",   meaning_ru: "облако",                 meaning_en: "cloud",                   category: "nature" },
  { latin: "shamol",   cyrillic: "шамол",   meaning_uz: "havo oqimi",            meaning_ru: "ветер",                  meaning_en: "wind",                    category: "nature" },
  { latin: "chechak",  cyrillic: "чечак",   meaning_uz: "gul",                   meaning_ru: "цветок",                 meaning_en: "flower",                  category: "nature" },
  { latin: "lola",     cyrillic: "лола",    meaning_uz: "bahorgi gul",           meaning_ru: "тюльпан",                meaning_en: "tulip",                   category: "nature" },
  { latin: "olov",     cyrillic: "олов",    meaning_uz: "alanga",                meaning_ru: "огонь, пламя",           meaning_en: "fire, flame",             category: "nature" },
  { latin: "yomg'ir",  cyrillic: "ёмғир",   meaning_uz: "osmondan tushuvchi suv", meaning_ru: "дождь",                 meaning_en: "rain",                    category: "nature" },
  { latin: "tog'",     cyrillic: "тоғ",     meaning_uz: "baland yer",            meaning_ru: "гора",                   meaning_en: "mountain",                category: "nature" },
  { latin: "o'rmon",   cyrillic: "ўрмон",   meaning_uz: "daraxtzor",             meaning_ru: "лес",                    meaning_en: "forest",                  category: "nature" },
  { latin: "tuproq",   cyrillic: "тупроқ",  meaning_uz: "yer qatlami",           meaning_ru: "земля, почва",           meaning_en: "soil, earth",             category: "nature" },
  { latin: "chashma",  cyrillic: "чашма",   meaning_uz: "buloq",                 meaning_ru: "родник, источник",       meaning_en: "spring, fountain",        category: "nature" },
  { latin: "buloq",    cyrillic: "булоқ",   meaning_uz: "tabiiy suv manbai",     meaning_ru: "источник",               meaning_en: "spring",                  category: "nature" },
  { latin: "shabnam",  cyrillic: "шабнам",  meaning_uz: "tong nami",             meaning_ru: "роса",                   meaning_en: "dew",                     category: "nature" },
  { latin: "qor",      cyrillic: "қор",     meaning_uz: "oq qish yog'ini",       meaning_ru: "снег",                   meaning_en: "snow",                    category: "nature" },
  { latin: "mavj",     cyrillic: "мавж",    meaning_uz: "to'lqin",               meaning_ru: "волна",                  meaning_en: "wave",                    category: "nature" },
  { latin: "sahro",    cyrillic: "саҳро",   meaning_uz: "cho'l",                 meaning_ru: "пустыня, степь",         meaning_en: "desert, steppe",          category: "nature" },
  { latin: "vodiy",    cyrillic: "водий",   meaning_uz: "tog' oraligi",          meaning_ru: "долина",                 meaning_en: "valley",                  category: "nature" },
  { latin: "nilufar",  cyrillic: "нилуфар", meaning_uz: "suv guli",              meaning_ru: "кувшинка, лотос",        meaning_en: "lotus, lily",             category: "nature" },
  { latin: "yulduz",   cyrillic: "юлдуз",   meaning_uz: "osmondagi nur",         meaning_ru: "звезда",                 meaning_en: "star",                    category: "nature" },
  { latin: "oy",       cyrillic: "ой",      meaning_uz: "tungi yorituvchi",      meaning_ru: "луна, месяц",            meaning_en: "moon",                    category: "nature" },
  { latin: "asal",     cyrillic: "асал",    meaning_uz: "shirin moy",            meaning_ru: "мёд",                    meaning_en: "honey",                   category: "nature" },
  { latin: "gul",      cyrillic: "гул",     meaning_uz: "o'simlik xushbo'yi",    meaning_ru: "цветок",                 meaning_en: "flower, rose",            category: "nature" },
  { latin: "raykhon",  cyrillic: "райҳон",  meaning_uz: "xushbo'y o't",          meaning_ru: "базилик",                meaning_en: "basil",                   category: "nature" },
  { latin: "chinor",   cyrillic: "чинор",   meaning_uz: "katta daraxt",          meaning_ru: "чинара, платан",         meaning_en: "plane tree",              category: "nature" },
  { latin: "tonggi",   cyrillic: "тонгги",  meaning_uz: "tong vaqtidagi",        meaning_ru: "утренний",               meaning_en: "morning, of dawn",        category: "nature" },
  { latin: "mehrob",   cyrillic: "меҳроб",  meaning_uz: "oltin nur",             meaning_ru: "михраб; источник тепла", meaning_en: "sanctuary niche",         category: "nature" },
  { latin: "havo",     cyrillic: "ҳаво",    meaning_uz: "nafas oluvchi muhit",   meaning_ru: "воздух",                 meaning_en: "air, sky",                category: "nature" },
  { latin: "osmon",    cyrillic: "осмон",   meaning_uz: "tepadagi cheksizlik",   meaning_ru: "небо",                   meaning_en: "sky, heaven",             category: "nature" },

  // ── power (28) ──────────────────────────────────────────
  { latin: "botir",    cyrillic: "ботир",   meaning_uz: "qahramon, jasur",       meaning_ru: "герой, храбрец",         meaning_en: "hero, brave",             category: "power" },
  { latin: "alp",      cyrillic: "алп",     meaning_uz: "bahodir",               meaning_ru: "богатырь",               meaning_en: "giant, warrior",          category: "power" },
  { latin: "qalqon",   cyrillic: "қалқон",  meaning_uz: "himoya quroli",         meaning_ru: "щит",                    meaning_en: "shield",                  category: "power" },
  { latin: "arslon",   cyrillic: "арслон",  meaning_uz: "tog' shoqoli",          meaning_ru: "лев",                    meaning_en: "lion",                    category: "power" },
  { latin: "bahodir",  cyrillic: "баҳодир", meaning_uz: "jasur, qahramon",       meaning_ru: "храбрец, витязь",        meaning_en: "hero, valiant",           category: "power" },
  { latin: "g'ayrat",  cyrillic: "ғайрат",  meaning_uz: "jasorat, harakat",      meaning_ru: "отвага, рвение",         meaning_en: "zeal, courage",           category: "power" },
  { latin: "shijoat",  cyrillic: "шижоат",  meaning_uz: "jasurlik",              meaning_ru: "мужество",               meaning_en: "bravery",                 category: "power" },
  { latin: "tavakkal", cyrillic: "таваккал",meaning_uz: "jasur qadam",           meaning_ru: "отвага, риск",           meaning_en: "daring, risk",            category: "power" },
  { latin: "mardona",  cyrillic: "мардона", meaning_uz: "mard sifat",            meaning_ru: "мужественно",            meaning_en: "manly, brave",            category: "power" },
  { latin: "qudrat",   cyrillic: "қудрат",  meaning_uz: "buyuk kuch",            meaning_ru: "мощь, могущество",       meaning_en: "power, might",            category: "power" },
  { latin: "zafar",    cyrillic: "зафар",   meaning_uz: "g'alaba",               meaning_ru: "победа",                 meaning_en: "victory",                 category: "power" },
  { latin: "g'olib",   cyrillic: "ғолиб",   meaning_uz: "yutuvchi",              meaning_ru: "победитель",             meaning_en: "victor",                  category: "power" },
  { latin: "jasur",    cyrillic: "жасур",   meaning_uz: "botir",                 meaning_ru: "храбрый",                meaning_en: "brave",                   category: "power" },
  { latin: "qahraman", cyrillic: "қаҳраман",meaning_uz: "qahramon",              meaning_ru: "герой",                  meaning_en: "hero",                    category: "power" },
  { latin: "yengil",   cyrillic: "енгил",   meaning_uz: "oson, tez",             meaning_ru: "лёгкий, быстрый",        meaning_en: "light, swift",            category: "power" },
  { latin: "shoh",     cyrillic: "шоҳ",     meaning_uz: "podsho",                meaning_ru: "царь",                   meaning_en: "king",                    category: "power" },
  { latin: "sherzod",  cyrillic: "шерзод",  meaning_uz: "sher bolasi",           meaning_ru: "сын льва",               meaning_en: "lion's son",              category: "power" },
  { latin: "bek",      cyrillic: "бек",     meaning_uz: "hokim",                 meaning_ru: "бек, господин",          meaning_en: "lord",                    category: "power" },
  { latin: "po'lat",   cyrillic: "пўлат",   meaning_uz: "qattiq metall",         meaning_ru: "сталь",                  meaning_en: "steel",                   category: "power" },
  { latin: "toshko'mir",cyrillic:"тошкўмир",meaning_uz: "qattiq energiya",       meaning_ru: "уголь",                  meaning_en: "coal",                    category: "power" },
  { latin: "olovli",   cyrillic: "оловли",  meaning_uz: "olovga ega",            meaning_ru: "огненный",               meaning_en: "fiery",                   category: "power" },
  { latin: "kuchli",   cyrillic: "кучли",   meaning_uz: "quvvatli",              meaning_ru: "сильный",                meaning_en: "strong",                  category: "power" },
  { latin: "otash",    cyrillic: "оташ",    meaning_uz: "olov, alanga",          meaning_ru: "пламя",                  meaning_en: "flame, fire",             category: "power" },
  { latin: "yog'du",   cyrillic: "ёғду",    meaning_uz: "yorqin nur",            meaning_ru: "яркий свет",             meaning_en: "bright ray",              category: "power" },
  { latin: "qoplon",   cyrillic: "қоплон",  meaning_uz: "yo'lbars",              meaning_ru: "леопард",                meaning_en: "leopard",                 category: "power" },
  { latin: "shahzod",  cyrillic: "шаҳзод",  meaning_uz: "shoh bolasi",           meaning_ru: "принц",                  meaning_en: "prince",                  category: "power" },
  { latin: "jadval",   cyrillic: "жадвал",  meaning_uz: "qat'iy tartib",         meaning_ru: "график, порядок",        meaning_en: "order, schedule",         category: "power" },
  { latin: "tezkor",   cyrillic: "тезкор",  meaning_uz: "tez ish",               meaning_ru: "быстрый",                meaning_en: "swift",                   category: "power" },

  // ── light (26) ──────────────────────────────────────────
  { latin: "nur",      cyrillic: "нур",     meaning_uz: "yorug'lik",             meaning_ru: "луч, свет",              meaning_en: "ray, light",              category: "light" },
  { latin: "ziyo",     cyrillic: "зиё",     meaning_uz: "yorug'lik, ilm",        meaning_ru: "свет, сияние",           meaning_en: "light, radiance",         category: "light" },
  { latin: "tong",     cyrillic: "тонг",    meaning_uz: "kun boshlanishi",       meaning_ru: "рассвет",                meaning_en: "dawn",                    category: "light" },
  { latin: "oydin",    cyrillic: "ойдин",   meaning_uz: "ravshan",               meaning_ru: "лунный, ясный",          meaning_en: "moonlit, clear",          category: "light" },
  { latin: "chiroq",   cyrillic: "чироқ",   meaning_uz: "yoruglik beruvchi",     meaning_ru: "светильник",             meaning_en: "lamp",                    category: "light" },
  { latin: "shu'la",   cyrillic: "шуъла",   meaning_uz: "yorug' nur",            meaning_ru: "луч, отблеск",           meaning_en: "glow, beam",              category: "light" },
  { latin: "yorug'",   cyrillic: "ёруғ",    meaning_uz: "nurli",                 meaning_ru: "светлый",                meaning_en: "bright",                  category: "light" },
  { latin: "quyosh",   cyrillic: "қуёш",    meaning_uz: "kunduzi nuri",          meaning_ru: "солнце",                 meaning_en: "sun",                     category: "light" },
  { latin: "mash'al",  cyrillic: "машъал",  meaning_uz: "olov shu'lasi",         meaning_ru: "факел",                  meaning_en: "torch",                   category: "light" },
  { latin: "charog'",  cyrillic: "чароғ",   meaning_uz: "yorituvchi",            meaning_ru: "светило",                meaning_en: "lantern",                 category: "light" },
  { latin: "yoritqich",cyrillic: "ёритқич", meaning_uz: "yorug'lik beruvchi",    meaning_ru: "осветитель",             meaning_en: "illuminator",             category: "light" },
  { latin: "mehrli",   cyrillic: "меҳрли",  meaning_uz: "issiq nurli",           meaning_ru: "тёплый",                 meaning_en: "warm-hearted",            category: "light" },
  { latin: "sham",     cyrillic: "шам",     meaning_uz: "olov ipi",              meaning_ru: "свеча",                  meaning_en: "candle",                  category: "light" },
  { latin: "gulshan",  cyrillic: "гулшан",  meaning_uz: "gulli bog'",            meaning_ru: "цветник",                meaning_en: "rose garden",             category: "light" },
  { latin: "olamtob",  cyrillic: "оламтоб", meaning_uz: "dunyoni yorituvchi",    meaning_ru: "озаряющий мир",          meaning_en: "world-illuminating",      category: "light" },
  { latin: "jilo",     cyrillic: "жило",    meaning_uz: "yaltir",                meaning_ru: "блеск",                  meaning_en: "shine, gloss",            category: "light" },
  { latin: "yog'duli", cyrillic: "ёғдули",  meaning_uz: "yorqin",                meaning_ru: "лучистый",               meaning_en: "radiant",                 category: "light" },
  { latin: "shu'lador",cyrillic: "шуълодор",meaning_uz: "shu'la sochuvchi",      meaning_ru: "излучающий",             meaning_en: "radiating",               category: "light" },
  { latin: "chaqmoq",  cyrillic: "чақмоқ",  meaning_uz: "momoqaldiroq nuri",     meaning_ru: "молния",                 meaning_en: "lightning",               category: "light" },
  { latin: "oltin",    cyrillic: "олтин",   meaning_uz: "qimmatli metall",       meaning_ru: "золото",                 meaning_en: "gold",                    category: "light" },
  { latin: "kumush",   cyrillic: "кумуш",   meaning_uz: "oq metall",             meaning_ru: "серебро",                meaning_en: "silver",                  category: "light" },
  { latin: "firuza",   cyrillic: "фируза",  meaning_uz: "ko'k tosh",             meaning_ru: "бирюза",                 meaning_en: "turquoise",               category: "light" },
  { latin: "marvarid", cyrillic: "марварид",meaning_uz: "qimmat tosh",           meaning_ru: "жемчуг",                 meaning_en: "pearl",                   category: "light" },
  { latin: "javohir",  cyrillic: "жавоҳир", meaning_uz: "qimmatbaho tosh",       meaning_ru: "драгоценность",          meaning_en: "jewel",                   category: "light" },
  { latin: "yoqut",    cyrillic: "ёқут",    meaning_uz: "qizil tosh",            meaning_ru: "рубин",                  meaning_en: "ruby",                    category: "light" },
  { latin: "alvon",    cyrillic: "алвон",   meaning_uz: "qizg'ish ranq",         meaning_ru: "багровый, ярко-красный", meaning_en: "crimson",                 category: "light" },

  // ── emotion (28) ────────────────────────────────────────
  { latin: "mehr",     cyrillic: "меҳр",    meaning_uz: "sevgi, iliqlik",        meaning_ru: "любовь, ласка",          meaning_en: "affection",               category: "emotion" },
  { latin: "vafo",     cyrillic: "вафо",    meaning_uz: "sodiqlik",              meaning_ru: "верность",               meaning_en: "loyalty",                 category: "emotion" },
  { latin: "mehribon", cyrillic: "меҳрибон",meaning_uz: "mehrli",                meaning_ru: "милосердный",            meaning_en: "kind",                    category: "emotion" },
  { latin: "sevgi",    cyrillic: "севги",   meaning_uz: "yurakdagi mehr",        meaning_ru: "любовь",                 meaning_en: "love",                    category: "emotion" },
  { latin: "qalb",     cyrillic: "қалб",    meaning_uz: "yurak",                 meaning_ru: "сердце, душа",           meaning_en: "heart, soul",             category: "emotion" },
  { latin: "shavq",    cyrillic: "шавқ",    meaning_uz: "hayajon",               meaning_ru: "восторг",                meaning_en: "enthusiasm",              category: "emotion" },
  { latin: "sokin",    cyrillic: "сокин",   meaning_uz: "jim",                   meaning_ru: "спокойный",              meaning_en: "calm",                    category: "emotion" },
  { latin: "shodlik",  cyrillic: "шодлик",  meaning_uz: "xursandchilik",         meaning_ru: "радость",                meaning_en: "joy",                     category: "emotion" },
  { latin: "nazokat",  cyrillic: "назокат", meaning_uz: "latiflik",              meaning_ru: "изящество",              meaning_en: "elegance",                category: "emotion" },
  { latin: "muhabbat", cyrillic: "муҳаббат",meaning_uz: "sevgi",                 meaning_ru: "любовь",                 meaning_en: "love",                    category: "emotion" },
  { latin: "yor",      cyrillic: "ёр",      meaning_uz: "sevimli",               meaning_ru: "любимый",                meaning_en: "beloved",                 category: "emotion" },
  { latin: "do'st",    cyrillic: "дўст",    meaning_uz: "yaqin",                 meaning_ru: "друг",                   meaning_en: "friend",                  category: "emotion" },
  { latin: "sadoqat",  cyrillic: "садоқат", meaning_uz: "vafo",                  meaning_ru: "преданность",            meaning_en: "devotion",                category: "emotion" },
  { latin: "latofat",  cyrillic: "латофат", meaning_uz: "go'zal nazokat",        meaning_ru: "очарование",             meaning_en: "grace",                   category: "emotion" },
  { latin: "go'zal",   cyrillic: "гўзал",   meaning_uz: "chiroyli",              meaning_ru: "красивый",               meaning_en: "beautiful",               category: "emotion" },
  { latin: "chiroyli", cyrillic: "чиройли", meaning_uz: "go'zal ko'rinishli",    meaning_ru: "красивый",               meaning_en: "beautiful",               category: "emotion" },
  { latin: "navqiron", cyrillic: "навқирон",meaning_uz: "yosh, baquvvat",        meaning_ru: "молодой, бодрый",        meaning_en: "young, vigorous",         category: "emotion" },
  { latin: "baxtiyor", cyrillic: "бахтиёр", meaning_uz: "baxtli",                meaning_ru: "счастливый",             meaning_en: "happy",                   category: "emotion" },
  { latin: "shirin",   cyrillic: "ширин",   meaning_uz: "yoqimli",               meaning_ru: "сладкий",                meaning_en: "sweet",                   category: "emotion" },
  { latin: "halol",    cyrillic: "ҳалол",   meaning_uz: "toza, sof",             meaning_ru: "честный, дозволенный",   meaning_en: "honest, halal",           category: "emotion" },
  { latin: "toza",     cyrillic: "тоза",    meaning_uz: "sof",                   meaning_ru: "чистый",                 meaning_en: "clean",                   category: "emotion" },
  { latin: "sof",      cyrillic: "соф",     meaning_uz: "toza",                  meaning_ru: "чистый",                 meaning_en: "pure",                    category: "emotion" },
  { latin: "munis",    cyrillic: "мунис",   meaning_uz: "jonajon",               meaning_ru: "родной, ласковый",       meaning_en: "dear",                    category: "emotion" },
  { latin: "shavkat",  cyrillic: "шавкат",  meaning_uz: "buyuklik, hashamat",    meaning_ru: "величие, благородство",  meaning_en: "majesty",                 category: "emotion" },
  { latin: "ehtirom",  cyrillic: "эҳтиром", meaning_uz: "hurmat",                meaning_ru: "уважение",               meaning_en: "respect",                 category: "emotion" },
  { latin: "hurmat",   cyrillic: "ҳурмат",  meaning_uz: "e'tibor",               meaning_ru: "уважение",               meaning_en: "respect",                 category: "emotion" },
  { latin: "insof",    cyrillic: "инсоф",   meaning_uz: "adolat hissi",          meaning_ru: "справедливость",         meaning_en: "fairness",                category: "emotion" },
  { latin: "diyonat",  cyrillic: "диёнат",  meaning_uz: "poklik",                meaning_ru: "совесть",                meaning_en: "conscience",              category: "emotion" },

  // ── wisdom (28) ─────────────────────────────────────────
  { latin: "aql",      cyrillic: "ақл",     meaning_uz: "fikr quroli",           meaning_ru: "разум",                  meaning_en: "intellect",               category: "wisdom" },
  { latin: "donish",   cyrillic: "дониш",   meaning_uz: "hikmat",                meaning_ru: "мудрость",               meaning_en: "wisdom",                  category: "wisdom" },
  { latin: "ilm",      cyrillic: "илм",     meaning_uz: "bilim",                 meaning_ru: "знание, наука",          meaning_en: "knowledge",               category: "wisdom" },
  { latin: "fikr",     cyrillic: "фикр",    meaning_uz: "o'ylov",                meaning_ru: "мысль",                  meaning_en: "thought",                 category: "wisdom" },
  { latin: "hikmat",   cyrillic: "ҳикмат",  meaning_uz: "chuqur fikr",           meaning_ru: "мудрость",               meaning_en: "wisdom",                  category: "wisdom" },
  { latin: "olim",     cyrillic: "олим",    meaning_uz: "bilimli kishi",         meaning_ru: "учёный",                 meaning_en: "scholar",                 category: "wisdom" },
  { latin: "dono",     cyrillic: "доно",    meaning_uz: "aqlli",                 meaning_ru: "мудрый",                 meaning_en: "wise",                    category: "wisdom" },
  { latin: "bilim",    cyrillic: "билим",   meaning_uz: "o'rganilgan",           meaning_ru: "знание",                 meaning_en: "knowledge",               category: "wisdom" },
  { latin: "zehn",     cyrillic: "зеҳн",    meaning_uz: "tez tushunish",         meaning_ru: "сметливость",            meaning_en: "acumen",                  category: "wisdom" },
  { latin: "tafakkur", cyrillic: "тафаккур",meaning_uz: "chuqur fikrlash",       meaning_ru: "мышление",               meaning_en: "contemplation",           category: "wisdom" },
  { latin: "aqlim",    cyrillic: "ақлим",   meaning_uz: "mening aqlim",          meaning_ru: "мой разум",              meaning_en: "my intellect",            category: "wisdom" },
  { latin: "farosat",  cyrillic: "фаросат", meaning_uz: "tushunish kuchi",       meaning_ru: "проницательность",       meaning_en: "insight",                 category: "wisdom" },
  { latin: "idrok",    cyrillic: "идрок",   meaning_uz: "anglash",               meaning_ru: "понимание",              meaning_en: "comprehension",           category: "wisdom" },
  { latin: "mantiq",   cyrillic: "мантиқ",  meaning_uz: "fikr ketma-ketligi",    meaning_ru: "логика",                 meaning_en: "logic",                   category: "wisdom" },
  { latin: "tadqiq",   cyrillic: "тадқиқ",  meaning_uz: "o'rganish",             meaning_ru: "исследование",           meaning_en: "research",                category: "wisdom" },
  { latin: "kashfiyot",cyrillic: "кашфиёт", meaning_uz: "yangilik",              meaning_ru: "открытие",               meaning_en: "discovery",               category: "wisdom" },
  { latin: "ma'rifat", cyrillic: "маърифат",meaning_uz: "bilim, ma'lumot",       meaning_ru: "просвещение",            meaning_en: "enlightenment",           category: "wisdom" },
  { latin: "o'qimishli",cyrillic:"ўқимишли",meaning_uz: "ko'p o'qigan",          meaning_ru: "начитанный",             meaning_en: "well-read",               category: "wisdom" },
  { latin: "savol",    cyrillic: "савол",   meaning_uz: "so'rov",                meaning_ru: "вопрос",                 meaning_en: "question",                category: "wisdom" },
  { latin: "javob",    cyrillic: "жавоб",   meaning_uz: "sav. yechimi",          meaning_ru: "ответ",                  meaning_en: "answer",                  category: "wisdom" },
  { latin: "ustoz",    cyrillic: "устоз",   meaning_uz: "o'qituvchi",            meaning_ru: "наставник",              meaning_en: "master, mentor",          category: "wisdom" },
  { latin: "shogird",  cyrillic: "шогирд",  meaning_uz: "o'quvchi",              meaning_ru: "ученик",                 meaning_en: "disciple",                category: "wisdom" },
  { latin: "maktab",   cyrillic: "мактаб",  meaning_uz: "o'quv joyi",            meaning_ru: "школа",                  meaning_en: "school",                  category: "wisdom" },
  { latin: "kitob",    cyrillic: "китоб",   meaning_uz: "yozma manba",           meaning_ru: "книга",                  meaning_en: "book",                    category: "wisdom" },
  { latin: "qalam",    cyrillic: "қалам",   meaning_uz: "yozuv quroli",          meaning_ru: "перо, ручка",            meaning_en: "pen",                     category: "wisdom" },
  { latin: "so'z",     cyrillic: "сўз",     meaning_uz: "ifoda",                 meaning_ru: "слово",                  meaning_en: "word",                    category: "wisdom" },
  { latin: "nigoh",    cyrillic: "нигоҳ",   meaning_uz: "qarash",                meaning_ru: "взгляд",                 meaning_en: "gaze",                    category: "wisdom" },
  { latin: "qarash",   cyrillic: "қараш",   meaning_uz: "ko'z tashlash",         meaning_ru: "взгляд",                 meaning_en: "perspective",             category: "wisdom" },

  // ── time (24) ───────────────────────────────────────────
  { latin: "zamon",    cyrillic: "замон",   meaning_uz: "davr, payt",            meaning_ru: "время, эпоха",           meaning_en: "time, era",               category: "time" },
  { latin: "davr",     cyrillic: "давр",    meaning_uz: "era",                   meaning_ru: "эра",                    meaning_en: "era",                     category: "time" },
  { latin: "asr",      cyrillic: "аср",     meaning_uz: "yuz yil",               meaning_ru: "век",                    meaning_en: "century",                 category: "time" },
  { latin: "abad",     cyrillic: "абад",    meaning_uz: "chegarasiz",            meaning_ru: "вечность",               meaning_en: "eternity",                category: "time" },
  { latin: "azal",     cyrillic: "азал",    meaning_uz: "boshlang'ich",          meaning_ru: "изначальность",          meaning_en: "primordial",              category: "time" },
  { latin: "soat",     cyrillic: "соат",    meaning_uz: "vaqt o'lchovi",         meaning_ru: "час",                    meaning_en: "hour",                    category: "time" },
  { latin: "sahar",    cyrillic: "саҳар",   meaning_uz: "tong vaqti",            meaning_ru: "рассветный час",         meaning_en: "dawn time",               category: "time" },
  { latin: "erta",     cyrillic: "эрта",    meaning_uz: "keyingi kun",           meaning_ru: "завтра",                 meaning_en: "tomorrow, early",         category: "time" },
  { latin: "bugun",    cyrillic: "бугун",   meaning_uz: "shu kun",               meaning_ru: "сегодня",                meaning_en: "today",                   category: "time" },
  { latin: "hozir",    cyrillic: "ҳозир",   meaning_uz: "shu daqiqa",            meaning_ru: "сейчас",                 meaning_en: "now",                     category: "time" },
  { latin: "daqiqa",   cyrillic: "дақиқа",  meaning_uz: "vaqt birligi",          meaning_ru: "минута",                 meaning_en: "minute",                  category: "time" },
  { latin: "oniy",     cyrillic: "оний",    meaning_uz: "bir lahza",             meaning_ru: "мгновенный",             meaning_en: "instant",                 category: "time" },
  { latin: "lahza",    cyrillic: "лаҳза",   meaning_uz: "qisqa vaqt",            meaning_ru: "мгновение",              meaning_en: "moment",                  category: "time" },
  { latin: "yangi",    cyrillic: "янги",    meaning_uz: "yaqinda paydo",         meaning_ru: "новый",                  meaning_en: "new",                     category: "time" },
  { latin: "qadim",    cyrillic: "қадим",   meaning_uz: "qadimgi",               meaning_ru: "древность",              meaning_en: "ancient",                 category: "time" },
  { latin: "abadiy",   cyrillic: "абадий",  meaning_uz: "abadda",                meaning_ru: "вечный",                 meaning_en: "eternal",                 category: "time" },
  { latin: "mangu",    cyrillic: "мангу",   meaning_uz: "abadiy",                meaning_ru: "вечный",                 meaning_en: "eternal",                 category: "time" },
  { latin: "davron",   cyrillic: "даврон",  meaning_uz: "davr",                  meaning_ru: "эпоха",                  meaning_en: "epoch",                   category: "time" },
  { latin: "yil",      cyrillic: "йил",     meaning_uz: "12 oy",                 meaning_ru: "год",                    meaning_en: "year",                    category: "time" },
  { latin: "navro'z",  cyrillic: "наврўз",  meaning_uz: "yangi yil",             meaning_ru: "Навруз, новый год",      meaning_en: "Nowruz",                  category: "time" },
  { latin: "hayit",    cyrillic: "ҳайит",   meaning_uz: "bayram",                meaning_ru: "праздник",               meaning_en: "holiday",                 category: "time" },
  { latin: "dam",      cyrillic: "дам",     meaning_uz: "vaqt",                  meaning_ru: "момент",                 meaning_en: "moment",                  category: "time" },
  { latin: "vaqt",     cyrillic: "вақт",    meaning_uz: "davr",                  meaning_ru: "время",                  meaning_en: "time",                    category: "time" },
  { latin: "safhat",   cyrillic: "саҳфат",  meaning_uz: "sahifa",                meaning_ru: "страница",               meaning_en: "page",                    category: "time" },

  // ── heritage (26) ───────────────────────────────────────
  { latin: "vatan",    cyrillic: "ватан",   meaning_uz: "ona yurt",              meaning_ru: "родина",                 meaning_en: "homeland",                category: "heritage" },
  { latin: "xalq",     cyrillic: "халқ",    meaning_uz: "el",                    meaning_ru: "народ",                  meaning_en: "people",                  category: "heritage" },
  { latin: "mulk",     cyrillic: "мулк",    meaning_uz: "qishloq",               meaning_ru: "владение",               meaning_en: "property",                category: "heritage" },
  { latin: "meros",    cyrillic: "мерос",   meaning_uz: "qoldirilgan",           meaning_ru: "наследство",             meaning_en: "heritage",                category: "heritage" },
  { latin: "odat",     cyrillic: "одат",    meaning_uz: "an'ana",                meaning_ru: "обычай",                 meaning_en: "custom",                  category: "heritage" },
  { latin: "avlod",    cyrillic: "авлод",   meaning_uz: "naslavl",               meaning_ru: "поколение",              meaning_en: "generation",              category: "heritage" },
  { latin: "shajara",  cyrillic: "шажара",  meaning_uz: "oilan",                 meaning_ru: "родословная",            meaning_en: "lineage",                 category: "heritage" },
  { latin: "rivoyat",  cyrillic: "ривоят",  meaning_uz: "qadimiy hikoya",        meaning_ru: "предание",               meaning_en: "legend",                  category: "heritage" },
  { latin: "an'ana",   cyrillic: "анъана",  meaning_uz: "odat",                  meaning_ru: "традиция",               meaning_en: "tradition",               category: "heritage" },
  { latin: "qadr",     cyrillic: "қадр",    meaning_uz: "hurmat",                meaning_ru: "достоинство",            meaning_en: "dignity",                 category: "heritage" },
  { latin: "qimmat",   cyrillic: "қиммат",  meaning_uz: "baholi",                meaning_ru: "ценность",               meaning_en: "value",                   category: "heritage" },
  { latin: "sharq",    cyrillic: "шарқ",    meaning_uz: "sharqiy tomon",         meaning_ru: "восток",                 meaning_en: "east, orient",            category: "heritage" },
  { latin: "buxoro",   cyrillic: "бухоро",  meaning_uz: "qadimgi shahar",        meaning_ru: "Бухара",                 meaning_en: "Bukhara",                 category: "heritage" },
  { latin: "samarqand",cyrillic: "самарқанд",meaning_uz:"qadimgi shahar",        meaning_ru: "Самарканд",              meaning_en: "Samarkand",               category: "heritage" },
  { latin: "xiva",     cyrillic: "хива",    meaning_uz: "qadimiy shahar",        meaning_ru: "Хива",                   meaning_en: "Khiva",                   category: "heritage" },
  { latin: "qoshiq",   cyrillic: "қошиқ",   meaning_uz: "oshpazlik buyumi",      meaning_ru: "ложка",                  meaning_en: "spoon",                   category: "heritage" },
  { latin: "chaykhana",cyrillic: "чойхона", meaning_uz: "choy uyi",              meaning_ru: "чайхана",                meaning_en: "teahouse",                category: "heritage" },
  { latin: "olov",     cyrillic: "олов",    meaning_uz: "otash",                 meaning_ru: "огонь",                  meaning_en: "flame",                   category: "heritage" },
  { latin: "karvon",   cyrillic: "карвон",  meaning_uz: "yo'l davomi",           meaning_ru: "караван",                meaning_en: "caravan",                 category: "heritage" },
  { latin: "ipak",     cyrillic: "ипак",    meaning_uz: "yumshoq tola",          meaning_ru: "шёлк",                   meaning_en: "silk",                    category: "heritage" },
  { latin: "atlas",    cyrillic: "атлас",   meaning_uz: "o'zbek matosi",         meaning_ru: "атлас",                  meaning_en: "atlas silk",              category: "heritage" },
  { latin: "do'ppi",   cyrillic: "дўппи",   meaning_uz: "milliy bosh kiyimi",    meaning_ru: "тюбетейка",              meaning_en: "doppi cap",               category: "heritage" },
  { latin: "oshxona",  cyrillic: "ошхона",  meaning_uz: "taom joyi",             meaning_ru: "кухня",                  meaning_en: "kitchen",                 category: "heritage" },
  { latin: "hovli",    cyrillic: "ҳовли",   meaning_uz: "uy oldi",               meaning_ru: "двор",                   meaning_en: "courtyard",               category: "heritage" },
  { latin: "daraxt",   cyrillic: "дарахт",  meaning_uz: "o'simlik",              meaning_ru: "дерево",                 meaning_en: "tree",                    category: "heritage" },
  { latin: "bog'",     cyrillic: "боғ",     meaning_uz: "o'simlik joyi",         meaning_ru: "сад",                    meaning_en: "garden",                  category: "heritage" },

  // ── abstract (28) ───────────────────────────────────────
  { latin: "safar",    cyrillic: "сафар",   meaning_uz: "yo'l yurish",           meaning_ru: "путешествие",            meaning_en: "journey",                 category: "abstract" },
  { latin: "niyat",    cyrillic: "ният",    meaning_uz: "maqsad",                meaning_ru: "намерение",              meaning_en: "intention",               category: "abstract" },
  { latin: "orzu",     cyrillic: "орзу",    meaning_uz: "orzu, xayol",           meaning_ru: "мечта",                  meaning_en: "dream",                   category: "abstract" },
  { latin: "umid",     cyrillic: "умид",    meaning_uz: "intilish",              meaning_ru: "надежда",                meaning_en: "hope",                    category: "abstract" },
  { latin: "baxt",     cyrillic: "бахт",    meaning_uz: "saodat",                meaning_ru: "счастье",                meaning_en: "happiness",               category: "abstract" },
  { latin: "tabassum", cyrillic: "табассум",meaning_uz: "jilmayish",             meaning_ru: "улыбка",                 meaning_en: "smile",                   category: "abstract" },
  { latin: "hayot",    cyrillic: "ҳаёт",    meaning_uz: "yashash",               meaning_ru: "жизнь",                  meaning_en: "life",                    category: "abstract" },
  { latin: "ruh",      cyrillic: "руҳ",     meaning_uz: "jon",                   meaning_ru: "дух",                    meaning_en: "spirit",                  category: "abstract" },
  { latin: "ma'no",    cyrillic: "маъно",   meaning_uz: "ahamiyat",              meaning_ru: "смысл",                  meaning_en: "meaning",                 category: "abstract" },
  { latin: "qiyam",    cyrillic: "қиём",    meaning_uz: "yuksak nuqta",          meaning_ru: "вершина, пик",           meaning_en: "zenith",                  category: "abstract" },
  { latin: "manzil",   cyrillic: "манзил",  meaning_uz: "borish joyi",           meaning_ru: "место назначения",       meaning_en: "destination",             category: "abstract" },
  { latin: "yo'l",     cyrillic: "йўл",     meaning_uz: "yurish chizig'i",       meaning_ru: "путь, дорога",           meaning_en: "path",                    category: "abstract" },
  { latin: "qadam",    cyrillic: "қадам",   meaning_uz: "yurish bo'lagi",        meaning_ru: "шаг",                    meaning_en: "step",                    category: "abstract" },
  { latin: "intilish", cyrillic: "интилиш", meaning_uz: "harakat",               meaning_ru: "стремление",             meaning_en: "aspiration",              category: "abstract" },
  { latin: "ishonch",  cyrillic: "ишонч",   meaning_uz: "e'tiqod",               meaning_ru: "уверенность",            meaning_en: "confidence",              category: "abstract" },
  { latin: "e'tiqod",  cyrillic: "эътиқод", meaning_uz: "ishonish",              meaning_ru: "вера",                   meaning_en: "belief",                  category: "abstract" },
  { latin: "erkin",    cyrillic: "эркин",   meaning_uz: "hech narsa to'smaydi",  meaning_ru: "свободный",              meaning_en: "free",                    category: "abstract" },
  { latin: "ozod",     cyrillic: "озод",    meaning_uz: "erkin",                 meaning_ru: "свободный",              meaning_en: "liberated",               category: "abstract" },
  { latin: "haqiqat",  cyrillic: "ҳақиқат", meaning_uz: "to'g'rilik",            meaning_ru: "истина",                 meaning_en: "truth",                   category: "abstract" },
  { latin: "adolat",   cyrillic: "адолат",  meaning_uz: "haqqoniyat",            meaning_ru: "справедливость",         meaning_en: "justice",                 category: "abstract" },
  { latin: "birlik",   cyrillic: "бирлик",  meaning_uz: "bir bo'lish",           meaning_ru: "единство",               meaning_en: "unity",                   category: "abstract" },
  { latin: "taraqqiy", cyrillic: "тараққий",meaning_uz: "o'sish",                meaning_ru: "прогресс",               meaning_en: "progress",                category: "abstract" },
  { latin: "yutuq",    cyrillic: "ютуқ",    meaning_uz: "muvaffaqiyat",          meaning_ru: "успех",                  meaning_en: "achievement",             category: "abstract" },
  { latin: "farah",    cyrillic: "фараҳ",   meaning_uz: "shodlik",               meaning_ru: "радость, ликование",     meaning_en: "joy",                     category: "abstract" },
  { latin: "saodat",   cyrillic: "саодат",  meaning_uz: "baxt",                  meaning_ru: "счастье, блаженство",    meaning_en: "bliss",                   category: "abstract" },
  { latin: "farog'at", cyrillic: "фароғат", meaning_uz: "orom",                  meaning_ru: "покой, отрада",          meaning_en: "serenity",                category: "abstract" },
  { latin: "orom",     cyrillic: "ором",    meaning_uz: "tinchlik",              meaning_ru: "покой",                  meaning_en: "peace, calm",             category: "abstract" },
  { latin: "sukun",    cyrillic: "сукун",   meaning_uz: "jimlik",                meaning_ru: "тишина",                 meaning_en: "silence",                 category: "abstract" },

  // ── bonus modern brand-style (10) ───────────────────────
  { latin: "sayyora",  cyrillic: "сайёра",  meaning_uz: "osmondagi jism",        meaning_ru: "планета",                meaning_en: "planet",                  category: "abstract" },
  { latin: "yulduzkor",cyrillic: "юлдузкор",meaning_uz: "yulduzlar oluvchi",     meaning_ru: "ловец звёзд",            meaning_en: "star-catcher",            category: "abstract" },
  { latin: "tongchi",  cyrillic: "тонгчи",  meaning_uz: "tongni qutib oluvchi",  meaning_ru: "встречающий рассвет",    meaning_en: "dawn-bringer",            category: "time" },
  { latin: "qiyamzor", cyrillic: "қиёмзор", meaning_uz: "yuksaklik joyi",        meaning_ru: "место подъёма",          meaning_en: "place of rising",         category: "abstract" },
  { latin: "nurzor",   cyrillic: "нурзор",  meaning_uz: "nur to'la joy",         meaning_ru: "место света",            meaning_en: "place of light",          category: "light" },
  { latin: "mehrzod",  cyrillic: "меҳрзод", meaning_uz: "mehrning farzandi",     meaning_ru: "рождённый любовью",      meaning_en: "born of love",            category: "emotion" },
  { latin: "baxtzor",  cyrillic: "бахтзор", meaning_uz: "baxt makoni",           meaning_ru: "место счастья",          meaning_en: "place of happiness",      category: "abstract" },
  { latin: "oydina",   cyrillic: "ойдина",  meaning_uz: "oygina kabi",           meaning_ru: "подобная луне",          meaning_en: "moon-like",               category: "light" },
  { latin: "yorqin",   cyrillic: "ёрқин",   meaning_uz: "yog'duli",              meaning_ru: "яркий",                  meaning_en: "luminous",                category: "light" },
  { latin: "sarafroz", cyrillic: "сарафроз",meaning_uz: "yuksalgan",             meaning_ru: "возвышенный",            meaning_en: "exalted",                 category: "emotion" },
];

// ── Helpers ─────────────────────────────────────────────

export function getRootsByCategory(category: UzbekCategory): readonly UzbekRoot[] {
  return UZBEK_ROOTS.filter((r) => r.category === category);
}

export interface PickRootsOptions {
  /** When provided, only roots from these categories are eligible. */
  readonly categories?: readonly UzbekCategory[];
  readonly count: number;
  /** Defaults to Math.random — tests inject a seeded PRNG for determinism. */
  readonly rng?: () => number;
}

/**
 * Returns up to `count` roots, uniformly sampled without replacement from
 * the eligible pool (Fisher-Yates partial shuffle). Used by the generation
 * prompt to embed 10-15 fresh anchors per request.
 */
export function pickRoots(opts: PickRootsOptions): readonly UzbekRoot[] {
  const rng = opts.rng ?? Math.random;
  const pool: readonly UzbekRoot[] = opts.categories
    ? UZBEK_ROOTS.filter((r) => opts.categories!.includes(r.category))
    : UZBEK_ROOTS;
  const arr: UzbekRoot[] = pool.slice();
  const target = Math.min(Math.max(0, opts.count), arr.length);
  for (let i = arr.length - 1; i > arr.length - 1 - target; i--) {
    const j = Math.floor(rng() * (i + 1));
    const ai = arr[i]!;
    const aj = arr[j]!;
    arr[i] = aj;
    arr[j] = ai;
  }
  return arr.slice(arr.length - target);
}
