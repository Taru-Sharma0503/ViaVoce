import Call from '../models/Call.js';
import TranslationHistory from '../models/TranslationHistory.js';
import { processAudio } from '../services/aiService.client.js';

// Handles the hearing -> deaf flow: client streams audio chunks, this
// forwards each chunk to the AI service for transcription, then
// broadcasts the resulting caption to everyone in the room and logs it.
export function registerCaptionHandlers(nsp, socket) {
  socket.on('audio:chunk', async ({ roomId, chunk }) => {
    if (!roomId || !chunk) return;

    nsp.to(roomId).emit('caption:status', { state: 'processing' });

    const result = await processAudio(chunk, roomId);

    if (!result || !result.text) {
      nsp.to(roomId).emit('caption:status', { state: 'idle' });
      return;
    }

    const payload = {
      text: result.text,
      speakerId: socket.user.id,
      timestamp: new Date().toISOString(),
    };

    nsp.to(roomId).emit('caption:new', payload);
    nsp.to(roomId).emit('caption:status', { state: 'idle' });

    // Fire-and-forget persistence - captions shouldn't block on a DB
    // write, and a failed write here shouldn't break the live demo.
    persistCaption(roomId, socket.user.id, result.text).catch((err) =>
      console.error('[captions] failed to persist caption:', err.message)
    );
  });
}

async function persistCaption(roomId, userId, text) {
  const call = await Call.findOne({ roomId });
  if (!call) return;

  await TranslationHistory.create({
    callId: call._id,
    userId,
    direction: 'speech-to-text',
    outputText: text,
    timestamp: new Date(),
  });
}
