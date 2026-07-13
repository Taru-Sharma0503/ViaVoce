# ViaVoce

**AI-powered communication assistant that bridges communication gaps between speech users and sign-language users.**

ViaVoce is a real-time video calling platform with two AI-driven pipelines:
1. **Speech → Captions**: hearing user's speech is transcribed live for a deaf/sign-language user.
2. **Sign → Speech**: a deaf/sign-language user's signs are recognized, turned into a natural sentence, and spoken aloud for a hearing user.

## Architecture

```
React (client) ── Socket.IO/REST ──> Node.js/Express (server) ── REST ──> FastAPI (ai-service)
                                            │                                    │
                                       MongoDB (Atlas)                   MediaPipe / Gemini /
                                                                          Whisper / TTS
```

- **client/** — React (Vite) frontend. Video UI, live captions, translation panel.
- **server/** — Node.js/Express backend. Auth, call sessions, WebRTC signaling, Socket.IO, MongoDB. Never runs AI inference directly.
- **ai-service/** — Python FastAPI microservice. MediaPipe landmark extraction, sign classification, Gemini sentence generation, Whisper transcription, TTS synthesis.
- **shared-types/** — Shared data shape definitions (JSDoc typedefs) used as the contract between client and server.

## Running the project

Each service runs independently and communicates over HTTP/WebSocket — you need three terminals (or use the root dev script for client+server).

### 1. Server + Client together (from root)

```bash
npm run install:all
npm run dev
```

This starts the client (Vite dev server, default `http://localhost:5173`) and the server (Express, default `http://localhost:5000`) concurrently.

### 2. AI service (separate terminal, Python)

```bash
cd ai-service
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # fill in API keys
uvicorn app.main:app --reload --port 8000
```

### 3. Individual services (if not using root script)

```bash
# client
cd client && npm install && npm run dev

# server
cd server && npm install && npm run dev
```

## Environment configuration strategy

Each service owns its own `.env` file (never committed — see `.gitignore`). A `.env.example` is provided per service documenting required variables. The **server** holds the `AI_SERVICE_URL` used to reach the AI microservice internally; the **client** never talks to the AI service directly.

| Service | File | Key variables |
|---|---|---|
| client | `client/.env` | `VITE_API_URL`, `VITE_SOCKET_URL` |
| server | `server/.env` | `PORT`, `MONGO_URI`, `JWT_SECRET`, `AI_SERVICE_URL`, `CLIENT_URL` |
| ai-service | `ai-service/.env` | `GEMINI_API_KEY`, `WHISPER_API_KEY`, `TTS_API_KEY`, `PORT` |

## Project status

This repo is being generated in phases. See the latest **PROJECT GENERATION CHECKPOINT** in the build log for current progress.

- [x] Phase 1 — Project initialization
- [ ] Phase 2 — Backend (auth, call management, sockets, models)
- [ ] Phase 3 — Frontend (pages, video UI, captions/translation panels)
- [ ] Phase 4 — AI service (MediaPipe, model wrapper, Gemini/Whisper/TTS)

## Tech stack

- **Frontend**: React, Vite, React Router, Tailwind CSS, Socket.IO client
- **Backend**: Node.js, Express, Socket.IO, MongoDB (Mongoose), JWT
- **AI service**: FastAPI, MediaPipe Holistic, Gemini API, Whisper API, TTS
- **Real-time transport**: WebRTC (signaling via Socket.IO)
