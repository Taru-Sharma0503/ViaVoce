import jwt from 'jsonwebtoken';

// Centralized JWT signing/verification so the secret and expiry are
// only ever read from env in one place.
export function signAccessToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET); // throws if invalid/expired
}
