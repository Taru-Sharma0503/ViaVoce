import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/User.js';

// Socket.IO middleware, applied per-namespace. Client must connect with
// `auth: { token: '<jwt>' }` (socket.io-client supports this natively).
// On success, attaches `socket.user` (plain object, not the full Mongo
// doc) so handlers can read id/role without another DB round trip.
export async function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = { id: user._id.toString(), name: user.name, role: user.role };
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
}
