import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import LandingPage from './pages/LandingPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CallRoomPage from './pages/CallRoomPage.jsx';

// AuthProvider wraps the whole app so any page can read auth state.
// Dashboard and the call room require a logged-in user; landing and
// auth pages are public.
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/call/:roomId"
          element={
            <ProtectedRoute>
              <CallRoomPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
