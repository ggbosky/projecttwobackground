import { StrictMode, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import AuthLayout from "@/app/(auth)/layout";
import LoginPage from "@/app/(auth)/login/page";
import SetupPage from "@/app/(auth)/setup/page";
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
import SettingsPage from "@/app/(app)/settings/page";
import NotFound from "@/app/not-found";
import { NotFoundError, getHref, subscribe } from "./shims/router";
import { AuthRedirect } from "./shims/auth";
import { getVersion, subscribeVersion } from "./shims/store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPage = (props: any) => ReactNode | Promise<ReactNode>;

function match(path: string): { page: AnyPage; params: Record<string, string>; auth?: boolean } | null {
  const s = path.split("/").filter(Boolean);
  const table: [RegExp, AnyPage, string[], boolean?][] = [
    [/^\/login$/, LoginPage, [], true],
    [/^\/setup$/, SetupPage, [], true],
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
    [/^\/settings$/, SettingsPage, []],
  ];
  void s;
  for (const [re, page, keys, auth] of table) {
    const m = path.match(re);
    if (m) return { page, params: Object.fromEntries(keys.map((k, i) => [k, m[i + 1]])), auth };
  }
  return null;
}

function Route() {
  const href = useSyncExternalStore(subscribe, getHref, getHref);
  const version = useSyncExternalStore(subscribeVersion, getVersion, getVersion);
  const [path, query = ""] = href.split("?");
  const [el, setEl] = useState<ReactNode>(null);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const m = match(path.replace(/\/$/, "") || "/");
      if (!m) return <NotFound />;
      const props = {
        params: Promise.resolve(m.params),
        searchParams: Promise.resolve(Object.fromEntries(new URLSearchParams(query))),
      };
      const page = await m.page(props);
      if (m.auth) return <AuthLayout>{page}</AuthLayout>;
      return await AppLayout({ children: page });
    };
    run()
      .then((node) => alive && setEl(node))
      .catch((e) => {
        if (!alive) return;
        if (e instanceof AuthRedirect) return;
        if (e instanceof NotFoundError) setEl(<NotFound />);
        else setEl(<pre style={{ padding: 24, whiteSpace: "pre-wrap" }}>Chyba: {String(e?.stack ?? e)}</pre>);
      });
    return () => {
      alive = false;
    };
  }, [path, query, version]);

  return <div key={path}>{el}</div>;
}

function PreviewBanner() {
  const [armed, setArmed] = useState(false);
  const [msg, setMsg] = useState("");

  const exportData = () => {
    try {
      const raw = localStorage.getItem("p2-preview-db") ?? "{}";
      const blob = new Blob([raw], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `project-two-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch {
      setMsg("Export se nepodařil.");
    }
  };

  const importData = (file: File) => {
    file.text().then((text) => {
      try {
        const data = JSON.parse(text);
        if (!Array.isArray(data.users) || !Array.isArray(data.clients)) throw new Error();
        localStorage.setItem("p2-preview-db", JSON.stringify(data));
        localStorage.removeItem("p2-preview-session");
        location.reload();
      } catch {
        setMsg("Soubor není platný export z Project Two.");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-line bg-accent-soft px-4 py-1.5 text-center text-[11px] text-fg-2">
      <span>Data se ukládají jen v tomto prohlížeči. Kolegům je předáte exportem a importem souboru.</span>
      <button className="font-medium text-accent hover:underline" onClick={exportData}>
        Exportovat data
      </button>
      <label className="cursor-pointer font-medium text-accent hover:underline">
        Importovat data
        <input
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importData(f);
          }}
        />
      </label>
      <button
        className="font-medium text-red-600 hover:underline dark:text-red-400"
        onClick={() => {
          if (!armed) return setArmed(true);
          try {
            localStorage.removeItem("p2-preview-db");
            localStorage.removeItem("p2-preview-session");
          } catch {}
          location.reload();
        }}
        onBlur={() => setArmed(false)}
      >
        {armed ? "Opravdu smazat vše?" : "Smazat data"}
      </button>
      {msg && <span className="text-red-600 dark:text-red-400">{msg}</span>}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <PreviewBanner />
      <Route />
    </ThemeProvider>
  </StrictMode>,
);
