import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signAccessToken } from '../utils/jwt.js';

const SALT_ROUNDS = 10;

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role && ['hearing', 'deaf', 'both'].includes(role) ? role : 'both',
    });

    const token = signAccessToken(user._id.toString());
    return res.status(201).json({ token, user: user.toJSON() });
  } catch (err) {
    console.error('[auth] register error:', err.message);
    return res.status(500).json({ error: 'Failed to register user' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    // passwordHash has select: false on the schema, so it must be
    // explicitly requested here to compare against.
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signAccessToken(user._id.toString());
    return res.status(200).json({ token, user: user.toJSON() });
  } catch (err) {
    console.error('[auth] login error:', err.message);
    return res.status(500).json({ error: 'Failed to log in' });
  }
}

// Reissues a fresh token for an already-authenticated request (req.user
// is set by requireAuth). Simple sliding-expiry refresh - sufficient
// for hackathon scope; a real refresh-token rotation flow is a
// production hardening item, not an MVP requirement.
export async function refresh(req, res) {
  const token = signAccessToken(req.user._id.toString());
  return res.status(200).json({ token, user: req.user.toJSON() });
}

export async function me(req, res) {
  return res.status(200).json({ user: req.user.toJSON() });
}
