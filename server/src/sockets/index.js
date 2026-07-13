import { socketAuthMiddleware } from './socketAuth.js';
import { registerSignalingHandlers } from './signaling.handlers.js';
import { registerCaptionHandlers } from './captions.handlers.js';
import { registerTranslationHandlers } from './translation.handlers.js';

// Sets up the three namespaces defined in the architecture blueprint:
//   /signaling    - WebRTC offer/answer/ICE relay + room join/leave
//   /captions     - speech-to-text streaming (hearing -> deaf)
//   /translation  - sign-to-speech streaming (deaf -> hearing)
//
// Every namespace requires a valid JWT on connection (socketAuthMiddleware)
// - unauthenticated sockets are rejected before any handler runs.
export function registerSocketHandlers(io) {
  const signalingNsp = io.of('/signaling');
  const captionsNsp = io.of('/captions');
  const translationNsp = io.of('/translation');

  for (const nsp of [signalingNsp, captionsNsp, translationNsp]) {
    nsp.use(socketAuthMiddleware);
  }

  signalingNsp.on('connection', (socket) => {
    console.log(`[signaling] connected: ${socket.id} (user ${socket.user.id})`);
    registerSignalingHandlers(signalingNsp, socket);
  });

  captionsNsp.on('connection', (socket) => {
    console.log(`[captions] connected: ${socket.id} (user ${socket.user.id})`);
    socket.on('join-room', ({ roomId }) => roomId && socket.join(roomId));
    registerCaptionHandlers(captionsNsp, socket);
  });

  translationNsp.on('connection', (socket) => {
    console.log(`[translation] connected: ${socket.id} (user ${socket.user.id})`);
    socket.on('join-room', ({ roomId }) => roomId && socket.join(roomId));
    registerTranslationHandlers(translationNsp, socket);
  });
}
