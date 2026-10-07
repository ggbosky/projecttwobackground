import type { Metadata } from "next";
import { GithubDashboard } from "@/components/github/GithubDashboard";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "GitHub" };

export default function GithubPage() {
  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Integrace"
        title="GitHub"
        description="Repozitáře klientských webů – poslední commity, otevřené pull requesty, issues a stav nasazení (Vercel / Netlify)."
      />
      <GithubDashboard />
    </div>
  );
}
