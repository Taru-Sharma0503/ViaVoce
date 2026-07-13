import TranslationHistory from '../models/TranslationHistory.js';

// GET /api/translations/:callId - callId is the Mongo _id of the Call
// document (as returned by Call.toJSON().id). Kept as its own resource
// per the architecture blueprint rather than nested under /calls, since
// translation history is conceptually its own log, written to by the
// socket layer during a call, not by REST actions on the call itself.
export async function getTranslationsForCall(req, res) {
  try {
    const translations = await TranslationHistory.find({ callId: req.params.callId }).sort({
      timestamp: 1,
    });
    return res.status(200).json({ translations: translations.map((t) => t.toJSON()) });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid call id' });
  }
}
