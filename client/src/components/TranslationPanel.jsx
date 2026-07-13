import { useEffect, useRef } from 'react';

/**
 * Shows the output of the sign-to-speech pipeline: the recognized
 * gloss sequence (e.g. "HELP WATER") alongside the natural sentence
 * Gemini generated from it. Each entry can trigger TTS playback via
 * onPlay, wired up from TTSControls/CallRoomPage.
 */
export default function TranslationPanel({ translations, onPlay }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [translations]);

  return (
    <div className="flex h-full flex-col rounded-2xl bg-ink-900 ring-1 ring-ink-700">
      <div className="border-b border-ink-700 px-4 py-2">
        <h3 className="font-display text-sm font-semibold text-ink-100">Sign translation</h3>
        <p className="font-mono text-[11px] text-ink-400">Recognized signs, composed into sentences</p>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {translations.length === 0 ? (
          <p className="text-sm text-ink-400">
            Recognized signs and generated sentences will appear here.
          </p>
        ) : (
          translations.map((t, i) => (
            <div key={i} className="rounded-lg bg-ink-800 p-3">
              {t.glossSequence?.length > 0 && (
                <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-pulse-400">
                  {t.glossSequence.join(' · ')}
                </p>
              )}
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm leading-relaxed text-ink-100">{t.text}</p>
                {t.audioUrl && (
                  <button
                    type="button"
                    onClick={() => onPlay(t.audioUrl)}
                    className="shrink-0 rounded-md border border-ink-600 px-2 py-1 font-mono text-[11px] text-ink-200 hover:border-pulse-500 hover:text-pulse-400"
                  >
                    ▶ Play
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
