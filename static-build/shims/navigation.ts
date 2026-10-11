import { useMemo, useSyncExternalStore } from "react";
import { NotFoundError, back, getHref, navigate, subscribe } from "./router";

function useHref() {
  return useSyncExternalStore(subscribe, getHref, getHref);
}
export function usePathname() {
  return useHref().split("?")[0];
}
export function useSearchParams() {
  const href = useHref();
  return useMemo(() => new URLSearchParams(href.split("?")[1] ?? ""), [href]);
}
export function useRouter() {
  return {
    push: (h: string, o?: { scroll?: boolean }) => navigate(h, o),
    replace: (h: string, o?: { scroll?: boolean }) => navigate(h, { ...o, replace: true }),
    back,
    forward: () => {},
    refresh: () => {},
    prefetch: () => {},
  };
}
export function notFound(): never {
  throw new NotFoundError();
}
/** V náhledu redirect nehází výjimku – jen přepne stránku */
export function redirect(href: string): never {
  setTimeout(() => navigate(href), 0);
  return undefined as never;
}
