import mongoose from 'mongoose';

const { Schema } = mongoose;

// Mirrors the User shape in shared-types/index.js. passwordHash is never
// selected by default (select: false) so a stray `User.find()` can't
// accidentally leak hashes into an API response or log line.
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['hearing', 'deaf', 'both'],
      default: 'both',
    },
    preferredLanguage: { type: String, default: 'en-US' },
    preferredSignSet: { type: String, default: 'ASL' },
  },
  { timestamps: true }
);

// Never expose passwordHash even if a query accidentally selects it,
// and normalize _id -> id for the client.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
