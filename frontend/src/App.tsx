import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppHeader from './components/layout/AppHeader';
import RequireRole from './components/routing/RequireRole';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ProblemDetail from './pages/ProblemDetail';
import ProblemForm from './pages/ProblemForm';
import StudentDetail from './pages/StudentDetail';
import StudentSolveProblem from './pages/StudentSolveProblem';

function StudentSolveProblemRoute() {
  const { id } = useParams();
  return <StudentSolveProblem key={id} />;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'TEACHER') return <Navigate to="/dashboard" replace />;
  if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
  return <Navigate to="/login" replace />;
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5 } },
});


export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppHeader />
          <main>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/dashboard"
                element={
                  <RequireRole role="TEACHER" redirectTo="/student">
                    <TeacherDashboard />
                  </RequireRole>
                }
              />
              <Route
                path="/student"
                element={
                  <RequireRole role="STUDENT" redirectTo="/dashboard">
                    <StudentDashboard />
                  </RequireRole>
                }
              />
              <Route
                path="/problems/new"
                element={
                  <RequireRole role="TEACHER" redirectTo="/student">
                    <ProblemForm mode="create" />
                  </RequireRole>
                }
              />
              <Route
                path="/problems/:id"
                element={
                  <RequireRole role="TEACHER" redirectTo="/student">
                    <ProblemDetail />
                  </RequireRole>
                }
              />
              <Route
                path="/problems/:id/edit"
                element={
                  <RequireRole role="TEACHER" redirectTo="/student">
                    <ProblemForm mode="edit" />
                  </RequireRole>
                }
              />
              <Route
                path="/students/:id"
                element={
                  <RequireRole role="TEACHER" redirectTo="/student">
                    <StudentDetail />
                  </RequireRole>
                }
              />
              <Route
                path="/student/problems/:id"
                element={
                  <RequireRole role="STUDENT" redirectTo="/dashboard">
                    <StudentSolveProblemRoute />
                  </RequireRole>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
