import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';

const BARS = [6, 14, 9, 18, 8, 15, 6, 11]; // static waveform silhouette for the hero motif

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-ink-950 text-ink-100">
      <Navbar />

      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-24 pt-12 text-center md:pt-20">
        <span className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-pulse-400">
          AI communication assistant
        </span>

        <h1 className="font-display text-4xl font-semibold leading-tight md:text-6xl">
          A conversation shouldn't need
          <br />
          <span className="text-pulse-400">both people to hear it.</span>
        </h1>

        <p className="mt-6 max-w-xl text-balance text-base text-ink-300 md:text-lg">
          ViaVoce sits inside your video call and bridges the gap in real time — speech becomes
          captions, signs become spoken sentences, so the conversation flows both ways.
        </p>

        {/* Signature element: a waveform that resolves into a raised-hand
            silhouette - the visual thesis of the product in one shape. */}
        <div className="my-12 flex items-end gap-1.5" aria-hidden="true">
          {BARS.map((h, i) => (
            <span
              key={i}
              className="w-2 rounded-full bg-pulse-500/70"
              style={{ height: `${h * 3}px` }}
            />
          ))}
          <span className="ml-3 text-4xl">🤟</span>
        </div>

        <Link
          to={isAuthenticated ? '/dashboard' : '/auth'}
          className="rounded-full bg-voice-500 px-8 py-3 font-mono text-sm text-white transition-colors hover:bg-voice-600"
        >
          {isAuthenticated ? 'Go to dashboard' : 'Start a call'}
        </Link>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 pb-24 md:grid-cols-2">
        <div className="rounded-2xl bg-ink-900 p-6 ring-1 ring-ink-700">
          <p className="font-mono text-xs text-pulse-400">Hearing → Deaf</p>
          <h3 className="mt-2 font-display text-lg font-semibold">Speech becomes captions</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-300">
            Whisper transcribes speech live, streaming captions into the call as words are spoken —
            no delay waiting for a full sentence.
          </p>
        </div>
        <div className="rounded-2xl bg-ink-900 p-6 ring-1 ring-ink-700">
          <p className="font-mono text-xs text-pulse-400">Deaf → Hearing</p>
          <h3 className="mt-2 font-display text-lg font-semibold">Signs become spoken sentences</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-300">
            Camera frames are read by a sign-recognition pipeline; recognized signs are composed
            into natural sentences and spoken aloud.
          </p>
        </div>
      </section>
    </div>
  );
}
