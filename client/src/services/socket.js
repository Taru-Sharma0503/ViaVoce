import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Creates a Socket.IO connection to one of the server's namespaces
 * (/signaling, /captions, /translation), authenticated with the
 * current user's JWT. Each namespace gets its own socket instance -
 * matches the server's per-namespace auth middleware and event
 * contracts from Phase 2.
 *
 * autoConnect is disabled so callers control exactly when the
 * connection opens/closes (typically on CallRoomPage mount/unmount).
 */
export function createNamespaceSocket(namespace, token) {
  return io(`${SOCKET_URL}${namespace}`, {
    autoConnect: false,
    transports: ['websocket'],
    auth: { token },
  });
}
