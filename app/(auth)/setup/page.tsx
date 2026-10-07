import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { SetupForm } from "@/components/auth/AuthForms";
import { readDb } from "@/lib/server/db";

export const metadata: Metadata = { title: "První nastavení" };

export default async function SetupPage() {
  await connection();
  const db = await readDb();
  if (db.users.length > 0) redirect("/login");
  return <SetupForm />;
}
