/**
 * Údaje o agentuře převzaté z webu https://projectwo.com/ (stav k 17. 10. 2026).
 * Používají se na stránce Agentura, ve formulářích (balíčky, péče, typy poptávek,
 * rozpočty) a pro import referencí jako klientů.
 * Když se web změní, upravte tento soubor.
 */

export const AGENCY = {
  name: "Project Two",
  tagline: "Moderní, prémiové weby pro značky, které chtějí růst.",
  claim: "Weby, které prodávají za vás.",
  intro:
    "Jsme Project Two — malý tým, který stojí za každým projektem osobně. Tvoříme moderní, rychlé a prémiové weby, které posunou vaši značku o level výš.",
  web: "https://projectwo.com/",
  email: "projectwo@seznam.cz",
  operator: {
    name: "Karel Drexler",
    ico: "24881317",
    address: "Javorová 115, 250 73 Přezletice",
    note: "Podnikatel zapsaný v živnostenském rejstříku, podniká pod značkou Project Two.",
  },
  syncedAt: "2026-10-17",
  stats: [
    { value: "Zdarma", label: "úvodní konzultace" },
    { value: "2–3 týdny", label: "a web je online" },
    { value: "Mobile first", label: "perfektní na telefonu" },
  ],
} as const;

export const SERVICES = [
  { title: "Webdesign & UI/UX", text: "Unikátní design na míru značce. Žádné šablony — každý pixel má svůj důvod." },
  { title: "Funkce na míru", text: "Rezervace, poptávkové formuláře, jednoduchý e-shop nebo napojení na nástroje, které klient už používá." },
  { title: "Bleskový výkon", text: "Ladíme web do poslední milisekundy. Rychlý web = lepší SEO i konverze." },
  { title: "Na mobilu i počítači", text: "Web vypadá a funguje skvěle na telefonu, tabletu i velké obrazovce." },
  { title: "SEO & analytika", text: "Technické SEO, měření a data, podle kterých web roste." },
  { title: "Animace & interakce", text: "Jemný motion design, který působí prémiově a vede pozornost." },
  { title: "Péče & podpora", text: "Hosting, zálohy, aktualizace a drobné úpravy. O web se postaráme i po spuštění." },
] as const;

export interface PackageInfo {
  name: string;
  description: string;
  features: readonly string[];
  highlighted?: boolean;
}

/** Balíčky webů – ceník na webu je individuální */
export const WEB_PACKAGES: readonly PackageInfo[] = [
  {
    name: "Start",
    description: "Pro živnostníky, nové značky a jednoduché prezentace",
    features: ["Jednostránkový web", "Design na míru", "Optimalizace pro mobily", "Kontaktní formulář", "Základní SEO", "Spuštění na vaší doméně"],
  },
  {
    name: "Business",
    description: "Pro firmy, které chtějí růst online",
    features: [
      "Web s více podstránkami",
      "Návrh designu ke schválení",
      "Snadná správa obsahu",
      "Animace a interakce",
      "SEO a napojení na Google Analytics",
      "Vícejazyčnost na přání",
    ],
    highlighted: true,
  },
  {
    name: "Premium",
    description: "Rozsáhlejší weby a projekty na míru",
    features: ["Rezervace, e-shop nebo klientská sekce", "Online platby", "Napojení na vaše nástroje", "Rozsah podle vašich potřeb", "Prioritní podpora"],
  },
];

/** Balíčky péče o web (retainer) */
export const CARE_PACKAGES: readonly PackageInfo[] = [
  { name: "Basic", description: "Bezstarostný provoz webu", features: ["Hosting a SSL certifikát", "Pravidelné zálohy", "Bezpečnostní aktualizace", "Hlídání dostupnosti"] },
  {
    name: "Standard",
    description: "Web, který je stále aktuální",
    features: ["Vše z Basic", "Drobné úpravy obsahu každý měsíc", "Kontrola rychlosti", "Podpora e-mailem"],
    highlighted: true,
  },
  { name: "Plus", description: "Web, který s vámi roste", features: ["Vše ze Standard", "Nové sekce a podstránky", "Průběžné SEO", "Přednostní řešení požadavků"] },
];

