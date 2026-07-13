import { useEffect, useRef } from 'react';

/**
 * Renders the scrolling live-caption feed. Receives already-collected
 * caption entries (see CallRoomPage, which listens for `caption:new`
 * and appends to state) rather than talking to the socket directly -
 * keeps this component presentational and easy to reuse/test.
 */
export default function CaptionOverlay({ captions }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [captions]);

  return (
    <div className="flex h-full flex-col rounded-2xl bg-ink-900 ring-1 ring-ink-700">
      <div className="border-b border-ink-700 px-4 py-2">
        <h3 className="font-display text-sm font-semibold text-ink-100">Live captions</h3>
        <p className="font-mono text-[11px] text-ink-400">Speech, transcribed in real time</p>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {captions.length === 0 ? (
          <p className="text-sm text-ink-400">Captions will appear here once someone speaks.</p>
        ) : (
          captions.map((c, i) => (
            <p key={i} className="text-sm leading-relaxed text-ink-100">
              <span className="mr-2 font-mono text-[11px] text-ink-400">
                {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {c.text}
            </p>
          ))
        )}
      </div>
    </div>
  );
}
