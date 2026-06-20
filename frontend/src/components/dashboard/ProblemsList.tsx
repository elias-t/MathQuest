import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import Button from '../ui/Button';

interface Problem {
  id: string;
  title: string;
  topic: string;
  difficulty: number;
  aiGenerated: boolean;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ProblemsList() {
  const navigate = useNavigate();
  const { data: problems, isLoading, isError } = useQuery<Problem[]>({
    queryKey: ['problems'],
    queryFn: () => api.get('/problems'),
  });

  if (isLoading) return <p className="text-ink-muted py-4">Loading…</p>;
  if (isError) return <p className="text-red-700 py-4">Failed to load problems.</p>;

  if (!problems?.length) {
    return (
      <div className="py-4">
        <p className="text-ink-muted mb-4">No problems yet. Create the first one.</p>
        <Button onClick={() => navigate('/problems/new')}>Create problem</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => navigate('/problems/new')}>Create problem</Button>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-line">
            <th className="px-4 py-3 font-semibold">Title</th>
            <th className="px-4 py-3 font-semibold">Topic</th>
            <th className="px-4 py-3 font-semibold">Difficulty</th>
            <th className="px-4 py-3 font-semibold">AI-generated</th>
            <th className="px-4 py-3 font-semibold">Created</th>
          </tr>
        </thead>
        <tbody>
          {problems.map((p) => (
            <tr
              key={p.id}
              className="border-b border-line cursor-pointer hover:bg-gray-50"
              onClick={() => navigate(`/problems/${p.id}`)}
            >
              <td className="px-4 py-3">{p.title}</td>
              <td className="px-4 py-3 text-ink-muted">{p.topic}</td>
              <td className="px-4 py-3 text-ink-muted">{p.difficulty}</td>
              <td className="px-4 py-3 text-ink-muted">{p.aiGenerated ? 'Yes' : 'No'}</td>
              <td className="px-4 py-3 text-ink-muted">{formatDate(p.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
