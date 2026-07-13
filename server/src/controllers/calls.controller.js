import Call from '../models/Call.js';
import { generateRoomId } from '../utils/roomId.js';

export async function createCall(req, res) {
  try {
    let roomId = generateRoomId();

    // Extremely unlikely, but guard against a collision anyway.
    // eslint-disable-next-line no-await-in-loop
    while (await Call.findOne({ roomId })) {
      roomId = generateRoomId();
    }

    const call = await Call.create({
      roomId,
      createdBy: req.user._id,
      participants: [
        {
          userId: req.user._id,
          role: req.user.role,
          joinedAt: new Date(),
        },
      ],
      status: 'active',
    });

    return res.status(201).json({ call: call.toJSON() });
  } catch (err) {
    console.error('[calls] createCall error:', err.message);
    return res.status(500).json({ error: 'Failed to create call' });
  }
}

export async function joinCall(req, res) {
  try {
    const { roomId } = req.params;
    const call = await Call.findOne({ roomId });

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }
    if (call.status === 'ended') {
      return res.status(410).json({ error: 'This call has already ended' });
    }

    const alreadyJoined = call.participants.some(
      (p) => p.userId.toString() === req.user._id.toString() && !p.leftAt
    );

    if (!alreadyJoined) {
      call.participants.push({
        userId: req.user._id,
        role: req.user.role,
        joinedAt: new Date(),
      });
      await call.save();
    }

    return res.status(200).json({ call: call.toJSON() });
  } catch (err) {
    console.error('[calls] joinCall error:', err.message);
    return res.status(500).json({ error: 'Failed to join call' });
  }
}

export async function endCall(req, res) {
  try {
    const { roomId } = req.params;
    const call = await Call.findOne({ roomId });

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    call.status = 'ended';
    call.endedAt = new Date();
    call.participants.forEach((p) => {
      if (!p.leftAt) p.leftAt = new Date();
    });

    await call.save();
    return res.status(200).json({ call: call.toJSON() });
  } catch (err) {
    console.error('[calls] endCall error:', err.message);
    return res.status(500).json({ error: 'Failed to end call' });
  }
}

export async function getCall(req, res) {
  try {
    const call = await Call.findOne({ roomId: req.params.roomId });
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }
    return res.status(200).json({ call: call.toJSON() });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch call' });
  }
}

export async function getCallHistory(req, res) {
  try {
    const calls = await Call.find({ 'participants.userId': req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.status(200).json({ calls: calls.map((c) => c.toJSON()) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch call history' });
  }
}

