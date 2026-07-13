const VOICES = [
  { id: 'warm', label: 'Warm' },
  { id: 'clear', label: 'Clear' },
  { id: 'calm', label: 'Calm' },
];

/**
 * Controls for the text-to-speech output of the sign-to-speech
 * pipeline. Voice selection is a preference only - it's threaded
 * through to the AI service's /synthesize-speech call in Phase 4;
 * for now it's stored here so the UI contract is stable ahead of
 * that integration.
 */
export default function TTSControls({ muted, onToggleMute, voice, onVoiceChange, onReplay, hasAudio }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-ink-900 px-4 py-3 ring-1 ring-ink-700">
      <span className="font-display text-sm font-semibold text-ink-100">Voice output</span>

      <button
        type="button"
        onClick={onToggleMute}
        className={`rounded-md border px-2.5 py-1 font-mono text-xs transition-colors ${
          muted
            ? 'border-ink-600 text-ink-400 hover:border-ink-400'
            : 'border-pulse-500/40 bg-pulse-500/10 text-pulse-400'
        }`}
      >
        {muted ? 'Unmute' : 'Mute'}
      </button>

      <button
        type="button"
        onClick={onReplay}
        disabled={!hasAudio}
        className="rounded-md border border-ink-600 px-2.5 py-1 font-mono text-xs text-ink-200 hover:border-pulse-500 hover:text-pulse-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ↺ Replay last
      </button>

      <select
        value={voice}
        onChange={(e) => onVoiceChange(e.target.value)}
        className="ml-auto rounded-md border border-ink-600 bg-ink-800 px-2 py-1 font-mono text-xs text-ink-200 focus:border-pulse-500 focus:outline-none"
      >
        {VOICES.map((v) => (
          <option key={v.id} value={v.id}>
            {v.label}
          </option>
        ))}
      </select>
    </div>
  );
}
