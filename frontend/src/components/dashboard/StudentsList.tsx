import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

interface Student {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
  _count: { submissions: number };
}

export default function StudentsList() {
  const navigate = useNavigate();
  const { data: students, isLoading, isError } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => api.get('/users?role=STUDENT'),
    refetchOnMount: 'always', // keep submission counts fresh on each visit
  });

  if (isLoading) return <p className="text-ink-muted py-4">Loading…</p>;
  if (isError) return <p className="text-red-700 py-4">Failed to load students.</p>;
  if (!students?.length) return <p className="text-ink-muted py-4">No students yet.</p>;

  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-line">
          <th className="px-4 py-3 font-semibold">Display name</th>
          <th className="px-4 py-3 font-semibold">Email</th>
          <th className="px-4 py-3 font-semibold">Submissions</th>
        </tr>
      </thead>
      <tbody>
        {students.map((s) => (
          <tr
            key={s.id}
            className="border-b border-line cursor-pointer hover:bg-gray-50"
            onClick={() => navigate(`/students/${s.id}`)}
          >
            <td className="px-4 py-3">{s.displayName}</td>
            <td className="px-4 py-3 text-ink-muted">{s.email}</td>
            <td className="px-4 py-3 text-ink-muted">{s._count.submissions}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
