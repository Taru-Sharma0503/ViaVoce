FROM python:3.11-slim

# System libs required by opencv-python-headless / mediapipe
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Download the default Piper voice(s) at build time so TTS works out of
# the box. Add more lines here for "clear"/"calm" if you want all three.
RUN mkdir -p voices && \
    curl -L -o voices/en_US-lessac-medium.onnx \
      https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx && \
    curl -L -o voices/en_US-lessac-medium.onnx.json \
      https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json

ENV PIPER_VOICES_DIR=/app/voices
ENV PORT=8000

EXPOSE 8000

RUN python -c "from faster_whisper import WhisperModel; WhisperModel('base')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]