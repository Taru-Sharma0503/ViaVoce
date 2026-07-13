import crypto from 'crypto';

// Short, URL-friendly room code (e.g. "a1b2c3d4") - good enough entropy
// for a hackathon demo where rooms are short-lived and shared via a
// direct link, not something requiring cryptographic unguessability.
export function generateRoomId() {
  return crypto.randomBytes(4).toString('hex');
}
