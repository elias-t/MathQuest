import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import PageContainer from '../components/layout/PageContainer';
import Breadcrumb from '../components/layout/Breadcrumb';
import Button from '../components/ui/Button';

interface Problem {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: number;
}

interface SubmissionResult {
  id: string;
  answer: string;
  isCorrect: boolean;
  timeTaken: number;
  aiFeedback: string | null;
  hintsUsed: number;
  attemptNumber: number;
  createdAt: string;
  studentId: string;
  problemId: string;
  nextProblem: { id: string; title: string } | null;
}

export default function StudentSolveProblem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // TODO: form state for the student's answer
  const [answer, setAnswer] = useState('');

  // TODO: hints the student has unlocked so far this session
  const [hints, setHints] = useState<string[]>([]);

  // TODO: timing - when did the student start? (Date.now() on mount)
  const [startTime] = useState(Date.now());

  // TODO: result from the most recent submission (null until submit)
  const [result, setResult] = useState<SubmissionResult | null>(null);

  // TODO: submitting / hinting in-flight flags
  const [submitting, setSubmitting] = useState(false);
  const [requestingHint, setRequestingHint] = useState(false);

  // TODO: error message for failed submit or hint requests
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: problem, isLoading, isError } = useQuery<Problem>({
    queryKey: ['problem', id],
    queryFn: () => api.get(`/problems/${id}`),
    enabled: !!id,
  });

  async function handleSubmit() {
    if (!answer.trim()) {
      setErrorMessage('Enter an answer first.');
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    try {
      const response = await api.post('/submissions', { problemId: id, answer, timeTaken });
      setResult(response);
    } catch (err) {
      setErrorMessage((err as Error).message ?? "Couldn't submit your answer.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleHint() {
    setRequestingHint(true);
    setErrorMessage(null);
    try {
      const response = await api.post(`/problems/${id}/hint`, { previousHints: hints });
      setHints((prev) => [...prev, response.hint]);
    } catch (err) {
      setErrorMessage((err as Error).message ?? "Couldn't get a hint.");
    } finally {
      setRequestingHint(false);
    }
  }

  if (isLoading) return <PageContainer><p className="text-ink-muted">Loading...</p></PageContainer>;
  if (isError || !problem) return (
    <PageContainer>
      <p className="text-red-700 mb-2">Problem not found.</p>
      <Link to="/student">Back to problems</Link>
    </PageContainer>
  );

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: 'Back to problems', to: '/student' }, { label: problem.title }]} />

      <h1>{problem.title}</h1>
      <p className="text-ink-muted text-sm mb-6">
        {problem.topic} · Difficulty {problem.difficulty}
      </p>

      <h2>Problem</h2>
      <p className="mb-6">{problem.description}</p>

      <h2>Your answer</h2>
      <div className="mb-4">
        <textarea
          name="answer"
          rows={3}
          className="w-full border border-line p-3 font-sans text-base"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
      </div>

      {errorMessage && (
        <p className="text-red-700 text-sm mb-3">{errorMessage}</p>
      )}

      <div className="flex gap-3 mb-8">
        <Button variant="secondary" onClick={handleHint} disabled={requestingHint}>
          {requestingHint ? 'Getting hint…' : 'Hint'}
        </Button>
        {!result?.isCorrect && (
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit'}
          </Button>
        )}
      </div>

      {hints.length > 0 && (
        <div className="mb-8">
          <h2>Hints</h2>
          {hints.map((hint, i) => (
            <div key={i} className="border border-line p-3 mb-2">
              {hint}
            </div>
          ))}
        </div>
      )}

      {result !== null && (
        <div className="mb-8">
          <h2 className={result.isCorrect ? 'text-green-700' : 'text-red-700'}>
            {result.isCorrect ? 'Correct' : 'Not quite'}
          </h2>
          {result.aiFeedback && <p className="mb-4">{result.aiFeedback}</p>}

          {result.nextProblem ? (
            <Button variant="primary" onClick={() => navigate(`/student/problems/${result.nextProblem?.id}`)}>
              Next problem
            </Button>
          ) : result.isCorrect ? (
            <p className="text-ink-muted">Great job! No further problems generated yet.</p>
          ) : (
            <p className="text-ink-muted">Try again — adjust your answer and resubmit.</p>
          )}
        </div>
      )}
    </PageContainer>
  );
}
