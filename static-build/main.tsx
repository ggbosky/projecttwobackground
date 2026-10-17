import { StrictMode, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import AppLayout from "@/app/(app)/layout";
import OverviewPage from "@/app/(app)/page";
import ClientsPage from "@/app/(app)/clients/page";
import NewClientPage from "@/app/(app)/clients/new/page";
import ClientDetailPage from "@/app/(app)/clients/[id]/page";
import EditClientPage from "@/app/(app)/clients/[id]/edit/page";
import ProjectsPage from "@/app/(app)/projects/page";
import NewProjectPage from "@/app/(app)/projects/new/page";
import ProjectDetailPage from "@/app/(app)/projects/[id]/page";
import EditProjectPage from "@/app/(app)/projects/[id]/edit/page";
import FinancePage from "@/app/(app)/finance/page";
import SuccessPage from "@/app/(app)/success/page";
import TeamPage from "@/app/(app)/team/page";
import AgencyPage from "@/app/(app)/agency/page";
import SettingsPage from "@/app/(app)/settings/page";
import NotFound from "@/app/not-found";
import { DB_KEY, lastSaved, listBackups, replaceDb } from "./shims/db";
import { NotFoundError, getHref, subscribe } from "./shims/router";
import { bump, getVersion, subscribeVersion } from "./shims/store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPage = (props: any) => ReactNode | Promise<ReactNode>;

const ROUTES: [RegExp, AnyPage, string[]][] = [
  [/^\/$/, OverviewPage, []],
  [/^\/clients$/, ClientsPage, []],
  [/^\/clients\/new$/, NewClientPage, []],
  [/^\/clients\/([^/]+)\/edit$/, EditClientPage, ["id"]],
  [/^\/clients\/([^/]+)$/, ClientDetailPage, ["id"]],
  [/^\/projects$/, ProjectsPage, []],
  [/^\/projects\/new$/, NewProjectPage, []],
  [/^\/projects\/([^/]+)\/edit$/, EditProjectPage, ["id"]],
  [/^\/projects\/([^/]+)$/, ProjectDetailPage, ["id"]],
  [/^\/finance$/, FinancePage, []],
  [/^\/success$/, SuccessPage, []],
  [/^\/team$/, TeamPage, []],
  [/^\/agency$/, AgencyPage, []],
  [/^\/settings$/, SettingsPage, []],
];

function Route() {
  const href = useSyncExternalStore(subscribe, getHref, getHref);
  const version = useSyncExternalStore(subscribeVersion, getVersion, getVersion);
  const [path, query = ""] = href.split("?");
  const [el, setEl] = useState<ReactNode>(null);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const clean = path.replace(/\/$/, "") || "/";
      for (const [re, page, keys] of ROUTES) {
        const m = clean.match(re);
        if (!m) continue;
        const props = {
          params: Promise.resolve(Object.fromEntries(keys.map((k, i) => [k, m[i + 1]]))),
          searchParams: Promise.resolve(Object.fromEntries(new URLSearchParams(query))),
        };
        return await AppLayout({ children: await page(props) });
      }
      return await AppLayout({ children: <NotFound /> });
    };
    run()
      .then((node) => alive && setEl(node))
      .catch(async (e) => {
        if (!alive) return;
        if (e instanceof NotFoundError) setEl(await AppLayout({ children: <NotFound /> }));
        else setEl(<pre style={{ padding: 24, whiteSpace: "pre-wrap" }}>Chyba: {String(e?.stack ?? e)}</pre>);
      });
    return () => {
      alive = false;
    };
  }, [path, query, version]);

  return <div key={path}>{el}</div>;
}

