import mongoose from 'mongoose';

const { Schema } = mongoose;

const participantSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['hearing', 'deaf', 'both'], required: true },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date, default: null },
  },
  { _id: false }
);

// roomId is the human/URL-friendly identifier used in Socket.IO rooms
// and the /call/:roomId frontend route - separate from Mongo's _id so
// call links stay short and stable.
const callSchema = new Schema(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    participants: { type: [participantSchema], default: [] },
    status: { type: String, enum: ['active', 'ended'], default: 'active' },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

callSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Call', callSchema);
