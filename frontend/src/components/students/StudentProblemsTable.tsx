import { useNavigate } from 'react-router-dom';

interface ProblemSummary {
  problemId: string;
  title: string;
  topic: string;
  difficulty: number;
  attempts: number;
  isCorrect: boolean;
  lastAttemptAt: string;
}

interface StudentProblemsTableProps {
  title: string;
  problems: ProblemSummary[];
  emptyMessage: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function StudentProblemsTable({ title, problems, emptyMessage }: StudentProblemsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <h2>{title}</h2>
      {problems.length === 0 ? (
        <p className="text-ink-muted">{emptyMessage}</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Topic</th>
              <th className="px-4 py-3 font-semibold">Difficulty</th>
              <th className="px-4 py-3 font-semibold">Attempts</th>
              <th className="px-4 py-3 font-semibold">Last attempt</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((p) => (
              <tr
                key={p.problemId}
                className="border-b border-line cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/problems/${p.problemId}`)}
              >
                <td className="px-4 py-3">{p.title}</td>
                <td className="px-4 py-3 text-ink-muted">{p.topic}</td>
                <td className="px-4 py-3 text-ink-muted">{p.difficulty}</td>
                <td className="px-4 py-3 text-ink-muted">{p.attempts}</td>
                <td className="px-4 py-3 text-ink-muted">{formatDate(p.lastAttemptAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
