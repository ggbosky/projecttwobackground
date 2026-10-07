import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { LoginForm } from "@/components/auth/AuthForms";
import { getCurrentUser } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";

export const metadata: Metadata = { title: "Přihlášení" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  await connection();
  const db = await readDb();
  if (db.users.length === 0) redirect("/setup");
  if (await getCurrentUser()) redirect("/");
  const { next } = await searchParams;
  return <LoginForm next={next} />;
}
