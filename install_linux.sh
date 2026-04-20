#!/usr/bin/env bash
echo "🎵 VibeCoded Music Lab Setup 🎵"
echo "Installing automated stack for local Audio Processing (Demucs, MDX-Net, Spleeter, BS-Roformer)"

echo -e "\n[1/3] Installing base dependencies (Node, Python, FFmpeg)..."
sudo apt-get update
sudo apt-get install -y curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs python3 python3-pip python3-venv ffmpeg git

echo -e "\n[2/3] Installing AI Audio Separation Models..."
python3 -m pip install --upgrade pip
pip3 install -U demucs spleeter
pip3 install "audio-separator[cpu]"

echo -e "\n[3/3] Installing Node dependencies..."
npm install

echo -e "\n✅ Setup Complete! Run 'npm run dev' to boot the lab."
