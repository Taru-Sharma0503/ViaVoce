import { useEffect, useRef } from 'react';

const DEFAULT_INTERVAL_MS = 150; // ~6-7 fps, matches architecture blueprint's throttle target

/**
 * Periodically captures a frame from a <video> element onto an
 * off-screen canvas, encodes it as a base64 JPEG, and hands it to
 * onFrame. Used to feed the /translation namespace's `frame:capture`
 * event for sign recognition.
 *
 * @param {React.RefObject<HTMLVideoElement>} videoRef
 * @param {(frameData: string) => void} onFrame
 * @param {boolean} active - only captures while true (e.g. "sign-in" mode enabled)
 * @param {number} [intervalMs]
 */
export function useFrameCapture(videoRef, onFrame, active, intervalMs = DEFAULT_INTERVAL_MS) {
  const canvasRef = useRef(document.createElement('canvas'));

  useEffect(() => {
    if (!active) return undefined;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const intervalId = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return; // not enough data yet

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Quality 0.6 keeps payloads small enough for frequent socket emits.
      const frameData = canvas.toDataURL('image/jpeg', 0.6);
      onFrame(frameData);
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [videoRef, onFrame, active, intervalMs]);
}
