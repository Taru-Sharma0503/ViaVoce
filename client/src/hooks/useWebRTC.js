import { useEffect, useRef, useState, useCallback } from 'react';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

/**
 * Manages local media capture and WebRTC peer connections for a call
 * room, driven entirely by events on the /signaling socket namespace
 * (see server/src/sockets/signaling.handlers.js for the event contract).
 *
 * Supports multiple remote peers (keyed by their signaling socket id),
 * though the hackathon MVP call room UI only renders one remote tile.
 *
 * @param {import('socket.io-client').Socket | null} signalingSocket
 * @param {string} roomId
 */
export function useWebRTC(signalingSocket, roomId) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { [peerSocketId]: MediaStream }
  const [mediaError, setMediaError] = useState(null);

  const peerConnections = useRef({}); // { [peerSocketId]: RTCPeerConnection }
  const localStreamRef = useRef(null);

  const createPeerConnection = useCallback(
    (peerId) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          signalingSocket.emit('webrtc:ice-candidate', { to: peerId, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStreams((prev) => ({ ...prev, [peerId]: event.streams[0] }));
      };

      pc.onconnectionstatechange = () => {
        if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
          setRemoteStreams((prev) => {
            const next = { ...prev };
            delete next[peerId];
            return next;
          });
        }
      };

      peerConnections.current[peerId] = pc;
      return pc;
    },
    [signalingSocket]
  );

  // Acquire local camera/mic once on mount.
  useEffect(() => {
    let cancelled = false;

    async function getMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err) {
        if (!cancelled) setMediaError(err.message);
      }
    }

    getMedia();
    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Wire signaling events once both the socket and local stream are ready.
  useEffect(() => {
    if (!signalingSocket || !localStream) return;

    signalingSocket.connect();
    signalingSocket.emit('join-room', { roomId });

    // Existing peers already in the room when we join - we initiate the offer to each.
    signalingSocket.on('room:peers', async ({ peers }) => {
      for (const peerId of peers) {
        const pc = createPeerConnection(peerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        signalingSocket.emit('webrtc:offer', { to: peerId, sdp: offer });
      }
    });

    // A new peer joined after us - we wait for their offer, no action needed here.
    signalingSocket.on('user:joined', () => {
      /* no-op: joiner initiates via room:peers on their end */
    });

    signalingSocket.on('user:left', () => {
      // Peer cleanup happens via onconnectionstatechange when their
      // connection actually drops - this event is mainly for UI hooks.
    });

    signalingSocket.on('webrtc:offer', async ({ from, sdp }) => {
      const pc = createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      signalingSocket.emit('webrtc:answer', { to: from, sdp: answer });
    });

    signalingSocket.on('webrtc:answer', async ({ from, sdp }) => {
      const pc = peerConnections.current[from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    signalingSocket.on('webrtc:ice-candidate', async ({ from, candidate }) => {
      const pc = peerConnections.current[from];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[useWebRTC] failed to add ICE candidate:', err.message);
        }
      }
    });

    return () => {
      signalingSocket.off('room:peers');
      signalingSocket.off('user:joined');
      signalingSocket.off('user:left');
      signalingSocket.off('webrtc:offer');
      signalingSocket.off('webrtc:answer');
      signalingSocket.off('webrtc:ice-candidate');
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
      signalingSocket.disconnect();
    };
  }, [signalingSocket, localStream, roomId, createPeerConnection]);

  const toggleTrack = useCallback((kind, enabled) => {
    localStreamRef.current
      ?.getTracks()
      .filter((t) => t.kind === kind)
      .forEach((t) => {
        t.enabled = enabled;
      });
  }, []);

  return { localStream, remoteStreams, mediaError, toggleTrack };
}
