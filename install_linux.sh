#!/usr/bin/env bash
echo "🎵 VibeCoded Music Lab Setup (Harmonic Studio V2) 🎵"

echo -e "\n📦 Checking and installing base dependencies..."
sudo apt-get update
sudo apt-get install -y curl git python3 python3-pip ffmpeg

if ! command -v npm &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

if [ ! -f "package.json" ]; then
    if [ ! -d "Harmonic-Studio-V2" ]; then
        echo -e "\n📦 Cloning repository..."
        git clone https://github.com/airiharuki/Harmonic-Studio-V2.git
    fi
    cd Harmonic-Studio-V2 || exit
fi

echo -e "\n🤖 Installing AI Audio Separation Models..."
export PIP_BREAK_SYSTEM_PACKAGES=1
python3 -m pip install --upgrade pip
pip3 install -U demucs spleeter "audio-separator[cpu]"

echo -e "\n📦 Installing Node dependencies..."
npm install

echo -e "\n✅ Setup Complete! Run the following commands to boot the lab:"
echo -e "\033[33m  cd Harmonic-Studio-V2\033[0m (If you ran this outside the dir)"
echo -e "\033[33m  npm run dev\033[0m"
