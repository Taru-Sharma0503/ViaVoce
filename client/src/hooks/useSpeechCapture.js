import { useEffect, useRef } from 'react';

const CHUNK_INTERVAL_MS = 3000; // ~3s chunks, balances caption latency vs. request volume

/**
 * Records audio from the given MediaStream in fixed-length chunks and
 * hands each one (as base64) to onChunk. Used to feed the /captions
 * namespace's `audio:chunk` event for Whisper transcription.
 *
 * @param {MediaStream | null} stream - typically the local call stream
 * @param {(base64Audio: string) => void} onChunk
 * @param {boolean} active - only records while true (e.g. "speech-in" mode enabled)
 */
export function useSpeechCapture(stream, onChunk, active) {
  const recorderRef = useRef(null);

  useEffect(() => {
    if (!active || !stream) return undefined;

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return undefined;

    const audioOnlyStream = new MediaStream(audioTracks);
    const mimeType = MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/ogg';

    let recorder;
    try {
      recorder = new MediaRecorder(audioOnlyStream, { mimeType });
    } catch (err) {
      console.error('[useSpeechCapture] MediaRecorder init failed:', err.message);
      return undefined;
    }

    recorder.ondataavailable = async (event) => {
      if (event.data.size === 0) return;
      const base64 = await blobToBase64(event.data);
      onChunk(base64);
    };

    recorder.start(CHUNK_INTERVAL_MS);
    recorderRef.current = recorder;

    return () => {
      if (recorder.state !== 'inactive') recorder.stop();
    };
  }, [stream, onChunk, active]);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result); // data URL, includes mime prefix
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
