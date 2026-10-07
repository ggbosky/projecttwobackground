# Project Two

Interní **CRM a řídicí centrum** agentury Project Two: klienti a leady s detailní analýzou, projekty, faktury, náklady, úspěšnost zakázek a kapacita týmu.

**Stack:** Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS v4 · Recharts · Lucide

## Data zůstávají u vás

- Aplikace **nepoužívá žádnou externí službu** (žádná databáze v cloudu, žádné GitHub API, žádná analytika).
- Všechna data se ukládají do jediného souboru **`.data/db.json`** na serveru, kde aplikace běží. Složku lze změnit proměnnou `DATA_DIR`.
- `.data/` je v `.gitignore`, takže **na GitHub jde jen kód**, nikdy data klientů.
- Záloha = zkopírování souboru `.data/db.json`.

## Přihlášení

- Vlastní přihlašování, bez externích poskytovatelů. Hesla jsou uložená jen jako hash (scrypt) a session je v httpOnly cookie (30 dní).
- **První spuštění:** aplikace sama otevře `/setup`, kde si vytvoříte první účet.
- **Další členové týmu:** *Tým & kapacita → Přidat člena týmu* (jméno, e-mail, dočasné heslo). Kolega si heslo změní v *Nastavení*.
- Po 5 špatných pokusech o přihlášení se účet na 5 minut zablokuje.

## Spuštění

```bash
npm install
npm run dev                      # vývoj na http://localhost:3000
npm run build && npm start       # produkce
```

> **Hosting:** aplikace potřebuje běžet jako Node.js server s trvalým diskem (vlastní počítač v kanceláři, VPS, Docker s volume, Railway/Fly.io s volume…).
> Serverless platformy typu Vercel/Netlify **nejsou vhodné**, protože nemají trvalé úložiště a data by se ztrácela.
> Při provozu přes internet použijte HTTPS (např. reverse proxy Caddy/Nginx). Cookie se pak automaticky označí jako `Secure`.

## Moduly

| Stránka | Co umí |
|---|---|
| **Přehled** | KPI, rozjezdový checklist, „Vyžaduje pozornost" (faktury po splatnosti, klienti bez kontaktu, úkoly po termínu), moje úkoly, poslední komunikace, graf příjmů, vytížení týmu, běžící projekty |
| **Klienti (CRM)** | Přidávání a úpravy klientů, tabulka nebo karty, filtry (stav, odvětví, owner, „vyžaduje pozornost"), fulltext, řazení podle skóre/obratu/kontaktu |
| **Detail klienta** | 4 záložky: **Analýza**, **Profil**, **Komunikace & úkoly**, **Projekty & faktury** (popsány níže) |
| **Projekty** | Přidávání a úpravy zakázek (nabídka → realizace → předání), tým a hodiny, výsledek, důvody, hodnocení; tabulka nebo Kanban s filtry |
| **Finance** | Faktury (vystavení, úhrada, po splatnosti), náklady, obrat, MRR/ARR, pipeline & cashflow, profitabilita projektů, koláč podle typů webů |
| **Úspěšnost** | Win rate, úspěšnost realizace, plán vs. realita, hodnocení, důvody úspěchu/neúspěchu, případové studie |
| **Tým & kapacita** | Účty týmu, vytížení, kapacitní plánovač na 4 měsíce, simulátor „zvládneme další web?" |
| **Nastavení** | Profil (kapacita, nákladová sazba), změna hesla, cíle agentury |

### Detail klienta

- **Profil:**
  - firma (IČO, DIČ, odvětví, velikost, obrat, adresa, web);
  - libovolný počet kontaktních osob s označením rozhodovatele;
  - obchodní kvalifikace (rozpočet, potřeby, bolesti, rozhodovací proces, časový horizont, fit 1–5, konkurence, „proč my");
  - digitální stav (současný web, platforma, sítě, cíle, KPI);
  - fakturace a retainer;
  - osobnost klienta a interní poznámky.
- **Komunikace & úkoly:** log e-mailů, hovorů, schůzek a poznámek s dalším krokem; úkoly s termínem a řešitelem.
- **Analýza (počítá se automaticky):**
  - **Zdraví vztahu (0–100):** kontakt, platební morálka, úspěšnost projektů, ziskovost, spokojenost.
  - **Lead score (0–100, Hot/Warm/Cold):** rozpočet vs. průměrná zakázka, fit, časový horizont, rozhodovatel, aktivita.
  - **Finance:** LTV, uhrazeno a neuhrazeno, po splatnosti, průměrná doba úhrady a zpoždění, MRR, podíl na obratu agentury, graf po měsících.
  - **Projekty:** hodnota, efektivní hodinová sazba, marže, úspěšnost, win rate, hodiny vs. odhad, dodržení termínu, hodnocení.
  - **Komunikace:** poslední kontakt, četnost za 90 dní, rozpad podle typu, otevřené úkoly a úkoly po termínu.
  - **Rizika a doporučené kroky**, úplnost profilu.

## Struktura

```
app/(auth)/        login, první nastavení
app/(app)/         přihlášená část (přehled, klienti, projekty, finance, úspěšnost, tým, nastavení)
app/actions/       Server Actions (zápis dat) – každá ověřuje přihlášení
proxy.ts           rychlé přesměrování nepřihlášených na /login
lib/server/        úložiště (db.ts), přihlášení a sessions (auth.ts), čtení formulářů
lib/metrics.ts     výpočty KPI (obrat, MRR, pipeline, profitabilita, kapacita)
lib/analysis.ts    analýza klienta (health score, lead score, rizika, doporučení)
components/        UI, grafy, formuláře
```