export const PROCESS = [
  { title: "Úvodní hovor", text: "Probereme, co klient potřebuje, pro koho web je a co má přinést. Nezávazně a zdarma." },
  { title: "Návrh a nabídka", text: "Struktura webu, vizuální směr a konkrétní nabídka bez skrytých položek." },
  { title: "Tvorba webu", text: "Web postavíme, průběžně ukazujeme a zapracujeme připomínky." },
  { title: "Spuštění a podpora", text: "Spuštění na doméně klienta, nastavení měření a podpora i potom." },
] as const;

/** Typy poptávek a orientační rozpočty z poptávkového formuláře na webu */
export const INQUIRY_TYPES = ["Nový web", "Redesign", "E-shop", "Web aplikace", "Péče o web"] as const;

export const BUDGET_BRACKETS = [
  { label: "do 10 tis.", min: 0, max: 10_000 },
  { label: "10–25 tis.", min: 10_000, max: 25_000 },
  { label: "25–50 tis.", min: 25_000, max: 50_000 },
  { label: "50 tis. +", min: 50_000, max: null },
] as const;

export const FAQ = [
  {
    q: "Jak dlouho trvá vytvoření webu?",
    a: "Většina webů je hotová a online na vaší doméně do 2–3 týdnů. Záleží hlavně na rozsahu a požadavcích — větší projekty jako e-shopy trvají déle. Odhad dostanete hned s nabídkou.",
  },
  {
    q: "Kolik web stojí?",
    a: "Každý projekt naceňujeme individuálně podle rozsahu a funkcí. Po úvodním hovoru vám pošleme konkrétní nabídku, ve které uvidíte, za co platíte.",
  },
  {
    q: "Budu si moct web sám upravovat?",
    a: "Ano. Web připravíme tak, abyste si texty, obrázky i nové stránky mohli snadno upravit sami. Při předání vám vše ukážeme.",
  },
  {
    q: "Používáte šablony?",
    a: "Občas ano — záleží na klientovi, jeho představách a požadavcích. Někdy dává smysl postavit web úplně od nuly, jindy je rychlejší a levnější vyjít z kvalitního základu a upravit ho na míru.",
  },
  {
    q: "Co když už web mám?",
    a: "Rádi se na něj podíváme a navrhneme redesign nebo postupné vylepšení. Často stačí upravit klíčové stránky a rychlost, aby web začal přinášet výsledky.",
  },
] as const;

/** Reference z webu – lze je jedním kliknutím přidat jako klienty */
export const REFERENCES = [
  {
    key: "aldastrih",
    company: "ALDA — Aleš Javorský",
    contact: "Aleš Javorský",
    role: "Video editor",
    industry: "Videostřih",
    website: "aldastrih.cz",
    project: "Web · Portfolio videostřihače",
    quote: "To je naprostý masterpiece Karle 🤩",
  },
  {
    key: "drexler",
    company: "Karel Drexler",
    contact: "Karel Drexler",
    role: "Grafik a tvůrce",
    industry: "Grafický design",
    website: "drexler.digital",
    project: "Web · Portfolio grafika a tvůrce",
    quote: "Ty kráso, tak to je fenomén. Interaktivní prvky a animace mě velmi baví. Toto bude prodejní bomba!",
  },
  {
    key: "bozikytky",
    company: "Boží kytky",
    contact: "Martina Drexlerová",
    role: "Floristka",
    industry: "Floristika",
    website: "bozikytky.cz",
    project: "Web · Floristika Martiny Drexlerové",
    quote: "Vypadá to super. Za mě perfektní 😍",
  },
] as const;

/** Zdroj leadu z webového formuláře */
export const WEB_INQUIRY_SOURCE = "Poptávka z projectwo.com";
