#!/usr/bin/env bash
echo "🎵 VibeCoded Music Lab Setup (Harmonic Studio V2) 🎵"

if ! command -v brew &> /dev/null; then
    echo "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    eval "$(/opt/homebrew/bin/brew shellenv)"
fi

echo -e "\n📦 Ensuring dependencies are installed (Git, Node, Python, FFmpeg)..."
brew install git node python@3.11 ffmpeg

if ! command -v git &> /dev/null; then
    echo "❌ Git failed to install. Please install manually."
    exit 1
fi

if [ ! -f "package.json" ]; then
    if [ ! -d "Harmonic-Studio-V2" ]; then
        echo "📦 Cloning Harmonic-Studio-V2 repository..."
        git clone https://github.com/airiharuki/Harmonic-Studio-V2.git
    fi
    cd Harmonic-Studio-V2 || exit
fi

echo -e "\n🤖 Installing AI Audio Separators and yt-dlp..."
python3 -m pip install --upgrade pip
export PIP_BREAK_SYSTEM_PACKAGES=1
pip3 install -U demucs spleeter "audio-separator[cpu]" yt-dlp

echo -e "\n📦 Installing Node dependencies..."
npm install

echo -e "\n✅ Setup Complete! Run the following commands to boot the lab:"
echo -e "\033[33m  cd Harmonic-Studio-V2\033[0m (If you ran this outside the dir)"
echo -e "\033[33m  npm run dev\033[0m"
