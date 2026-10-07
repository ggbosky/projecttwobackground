import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-2 text-xl font-semibold tracking-tight text-fg">Stránka nenalezena</h1>
      <p className="mt-1 text-sm text-fg-2">Hledaný klient, projekt nebo stránka neexistuje.</p>
      <Link
        href="/"
        className="mt-5 inline-flex h-9 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg shadow-card hover:brightness-110"
      >
        Zpět na přehled
      </Link>
    </div>
  );
}
