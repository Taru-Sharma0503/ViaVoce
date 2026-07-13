import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/User.js';

// Protects any route by requiring `Authorization: Bearer <token>`.
// On success, attaches the authenticated user's Mongo document to
// req.user (minus passwordHash, per the User model's toJSON transform
// - though here we fetch the raw doc since downstream code may need
// fields like role for authorization checks).
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ error: 'User for this token no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
