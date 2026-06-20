import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

interface Stats {
  studentsAttempted: number;
  successRate: number;
  avgAttemptsToSolve: number;
  avgTimeTaken: number;
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

interface StatsPanelProps {
  problemId: string;
}

export default function StatsPanel({ problemId }: StatsPanelProps) {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['problem-stats', problemId],
    queryFn: () => api.get(`/problems/${problemId}/stats`),
  });

  const dash = '—';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatBox label="Students attempted" value={isLoading ? dash : String(stats!.studentsAttempted)} />
      <StatBox label="Success rate" value={isLoading ? dash : `${stats!.successRate}%`} />
      <StatBox label="Avg attempts to solve" value={isLoading ? dash : String(stats!.avgAttemptsToSolve)} />
      <StatBox label="Avg time" value={isLoading ? dash : `${stats!.avgTimeTaken}s`} />
    </div>
  );
}
