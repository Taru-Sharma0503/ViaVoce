import { useMemo } from 'react';
import { createNamespaceSocket } from '../services/socket.js';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Creates the three namespace sockets (/signaling, /captions,
 * /translation) needed for a call room, authenticated with the
 * current user's JWT. Instances are memoized per token so they're
 * stable across re-renders within the same CallRoomPage mount -
 * individual hooks/components are responsible for connecting and
 * disconnecting the ones they use.
 */
export function useCallSockets() {
  const { token } = useAuth();

  const sockets = useMemo(() => {
    if (!token) return { signalingSocket: null, captionsSocket: null, translationSocket: null };
    return {
      signalingSocket: createNamespaceSocket('/signaling', token),
      captionsSocket: createNamespaceSocket('/captions', token),
      translationSocket: createNamespaceSocket('/translation', token),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return sockets;
}
