import { useEffect, useRef } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { useAuthStore } from './store/useAuthStore';

import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import ProjectsPage from './pages/ProjectsPage';
import WorkspacePage from './pages/WorkspacePage';
import ProfilePage from './pages/ProfilePage';
import OAuthCallback from './pages/OAuthCallback';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Recover session from refresh token cookie on cold boot (no token in storage)
const SessionHydrator = ({ children }: { children: React.ReactNode }) => {
  const { setAuth, logout, accessToken } = useAuthStore();
  const hasAttempted = useRef(false);

  useEffect(() => {
    // Only fire when there is genuinely NO access token (cold boot / after explicit logout).
    // If we have a token, user data is already persisted — no refresh needed.
    if (accessToken || hasAttempted.current) return;
    hasAttempted.current = true;

    // Attempt silent refresh using httpOnly cookie
    fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/auth/refresh`,
      { method: 'POST', credentials: 'include' }
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (data?.accessToken) {
          setAuth(data.accessToken, data.user);
        }
      })
      .catch(() => {
        // No valid refresh cookie — ensure store is clean so guards redirect to /auth
        logout();
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  return <>{children}</>;
};

// Guard — redirects unauthenticated users to /auth
const ProtectedRoute = () => {
  const { accessToken } = useAuthStore();
  return accessToken ? <Outlet /> : <Navigate to="/auth" replace />;
};

// Guard — redirects authenticated users away from /auth
const PublicRoute = () => {
  const { accessToken } = useAuthStore();
  return !accessToken ? <Outlet /> : <Navigate to="/projects" replace />;
};

function AppRoutes() {
  return (
    <SessionHydrator>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/projects" replace />} />

        {/* Auth — only accessible when not logged in */}
        <Route element={<PublicRoute />}>
          <Route path="/auth" element={<AuthPage />} />
        </Route>

        {/* OAuth callback — must always be accessible regardless of auth state */}
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/workspace/:projectId" element={<WorkspacePage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SessionHydrator>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ClerkProvider>
  );
}
