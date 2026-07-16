import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    try {
      const res = await api.post('/auth/login', {
        email: data.get('email'),
        password: data.get('password'),
      });
      const user = await signIn(res.access_token);
      navigate(user.role === 'TEACHER' ? '/dashboard' : '/student');
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <div className="max-w-md">
        <h1>Sign in</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="border border-line px-3 py-2 text-ink focus:outline-none focus:border-brand"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="border border-line px-3 py-2 text-ink focus:outline-none focus:border-brand"
            />
          </div>
          {error && <p className="text-red-700 text-sm">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-6 text-sm text-ink-muted">
          No account?{' '}
          <Link to="/register">Register</Link>
        </p>
      </div>
    </PageContainer>
  );
}
