# Project Two · Control Center

Interní **All-in-One dashboard** webové agentury Project Two – finance, klienti (CRM), projekty, úspěšnost zakázek, GitHub a kapacita týmu na jednom místě.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Recharts · Lucide Icons · Geist font

Aplikace běží ihned po instalaci nad simulovanými daty (JSON v `data/`). GitHub modul se volitelně napojí na živé GitHub API.

## Spuštění

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # produkční build
npm run lint       # typová kontrola (tsc)
```

Volitelně pro živá GitHub data:

```bash
cp .env.example .env.local
# GITHUB_TOKEN=github_pat_...   (fine-grained, read-only)
# GITHUB_ORG=vase-organizace    (volitelné – přepíše organizaci z data/repos.json)
```

## Moduly

| Stránka | Obsah |
|---|---|
| **Přehled** `/` | KPI (obrat za měsíc, YTD, MRR, pipeline), mini‑metriky, graf příjmů, koláč typů webů, rozpracované projekty se skluzem, GitHub aktivita, vytížení týmu, otevřené faktury |
| **Finance & KPI** `/finance` | Obrat měsíc/rok, **MRR & ARR** z retainerů, průměrná cena projektu, provozní marže vs. cíl, pohledávky; graf příjmů vs. nákladů (přepínač Obrat/Zisk); **Pipeline & Cashflow** (nasmlouváno vs. vyfakturováno, vážené nabídky); **profitabilita projektů** (řaditelná tabulka – příjem, náklady, zisk, marže, efektivní hodinovka, plán vs. realita hodin); faktury s filtrem stavu, typu, data a fulltextem |
| **Klienti** `/clients` | CRM tabulka / karty, filtr stavu vztahu (Aktivní / Lead / Bývalý), odvětví, řazení, fulltext |
| **Detail klienta** `/clients/[id]` | Kontakty, osobnost a tým klienta, interní poznámky, retainer, projekty, faktury, **historie komunikace** (s možností přidat záznam) |
| **Projekty** `/projects` | Tabulka nebo Kanban board; filtry stav, typ webu, klient, **cenové rozpětí**, **období**, fulltext (i technologie); řazení; filtry se ukládají do URL |
| **Detail projektu** `/projects/[id]` | Finální cena, fakturace, zisk/marže, čas plán vs. realita, tým, ekonomika, důvody úspěchu/neúspěchu, hodnocení ★ a citace klienta, napojený GitHub repozitář |
| **Úspěšnost** `/success` | Úspěšnost realizace, win rate, hodnocení, dodržení termínu/rozpočtu, graf plán vs. realita, důvody úspěchu/neúspěchu, filtrovatelné případové studie |
| **GitHub** `/github` | Stav připojení (live/demo), repozitáře s posledním commitem, otevřenými PR, issues a **stavem nasazení** (Vercel/Netlify), filtry, souhrnná aktivita |
| **Tým & kapacita** `/team` | „O nás“, kapacitní plánovač (sloty na nové weby pro tento a další měsíce), simulátor nové zakázky, matice alokací, karty členů týmu |

Dále: globální vyhledávání **⌘K / Ctrl+K** (nebo `/`), dark / light / auto režim bez probliknutí, plně responzivní layout s mobilním menu.

## Struktura

```
app/                    stránky (App Router) + /api/github route handler
components/
  layout/               AppShell (sidebar, topbar), CommandPalette, ThemeProvider
  ui/                   Card, Badge (status tagy), KpiCard, Progress, Stars, Avatar, ovládací prvky
  charts/               Recharts grafy (příjmy, typy webů, pipeline, plán vs. realita, kapacita, sparkline)
  clients/ projects/ finance/ github/ team/   moduly
data/                   mock data: clients, projects, finance (faktury + náklady), repos, team
lib/
  types.ts              datový model
  data.ts               datová vrstva (zde nahradit JSON za API / DB)
  metrics.ts            výpočty KPI – MRR/ARR, pipeline, profitabilita, úspěšnost, kapacita
  github.ts             napojení na GitHub REST API (server-only)
  format.ts, status.ts  formátování CZK/dat a konfigurace stavů
```

## Jak se počítají metriky

- **Obrat** = součet vystavených faktur v daném měsíci/roce (projekty + retainery), bez DPH.
- **MRR** = součet aktivních měsíčních retainerů; **ARR** = MRR × 12.
- **Průměrná cena projektu** = průměr cen podepsaných zakázek (dokončené, běžící, pozastavené).
- **Pipeline** = hodnota běžících zakázek − již vyfakturováno; nabídky vážené pravděpodobností výhry.
- **Profitabilita** = příjem − (hodiny × plně zatížená hodinová sazba týmu vážená alokací + externí náklady). U běžících projektů projekce hodin podle aktuálního postupu.
- **Win rate** = podepsané / (podepsané + prohrané nabídky); **úspěšnost realizace** = dokončené / (dokončené + zrušené).
- **Kapacita** = týdenní kapacita členů × pracovní dny v měsíci − alokace běžících projektů − 15% rezerva; sloty = (volno − vážená pipeline) / průměrná měsíční náročnost webu.

Mock data mají pevné referenční datum (`referenceDate` v `data/finance.json`, aktuálně 7. 10. 2026), aby metriky typu „tento měsíc“ dávaly smysl kdykoli.

## GitHub integrace

`lib/github.ts` běží jen na serveru – token se nikdy nedostane do prohlížeče. Klientské komponenty volají `/api/github` (případně `?repo=owner/name`).

- bez `GITHUB_TOKEN` → demo data z `data/repos.json`,
- s tokenem → pro každý repozitář z `data/repos.json` se načtou commity, otevřené PR, issues a poslední deployment + status (Vercel i Netlify je do GitHub Deployments zapisují automaticky). Odpovědi se cachují 5 minut.
- Repozitář, který se nepodaří načíst, zobrazí demo data s upozorněním.

Mapování repozitář ↔ projekt je v `data/repos.json` (`projectId`) a `data/projects.json` (`repo`).

## Napojení na reálná data

Všechny stránky čtou data přes `lib/data.ts`. Pro produkci stačí tyto funkce nahradit voláním databáze nebo API (Supabase, Notion, Fakturoid, Pipedrive…) se stejnými typy z `lib/types.ts` – výpočty v `lib/metrics.ts` i UI zůstanou beze změny. Záznamy komunikace přidané v detailu klienta se v demu ukládají jen do `localStorage` prohlížeče.
