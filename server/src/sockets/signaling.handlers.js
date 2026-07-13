// Handles room join/leave and relays WebRTC offer/answer/ICE candidates
// between the two peers in a call. This namespace never touches media
// itself - it only relays the signaling messages needed for the
// browsers to establish a direct P2P connection.
export function registerSignalingHandlers(nsp, socket) {
  socket.on('join-room', ({ roomId }) => {
    if (!roomId) return;

    socket.join(roomId);
    socket.data.roomId = roomId;

    // Tell existing room members someone new joined; tell the joiner
    // who's already there so it can decide whether to initiate the offer.
    socket.to(roomId).emit('user:joined', { userId: socket.user.id, name: socket.user.name });

    const room = nsp.adapter.rooms.get(roomId) || new Set();
    const otherSocketIds = [...room].filter((id) => id !== socket.id);
    socket.emit('room:peers', { peers: otherSocketIds });
  });

  socket.on('webrtc:offer', ({ to, sdp }) => {
    if (!to || !sdp) return;
    nsp.to(to).emit('webrtc:offer', { from: socket.id, sdp });
  });

  socket.on('webrtc:answer', ({ to, sdp }) => {
    if (!to || !sdp) return;
    nsp.to(to).emit('webrtc:answer', { from: socket.id, sdp });
  });

  socket.on('webrtc:ice-candidate', ({ to, candidate }) => {
    if (!to || !candidate) return;
    nsp.to(to).emit('webrtc:ice-candidate', { from: socket.id, candidate });
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (roomId) {
      socket.to(roomId).emit('user:left', { userId: socket.user.id });
    }
  });
}
