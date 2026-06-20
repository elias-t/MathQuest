import { useAuth } from '../contexts/AuthContext';
import PageContainer from '../components/layout/PageContainer';

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <PageContainer>
      <h1>Welcome, {user?.displayName}</h1>
      <p className="text-ink-muted">Your problem-solving area is coming soon. Check back later.</p>
    </PageContainer>
  );
}
