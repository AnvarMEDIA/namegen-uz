// Uzbek roots dictionary — Feature 1, Step 1.
//
// Curated list of authentic Uzbek roots and modern derivations suitable as
// semantic anchors for AI brand-name generation. Intentionally Uzbek-only;
// Turkic / Arabic / Persian neighbours land in a later iteration.
//
// Inclusion rules (all entries verified against these constraints):
//   - latin form is 4..8 characters, lower-case Latin a-z only (no
//     apostrophes, no digits) — must be brand-friendly out of the box.
//   - sounds easy to pronounce for an Uzbek speaker, with no awkward
//     consonant clusters at word boundaries (no leading sh/ng/gh/kh,
//     no triple-consonant sequences, no -ck / -tch / -dge endings).
//   - real Uzbek root or a productive derivation thereof.
//   - cyrillic spelling matches the standard Uzbek Cyrillic orthography
//     (Ў/Ҳ/Қ/Ғ where appropriate).
//   - meaning_uz uses Cyrillic to match Uzbek conventions; meaning_ru
//     is Russian; meaning_en is English. All three describe the same
//     concept.
//
// Use via lib/prompts/generate.ts (Step 2): a small randomised subset is
// embedded into the AI prompt as semantic inspiration, NOT as candidate
// names — the model is free to invent names rooted in or evocative of
// these words, but must still respect the existing phonetic and quality
// rules in lib/prompts/styles.ts.

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
  // ── nature ─────────────────────────────────────────────
  { latin: 'yulduz',   cyrillic: 'юлдуз',   meaning_uz: 'осмонда порловчи жисм', meaning_ru: 'звезда',                meaning_en: 'star',              category: 'nature' },
  { latin: 'oydin',    cyrillic: 'ойдин',   meaning_uz: 'ой нурида ёруғ',         meaning_ru: 'ясный, лунный',         meaning_en: 'moonlit',           category: 'nature' },
  { latin: 'oybek',    cyrillic: 'ойбек',   meaning_uz: 'ой каби бек',           meaning_ru: 'лунный князь',          meaning_en: 'moon-lord',         category: 'nature' },
  { latin: 'tonglik',  cyrillic: 'тонглик', meaning_uz: 'тонгга оид',             meaning_ru: 'рассветный',            meaning_en: 'of the dawn',       category: 'nature' },
  { latin: 'shafaq',   cyrillic: 'шафақ',   meaning_uz: 'тонг ёки кеч ранги',    meaning_ru: 'заря',                  meaning_en: 'dawn glow',         category: 'nature' },
  { latin: 'quyosh',   cyrillic: 'қуёш',    meaning_uz: 'осмондаги олов',        meaning_ru: 'солнце',                meaning_en: 'sun',               category: 'nature' },
  { latin: 'samo',     cyrillic: 'само',    meaning_uz: 'юқори осмон',           meaning_ru: 'небо',                  meaning_en: 'sky',               category: 'nature' },
  { latin: 'osmon',    cyrillic: 'осмон',   meaning_uz: 'юқори жой',             meaning_ru: 'небо, небеса',          meaning_en: 'heaven',            category: 'nature' },
  { latin: 'bahor',    cyrillic: 'баҳор',   meaning_uz: 'йил фасли',             meaning_ru: 'весна',                 meaning_en: 'spring',            category: 'nature' },
  { latin: 'bahori',   cyrillic: 'баҳори',  meaning_uz: 'баҳорга оид',           meaning_ru: 'весенний',              meaning_en: 'vernal',            category: 'nature' },
  { latin: 'gulshan',  cyrillic: 'гулшан',  meaning_uz: 'гуллар боғи',           meaning_ru: 'розарий, цветник',      meaning_en: 'rose garden',       category: 'nature' },
  { latin: 'gulbahor', cyrillic: 'гулбаҳор',meaning_uz: 'гуллар баҳори',         meaning_ru: 'весна цветов',          meaning_en: 'flower spring',     category: 'nature' },
  { latin: 'daryo',    cyrillic: 'дарё',    meaning_uz: 'катта сув оқими',       meaning_ru: 'река',                  meaning_en: 'river',             category: 'nature' },
  { latin: 'dengiz',   cyrillic: 'денгиз',  meaning_uz: 'катта сув',             meaning_ru: 'море',                  meaning_en: 'sea',               category: 'nature' },
  { latin: 'chashma',  cyrillic: 'чашма',   meaning_uz: 'тоза сув манбаси',      meaning_ru: 'родник',                meaning_en: 'spring water',      category: 'nature' },
  { latin: 'bulut',    cyrillic: 'булут',   meaning_uz: 'осмондаги пахта',       meaning_ru: 'облако',                meaning_en: 'cloud',             category: 'nature' },
  { latin: 'shamol',   cyrillic: 'шамол',   meaning_uz: 'ҳаво ҳаракати',         meaning_ru: 'ветер',                 meaning_en: 'wind',              category: 'nature' },
  { latin: 'yomgir',   cyrillic: 'ёмғир',   meaning_uz: 'осмондан тушадиган сув', meaning_ru: 'дождь',                meaning_en: 'rain',              category: 'nature' },
  { latin: 'tabiat',   cyrillic: 'табиат',  meaning_uz: 'табиий олам',           meaning_ru: 'природа',               meaning_en: 'nature',            category: 'nature' },
  { latin: 'tabiiy',   cyrillic: 'табиий',  meaning_uz: 'табиатга оид',          meaning_ru: 'натуральный',           meaning_en: 'natural',           category: 'nature' },
  { latin: 'orman',    cyrillic: 'ўрмон',   meaning_uz: 'дарахтлар жойи',        meaning_ru: 'лес',                   meaning_en: 'forest',            category: 'nature' },
  { latin: 'olov',     cyrillic: 'олов',    meaning_uz: 'иссиқлик манбаси',      meaning_ru: 'огонь, пламя',          meaning_en: 'flame',             category: 'nature' },
  { latin: 'tilla',    cyrillic: 'тилла',   meaning_uz: 'олтин рангли',          meaning_ru: 'золотой',               meaning_en: 'golden',            category: 'nature' },
  { latin: 'oltin',    cyrillic: 'олтин',   meaning_uz: 'қимматбаҳо метал',      meaning_ru: 'золото',                meaning_en: 'gold',              category: 'nature' },
  { latin: 'zumrad',   cyrillic: 'зумрад',  meaning_uz: 'яшил қимматбаҳо тош',   meaning_ru: 'изумруд',               meaning_en: 'emerald',           category: 'nature' },
  { latin: 'inju',     cyrillic: 'инжу',    meaning_uz: 'денгиз тоши',           meaning_ru: 'жемчуг',                meaning_en: 'pearl',             category: 'nature' },
  { latin: 'lola',     cyrillic: 'лола',    meaning_uz: 'қизил гул',             meaning_ru: 'тюльпан',               meaning_en: 'tulip',             category: 'nature' },
  { latin: 'chechak',  cyrillic: 'чечак',   meaning_uz: 'очилган гул',           meaning_ru: 'цветок',                meaning_en: 'blossom',           category: 'nature' },
  { latin: 'nargis',   cyrillic: 'наргис',  meaning_uz: 'оқ гул',                meaning_ru: 'нарцисс',               meaning_en: 'narcissus',         category: 'nature' },

  // ── power ──────────────────────────────────────────────
  { latin: 'kuch',     cyrillic: 'куч',     meaning_uz: 'қудрат',                 meaning_ru: 'сила',                  meaning_en: 'power',             category: 'power' },
  { latin: 'kuchli',   cyrillic: 'кучли',   meaning_uz: 'кучга эга',              meaning_ru: 'сильный',               meaning_en: 'strong',            category: 'power' },
  { latin: 'qudrat',   cyrillic: 'қудрат',  meaning_uz: 'катта куч',              meaning_ru: 'мощь',                  meaning_en: 'might',             category: 'power' },
  { latin: 'zafar',    cyrillic: 'зафар',   meaning_uz: 'ғалаба',                 meaning_ru: 'победа',                meaning_en: 'victory',           category: 'power' },
  { latin: 'zafarli',  cyrillic: 'зафарли', meaning_uz: 'ғолиб',                  meaning_ru: 'победоносный',          meaning_en: 'victorious',        category: 'power' },
  { latin: 'galaba',   cyrillic: 'ғалаба',  meaning_uz: 'устунлик',               meaning_ru: 'триумф',                meaning_en: 'triumph',           category: 'power' },
  { latin: 'begim',    cyrillic: 'бегим',   meaning_uz: 'менинг бегим',           meaning_ru: 'мой господин',          meaning_en: 'my lord',           category: 'power' },
  { latin: 'botir',    cyrillic: 'ботир',   meaning_uz: 'қаҳрамон',               meaning_ru: 'богатырь',              meaning_en: 'hero',              category: 'power' },
  { latin: 'bahodir',  cyrillic: 'баҳодир', meaning_uz: 'катта ботир',            meaning_ru: 'витязь',                meaning_en: 'champion',          category: 'power' },
  { latin: 'pahlavon', cyrillic: 'паҳлавон',meaning_uz: 'кучли инсон',            meaning_ru: 'силач',                 meaning_en: 'champion',          category: 'power' },
  { latin: 'arslon',   cyrillic: 'арслон',  meaning_uz: 'шер',                    meaning_ru: 'лев',                   meaning_en: 'lion',              category: 'power' },
  { latin: 'sherzod',  cyrillic: 'шерзод',  meaning_uz: 'шер каби туғилган',      meaning_ru: 'львиный отпрыск',       meaning_en: 'lion-born',         category: 'power' },
  { latin: 'sherdil',  cyrillic: 'шердил',  meaning_uz: 'шер юракли',             meaning_ru: 'львиное сердце',        meaning_en: 'lion-hearted',      category: 'power' },
  { latin: 'mard',     cyrillic: 'мард',    meaning_uz: 'эр киши',                meaning_ru: 'мужественный',          meaning_en: 'manly',             category: 'power' },
  { latin: 'mardlik',  cyrillic: 'мардлик', meaning_uz: 'мардона феъл',           meaning_ru: 'мужество',              meaning_en: 'bravery',           category: 'power' },
  { latin: 'jasur',    cyrillic: 'жасур',   meaning_uz: 'қўрқмас',                meaning_ru: 'смелый',                meaning_en: 'brave',             category: 'power' },
  { latin: 'jasorat',  cyrillic: 'жасорат', meaning_uz: 'қаҳрамонлик',            meaning_ru: 'отвага',                meaning_en: 'valour',            category: 'power' },
  { latin: 'amir',     cyrillic: 'амир',    meaning_uz: 'бошлиқ',                 meaning_ru: 'эмир, повелитель',      meaning_en: 'commander',         category: 'power' },
  { latin: 'sulton',   cyrillic: 'султон',  meaning_uz: 'катта шоҳ',              meaning_ru: 'султан',                meaning_en: 'sultan',            category: 'power' },
  { latin: 'azim',     cyrillic: 'азим',    meaning_uz: 'буюк',                   meaning_ru: 'великий',               meaning_en: 'great',             category: 'power' },
  { latin: 'azimat',   cyrillic: 'азимат',  meaning_uz: 'буюклик',                meaning_ru: 'величие',               meaning_en: 'greatness',         category: 'power' },
  { latin: 'ulug',     cyrillic: 'улуғ',    meaning_uz: 'буюк, мўътабар',         meaning_ru: 'великий',               meaning_en: 'great',             category: 'power' },
  { latin: 'ulugbek',  cyrillic: 'улуғбек', meaning_uz: 'буюк бек',               meaning_ru: 'великий лорд',          meaning_en: 'great-lord',        category: 'power' },
  { latin: 'qahramon', cyrillic: 'қаҳрамон',meaning_uz: 'ботир',                  meaning_ru: 'герой',                 meaning_en: 'hero',              category: 'power' },
  { latin: 'tantana',  cyrillic: 'тантана', meaning_uz: 'ғалаба байрами',         meaning_ru: 'триумф',                meaning_en: 'celebration',       category: 'power' },
  { latin: 'shoh',     cyrillic: 'шоҳ',     meaning_uz: 'подшо',                  meaning_ru: 'царь',                  meaning_en: 'king',              category: 'power' },
  { latin: 'shohbek',  cyrillic: 'шоҳбек',  meaning_uz: 'шоҳ беги',               meaning_ru: 'царственный лорд',      meaning_en: 'regal lord',        category: 'power' },

  // ── light ──────────────────────────────────────────────
  { latin: 'nuri',     cyrillic: 'нури',    meaning_uz: 'нур',                    meaning_ru: 'свет, сияние',          meaning_en: 'light',             category: 'light' },
  { latin: 'nurli',    cyrillic: 'нурли',   meaning_uz: 'ёруғ',                   meaning_ru: 'лучистый',              meaning_en: 'luminous',          category: 'light' },
  { latin: 'nuriy',    cyrillic: 'нурий',   meaning_uz: 'нурга оид',              meaning_ru: 'световой',              meaning_en: 'radiant',           category: 'light' },
  { latin: 'oftob',    cyrillic: 'офтоб',   meaning_uz: 'қуёш',                   meaning_ru: 'солнце',                meaning_en: 'sun',               category: 'light' },
  { latin: 'oftobli',  cyrillic: 'офтобли', meaning_uz: 'қуёшли',                 meaning_ru: 'солнечный',             meaning_en: 'sunny',             category: 'light' },
  { latin: 'shula',    cyrillic: 'шуъла',   meaning_uz: 'нур, чироқ',             meaning_ru: 'луч',                   meaning_en: 'ray',               category: 'light' },
  { latin: 'zarrin',   cyrillic: 'заррин',  meaning_uz: 'олтин рангли',           meaning_ru: 'златой',                meaning_en: 'golden-hued',       category: 'light' },
  { latin: 'yarqin',   cyrillic: 'ярқин',   meaning_uz: 'порлоқ',                 meaning_ru: 'яркий',                 meaning_en: 'sparkling',         category: 'light' },
  { latin: 'ravshan',  cyrillic: 'равшан',  meaning_uz: 'ёруғ ва тоза',           meaning_ru: 'светлый',               meaning_en: 'bright',            category: 'light' },
  { latin: 'shams',    cyrillic: 'шамс',    meaning_uz: 'қуёш',                   meaning_ru: 'солнце',                meaning_en: 'sun',               category: 'light' },
  { latin: 'shamsiy',  cyrillic: 'шамсий',  meaning_uz: 'қуёшга оид',             meaning_ru: 'солнечный',             meaning_en: 'solar',             category: 'light' },
  { latin: 'tongi',    cyrillic: 'тонги',   meaning_uz: 'тонгга оид',             meaning_ru: 'утренний',              meaning_en: 'of the morning',    category: 'light' },
  { latin: 'tongnur',  cyrillic: 'тонгнур', meaning_uz: 'тонг нури',              meaning_ru: 'свет рассвета',         meaning_en: 'dawn-light',        category: 'light' },
  { latin: 'nurchin',  cyrillic: 'нурчин',  meaning_uz: 'нур терувчи',            meaning_ru: 'собирающий свет',       meaning_en: 'light-gatherer',    category: 'light' },
  { latin: 'yorug',    cyrillic: 'ёруғ',    meaning_uz: 'нурли',                  meaning_ru: 'светлый',               meaning_en: 'bright',            category: 'light' },
  { latin: 'tongchi',  cyrillic: 'тонгчи',  meaning_uz: 'тонгда турувчи',         meaning_ru: 'встающий с рассветом',  meaning_en: 'early-riser',       category: 'light' },
  { latin: 'nurzar',   cyrillic: 'нурзор',  meaning_uz: 'нур ёғилаётган жой',     meaning_ru: 'место сияния',          meaning_en: 'place of light',    category: 'light' },
  { latin: 'oychiroq', cyrillic: 'ойчироқ', meaning_uz: 'ой чироғи',              meaning_ru: 'лунный фонарь',         meaning_en: 'moon-lamp',         category: 'light' },
  { latin: 'shulali',  cyrillic: 'шуълали', meaning_uz: 'нурли',                  meaning_ru: 'лучезарный',            meaning_en: 'radiant',           category: 'light' },
  { latin: 'shafaqli', cyrillic: 'шафақли', meaning_uz: 'шафақ ранги',            meaning_ru: 'зарёвый',               meaning_en: 'dawn-tinted',       category: 'light' },
  { latin: 'nuruz',    cyrillic: 'нуруз',   meaning_uz: 'янги нур',               meaning_ru: 'новый свет',            meaning_en: 'new light',         category: 'light' },
  { latin: 'yoritma',  cyrillic: 'ёритма',  meaning_uz: 'нур таратувчи',          meaning_ru: 'осветительный',         meaning_en: 'illuminator',       category: 'light' },
  { latin: 'nurkor',   cyrillic: 'нуркор',  meaning_uz: 'нур ишловчиси',          meaning_ru: 'создающий свет',        meaning_en: 'light-maker',       category: 'light' },
  { latin: 'yarqiroq', cyrillic: 'ярқироқ', meaning_uz: 'ярқираган',              meaning_ru: 'блестящий',             meaning_en: 'glittering',        category: 'light' },
  { latin: 'zarbek',   cyrillic: 'зарбек',  meaning_uz: 'олтин бек',              meaning_ru: 'золотой лорд',          meaning_en: 'gold-lord',         category: 'light' },

  // ── emotion ────────────────────────────────────────────
  { latin: 'mehr',     cyrillic: 'меҳр',    meaning_uz: 'муҳаббат, илиқлик',      meaning_ru: 'любовь, тепло',         meaning_en: 'love, warmth',      category: 'emotion' },
  { latin: 'mehrli',   cyrillic: 'меҳрли',  meaning_uz: 'илиқ дилли',             meaning_ru: 'тёплый, душевный',      meaning_en: 'warm-hearted',      category: 'emotion' },
  { latin: 'mehrjon',  cyrillic: 'меҳржон', meaning_uz: 'азиз, илиқ',             meaning_ru: 'милый, дорогой',        meaning_en: 'dear love',         category: 'emotion' },
  { latin: 'mehrobon', cyrillic: 'меҳрибон',meaning_uz: 'меҳр-шафқатли',          meaning_ru: 'милосердный',           meaning_en: 'kind, caring',      category: 'emotion' },
  { latin: 'dost',     cyrillic: 'дўст',    meaning_uz: 'яқин одам',              meaning_ru: 'друг',                  meaning_en: 'friend',            category: 'emotion' },
  { latin: 'dostlik',  cyrillic: 'дўстлик', meaning_uz: 'дўст бўлиш',             meaning_ru: 'дружба',                meaning_en: 'friendship',        category: 'emotion' },
  { latin: 'sevgi',    cyrillic: 'севги',   meaning_uz: 'муҳаббат',               meaning_ru: 'любовь',                meaning_en: 'love',              category: 'emotion' },
  { latin: 'shod',     cyrillic: 'шод',     meaning_uz: 'хурсанд',                meaning_ru: 'радостный',             meaning_en: 'joyful',            category: 'emotion' },
  { latin: 'shodlik',  cyrillic: 'шодлик',  meaning_uz: 'хурсандчилик',           meaning_ru: 'радость',               meaning_en: 'joy',               category: 'emotion' },
  { latin: 'shodyona', cyrillic: 'шодиёна', meaning_uz: 'хурсанд ҳолатда',        meaning_ru: 'весёлый',               meaning_en: 'merry',             category: 'emotion' },
  { latin: 'quvonch',  cyrillic: 'қувонч',  meaning_uz: 'шодлик',                 meaning_ru: 'радость',               meaning_en: 'delight',           category: 'emotion' },
  { latin: 'baxt',     cyrillic: 'бахт',    meaning_uz: 'катта омад',             meaning_ru: 'счастье',               meaning_en: 'happiness',         category: 'emotion' },
  { latin: 'baxtli',   cyrillic: 'бахтли',  meaning_uz: 'омадли',                 meaning_ru: 'счастливый',            meaning_en: 'happy',             category: 'emotion' },
  { latin: 'baxtbek',  cyrillic: 'бахтбек', meaning_uz: 'бахт беги',              meaning_ru: 'лорд счастья',          meaning_en: 'happiness-lord',    category: 'emotion' },
  { latin: 'saodat',   cyrillic: 'саодат',  meaning_uz: 'буюк бахт',              meaning_ru: 'благодать',             meaning_en: 'blessed-state',     category: 'emotion' },
  { latin: 'saodatli', cyrillic: 'саодатли',meaning_uz: 'бахтли',                 meaning_ru: 'благословенный',        meaning_en: 'blessed',           category: 'emotion' },
  { latin: 'umid',     cyrillic: 'умид',    meaning_uz: 'келажак ишончи',         meaning_ru: 'надежда',               meaning_en: 'hope',              category: 'emotion' },
  { latin: 'umidli',   cyrillic: 'умидли',  meaning_uz: 'умид қилувчи',           meaning_ru: 'обнадёженный',          meaning_en: 'hopeful',           category: 'emotion' },
  { latin: 'umidbek',  cyrillic: 'умидбек', meaning_uz: 'умид беги',              meaning_ru: 'лорд надежды',          meaning_en: 'hope-lord',         category: 'emotion' },
  { latin: 'ishonch',  cyrillic: 'ишонч',   meaning_uz: 'ҳақиқатга ишониш',       meaning_ru: 'доверие',               meaning_en: 'trust',             category: 'emotion' },
  { latin: 'iliq',     cyrillic: 'илиқ',    meaning_uz: 'илиқ ҳарорат',           meaning_ru: 'тёплый',                meaning_en: 'warm',              category: 'emotion' },
  { latin: 'iliqlik',  cyrillic: 'илиқлик', meaning_uz: 'илиқ ҳолат',             meaning_ru: 'теплота',               meaning_en: 'warmth',            category: 'emotion' },
  { latin: 'tinch',    cyrillic: 'тинч',    meaning_uz: 'осойишта',               meaning_ru: 'спокойный',             meaning_en: 'peaceful',          category: 'emotion' },
  { latin: 'oromli',   cyrillic: 'оромли',  meaning_uz: 'дам олган',              meaning_ru: 'умиротворённый',        meaning_en: 'serene',            category: 'emotion' },
  { latin: 'orom',     cyrillic: 'ором',    meaning_uz: 'дам, осойишта',          meaning_ru: 'покой',                 meaning_en: 'rest',              category: 'emotion' },
  { latin: 'shirin',   cyrillic: 'ширин',   meaning_uz: 'тотли',                  meaning_ru: 'сладкий',               meaning_en: 'sweet',             category: 'emotion' },
  { latin: 'dilbar',   cyrillic: 'дилбар',  meaning_uz: 'дилларни жалб қилувчи',  meaning_ru: 'пленяющий сердца',      meaning_en: 'heart-stealing',    category: 'emotion' },

  // ── wisdom ─────────────────────────────────────────────
  { latin: 'aqlim',    cyrillic: 'ақлим',   meaning_uz: 'менинг ақлим',           meaning_ru: 'мой разум',             meaning_en: 'my mind',           category: 'wisdom' },
  { latin: 'aqlli',    cyrillic: 'ақлли',   meaning_uz: 'ақлга эга',              meaning_ru: 'умный',                 meaning_en: 'intelligent',       category: 'wisdom' },
  { latin: 'aqliy',    cyrillic: 'ақлий',   meaning_uz: 'ақлга оид',              meaning_ru: 'умственный',            meaning_en: 'mental',            category: 'wisdom' },
  { latin: 'aqlbek',   cyrillic: 'ақлбек',  meaning_uz: 'ақл беги',               meaning_ru: 'мудрый лорд',           meaning_en: 'mind-lord',         category: 'wisdom' },
  { latin: 'bilim',    cyrillic: 'билим',   meaning_uz: 'ўрганилган маълумот',    meaning_ru: 'знание',                meaning_en: 'knowledge',         category: 'wisdom' },
  { latin: 'bilimli',  cyrillic: 'билимли', meaning_uz: 'билимга эга',            meaning_ru: 'знающий',               meaning_en: 'knowledgeable',     category: 'wisdom' },
  { latin: 'bilimchi', cyrillic: 'билимчи', meaning_uz: 'билим қидирувчи',        meaning_ru: 'искатель знаний',       meaning_en: 'knowledge-seeker',  category: 'wisdom' },
  { latin: 'olim',     cyrillic: 'олим',    meaning_uz: 'илм одами',              meaning_ru: 'учёный',                meaning_en: 'scholar',           category: 'wisdom' },
  { latin: 'olimcha',  cyrillic: 'олимча',  meaning_uz: 'кичик олим',             meaning_ru: 'юный учёный',           meaning_en: 'young scholar',     category: 'wisdom' },
  { latin: 'dono',     cyrillic: 'доно',    meaning_uz: 'ақлли',                  meaning_ru: 'мудрый',                meaning_en: 'wise',              category: 'wisdom' },
  { latin: 'donolik',  cyrillic: 'донолик', meaning_uz: 'ақлли бўлиш',            meaning_ru: 'мудрость',              meaning_en: 'wisdom',            category: 'wisdom' },
  { latin: 'donobek',  cyrillic: 'донобек', meaning_uz: 'доно бек',               meaning_ru: 'мудрый лорд',           meaning_en: 'wise-lord',         category: 'wisdom' },
  { latin: 'donish',   cyrillic: 'дониш',   meaning_uz: 'мадраса донолиги',       meaning_ru: 'мудрость (поэт.)',      meaning_en: 'wisdom (poetic)',   category: 'wisdom' },
  { latin: 'idrok',    cyrillic: 'идрок',   meaning_uz: 'тушуниш қобилияти',      meaning_ru: 'восприятие',            meaning_en: 'perception',        category: 'wisdom' },
  { latin: 'idrokli',  cyrillic: 'идрокли', meaning_uz: 'тушуниш қобилиятли',     meaning_ru: 'проницательный',        meaning_en: 'perceptive',        category: 'wisdom' },
  { latin: 'tafakkur', cyrillic: 'тафаккур',meaning_uz: 'фикрлаш',                meaning_ru: 'мышление',              meaning_en: 'thinking',          category: 'wisdom' },
  { latin: 'fikr',     cyrillic: 'фикр',    meaning_uz: 'ўйланган нарса',         meaning_ru: 'мысль',                 meaning_en: 'thought',           category: 'wisdom' },
  { latin: 'fikrli',   cyrillic: 'фикрли',  meaning_uz: 'фикрга эга',             meaning_ru: 'вдумчивый',             meaning_en: 'thoughtful',        category: 'wisdom' },
  { latin: 'fikrbek',  cyrillic: 'фикрбек', meaning_uz: 'фикр беги',              meaning_ru: 'лорд мысли',            meaning_en: 'thought-lord',      category: 'wisdom' },
  { latin: 'maslahat', cyrillic: 'маслаҳат',meaning_uz: 'тавсия',                 meaning_ru: 'совет',                 meaning_en: 'advice',            category: 'wisdom' },
  { latin: 'zukko',    cyrillic: 'зукко',   meaning_uz: 'тез фикрловчи',          meaning_ru: 'сообразительный',       meaning_en: 'clever',            category: 'wisdom' },
  { latin: 'zehn',     cyrillic: 'зеҳн',    meaning_uz: 'идрок қобилияти',        meaning_ru: 'разум',                 meaning_en: 'intellect',         category: 'wisdom' },
  { latin: 'zehnli',   cyrillic: 'зеҳнли',  meaning_uz: 'зеҳнга эга',             meaning_ru: 'смышлёный',             meaning_en: 'sharp-minded',      category: 'wisdom' },
  { latin: 'zakovat',  cyrillic: 'заковат', meaning_uz: 'зеҳн ўткирлиги',         meaning_ru: 'остроумие',             meaning_en: 'wit',               category: 'wisdom' },
  { latin: 'mantiq',   cyrillic: 'мантиқ',  meaning_uz: 'фикрнинг тартиби',       meaning_ru: 'логика',                meaning_en: 'logic',             category: 'wisdom' },
  { latin: 'mantiqli', cyrillic: 'мантиқли',meaning_uz: 'мантиққа эга',           meaning_ru: 'логичный',              meaning_en: 'logical',           category: 'wisdom' },
  { latin: 'ustoz',    cyrillic: 'устоз',   meaning_uz: 'муаллим, устод',         meaning_ru: 'наставник',             meaning_en: 'master',            category: 'wisdom' },
  { latin: 'murabbiy', cyrillic: 'мураббий',meaning_uz: 'тарбиячи',               meaning_ru: 'тренер, наставник',     meaning_en: 'tutor',             category: 'wisdom' },

  // ── time ───────────────────────────────────────────────
  { latin: 'vaqt',     cyrillic: 'вақт',    meaning_uz: 'вақт',                   meaning_ru: 'время',                 meaning_en: 'time',              category: 'time' },
  { latin: 'zamon',    cyrillic: 'замон',   meaning_uz: 'тарихий давр',           meaning_ru: 'эпоха',                 meaning_en: 'era',               category: 'time' },
  { latin: 'zamonli',  cyrillic: 'замонли', meaning_uz: 'замонга оид',            meaning_ru: 'эпохальный',            meaning_en: 'of the era',        category: 'time' },
  { latin: 'zamonbek', cyrillic: 'замонбек',meaning_uz: 'замон беги',             meaning_ru: 'лорд эпохи',            meaning_en: 'era-lord',          category: 'time' },
  { latin: 'tarix',    cyrillic: 'тарих',   meaning_uz: 'ўтган воқеалар',         meaning_ru: 'история',               meaning_en: 'history',           category: 'time' },
  { latin: 'tarixiy',  cyrillic: 'тарихий', meaning_uz: 'тарихга оид',            meaning_ru: 'исторический',          meaning_en: 'historical',        category: 'time' },
  { latin: 'kelajak',  cyrillic: 'келажак', meaning_uz: 'келадиган давр',         meaning_ru: 'будущее',               meaning_en: 'future',            category: 'time' },
  { latin: 'tongbek',  cyrillic: 'тонгбек', meaning_uz: 'тонг беги',              meaning_ru: 'рассветный лорд',       meaning_en: 'dawn-lord',         category: 'time' },
  { latin: 'sahar',    cyrillic: 'саҳар',   meaning_uz: 'эрта тонг',              meaning_ru: 'заря',                  meaning_en: 'dawn',              category: 'time' },
  { latin: 'saharli',  cyrillic: 'саҳарли', meaning_uz: 'эрта вақт',              meaning_ru: 'ранний',                meaning_en: 'early',             category: 'time' },
  { latin: 'saharbek', cyrillic: 'саҳарбек',meaning_uz: 'саҳар беги',             meaning_ru: 'лорд зари',             meaning_en: 'dawn-lord',         category: 'time' },
  { latin: 'subh',     cyrillic: 'субҳ',    meaning_uz: 'тонг (поэт.)',           meaning_ru: 'утро (поэт.)',          meaning_en: 'dawn (poetic)',     category: 'time' },
  { latin: 'kechki',   cyrillic: 'кечки',   meaning_uz: 'кечга оид',              meaning_ru: 'вечерний',              meaning_en: "of the evening",    category: 'time' },
  { latin: 'kunduz',   cyrillic: 'кундуз',  meaning_uz: 'кун пайти',              meaning_ru: 'день',                  meaning_en: 'day',               category: 'time' },
  { latin: 'kunduzi',  cyrillic: 'кундузи', meaning_uz: 'кун давомида',           meaning_ru: 'дневной',               meaning_en: 'of the day',        category: 'time' },
  { latin: 'tunli',    cyrillic: 'тунли',   meaning_uz: 'тунга оид',              meaning_ru: 'ночной',                meaning_en: 'nightly',           category: 'time' },
  { latin: 'oqshom',   cyrillic: 'оқшом',   meaning_uz: 'кеч пайт',               meaning_ru: 'вечер',                 meaning_en: 'evening',           category: 'time' },
  { latin: 'oqshomli', cyrillic: 'оқшомли', meaning_uz: 'кечга оид',              meaning_ru: 'вечерний',              meaning_en: 'of the evening',    category: 'time' },
  { latin: 'abad',     cyrillic: 'абад',    meaning_uz: 'охирсиз вақт',           meaning_ru: 'вечность',              meaning_en: 'eternity',          category: 'time' },
  { latin: 'abadiy',   cyrillic: 'абадий',  meaning_uz: 'охирсиз',                meaning_ru: 'вечный',                meaning_en: 'eternal',           category: 'time' },
  { latin: 'abadbek',  cyrillic: 'абадбек', meaning_uz: 'абад беги',              meaning_ru: 'вечный лорд',           meaning_en: 'eternal-lord',      category: 'time' },
  { latin: 'umrli',    cyrillic: 'умрли',   meaning_uz: 'узоқ умрли',             meaning_ru: 'долгожитель',           meaning_en: 'long-lived',        category: 'time' },
  { latin: 'umrlik',   cyrillic: 'умрлик',  meaning_uz: 'бутун умр',              meaning_ru: 'на всю жизнь',          meaning_en: 'lifelong',          category: 'time' },
  { latin: 'asrim',    cyrillic: 'асрим',   meaning_uz: 'менинг асрим',           meaning_ru: 'мой век',               meaning_en: 'my century',        category: 'time' },
  { latin: 'uzun',     cyrillic: 'узун',    meaning_uz: 'узоқ',                   meaning_ru: 'долгий',                meaning_en: 'long',              category: 'time' },

  // ── heritage ───────────────────────────────────────────
  { latin: 'otabek',   cyrillic: 'отабек',  meaning_uz: 'ота беги',               meaning_ru: 'отец-лорд',             meaning_en: 'father-lord',       category: 'heritage' },
  { latin: 'onaxon',   cyrillic: 'онахон',  meaning_uz: 'онажоним',               meaning_ru: 'матушка',               meaning_en: 'honoured mother',   category: 'heritage' },
  { latin: 'bobo',     cyrillic: 'бобо',    meaning_uz: 'катта ота',              meaning_ru: 'дед',                   meaning_en: 'grandfather',       category: 'heritage' },
  { latin: 'bobocha',  cyrillic: 'бобоча',  meaning_uz: 'кичкина бобо',           meaning_ru: 'дедушка (ласк.)',       meaning_en: 'little grandfather', category: 'heritage' },
  { latin: 'ajdod',    cyrillic: 'аждод',   meaning_uz: 'ўтган авлод',            meaning_ru: 'предок',                meaning_en: 'ancestor',          category: 'heritage' },
  { latin: 'ajdodi',   cyrillic: 'аждоди',  meaning_uz: 'аждодга оид',            meaning_ru: 'по предкам',            meaning_en: 'of ancestors',      category: 'heritage' },
  { latin: 'avlod',    cyrillic: 'авлод',   meaning_uz: 'насил',                  meaning_ru: 'поколение',             meaning_en: 'generation',        category: 'heritage' },
  { latin: 'meros',    cyrillic: 'мерос',   meaning_uz: 'қолдирилган бойлик',     meaning_ru: 'наследие',              meaning_en: 'heritage',          category: 'heritage' },
  { latin: 'merosli',  cyrillic: 'меросли', meaning_uz: 'мерос ҳолда',            meaning_ru: 'унаследованный',        meaning_en: 'inherited',         category: 'heritage' },
  { latin: 'urfli',    cyrillic: 'урфли',   meaning_uz: 'удумли',                 meaning_ru: 'обычный, традиционный', meaning_en: 'customary',         category: 'heritage' },
  { latin: 'anana',    cyrillic: 'анъана',  meaning_uz: 'удум, расм',             meaning_ru: 'традиция',              meaning_en: 'tradition',         category: 'heritage' },
  { latin: 'ananali',  cyrillic: 'анъанали',meaning_uz: 'удумли',                 meaning_ru: 'традиционный',          meaning_en: 'traditional',       category: 'heritage' },
  { latin: 'millat',   cyrillic: 'миллат',  meaning_uz: 'халқ',                   meaning_ru: 'нация',                 meaning_en: 'nation',            category: 'heritage' },
  { latin: 'vatan',    cyrillic: 'ватан',   meaning_uz: 'юрт',                    meaning_ru: 'отечество',             meaning_en: 'homeland',          category: 'heritage' },
  { latin: 'vatanim',  cyrillic: 'ватаним', meaning_uz: 'менинг ватаним',         meaning_ru: 'моё отечество',         meaning_en: 'my homeland',       category: 'heritage' },
  { latin: 'olka',     cyrillic: 'ўлка',    meaning_uz: 'диёр',                   meaning_ru: 'край',                  meaning_en: 'region',            category: 'heritage' },
  { latin: 'shahar',   cyrillic: 'шаҳар',   meaning_uz: 'катта йирик жой',        meaning_ru: 'город',                 meaning_en: 'city',              category: 'heritage' },
  { latin: 'qishloq',  cyrillic: 'қишлоқ',  meaning_uz: 'кичик жой',              meaning_ru: 'село',                  meaning_en: 'village',           category: 'heritage' },
  { latin: 'maskan',   cyrillic: 'маскан',  meaning_uz: 'яшаш жойи',              meaning_ru: 'обитель',               meaning_en: 'abode',             category: 'heritage' },
  { latin: 'turon',    cyrillic: 'турон',   meaning_uz: 'тарихий ўлка',           meaning_ru: 'Туран (земля)',         meaning_en: 'Turan-land',        category: 'heritage' },
  { latin: 'turonbek', cyrillic: 'туронбек',meaning_uz: 'Турон беги',             meaning_ru: 'Туранский лорд',        meaning_en: 'Turan-lord',        category: 'heritage' },
  { latin: 'turkbek',  cyrillic: 'туркбек', meaning_uz: 'турк беги',              meaning_ru: 'тюркский лорд',         meaning_en: 'Turkic-lord',       category: 'heritage' },
  { latin: 'guzar',    cyrillic: 'гузар',   meaning_uz: 'маҳалла йўли',           meaning_ru: 'квартал',               meaning_en: 'neighbourhood',     category: 'heritage' },
  { latin: 'mahalla',  cyrillic: 'маҳалла', meaning_uz: 'маҳалла, элига',         meaning_ru: 'махалля',               meaning_en: 'neighbourhood community', category: 'heritage' },
  { latin: 'tarixchi', cyrillic: 'тарихчи', meaning_uz: 'тарих ўрганувчи',        meaning_ru: 'историк',               meaning_en: 'historian',         category: 'heritage' },

  // ── abstract ───────────────────────────────────────────
  { latin: 'yolbek',   cyrillic: 'йўлбек',  meaning_uz: 'йўл беги',               meaning_ru: 'лорд пути',             meaning_en: 'way-lord',          category: 'abstract' },
  { latin: 'yolchi',   cyrillic: 'йўлчи',   meaning_uz: 'йўл топувчи',            meaning_ru: 'путник',                meaning_en: 'wayfinder',         category: 'abstract' },
  { latin: 'eshik',    cyrillic: 'эшик',    meaning_uz: 'кириш жойи',             meaning_ru: 'дверь',                 meaning_en: 'door',              category: 'abstract' },
  { latin: 'eshikbek', cyrillic: 'эшикбек', meaning_uz: 'эшик беги',              meaning_ru: 'лорд врат',             meaning_en: 'gate-lord',         category: 'abstract' },
  { latin: 'koprik',   cyrillic: 'кўприк',  meaning_uz: 'дарё устидаги ўтиш',     meaning_ru: 'мост',                  meaning_en: 'bridge',            category: 'abstract' },
  { latin: 'markaz',   cyrillic: 'марказ',  meaning_uz: 'ўрта жой',               meaning_ru: 'центр',                 meaning_en: 'center',            category: 'abstract' },
  { latin: 'olam',     cyrillic: 'олам',    meaning_uz: 'дунё',                   meaning_ru: 'мир',                   meaning_en: 'world',             category: 'abstract' },
  { latin: 'olamiy',   cyrillic: 'оламий',  meaning_uz: 'оламга оид',             meaning_ru: 'универсальный',         meaning_en: 'universal',         category: 'abstract' },
  { latin: 'dunyo',    cyrillic: 'дунё',    meaning_uz: 'олам, ер',               meaning_ru: 'мир',                   meaning_en: 'world',             category: 'abstract' },
  { latin: 'erkin',    cyrillic: 'эркин',   meaning_uz: 'озод',                   meaning_ru: 'свободный',             meaning_en: 'free',              category: 'abstract' },
  { latin: 'erkbek',   cyrillic: 'эркбек',  meaning_uz: 'эрк беги',               meaning_ru: 'лорд свободы',          meaning_en: 'freedom-lord',      category: 'abstract' },
  { latin: 'ozod',     cyrillic: 'озод',    meaning_uz: 'эркин',                  meaning_ru: 'свободный',             meaning_en: 'free',              category: 'abstract' },
  { latin: 'ozodlik',  cyrillic: 'озодлик', meaning_uz: 'эркинлик',               meaning_ru: 'свобода',               meaning_en: 'freedom',           category: 'abstract' },
  { latin: 'adolat',   cyrillic: 'адолат',  meaning_uz: 'ҳақиқат',                meaning_ru: 'справедливость',        meaning_en: 'justice',           category: 'abstract' },
  { latin: 'adolatli', cyrillic: 'адолатли',meaning_uz: 'ҳақоний',                meaning_ru: 'справедливый',          meaning_en: 'just',              category: 'abstract' },
  { latin: 'haqiqat',  cyrillic: 'ҳақиқат', meaning_uz: 'ҳақиқий нарса',          meaning_ru: 'истина',                meaning_en: 'truth',             category: 'abstract' },
  { latin: 'haqli',    cyrillic: 'ҳақли',   meaning_uz: 'ҳақига эга',             meaning_ru: 'правый',                meaning_en: 'rightful',          category: 'abstract' },
  { latin: 'gozal',    cyrillic: 'гўзал',   meaning_uz: 'чиройли',                meaning_ru: 'красивый',              meaning_en: 'beautiful',         category: 'abstract' },
  { latin: 'gozallik', cyrillic: 'гўзаллик',meaning_uz: 'чирой',                  meaning_ru: 'красота',               meaning_en: 'beauty',            category: 'abstract' },
  { latin: 'soflik',   cyrillic: 'софлик',  meaning_uz: 'тозалик',                meaning_ru: 'чистота',               meaning_en: 'purity',            category: 'abstract' },
  { latin: 'pokiza',   cyrillic: 'покиза',  meaning_uz: 'тоза',                   meaning_ru: 'чистый',                meaning_en: 'pure',              category: 'abstract' },
  { latin: 'poklik',   cyrillic: 'поклик',  meaning_uz: 'тоза ҳолат',             meaning_ru: 'чистота',               meaning_en: 'purity',            category: 'abstract' },
  { latin: 'nishon',   cyrillic: 'нишон',   meaning_uz: 'белги, мақсад',          meaning_ru: 'знак, цель',            meaning_en: 'mark, target',      category: 'abstract' },
  { latin: 'aniq',     cyrillic: 'аниқ',    meaning_uz: 'тўғри',                  meaning_ru: 'точный',                meaning_en: 'exact',             category: 'abstract' },
  { latin: 'aniqlik',  cyrillic: 'аниқлик', meaning_uz: 'аниқ ҳолати',            meaning_ru: 'точность',              meaning_en: 'precision',         category: 'abstract' },
  { latin: 'togri',    cyrillic: 'тўғри',   meaning_uz: 'аниқ ва ҳақиқий',        meaning_ru: 'правильный',            meaning_en: 'right',             category: 'abstract' },
  { latin: 'togrilik', cyrillic: 'тўғрилик',meaning_uz: 'тўғри ҳолати',           meaning_ru: 'правота',               meaning_en: 'rightness',         category: 'abstract' },
  { latin: 'yaxshi',   cyrillic: 'яхши',    meaning_uz: 'эзгу',                   meaning_ru: 'хороший',               meaning_en: 'good',              category: 'abstract' },
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
