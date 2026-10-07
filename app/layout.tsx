import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider, themeInitScript } from "@/components/layout/ThemeProvider";
import { clients, finance, mockRepos, projects } from "@/lib/data";
import { githubMode } from "@/lib/github";
import { receivables } from "@/lib/metrics";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Project Two · Control Center", template: "%s · Project Two" },
  description: "Interní All-in-One dashboard agentury Project Two – finance, klienti, projekty, GitHub a tým.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#09090a" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const r = receivables();
  const stats = {
    activeProjects: projects.filter((p) => p.status === "in_progress").length,
    openPullRequests: mockRepos.reduce((s, repo) => s + repo.pullRequests.length, 0),
    overdueCount: r.overdueCount,
    overdueAmount: r.overdue,
    leads: clients.filter((c) => c.status === "lead").length,
    referenceDate: finance.referenceDate,
    githubMode: githubMode(),
  };

  return (
    <html lang="cs" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans">
        <ThemeProvider>
          <AppShell stats={stats}>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
