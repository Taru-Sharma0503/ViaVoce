import mongoose from 'mongoose';

const { Schema } = mongoose;

// One document per translation event emitted during a call. Written
// by the socket handlers (captionHandlers / translationHandlers) so
// the call history is reconstructable after the call ends.
const translationHistorySchema = new Schema(
  {
    callId: { type: Schema.Types.ObjectId, ref: 'Call', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    direction: {
      type: String,
      enum: ['speech-to-text', 'sign-to-speech'],
      required: true,
    },
    inputSummary: { type: String, default: '' }, // e.g. gloss sequence or audio duration
    outputText: { type: String, required: true },
    confidence: { type: Number, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

translationHistorySchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('TranslationHistory', translationHistorySchema);
