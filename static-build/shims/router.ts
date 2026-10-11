// In-memory router for the artifact preview (replaces Next.js routing).
type Listener = () => void;
let current = "/";
const listeners = new Set<Listener>();
const history: string[] = [];

export function getHref() {
  return current;
}
export function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function emit() {
  listeners.forEach((l) => l());
}

export function navigate(href: string, opts: { replace?: boolean; scroll?: boolean } = {}) {
  const [pathAndQuery, anchor] = href.split("#");
  const next = pathAndQuery || current.split("?")[0];
  const changed = next !== current;
  if (changed) {
    if (!opts.replace) history.push(current);
    current = next;
    emit();
  }
  if (anchor) {
    setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }), changed ? 120 : 0);
  } else if (changed && opts.scroll !== false && !opts.replace) {
    window.scrollTo({ top: 0 });
  }
}

export function back() {
  const prev = history.pop();
  if (prev) {
    current = prev;
    emit();
  }
}

export class NotFoundError extends Error {
  constructor() {
    super("NEXT_NOT_FOUND");
  }
}
