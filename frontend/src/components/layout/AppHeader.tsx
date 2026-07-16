import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 bg-white border-b border-line z-10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-ink no-underline hover:text-brand">
          MathQuest
        </Link>
        <div className="text-sm text-ink-muted">
          {user ? (
            <span className="flex items-center gap-4">
              <span>Signed in as {user.displayName ?? user.email} ({user.role})</span>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-brand underline underline-offset-2 hover:text-brand-dark bg-transparent border-none p-0 cursor-pointer font-sans text-sm"
              >
                Sign out
              </button>
            </span>
          ) : (
            <Link to="/login">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
