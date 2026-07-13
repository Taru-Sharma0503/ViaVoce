import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [joinCode, setJoinCode] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const { data } = await api.get('/calls/history');
        if (!cancelled) setHistory(data.calls);
      } catch {
        if (!cancelled) setError('Could not load call history.');
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateCall() {
    setError('');
    setCreating(true);
    try {
      const { data } = await api.post('/calls');
      navigate(`/call/${data.call.roomId}`);
    } catch {
      setError('Could not create a call right now.');
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinCall(e) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setError('');
    setJoining(true);
    try {
      await api.post(`/calls/${joinCode.trim()}/join`);
      navigate(`/call/${joinCode.trim()}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not join that call.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 text-ink-100">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 pb-24">
        <h1 className="font-display text-2xl font-semibold">Hi {user?.name?.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-ink-400">Start a new call, or join one you've been sent.</p>

        {error && <p className="mt-4 text-sm text-voice-400">{error}</p>}

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-ink-900 p-6 ring-1 ring-ink-700">
            <h2 className="font-display text-base font-semibold">New call</h2>
            <p className="mt-1 text-sm text-ink-400">Creates a room and takes you straight in.</p>
            <button
              onClick={handleCreateCall}
              disabled={creating}
              className="mt-4 w-full rounded-lg bg-voice-500 py-2.5 font-mono text-sm text-white transition-colors hover:bg-voice-600 disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Start a call'}
            </button>
          </div>

          <div className="rounded-2xl bg-ink-900 p-6 ring-1 ring-ink-700">
            <h2 className="font-display text-base font-semibold">Join a call</h2>
            <p className="mt-1 text-sm text-ink-400">Enter the room code someone shared with you.</p>
            <form onSubmit={handleJoinCall} className="mt-4 flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="e.g. a1b2c3d4"
                className="flex-1 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 font-mono text-sm text-ink-100 focus:border-pulse-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={joining}
                className="rounded-lg border border-ink-600 px-4 py-2 font-mono text-sm text-ink-100 hover:border-pulse-500 disabled:opacity-50"
              >
                {joining ? '…' : 'Join'}
              </button>
            </form>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="font-display text-base font-semibold">Recent calls</h2>
          {loadingHistory ? (
            <p className="mt-3 text-sm text-ink-400">Loading…</p>
          ) : history.length === 0 ? (
            <p className="mt-3 text-sm text-ink-400">No calls yet — start one above.</p>
          ) : (
            <ul className="mt-3 divide-y divide-ink-800 rounded-2xl bg-ink-900 ring-1 ring-ink-700">
              {history.map((call) => (
                <li key={call.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-mono text-sm text-ink-100">{call.roomId}</p>
                    <p className="text-xs text-ink-400">
                      {new Date(call.startedAt).toLocaleString()} ·{' '}
                      <span className={call.status === 'active' ? 'text-pulse-400' : 'text-ink-500'}>
                        {call.status}
                      </span>
                    </p>
                  </div>
                  {call.status === 'active' && (
                    <button
                      onClick={() => navigate(`/call/${call.roomId}`)}
                      className="rounded-md border border-ink-600 px-3 py-1 font-mono text-xs text-ink-200 hover:border-pulse-500"
                    >
                      Rejoin
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
