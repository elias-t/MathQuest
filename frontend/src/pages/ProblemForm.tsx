import { useState, useEffect, type ChangeEvent, type FormEvent} from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import PageContainer from '../components/layout/PageContainer';
import Breadcrumb from '../components/layout/Breadcrumb';
import Button from '../components/ui/Button';

type Props = { mode: 'create' | 'edit' };

const inputClass = 'border border-line px-3 py-2 w-full font-sans focus:outline-none focus:border-brand';
const labelClass = 'block font-semibold mb-1 text-sm';
const fieldClass = 'mb-5';

export default function ProblemForm({ mode }: Props) {
  console.log('ProblemForm mounted, mode:', mode);
  const { id } = useParams<{ id: string }>();
  
  type ProblemFormState = {
    title: string;
    description: string;
    topic: 'ARITHMETIC' | 'ALGEBRA' | 'GEOMETRY' | 'FRACTIONS' | 'STATISTICS';
    difficulty: number;
    ageGroup: string;
    correctAnswer: string;
    hints: string;
    machineForm: string;
    variable: string;
  };

  const initialState: ProblemFormState = {
    title: '',
    description: '',
    topic: 'ARITHMETIC',
    difficulty: 1,
    ageGroup: '',
    correctAnswer: '',
    hints: '',
    machineForm: '',
    variable: '',
  };

  const [form, setForm] = useState<ProblemFormState>(initialState);

  const [errors, setErrors] = useState<Partial<Record<keyof ProblemFormState, string>>>({});

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'difficulty' ? Number(value) : value,
    }));
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.title.trim()) errs.title = 'Required';
    if (!form.description.trim()) errs.description = 'Required';
    if (!form.ageGroup.trim()) errs.ageGroup = 'Required';
    if (!form.correctAnswer.trim()) errs.correctAnswer = 'Required';
    if (!form.machineForm.trim()) errs.machineForm = 'Required';
    if (form.difficulty < 1 || form.difficulty > 10) {
      errs.difficulty = 'Must be between 1 and 10';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const { data: problem, isLoading, isError } = useQuery({
    queryKey: ['problem', id],
    queryFn: () => api.get(`/problems/${id}`),
    enabled: mode === 'edit' && !!id,
  });

  useEffect(() => {
    if (problem) {
      setForm({
        title: problem.title,
        description: problem.description,
        topic: problem.topic,
        difficulty: problem.difficulty,
        ageGroup: problem.ageGroup,
        correctAnswer: problem.correctAnswer,
        hints: problem.hints ?? '',
        machineForm: problem.machineForm ?? '',
        variable: problem.variable ?? '',
      });
    }
  }, [problem]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      if (mode === 'create') {
        const created = await api.post('/problems', form);          // ← rename for clarity
        queryClient.invalidateQueries({ queryKey: ['problems'] });
        navigate(`/problems/${created.id}`);                        // ← no .data
      } else {
        await api.patch(`/problems/${id}`, form);
        queryClient.invalidateQueries({ queryKey: ['problems'] });
        queryClient.invalidateQueries({ queryKey: ['problem', id] });
        navigate(`/problems/${id}`);
      }
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }
  if (mode === 'edit' && isLoading) {
    return <PageContainer><p className="text-ink-muted">Loading…</p></PageContainer>;
  }

  if (mode === 'edit' && isError) {
    return (
      <PageContainer>
        <p className="text-red-700 mb-4">Problem not found.</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </PageContainer>
    );
  }

  const breadcrumbItems =
    mode === 'create'
      ? [{ label: 'Dashboard', to: '/dashboard' }, { label: 'New problem' }]
      : [
          { label: 'Dashboard', to: '/dashboard' },
          { label: problem?.title ?? '…', to: `/problems/${id}` },
          { label: 'Edit' },
        ];

  return (
    <PageContainer>
      <Breadcrumb items={breadcrumbItems} />
      <h1>{mode === 'create' ? 'New problem' : 'Edit problem'}</h1>

      <p className="text-sm text-ink-muted mb-6">
        Use machine form for sympy-parseable expressions. Use * for multiplication.
      </p>

      <form onSubmit={handleSubmit} className="max-w-2xl">

        <div className={fieldClass}>
          <label className={labelClass} htmlFor="title">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="border border-line px-3 py-2 w-full"
          />
          {errors.title && <p className="text-red-700 text-sm mt-1">{errors.title}</p>}
        </div>

        <div className={fieldClass}>
          <label className={labelClass} htmlFor="description">Description</label>
          <textarea
            name="description"
            rows={4}
            value={form.description}
            onChange={handleChange}
            className="border border-line px-3 py-2 w-full"
          />
          {errors.description && <p className="text-red-700 text-sm mt-1">{errors.description}</p>}
        </div>

        <div className={fieldClass}>
          <label className={labelClass} htmlFor="topic">Topic</label>
          <select
            name="topic"
            value={form.topic}
            onChange={handleChange}
            className="border border-line px-3 py-2 w-full"
          >
            <option value="ARITHMETIC">ARITHMETIC</option>
            <option value="ALGEBRA">ALGEBRA</option>
            <option value="GEOMETRY">GEOMETRY</option>
            <option value="FRACTIONS">FRACTIONS</option>
            <option value="STATISTICS">STATISTICS</option>
          </select>
          {errors.topic && <p className="text-red-700 text-sm mt-1">{errors.topic}</p>}
        </div>

        <div className={fieldClass}>
          <label className={labelClass} htmlFor="difficulty">Difficulty (1–10)</label>
          <input
            name="difficulty"
            type="number"
            min={1}
            max={10}
            value={form.difficulty}
            onChange={handleChange}
            className="border border-line px-3 py-2 w-full"
          />
          {errors.difficulty && <p className="text-red-700 text-sm mt-1">{errors.difficulty}</p>}
        </div>

        <div className={fieldClass}>
          <label className={labelClass} htmlFor="ageGroup">Age group</label>
          <input
            name="ageGroup"
            value={form.ageGroup}
            onChange={handleChange}
            className="border border-line px-3 py-2 w-full"
          />
          {errors.ageGroup && <p className="text-red-700 text-sm mt-1">{errors.ageGroup}</p>}

        </div>

        <div className={fieldClass}>
          <label className={labelClass} htmlFor="correctAnswer">Correct answer</label>
          <input
            name="correctAnswer"
            value={form.correctAnswer}
            onChange={handleChange}
            className="border border-line px-3 py-2 w-full"
          />
          {errors.correctAnswer && <p className="text-red-700 text-sm mt-1">{errors.correctAnswer}</p>}
        </div>

        <div className={fieldClass}>
          <label className={labelClass} htmlFor="hints">Hints</label>
          <textarea
            name="hints"
            rows={3}
            value={form.hints}
            onChange={handleChange}
            className="border border-line px-3 py-2 w-full"
          />
        </div>

        <div className={fieldClass}>
          <label className={labelClass} htmlFor="machineForm">Machine form</label>
          <input
            name="machineForm"
            placeholder="e.g. 2*x + 4 = 10 or 6 * 4"
            value={form.machineForm}
            onChange={handleChange}
            className="border border-line px-3 py-2 w-full"
          />
          {errors.machineForm && <p className="text-red-700 text-sm mt-1">{errors.machineForm}</p>}
        </div>

        <div className={fieldClass}>
          <label className={labelClass} htmlFor="variable">Variable</label>
          <input
            name="variable"
            placeholder="e.g. x (leave empty for arithmetic)"
            value={form.variable}
            onChange={handleChange}
            className="border border-line px-3 py-2 w-full"
          />
        </div>

        {submitError && (<p className="text-red-700 mb-4">{submitError}</p>)}
        <div className="flex gap-3 mt-2">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </div>

      </form>
    </PageContainer>
  );
}

