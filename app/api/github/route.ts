import { NextResponse, type NextRequest } from "next/server";
import { getGithubData } from "@/lib/github";

/**
 * GET /api/github            – všechny sledované repozitáře
 * GET /api/github?repo=o/r   – jeden repozitář (detail projektu)
 *
 * Token zůstává na serveru, klient dostává jen normalizovaná data.
 */
export async function GET(request: NextRequest) {
  const repo = request.nextUrl.searchParams.get("repo") ?? undefined;
  const data = await getGithubData(repo);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
