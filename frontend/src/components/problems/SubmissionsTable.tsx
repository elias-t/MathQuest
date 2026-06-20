import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

interface Submission {
  id: string;
  answer: string;
  isCorrect: boolean;
  attemptNumber: number;
  timeTaken: number;
  createdAt: string;
  student: {
    displayName: string;
    email: string;
  };
}

function formatSubmittedAt(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

interface SubmissionsTableProps {
  problemId: string;
}

export default function SubmissionsTable({ problemId }: SubmissionsTableProps) {
  const { data: submissions, isLoading, isError } = useQuery<Submission[]>({
    queryKey: ['problem-submissions', problemId],
    queryFn: () => api.get(`/submissions/problem/${problemId}`),
  });

  if (isLoading) return <p className="text-ink-muted py-4">Loading…</p>;
  if (isError) return <p className="text-red-700 py-4">Failed to load submissions.</p>;
  if (!submissions?.length) return <p className="text-ink-muted py-4">No submissions yet.</p>;

  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-line">
          <th className="px-4 py-3 font-semibold">Student</th>
          <th className="px-4 py-3 font-semibold">Answer</th>
          <th className="px-4 py-3 font-semibold">Correct</th>
          <th className="px-4 py-3 font-semibold">Attempt</th>
          <th className="px-4 py-3 font-semibold">Time (s)</th>
          <th className="px-4 py-3 font-semibold">Submitted</th>
        </tr>
      </thead>
      <tbody>
        {submissions.map((s) => (
          <tr key={s.id} className="border-b border-line">
            <td className="px-4 py-3">{s.student.displayName}</td>
            <td className="px-4 py-3 font-mono text-sm">{s.answer}</td>
            <td className="px-4 py-3">
              {s.isCorrect ? (
                <span className="text-green-700 font-bold">✓</span>
              ) : (
                <span className="text-red-700 font-bold">✗</span>
              )}
            </td>
            <td className="px-4 py-3 text-ink-muted">{s.attemptNumber}</td>
            <td className="px-4 py-3 text-ink-muted">{s.timeTaken}</td>
            <td className="px-4 py-3 text-ink-muted">{formatSubmittedAt(s.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
