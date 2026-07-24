import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import PageContainer from '../components/layout/PageContainer';
import Breadcrumb from '../components/layout/Breadcrumb';
import Button from '../components/ui/Button';
import StatsPanel from '../components/problems/StatsPanel';
import SubmissionsTable from '../components/problems/SubmissionsTable';

interface Problem {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: number;
  ageGroup: string;
  correctAnswer: string;
  hints: string | null;
  aiGenerated: boolean;
  createdBy: {
    id: string;
    email: string;
    displayName: string;
    role: string;
  };
}

export default function ProblemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: problem, isLoading, isError, error } = useQuery<Problem>({
    queryKey: ['problem', id],
    queryFn: () => api.get(`/problems/${id}`),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/problems/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] });
      navigate('/dashboard');
    },
  });

  function handleDelete() {
    if (!window.confirm('Delete this problem? This cannot be undone.')) return;
    deleteMutation.mutate();
  }

  if (isLoading) return <PageContainer><p className="text-ink-muted">Loading…</p></PageContainer>;
  if (isError) return <PageContainer><p className="text-red-700">{(error as Error).message}</p></PageContainer>;
  if (!problem) return null;

  const isOwner = user?.userId === problem.createdBy.id;

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: problem.title }]} />

      <div className="flex flex-wrap justify-between items-start gap-4 mb-2">
        <h1 className="mb-0">{problem.title}</h1>
        {isOwner && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/problems/${id}/edit`)}>
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        )}
      </div>

      <p className="text-ink-muted text-sm mb-6">
        {problem.topic} · Difficulty {problem.difficulty} · Age {problem.ageGroup} ·{' '}
        {problem.aiGenerated ? 'AI-generated' : 'Teacher-authored'}
      </p>

      <h2>Description</h2>
      <p className="mb-6">{problem.description}</p>

      <h2>Correct answer</h2>
      <div className="border border-line bg-gray-50 p-3 font-mono text-sm mb-6 inline-block">
        {problem.correctAnswer}
      </div>

      {problem.hints && (
        <>
          <h2>Hints</h2>
          <p className="whitespace-pre-wrap mb-6">{problem.hints}</p>
        </>
      )}

      <h2>Statistics</h2>
      <div className="mb-6">
        <StatsPanel problemId={id!} />
      </div>

      <h2>Submissions</h2>
      <SubmissionsTable problemId={id!} />
    </PageContainer>
  );
}
