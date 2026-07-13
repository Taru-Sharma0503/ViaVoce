import User from '../models/User.js';

export async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({ user: user.toJSON() });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
}

export async function updatePreferences(req, res) {
  try {
    // Only allow a user to update their own preferences.
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Cannot update another user\'s preferences' });
    }

    const { preferredLanguage, preferredSignSet, role } = req.body;
    const updates = {};
    if (preferredLanguage) updates.preferredLanguage = preferredLanguage;
    if (preferredSignSet) updates.preferredSignSet = preferredSignSet;
    if (role && ['hearing', 'deaf', 'both'].includes(role)) updates.role = role;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    return res.status(200).json({ user: user.toJSON() });
  } catch (err) {
    console.error('[users] updatePreferences error:', err.message);
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
}
