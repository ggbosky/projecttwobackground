# Project Two

Interní **CRM a řídicí centrum** agentury Project Two: klienti a leady s detailní analýzou, projekty, faktury, náklady, úspěšnost zakázek a kapacita týmu.

**Stack:** Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS v4 · Recharts · Lucide

## Verze na GitHub Pages

Na **https://ggbosky.github.io/projecttwobackground/** běží verze aplikace, která funguje celá v prohlížeči (soubor `index.html` v kořeni repa).

- Aplikace se **otevře rovnou, bez přihlašování**.
- **Paměť:** vše, co zadáte, se automaticky ukládá do prohlížeče (localStorage). Aplikace požádá prohlížeč o trvalé úložiště a každý den si sama uloží zálohu (posledních 14 dní, obnovíte ji v horní liště přes *Denní zálohy*).
- Data jsou **jen v prohlížeči** daného člověka. Kolegům je předáte tlačítky **Stáhnout zálohu / Nahrát ze souboru** v horní liště. Stažený soubor je zároveň nejbezpečnější záloha.
- Po úpravě kódu verzi pro Pages přegenerujete příkazem `npm run build:pages` a pushnete. Otevřená aplikace si novou verzi načte sama (kontroluje `version.json`).
- Pro společná data v reálném čase spusťte serverovou verzi (níže).

## Data zůstávají u vás

- Aplikace **nepoužívá žádnou externí službu** (žádná databáze v cloudu, žádné GitHub API, žádná analytika).
- Všechna data se ukládají do jediného souboru **`.data/db.json`** na serveru, kde aplikace běží. Složku lze změnit proměnnou `DATA_DIR`.
- `.data/` je v `.gitignore`, takže **na GitHub jde jen kód**, nikdy data klientů.
- Záloha = zkopírování souboru `.data/db.json`.

## Bez přihlašování

- Aplikace nemá login, kdo ji otevře, může ji používat.
- Členy týmu přidáte v *Tým & kapacita*. Vlevo dole v menu si přepnete **„Pracuji jako“**, podle toho se plní „Moje úkoly“ a autor záznamů v komunikaci.
- Serverovou verzi proto nevystavujte veřejně na internet bez dalšího zabezpečení (VPN, heslo na reverse proxy apod.).

## Data z webu projectwo.com

Stránka **Agentura** obsahuje informace převzaté z webu https://projectwo.com/ (staženo jednorázově a uložené v `lib/agency.ts`, aplikace se na web za běhu nepřipojuje):

- služby, ceník webů (Start / Business / Premium) a péče o web (Basic / Standard / Plus) s počty klientů a projektů v CRM;
- postup spolupráce, FAQ, kontakt a provozovatel;
- **reference z webu** a jejich přidání do CRM jedním kliknutím;
- typy poptávek a rozpočtová pásma z poptávkového formuláře, které jsou k dispozici v kartě klienta, a balíčky v kartě projektu.

Když se web změní, upravte `lib/agency.ts` (a pro Pages spusťte `npm run build:pages`).

## Spuštění přímo z GitHubu (Codespaces)

1. Na stránce repozitáře klikněte na **Code → Codespaces → Create codespace**.
2. Počkejte zhruba 2–3 minuty: nainstalují se závislosti, aplikace se sestaví a spustí.
3. Aplikace se sama otevře v nové záložce. Jinak ji najdete v záložce **Ports** u portu 3000 (ikona zeměkoule).
4. Kolegům pošlete tu samou adresu. V záložce **Ports** nastavte u portu 3000 viditelnost **Public**, jinak se k ní dostane jen vlastník Codespace. Aplikace nemá přihlašování, adresu proto dávejte jen kolegům.

> Codespace se po 30 minutách nečinnosti uspí. Znovu ho spustíte přes **Code → Codespaces**, data v `.data/` zůstanou.
> Codespace, který se 30 dní nepoužívá, GitHub smaže i s daty, proto si `.data/db.json` občas stáhněte jako zálohu.
> Pro trvalý provoz pro celý tým je lepší vlastní server (viz níže).

## Spuštění na vlastním počítači / serveru

```bash
npm install
npm run dev                      # vývoj na http://localhost:3000
npm run build && npm start       # produkce
```

> **Hosting:** aplikace potřebuje běžet jako Node.js server s trvalým diskem (vlastní počítač v kanceláři, VPS, Docker s volume, Railway/Fly.io s volume…).
> Serverless platformy typu Vercel/Netlify **nejsou vhodné**, protože nemají trvalé úložiště a data by se ztrácela.
> Při provozu přes internet použijte HTTPS a ochranu přístupu na reverse proxy (např. Caddy/Nginx s heslem), aplikace sama login nemá.

## Moduly

| Stránka | Co umí |
|---|---|
| **Přehled** | KPI, rozjezdový checklist, „Vyžaduje pozornost" (faktury po splatnosti, klienti bez kontaktu, úkoly po termínu), moje úkoly, poslední komunikace, graf příjmů, vytížení týmu, běžící projekty |
| **Klienti (CRM)** | **Přidat hotového klienta**: co jsme dělali a kolik jsme dostali (jednorázově, měsíční paušál nebo obojí), uloží se klient + hotový projekt + platby. Leady přes „Jen potenciální klient“. Úpravy klientů, tabulka nebo karty, filtry (stav, odvětví, owner, „vyžaduje pozornost"), fulltext, řazení podle skóre/obratu/kontaktu |
| **Detail klienta** | 4 záložky: **Analýza**, **Profil**, **Komunikace & úkoly**, **Projekty & faktury** (popsány níže) |
| **Projekty** | Přidávání a úpravy zakázek (nabídka → realizace → předání), tým a hodiny, výsledek, důvody, hodnocení; tabulka nebo Kanban s filtry |
| **Finance** | Faktury (vystavení, úhrada, po splatnosti), náklady, obrat, MRR/ARR, pipeline & cashflow, profitabilita projektů, koláč podle typů webů |
| **Úspěšnost** | Win rate, úspěšnost realizace, plán vs. realita, hodnocení, důvody úspěchu/neúspěchu, případové studie |
| **Agentura** | Služby, ceník, péče, postup, FAQ a reference z projectwo.com, import referencí do CRM |
| **Tým & kapacita** | Přidání, úprava a odebrání členů, vytížení, kapacitní plánovač na 4 měsíce, simulátor „zvládneme další web?" |
| **Nastavení** | Cíle agentury, informace o uložení dat |

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
app/(app)/         aplikace (přehled, klienti, projekty, finance, úspěšnost, agentura, tým, nastavení)
app/actions/       Server Actions (zápis dat)
lib/server/        úložiště (db.ts), aktuální člen týmu (context.ts), čtení formulářů
lib/agency.ts      data převzatá z projectwo.com
static-build/      sestavení verze pro GitHub Pages (úložiště v prohlížeči)
lib/metrics.ts     výpočty KPI (obrat, MRR, pipeline, profitabilita, kapacita)
lib/analysis.ts    analýza klienta (health score, lead score, rizika, doporučení)
components/        UI, grafy, formuláře
```
