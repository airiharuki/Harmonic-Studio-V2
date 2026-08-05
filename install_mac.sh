#!/usr/bin/env bash
set -e
echo "🎵 VibeCoded Music Lab Setup (Harmonic Studio V2) 🎵"
echo "Automated: Homebrew -> Git / Node / Python / FFmpeg / Deno -> AI Models -> React"
echo ""

# 1. Homebrew
if ! command -v brew &>/dev/null; then
    echo "🛠️ Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    # Wire up brew for Apple Silicon and Intel paths
    if [[ -f /opt/homebrew/bin/brew ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [[ -f /usr/local/bin/brew ]]; then
        eval "$(/usr/local/bin/brew shellenv)"
    fi
    echo "✅ Homebrew installed."
else
    echo "✅ Homebrew already installed."
fi

# 2. Core system dependencies (brew is idempotent — safe to re-run)
echo ""
echo "📦 Installing / verifying: git, node, python@3.11, ffmpeg, deno..."
brew install git node python@3.11 ffmpeg deno

if ! command -v git &>/dev/null; then
    echo "❌ Git failed to install. Please install manually."
    exit 1
fi

echo "✅ All system dependencies installed."

# 3. Clone repo (if we're not already inside it)
if [ ! -f "package.json" ]; then
    if [ ! -d "Harmonic-Studio-V2" ]; then
        echo ""
        echo "📦 Cloning Harmonic-Studio-V2 repository..."
        git clone https://github.com/airiharuki/Harmonic-Studio-V2.git
    fi
    cd Harmonic-Studio-V2 || exit 1
else
    echo "✅ Repository files found locally."
fi

# 4. Python AI models + yt-dlp
echo ""
echo "🤖 Installing AI Audio Separators and yt-dlp..."
python3 -m pip install --upgrade pip
PIP_BREAK_SYSTEM_PACKAGES=1 pip3 install -U demucs spleeter "audio-separator[cpu]" yt-dlp

# 5. Node dependencies
echo ""
echo "📦 Installing Node dependencies..."
npm install

echo ""
echo "✅ Setup Complete!"
echo "--------------------------------------------------------"
echo "To start the lab:"
echo -e "  \033[33mcd Harmonic-Studio-V2\033[0m  (if you ran this from outside the folder)"
echo -e "  \033[33mnpm run dev\033[0m"
echo ""
echo -e "\033[90m💡 Deno is used by yt-dlp to bypass YouTube throttling — no config needed, just keep it in PATH.\033[0m"
echo "--------------------------------------------------------"
