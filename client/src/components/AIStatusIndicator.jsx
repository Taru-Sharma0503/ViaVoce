const STATE_LABELS = {
  idle: 'Idle',
  listening: 'Listening',
  processing: 'Processing speech',
  detecting: 'Watching for signs',
  generating: 'Composing sentence',
};

/**
 * Small pill showing what the AI pipeline is doing right now. This is
 * the app's signature visual element - a tiny waveform that animates
 * when the pipeline is actively working, standing in for "the bridge
 * between speech and sign" in miniature.
 */
export default function AIStatusIndicator({ state = 'idle' }) {
  const active = state !== 'idle';
  const label = STATE_LABELS[state] || 'Idle';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs transition-colors ${
        active
          ? 'border-pulse-500/40 bg-pulse-500/10 text-pulse-400'
          : 'border-ink-700 bg-ink-900 text-ink-400'
      }`}
    >
      <span className="flex items-end gap-[2px]" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`w-[3px] rounded-full ${active ? 'bg-pulse-400' : 'bg-ink-600'}`}
            style={{
              height: active ? undefined : '4px',
              animation: active ? `via-bar 0.9s ease-in-out ${i * 0.12}s infinite` : 'none',
            }}
          />
        ))}
      </span>
      {label}
      <style>{`
        @keyframes via-bar {
          0%, 100% { height: 4px; }
          50% { height: 14px; }
        }
      `}</style>
    </div>
  );
}
