import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import api from '../services/api.js';
import { useCallSockets } from '../hooks/useCallSockets.js';
import { useWebRTC } from '../hooks/useWebRTC.js';
import { useFrameCapture } from '../hooks/useFrameCapture.js';
import { useSpeechCapture } from '../hooks/useSpeechCapture.js';

import VideoStage from '../components/VideoStage.jsx';
import CaptionOverlay from '../components/CaptionOverlay.jsx';
import TranslationPanel from '../components/TranslationPanel.jsx';
import AIStatusIndicator from '../components/AIStatusIndicator.jsx';
import TTSControls from '../components/TTSControls.jsx';
import CallControls from '../components/CallControls.jsx';

export default function CallRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const { signalingSocket, captionsSocket, translationSocket } = useCallSockets();
  const { localStream, remoteStreams, mediaError, toggleTrack } = useWebRTC(signalingSocket, roomId);

  const [mode, setMode] = useState('speech-in'); // 'speech-in' | 'sign-in'
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const [captions, setCaptions] = useState([]);
  const [translations, setTranslations] = useState([]);
  const [captionStatus, setCaptionStatus] = useState('idle');
  const [translationStatus, setTranslationStatus] = useState('idle');

  const [muted, setMuted] = useState(false);
  const [voice, setVoice] = useState('warm');
  const [lastAudioUrl, setLastAudioUrl] = useState(null);

  const hiddenVideoRef = useRef(null); // off-screen <video> feeding frame capture, decoupled from the visible VideoStage tile
  const audioPlayerRef = useRef(null);

  // Mirror the local stream into the hidden video element used purely
  // for frame capture, so sign-recognition doesn't depend on VideoStage's
  // internal DOM structure.
  useEffect(() => {
    if (hiddenVideoRef.current) hiddenVideoRef.current.srcObject = localStream || null;
  }, [localStream]);

  // --- Captions socket (speech-to-text) ---
  useEffect(() => {
    if (!captionsSocket) return undefined;

    captionsSocket.connect();
    captionsSocket.emit('join-room', { roomId });

    captionsSocket.on('caption:new', (payload) => {
      setCaptions((prev) => [...prev, payload]);
    });
    captionsSocket.on('caption:status', ({ state }) => setCaptionStatus(state));

    return () => {
      captionsSocket.off('caption:new');
      captionsSocket.off('caption:status');
      captionsSocket.disconnect();
    };
  }, [captionsSocket, roomId]);

  // --- Translation socket (sign-to-speech) ---
  useEffect(() => {
    if (!translationSocket) return undefined;

    translationSocket.connect();
    translationSocket.emit('join-room', { roomId });

    translationSocket.on('translation:new', (payload) => {
      setTranslations((prev) => [...prev, payload]);
      if (payload.audioUrl) {
        setLastAudioUrl(payload.audioUrl);
        if (!muted) playAudio(payload.audioUrl);
      }
    });
    translationSocket.on('translation:status', ({ state }) => setTranslationStatus(state));

    return () => {
      translationSocket.off('translation:new');
      translationSocket.off('translation:status');
      translationSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translationSocket, roomId, muted]);

  const emitFrame = useCallback(
    (frameData) => {
      translationSocket?.emit('frame:capture', { roomId, frameData });
    },
    [translationSocket, roomId]
  );

  const emitAudioChunk = useCallback(
    (chunk) => {
      captionsSocket?.emit('audio:chunk', { roomId, chunk });
    },
    [captionsSocket, roomId]
  );

  useFrameCapture(hiddenVideoRef, emitFrame, mode === 'sign-in');
  useSpeechCapture(localStream, emitAudioChunk, mode === 'speech-in');

  function playAudio(url) {
    if (!audioPlayerRef.current) return;
    audioPlayerRef.current.src = url;
    audioPlayerRef.current.play().catch(() => {
      /* autoplay may be blocked until the user interacts with the page - non-fatal */
    });
  }

  function handleToggleMic() {
    const next = !micOn;
    setMicOn(next);
    toggleTrack('audio', next);
  }

  function handleToggleCamera() {
    const next = !cameraOn;
    setCameraOn(next);
    toggleTrack('video', next);
  }

  async function handleEndCall() {
    try {
      await api.post(`/calls/${roomId}/end`);
    } catch {
      // Non-fatal - navigate away regardless so the user isn't stuck.
    }
    navigate('/dashboard');
  }

  // A single indicator prioritizes whichever pipeline is actively working;
  // falls back to a mode-appropriate "listening" hint when idle.
  const aiState =
    translationStatus !== 'idle'
      ? translationStatus
      : captionStatus !== 'idle'
      ? captionStatus
      : mode === 'sign-in'
      ? 'detecting'
      : 'idle';

  return (
    <div className="flex min-h-screen flex-col bg-ink-950 p-4 text-ink-100 md:p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg font-semibold">Room {roomId}</h1>
          {mediaError && <p className="text-xs text-voice-400">Camera/mic error: {mediaError}</p>}
        </div>
        <AIStatusIndicator state={aiState} />
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <VideoStage localStream={localStream} remoteStreams={remoteStreams} />
        </div>
        <div className="grid grid-rows-2 gap-4">
          <CaptionOverlay captions={captions} />
          <TranslationPanel translations={translations} onPlay={playAudio} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
        <TTSControls
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
          voice={voice}
          onVoiceChange={setVoice}
          onReplay={() => lastAudioUrl && playAudio(lastAudioUrl)}
          hasAudio={Boolean(lastAudioUrl)}
        />
        <CallControls
          micOn={micOn}
          cameraOn={cameraOn}
          onToggleMic={handleToggleMic}
          onToggleCamera={handleToggleCamera}
          mode={mode}
          onModeChange={setMode}
          onEndCall={handleEndCall}
        />
      </div>

      {/* Hidden off-screen elements: video feeds frame capture, audio plays TTS output */}
      <video ref={hiddenVideoRef} autoPlay playsInline muted className="hidden" />
      <audio ref={audioPlayerRef} className="hidden" />
    </div>
  );
}
