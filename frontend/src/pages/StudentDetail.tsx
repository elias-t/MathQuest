import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import PageContainer from '../components/layout/PageContainer';
import Breadcrumb from '../components/layout/Breadcrumb';
import StudentStatsPanel from '../components/students/StudentStatsPanel';
import StudentProblemsTable from '../components/students/StudentProblemsTable';

interface StudentBreakdown {
  student: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    createdAt: string;
  };
  stats: {
    totalProblems: number;
    totalSubmissions: number;
    successRate: number;
    solvedCount: number;
    failedCount: number;
    aiGeneratedCount: number;
  };
  solved: ProblemSummary[];
  failed: ProblemSummary[];
  aiGenerated: ProblemSummary[];
}

interface ProblemSummary {
  problemId: string;
  title: string;
  topic: string;
  difficulty: number;
  attempts: number;
  isCorrect: boolean;
  lastAttemptAt: string;
}

function formatJoinDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery<StudentBreakdown>({
    queryKey: ['student-breakdown', id],
    queryFn: () => api.get(`/users/${id}/breakdown`),
    enabled: !!id,
  });

  if (isLoading) return <PageContainer><p className="text-ink-muted">Loading...</p></PageContainer>;
  if (isError) return <PageContainer><p className="text-red-700">Could not load student.</p></PageContainer>;
  if (!data) return null;

  const { student, stats, solved, failed, aiGenerated } = data;

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: student.displayName }]} />

      <h1 className="mb-1">{student.displayName}</h1>
      <p className="text-ink-muted text-sm mb-6">
        {student.email} · Joined {formatJoinDate(student.createdAt)}
      </p>

      <h2>Statistics</h2>
      <div className="mb-8">
        <StudentStatsPanel stats={stats} />
      </div>

      <StudentProblemsTable
        title="Solved"
        problems={solved}
        emptyMessage="No problems solved yet."
      />
      <StudentProblemsTable
        title="Stuck"
        problems={failed}
        emptyMessage="Not stuck on any problems."
      />
      <StudentProblemsTable
        title="AI-generated problems encountered"
        problems={aiGenerated}
        emptyMessage="No AI-generated problems yet."
      />
    </PageContainer>
  );
}
