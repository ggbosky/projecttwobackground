/**
 * Sestaví verzi aplikace pro GitHub Pages: jeden soubor index.html v kořeni repozitáře.
 * Serverové části (úložiště, aktuální člen týmu) jsou nahrazené verzemi z ./shims,
 * které ukládají data do localStorage prohlížeče.
 *
 * Spuštění: npm run build:pages
 */
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(DIR, "..");
const OUT_CSS = path.join(DIR, ".out.css");

execFileSync(path.join(REPO, "node_modules/.bin/tailwindcss"), ["-i", path.join(DIR, "input.css"), "-o", OUT_CSS, "--minify"], {
  cwd: DIR,
  stdio: "inherit",
});

const result = await build({
  entryPoints: [path.join(DIR, "main.tsx")],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  charset: "utf8",
  legalComments: "none",
  define: { "process.env.NODE_ENV": '"production"' },
  alias: {
    "@/lib/server/db": path.join(DIR, "shims/db.ts"),
    "@/lib/server/context": path.join(DIR, "shims/context.ts"),
    "@": REPO,
    "next/link": path.join(DIR, "shims/link.tsx"),
    "next/navigation": path.join(DIR, "shims/navigation.ts"),
    "next/cache": path.join(DIR, "shims/cache.ts"),
    "next/server": path.join(DIR, "shims/server.ts"),
    "server-only": path.join(DIR, "shims/empty.ts"),
  },
  logLevel: "warning",
});

const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const font = (p) => fs.readFileSync(path.join(REPO, "node_modules/geist/dist/fonts", p)).toString("base64");
const css = fs.readFileSync(OUT_CSS, "utf8");
fs.rmSync(OUT_CSS);
const icon = encodeURIComponent(fs.readFileSync(path.join(REPO, "app/icon.svg"), "utf8"));
const themeInit = `(function(){try{var t=localStorage.getItem('p2-theme');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

const buildId = Date.now().toString(36);

const html = `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Project Two</title>
<link rel="icon" href="data:image/svg+xml,${icon}">
<style>
@font-face{font-family:"Geist";src:url(data:font/woff2;base64,${font("geist-sans/Geist-Variable.woff2")}) format("woff2");font-weight:100 900;font-display:swap}
@font-face{font-family:"Geist Mono";src:url(data:font/woff2;base64,${font("geist-mono/GeistMono-Variable.woff2")}) format("woff2");font-weight:100 900;font-display:swap}
:root{--font-geist-sans:"Geist";--font-geist-mono:"Geist Mono"}
body{margin:0}
${css}
.font-mono{font-family:"Geist Mono",ui-monospace,SFMono-Regular,Menlo,monospace}
</style>
<script>window.__P2_BUILD__=${JSON.stringify(buildId)};${themeInit}</script>
</head>
<body class="font-sans">
<div id="root"></div>
<script>${js}</script>
</body>
</html>
`;

fs.writeFileSync(path.join(REPO, "index.html"), html);
fs.writeFileSync(path.join(REPO, "version.json"), JSON.stringify({ build: buildId }) + "\n");
fs.writeFileSync(path.join(REPO, ".nojekyll"), "");
console.log(`index.html: ${(Buffer.byteLength(html) / 1024).toFixed(0)} kB`);
