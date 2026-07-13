import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between px-6 py-5 md:px-12">
      <Link to="/" className="font-display text-lg font-semibold tracking-tight text-ink-100">
        Via<span className="text-pulse-400">Voce</span>
      </Link>
      <div className="flex items-center gap-4 font-mono text-sm">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="text-ink-300 hover:text-ink-100">
              Dashboard
            </Link>
            <span className="text-ink-500">{user?.name}</span>
            <button onClick={logout} className="text-ink-400 hover:text-voice-400">
              Log out
            </button>
          </>
        ) : (
          <Link
            to="/auth"
            className="rounded-full bg-voice-500 px-4 py-2 text-white transition-colors hover:bg-voice-600"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
