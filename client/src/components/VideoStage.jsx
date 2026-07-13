import { useEffect, useRef } from 'react';

function VideoTile({ stream, label, muted = false, mirrored = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream || null;
  }, [stream]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-ink-900 ring-1 ring-ink-700">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`h-full w-full object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <p className="font-mono text-xs text-ink-400">Waiting for video…</p>
        </div>
      )}
      <span className="absolute bottom-3 left-3 rounded-md bg-ink-950/70 px-2 py-1 font-mono text-xs text-ink-200">
        {label}
      </span>
    </div>
  );
}

/**
 * Lays out the local video tile and up to one remote tile. The
 * hackathon MVP call room is 1:1, so remoteStreams is expected to
 * have at most one entry, but this renders any number gracefully.
 */
export default function VideoStage({ localStream, remoteStreams, localLabel = 'You' }) {
  const remoteEntries = Object.entries(remoteStreams || {});

  return (
    <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2">
      {remoteEntries.length === 0 ? (
        <VideoTile stream={null} label="Waiting for the other participant…" />
      ) : (
        remoteEntries.map(([peerId, stream]) => (
          <VideoTile key={peerId} stream={stream} label="Participant" />
        ))
      )}
      <VideoTile stream={localStream} label={localLabel} muted mirrored />
    </div>
  );
}
