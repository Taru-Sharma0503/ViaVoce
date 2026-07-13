import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';

import { connectDB } from './config/db.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import callsRoutes from './routes/calls.routes.js';
import translationsRoutes from './routes/translations.routes.js';
import { registerSocketHandlers } from './sockets/index.js';
import { checkAIServiceHealth } from './services/aiService.client.js';

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();

// Core middleware
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '2mb' })); // headroom for base64 frame payloads if used as REST fallback

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/translations', translationsRoutes);

// HTTP + Socket.IO share the same underlying server so they can run
// on a single port - required for most hackathon-friendly hosting (Render/Railway).
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: CLIENT_URL, credentials: true },
});
registerSocketHandlers(io);

async function start() {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`[server] ViaVoce backend listening on port ${PORT}`);
  });

  // Non-blocking - the server should still run (e.g. for auth/call
  // management) even if the AI service isn't up yet. This just gives
  // an early, visible warning during demo setup.
  const aiHealthy = await checkAIServiceHealth();
  console.log(
    aiHealthy
      ? '[server] AI service reachable'
      : '[server] WARNING: AI service is not reachable - captions/translation will not work'
  );
}

start();
