import axios from 'axios';

// This is the ONLY place server code talks to the AI microservice.
// Socket handlers and controllers import functions from here rather
// than calling axios directly - keeps the AI_SERVICE_URL and error
// handling for that boundary in one auditable spot, and makes it easy
// to swap in retries/circuit-breaking later without touching callers.
const aiClient = axios.create({
  baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  timeout: 10000,
});

/**
 * Sends a single video frame for sign-recognition processing.
 * @param {string} frameData - base64-encoded image data
 * @param {string} roomId
 * @returns {Promise<{label: string, confidence: number} | null>}
 */
export async function processFrame(frameData, roomId) {
  try {
    const { data } = await aiClient.post('/process-frame', { frameData, roomId });
    return data;
  } catch (err) {
    console.error('[ai-client] processFrame failed:', err.message);
    return null;
  }
}

/**
 * Sends an audio chunk for Whisper transcription.
 * @param {string} audioData - base64-encoded audio chunk
 * @param {string} roomId
 * @returns {Promise<{text: string} | null>}
 */
export async function processAudio(audioData, roomId) {
  try {
    const { data } = await aiClient.post('/process-audio', { audioData, roomId });
    return data;
  } catch (err) {
    console.error('[ai-client] processAudio failed:', err.message);
    return null;
  }
}

/**
 * Turns a buffered sequence of recognized signs/glosses into a natural
 * sentence via Gemini.
 * @param {string[]} glossSequence
 * @returns {Promise<{sentence: string} | null>}
 */
export async function generateSentence(glossSequence) {
  try {
    const { data } = await aiClient.post('/generate-sentence', { glossSequence });
    return data;
  } catch (err) {
    console.error('[ai-client] generateSentence failed:', err.message);
    return null;
  }
}

/**
 * Synthesizes speech audio from text.
 * @param {string} text
 * @returns {Promise<{audioUrl: string} | null>}
 */
export async function synthesizeSpeech(text) {
  try {
    const { data } = await aiClient.post('/synthesize-speech', { text });
    return data;
  } catch (err) {
    console.error('[ai-client] synthesizeSpeech failed:', err.message);
    return null;
  }
}

/**
 * Checks whether the AI service is reachable. Used at server startup
 * and can be surfaced via AIStatusIndicator in the client later.
 */
export async function checkAIServiceHealth() {
  try {
    const { data } = await aiClient.get('/health');
    return data.status === 'ok';
  } catch (err) {
    return false;
  }
}
