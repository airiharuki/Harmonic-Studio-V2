FROM node:20-slim

# System dependencies
# curl + unzip are required at runtime: server.ts auto-downloads a pinned Deno
# build for yt-dlp's YouTube n-challenge solver if it isn't already present.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    build-essential \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment to avoid PEP 668 issues
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install AI audio models + yt-dlp
# audio-separator covers MDX-Net and BS-Roformer (replaces the old mdx-net package)
RUN pip install --no-cache-dir -U \
    demucs \
    spleeter \
    "audio-separator[cpu]" \
    yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

# PORT env var tells server.ts which port to bind — must match the compose mapping
ENV PORT=3000

CMD ["npm", "start"]