function timeLabel(iso: string | null) {
  if (!iso) return "zatím nic";
  const d = new Date(iso);
  return d.toLocaleString("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Horní lišta: stav paměti, export/import, zálohy */
function DataBar() {
  const version = useSyncExternalStore(subscribeVersion, getVersion, getVersion);
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const [msg, setMsg] = useState("");
  const [persisted, setPersisted] = useState<boolean | null>(null);
  void version;

  useEffect(() => {
    // Požádá prohlížeč, aby data trvale uchoval (nemazal je při nedostatku místa)
    navigator.storage?.persist?.().then(setPersisted).catch(() => setPersisted(false));
  }, []);

  const exportData = () => {
    try {
      const raw = localStorage.getItem(DB_KEY) ?? "{}";
      const blob = new Blob([raw], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `project-two-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      localStorage.setItem("p2-last-export", new Date().toISOString());
      setMsg("Data stažena.");
    } catch {
      setMsg("Export se nepodařil.");
    }
  };

  const importData = (file: File) => {
    file.text().then((text) => {
      try {
        const data = JSON.parse(text);
        if (!Array.isArray(data.clients)) throw new Error();
        replaceDb(data);
        bump();
        setMsg("Data načtena ze souboru.");
      } catch {
        setMsg("Soubor není platný export z Project Two.");
      }
    });
  };

  const backups = open ? listBackups() : [];
  let lastExport: string | null = null;
  try {
    lastExport = localStorage.getItem("p2-last-export");
  } catch {}
  const exportOld = !lastExport || Date.now() - new Date(lastExport).getTime() > 7 * 864e5;

  return (
    <div className="border-b border-line bg-accent-soft px-4 py-1.5 text-[11px] text-fg-2">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Ukládá se automaticky do tohoto prohlížeče · naposledy {timeLabel(lastSaved())}
          {persisted === true && " · trvalé úložiště"}
        </span>
        <button className="font-medium text-accent hover:underline" onClick={exportData}>
          Stáhnout zálohu{exportOld ? " (doporučeno)" : ""}
        </button>
        <label className="cursor-pointer font-medium text-accent hover:underline">
          Nahrát ze souboru
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importData(f);
              e.target.value = "";
            }}
          />
        </label>
        <button className="font-medium text-accent hover:underline" onClick={() => setOpen((o) => !o)}>
          {open ? "Skrýt zálohy" : "Denní zálohy"}
        </button>
        {msg && <span className="font-medium text-fg">{msg}</span>}
      </div>
      {open && (
        <div className="mx-auto mt-2 max-w-xl rounded-lg border border-line bg-surface p-3 text-left">
          <p className="mb-2 text-xs text-fg-2">Aplikace si každý den sama uloží zálohu (posledních 14 dní). Obnovením vrátíte data do stavu z daného dne.</p>
          {backups.length === 0 ? (
            <p className="text-xs text-muted">Zatím žádné zálohy – vzniknou s prvním uložením.</p>
          ) : (
            <ul className="divide-y divide-line">
              {backups.map((b) => (
                <li key={b.date} className="flex items-center gap-3 py-1.5 text-xs">
                  <span className="text-fg">{new Date(b.date).toLocaleDateString("cs-CZ")}</span>
                  <span className="text-muted">
                    {b.data.clients.length} klientů · {b.data.projects.length} projektů · {b.data.invoices.length} faktur
                  </span>
                  <button
                    className="ml-auto font-medium text-accent hover:underline"
                    onClick={() => {
                      replaceDb(b.data);
                      bump();
                      setMsg(`Obnoveno ze zálohy ${new Date(b.date).toLocaleDateString("cs-CZ")}.`);
                      setOpen(false);
                    }}
                  >
                    Obnovit
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 border-t border-line pt-2 text-right">
            <button
              className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
              onClick={() => {
                if (!armed) return setArmed(true);
                try {
                  localStorage.removeItem(DB_KEY);
                } catch {}
                setArmed(false);
                bump();
                setMsg("Data smazána (zálohy zůstaly).");
              }}
              onBlur={() => setArmed(false)}
            >
              {armed ? "Opravdu smazat všechna data?" : "Smazat všechna data"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * GitHub Pages posílá index.html s cache na 10 minut, takže prohlížeč může ukazovat starou verzi.
 * Při otevření a návratu na záložku se podíváme na version.json a případně načteme novou verzi.
 */
function checkForUpdate() {
  const current = (window as unknown as { __P2_BUILD__?: string }).__P2_BUILD__;
  if (!current) return;
  fetch(`version.json?t=${Date.now()}`, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((v: { build?: string } | null) => {
      if (!v?.build || v.build === current) return;
      try {
        // Jen jeden pokus na každou novou verzi, ať se stránka nezacyklí, než CDN dožene version.json
        if (sessionStorage.getItem("p2-reload-to") === v.build) return;
        sessionStorage.setItem("p2-reload-to", v.build);
      } catch {}
      location.replace(`${location.pathname}?v=${v.build}`);
    })
    .catch(() => {});
}

if (location.search.includes("v=")) history.replaceState(null, "", location.pathname);
checkForUpdate();
document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && checkForUpdate());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <DataBar />
      <Route />
    </ThemeProvider>
  </StrictMode>,
);
