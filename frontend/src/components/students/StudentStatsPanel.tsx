interface Stats {
  totalProblems: number;
  totalSubmissions: number;
  successRate: number;
  solvedCount: number;
  failedCount: number;
  aiGeneratedCount: number;
}

interface StatBoxProps {
  label: string;
  value: string;
}

function StatBox({ label, value }: StatBoxProps) {
  return (
    <div className="border border-line p-4">
      <p className="text-ink-muted text-sm uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}

interface StudentStatsPanelProps {
  stats: Stats;
}

export default function StudentStatsPanel({ stats }: StudentStatsPanelProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatBox label="Problems attempted" value={String(stats.totalProblems)} />
      <StatBox label="Success rate" value={`${stats.successRate}%`} />
      <StatBox label="Solved" value={String(stats.solvedCount)} />
      <StatBox label="Stuck" value={String(stats.failedCount)} />
    </div>
  );
}
