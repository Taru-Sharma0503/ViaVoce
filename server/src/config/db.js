import mongoose from 'mongoose';

// Connects to MongoDB using the URI from environment config.
// Called once at server startup (see server.js). Logs a clear error
// and exits if the connection fails, rather than letting the app run
// in a broken state - this matters for a live demo, fail fast and loud.
export async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('[db] MONGO_URI is not set in environment variables.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('[db] MongoDB connected');
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    process.exit(1);
  }
}
