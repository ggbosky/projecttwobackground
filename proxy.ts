import { NextResponse, type NextRequest } from "next/server";

/**
 * Rychlá kontrola přihlášení před vykreslením stránky.
 * Skutečné ověření session probíhá v lib/server/auth.ts (requireUser) u každé stránky i akce.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("p2_session");
  if (!hasSession) {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.pathname + request.nextUrl.search;
    url.pathname = "/login";
    url.search = next && next !== "/" ? `?next=${encodeURIComponent(next)}` : "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|setup|_next/static|_next/image|icon.svg|favicon.ico).*)"],
};
