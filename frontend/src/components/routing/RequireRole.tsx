import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface RequireRoleProps {
  role: 'TEACHER' | 'STUDENT';
  redirectTo?: string;
  children: ReactNode;
}

export default function RequireRole({ role, redirectTo = '/', children }: RequireRoleProps) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
}
