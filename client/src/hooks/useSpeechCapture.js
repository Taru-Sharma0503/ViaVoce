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

    let stopped = false;
    let intervalId;

    // NOTE: we deliberately do NOT use `recorder.start(CHUNK_INTERVAL_MS)`
    // (MediaRecorder's `timeslice` mode). That emits `dataavailable` every
    // N ms, but those blobs are fragments of ONE continuous WebM/Opus
    // stream - only the very first fragment contains the container header.
    // Since each chunk here is sent independently to a stateless
    // /process-audio endpoint and decoded on its own (see
    // whisper_service.py's io.BytesIO(audio_bytes)), every fragment after
    // the first has no header and fails to decode, so transcribe_audio()
    // silently returns None for it. That's why captions would appear
    // (at best) once and then stop.
    //
    // Instead, we start a brand-new MediaRecorder for every interval and
    // call stop() to flush it. stop() always produces a single, complete,
    // self-contained file (header included), so each chunk decodes fine
    // on its own.
    const recordOneChunk = () => {
      if (stopped) return;

      let recorder;
      try {
        recorder = new MediaRecorder(audioOnlyStream, { mimeType });
      } catch (err) {
        console.error('[useSpeechCapture] MediaRecorder init failed:', err.message);
        return;
      }

      const localChunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) localChunks.push(event.data);
      };

      recorder.onstop = async () => {
        if (localChunks.length === 0) return;
        const blob = new Blob(localChunks, { type: mimeType });
        const base64 = await blobToBase64(blob);
        onChunk(base64);
      };

      recorder.start();
      recorderRef.current = recorder;

      setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      }, CHUNK_INTERVAL_MS);
    };

    recordOneChunk();
    intervalId = setInterval(recordOneChunk, CHUNK_INTERVAL_MS);

    return () => {
      stopped = true;
      clearInterval(intervalId);
      const current = recorderRef.current;
      if (current && current.state !== 'inactive') current.stop();
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
