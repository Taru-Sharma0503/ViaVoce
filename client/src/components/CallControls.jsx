function ControlButton({ active, onClick, children, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-11 w-11 items-center justify-center rounded-full border text-lg transition-colors ${
        danger
          ? 'border-transparent bg-voice-500 text-white hover:bg-voice-600'
          : active
          ? 'border-ink-600 bg-ink-800 text-ink-100 hover:border-pulse-500'
          : 'border-ink-600 bg-ink-900 text-ink-500 hover:border-ink-400'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Bottom call control bar: mic/camera toggles, the speech-in/sign-in
 * mode switch (which AI pipeline is actively capturing), and end call.
 */
export default function CallControls({
  micOn,
  cameraOn,
  onToggleMic,
  onToggleCamera,
  mode,
  onModeChange,
  onEndCall,
}) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl bg-ink-900 px-4 py-3 ring-1 ring-ink-700">
      <ControlButton active={micOn} onClick={onToggleMic}>
        {micOn ? '🎙️' : '🔇'}
      </ControlButton>
      <ControlButton active={cameraOn} onClick={onToggleCamera}>
        {cameraOn ? '📷' : '🚫'}
      </ControlButton>

      <div className="mx-2 flex items-center gap-1 rounded-full bg-ink-800 p-1 font-mono text-xs">
        <button
          type="button"
          onClick={() => onModeChange('speech-in')}
          className={`rounded-full px-3 py-1.5 transition-colors ${
            mode === 'speech-in' ? 'bg-pulse-500/20 text-pulse-400' : 'text-ink-400'
          }`}
        >
          Speech in
        </button>
        <button
          type="button"
          onClick={() => onModeChange('sign-in')}
          className={`rounded-full px-3 py-1.5 transition-colors ${
            mode === 'sign-in' ? 'bg-pulse-500/20 text-pulse-400' : 'text-ink-400'
          }`}
        >
          Sign in
        </button>
      </div>

      <ControlButton danger onClick={onEndCall}>
        ✕
      </ControlButton>
    </div>
  );
}
