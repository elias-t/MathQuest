import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import PageContainer from '../components/layout/PageContainer';

interface Problem {
  id: string;
  title: string;
  topic: string;
  difficulty: number;
  aiGenerated: boolean;
  status: 'NOT_ATTEMPTED' | 'ATTEMPTED' | 'SOLVED_FIRST_TRY' | 'SOLVED_LATER';
}

const STATUS_META: Record<
  Problem['status'],
  { label: string; dot: string; text: string }
> = {
  NOT_ATTEMPTED: { label: 'Not attempted', dot: 'bg-gray-400', text: 'text-ink-muted' },
  ATTEMPTED: { label: 'Tried', dot: 'bg-red-500', text: 'text-red-700' },
  SOLVED_FIRST_TRY: { label: 'Solved', dot: 'bg-green-500', text: 'text-green-700' },
  SOLVED_LATER: { label: 'Solved (retried)', dot: 'bg-amber-500', text: 'text-amber-700' },
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: problems, isLoading, isError } = useQuery<Problem[]>({
    queryKey: ['problems', 'student'],
    queryFn: () => api.get('/problems/student'),
    // Always refetch when the student lands here — new AI problems and updated
    // statuses are generated while solving, and the global 5-min staleTime
    // would otherwise show a stale list until a hard refresh.
    refetchOnMount: 'always',
  });

  return (
    <PageContainer>
      <h1>Welcome, {user?.displayName}</h1>
      <p className="text-ink-muted text-sm mb-6">Pick a problem to start solving.</p>

      {isLoading && <p className="text-ink-muted">Loading…</p>}
      {isError && <p className="text-red-700">Failed to load problems.</p>}
      {problems && problems.length === 0 && (
        <p className="text-ink-muted">No problems available yet. Check back later.</p>
      )}
      {problems && problems.length > 0 && (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Topic</th>
              <th className="px-4 py-3 font-semibold">Difficulty</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Source</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((p) => {
              const meta = STATUS_META[p.status];
              return (
                <tr
                  key={p.id}
                  className="border-b border-line cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/student/problems/${p.id}`)}
                >
                  <td className="px-4 py-3">{p.title}</td>
                  <td className="px-4 py-3 text-ink-muted">{p.topic}</td>
                  <td className="px-4 py-3 text-ink-muted">{p.difficulty}</td>
                  <td className={`px-4 py-3 ${meta.text}`}>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full ${meta.dot}`}
                        aria-hidden="true"
                      />
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs border border-line ${
                        p.aiGenerated ? 'text-ink-muted' : ''
                      }`}
                    >
                      {p.aiGenerated ? 'AI' : 'Teacher'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </PageContainer>
  );
}
