import Call from '../models/Call.js';
import TranslationHistory from '../models/TranslationHistory.js';
import {
  processFrame,
  generateSentence,
  synthesizeSpeech,
} from '../services/aiService.client.js';

const GLOSS_BUFFER_MAX = 5; // sliding window of recognized signs, per architecture blueprint
const SENTENCE_DEBOUNCE_MS = 1500; // wait for a pause in signing before generating a sentence
const MIN_CONFIDENCE = 0.6;

// Handles the deaf -> hearing flow: client streams throttled camera
// frames, each is sent to the AI service for landmark extraction +
// sign classification. Recognized signs are buffered into a sliding
// window; once signing pauses (debounce), the buffered gloss sequence
// is sent to Gemini for sentence generation, then to TTS.
export function registerTranslationHandlers(nsp, socket) {
  socket.data.glossBuffer = [];
  socket.data.sentenceTimer = null;

  socket.on('frame:capture', async ({ roomId, frameData }) => {
    if (!roomId || !frameData) return;

    nsp.to(roomId).emit('translation:status', { state: 'detecting' });

    const result = await processFrame(frameData, roomId);

    if (!result || !result.label || result.confidence < MIN_CONFIDENCE) {
      return; // no confident sign detected in this frame - stay silent, don't spam the buffer
    }

    const lastGloss = socket.data.glossBuffer[socket.data.glossBuffer.length - 1];
    if (lastGloss !== result.label) {
      socket.data.glossBuffer.push(result.label);
      if (socket.data.glossBuffer.length > GLOSS_BUFFER_MAX) {
        socket.data.glossBuffer.shift();
      }
    }

    // Debounce: restart the "pause" timer on every recognized sign.
    // Sentence generation fires once signing actually stops.
    clearTimeout(socket.data.sentenceTimer);
    socket.data.sentenceTimer = setTimeout(() => {
      flushGlossBuffer(nsp, socket, roomId).catch((err) =>
        console.error('[translation] flush failed:', err.message)
      );
    }, SENTENCE_DEBOUNCE_MS);
  });

  socket.on('disconnect', () => {
    clearTimeout(socket.data.sentenceTimer);
  });
}

async function flushGlossBuffer(nsp, socket, roomId) {
  const glossSequence = [...socket.data.glossBuffer];
  socket.data.glossBuffer = [];

  if (glossSequence.length === 0) return;

  nsp.to(roomId).emit('translation:status', { state: 'generating' });

  const sentenceResult = await generateSentence(glossSequence);
  if (!sentenceResult || !sentenceResult.sentence) {
    nsp.to(roomId).emit('translation:status', { state: 'idle' });
    return;
  }

  const speechResult = await synthesizeSpeech(sentenceResult.sentence);

  const payload = {
    text: sentenceResult.sentence,
    audioUrl: speechResult?.audioUrl || null,
    glossSequence,
    speakerId: socket.user.id,
  };

  nsp.to(roomId).emit('translation:new', payload);
  nsp.to(roomId).emit('translation:status', { state: 'idle' });

  persistTranslation(roomId, socket.user.id, glossSequence, sentenceResult.sentence).catch((err) =>
    console.error('[translation] failed to persist translation:', err.message)
  );
}

async function persistTranslation(roomId, userId, glossSequence, outputText) {
  const call = await Call.findOne({ roomId });
  if (!call) return;

  await TranslationHistory.create({
    callId: call._id,
    userId,
    direction: 'sign-to-speech',
    inputSummary: glossSequence.join(' '),
    outputText,
    timestamp: new Date(),
  });
}
