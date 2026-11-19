# OpenShort Studio Production Container
FROM python:3.11-bookworm

# Install system dependencies: FFmpeg, Node.js 20, Git
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    git \
    ca-certificates \
    libgl1 \
    libglib2.0-0 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python backend dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Frontend dependencies
COPY frontend/package.json frontend/package-lock.json* ./frontend/
RUN cd frontend && npm install

# Copy application source code
COPY . .

# Build frontend production bundle
RUN cd frontend && npm run build

# Ensure storage directories exist
RUN mkdir -p storage/raw_media storage/audio storage/transcripts storage/renders storage/broll

EXPOSE 8000 3000

ENV HOST=0.0.0.0
ENV PORT=8000

# Start Studio servers
CMD ["python", "run_studio.py"]
