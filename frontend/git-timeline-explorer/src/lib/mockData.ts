export interface AnalysisData {
  repo: string;
  commits_per_day: { date: string; count: number }[];
  top_files: { file: string; changes: number; additions: number; deletions: number }[];
  contributors: { name: string; commits: number; avatar?: string }[];
  contributor_edges: { source: string; target: string; weight: number }[];
  activity_calendar: { date: string; count: number }[];
  branches: { name: string; commits: number; parent?: string }[];
  hotspots: { file: string; risk: number; reason: string; changes: number }[];
  health_score: number;
  ai_insights: string[];
}

function generateDates(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

/**
 * Normalize any API response (real or mock) into the internal AnalysisData shape.
 * Uses optional chaining + fallbacks so it never crashes on missing fields.
 */
export const normalizeApiResponse = (raw: any, repoUrl: string): AnalysisData => {
  // commits_per_day: from timeline[] or commits_per_day[]
  const timeline: any[] = raw?.timeline ?? raw?.commits_per_day ?? [];
  const commits_per_day = timeline.map((t: any) => ({
    date: t?.date ?? "",
    count: t?.count ?? t?.commits ?? t?.value ?? 0,
  }));

  // top_files: from file_churn[] or top_files[]
  const fileChurn: any[] = raw?.file_churn ?? raw?.top_files ?? [];
  const top_files = fileChurn.map((f: any) => ({
    file: f?.file ?? f?.name ?? "unknown",
    changes: f?.churn ?? f?.changes ?? f?.value ?? 0,
    additions: f?.additions ?? 0,
    deletions: f?.deletions ?? 0,
  }));

  // contributors
  const rawContributors: any[] = raw?.contributors ?? raw?.contributor_network_nodes ?? [];
  const contributors = rawContributors.map((c: any) => ({
    name: c?.name ?? c?.author ?? c?.label ?? c?.id ?? "unknown",
    commits: c?.commits ?? c?.value ?? 0,
  }));

  // contributor_edges
  const rawEdges: any[] = raw?.contributor_network_edges ?? raw?.contributor_edges ?? raw?.contributor_network ?? [];
  const contributor_edges = rawEdges.map((e: any) => ({
    source: e?.source ?? e?.from ?? "",
    target: e?.target ?? e?.to ?? "",
    weight: e?.weight ?? e?.value ?? 1,
  }));

  // activity_calendar
  const rawCal: any[] = raw?.activity_calendar ?? [];
  const activity_calendar = rawCal.map((d: any) => ({
    date: d?.date ?? "",
    count: d?.count ?? d?.total_commits ?? d?.value ?? 0,
  }));

  // branches
  const rawBranches: any[] = raw?.branches ?? [];
  const branches = rawBranches.map((b: any) => ({
    name: b?.name ?? b?.label ?? b?.id ?? "unknown",
    commits: b?.commits ?? b?.value ?? 0,
    parent: b?.parent,
  }));

  // hotspots: from risk_scores[] or hotspots[]
  const rawHotspots: any[] = raw?.risk_scores ?? raw?.hotspots ?? [];
  const hotspots = rawHotspots.map((h: any) => ({
    file: h?.file ?? h?.name ?? "unknown",
    risk: h?.risk_score ?? h?.hotspot_score ?? h?.score ?? h?.risk ?? h?.value ?? 0,
    reason: h?.risk_level ?? h?.level ?? (h?.risk_score >= 80 ? "Critical risk" : h?.risk_score >= 60 ? "High risk" : "Moderate risk"),
    changes: h?.churn ?? h?.changes ?? 0,
  }));

  const health_score = raw?.health_score ?? 0;
  const ai_insights: string[] = raw?.insights ?? raw?.ai_insights ?? [];
  const repo = raw?.meta?.repo_url ?? repoUrl;

  return {
    repo,
    commits_per_day,
    top_files,
    contributors,
    contributor_edges,
    activity_calendar,
    branches,
    hotspots,
    health_score,
    ai_insights,
  };
};

export const generateMockData = (repo: string): AnalysisData => {
  const dates = generateDates(90);

  return {
    repo,
    commits_per_day: dates.map((date) => ({
      date,
      count: Math.floor(Math.random() * 25) + 1,
    })),
    top_files: [
      { file: "src/App.tsx", changes: 142, additions: 89, deletions: 53 },
      { file: "src/index.ts", changes: 98, additions: 67, deletions: 31 },
      { file: "src/utils/api.ts", changes: 87, additions: 52, deletions: 35 },
      { file: "src/components/Dashboard.tsx", changes: 76, additions: 58, deletions: 18 },
      { file: "src/hooks/useAuth.ts", changes: 65, additions: 41, deletions: 24 },
      { file: "README.md", changes: 54, additions: 48, deletions: 6 },
      { file: "src/styles/main.css", changes: 49, additions: 33, deletions: 16 },
      { file: "package.json", changes: 43, additions: 28, deletions: 15 },
      { file: "src/types/index.ts", changes: 38, additions: 32, deletions: 6 },
      { file: "src/components/Header.tsx", changes: 35, additions: 23, deletions: 12 },
      { file: "tests/app.test.ts", changes: 31, additions: 25, deletions: 6 },
      { file: "src/lib/db.ts", changes: 28, additions: 19, deletions: 9 },
      { file: "src/routes/api.ts", changes: 24, additions: 18, deletions: 6 },
      { file: ".env.example", changes: 19, additions: 15, deletions: 4 },
      { file: "docker-compose.yml", changes: 15, additions: 12, deletions: 3 },
    ],
    contributors: [
      { name: "alice", commits: 234 },
      { name: "bob", commits: 187 },
      { name: "charlie", commits: 145 },
      { name: "diana", commits: 98 },
      { name: "eve", commits: 67 },
      { name: "frank", commits: 45 },
    ],
    contributor_edges: [
      { source: "alice", target: "bob", weight: 42 },
      { source: "alice", target: "charlie", weight: 28 },
      { source: "bob", target: "diana", weight: 35 },
      { source: "charlie", target: "eve", weight: 19 },
      { source: "diana", target: "frank", weight: 12 },
      { source: "eve", target: "alice", weight: 23 },
      { source: "bob", target: "eve", weight: 15 },
    ],
    activity_calendar: generateDates(365).map((date) => ({
      date,
      count: Math.random() > 0.3 ? Math.floor(Math.random() * 12) : 0,
    })),
    branches: [
      { name: "main", commits: 450 },
      { name: "develop", commits: 320, parent: "main" },
      { name: "feature/auth", commits: 45, parent: "develop" },
      { name: "feature/dashboard", commits: 38, parent: "develop" },
      { name: "hotfix/security", commits: 12, parent: "main" },
      { name: "feature/api", commits: 28, parent: "develop" },
      { name: "release/v2.0", commits: 15, parent: "main" },
    ],
    hotspots: [
      { file: "src/App.tsx", risk: 92, reason: "High churn + multiple contributors", changes: 142 },
      { file: "src/utils/api.ts", risk: 78, reason: "Frequent bug fixes detected", changes: 87 },
      { file: "src/hooks/useAuth.ts", risk: 71, reason: "Complex logic, low test coverage", changes: 65 },
      { file: "src/components/Dashboard.tsx", risk: 65, reason: "Growing complexity", changes: 76 },
      { file: "src/lib/db.ts", risk: 58, reason: "Critical path, few contributors", changes: 28 },
    ],
    health_score: 73,
    ai_insights: [
      "🔥 High code churn detected in src/App.tsx — 142 changes across 6 contributors. Consider splitting into smaller modules.",
      "⚡ Commit frequency peaks on Tuesdays and Thursdays. The team is most productive mid-week.",
      "🛡️ Security hotfix branch has unmerged changes for 14 days. Recommend immediate merge to main.",
      "📈 Developer alice is the top contributor with 234 commits, but 67% are concentrated in 3 files — potential bus factor risk.",
      "🧪 Test coverage appears low for high-churn files. Consider adding tests for src/utils/api.ts and src/hooks/useAuth.ts.",
      "🌿 Branch feature/api has diverged significantly from develop. Merge conflicts likely if not resolved soon.",
    ],
  };
};
