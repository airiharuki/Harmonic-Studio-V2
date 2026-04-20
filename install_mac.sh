#!/usr/bin/env bash
echo "🎵 VibeCoded Music Lab Setup 🎵"
echo "Installing automated stack for local Audio Processing (Demucs, MDX-Net, Spleeter, BS-Roformer)"

if ! command -v brew &> /dev/null; then
    echo "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

echo -e "\n[1/3] Installing base dependencies (Node, Python, FFmpeg)..."
brew install node python@3.11 ffmpeg git

echo -e "\n[2/3] Installing AI Audio Separation Models..."
python3 -m pip install --upgrade pip
pip3 install -U demucs spleeter
pip3 install "audio-separator[cpu]"

echo -e "\n[3/3] Installing Node dependencies..."
npm install

echo -e "\n✅ Setup Complete! Run 'npm run dev' to boot the lab."
