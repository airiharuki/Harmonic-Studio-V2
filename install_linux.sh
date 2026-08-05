#!/usr/bin/env bash
set -e
echo "🎵 VibeCoded Music Lab Setup (Harmonic Studio V2) 🎵"
echo "Automated: apt -> Git / Node / Python / FFmpeg -> Deno -> AI Models -> React"
echo ""

# 1. Base system packages
echo "📦 Updating apt and installing base dependencies..."
sudo apt-get update -qq
sudo apt-get install -y curl git python3 python3-pip ffmpeg unzip

# 2. Node.js v20 (via NodeSource — skip if already installed)
if ! command -v npm &>/dev/null; then
    echo "🛠️ Node.js not found. Installing via NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✅ Node.js installed."
else
    echo "✅ Node.js already installed ($(node --version))."
fi

# 3. Deno — required by yt-dlp to solve YouTube's n-challenge (throttling bypass)
if ! command -v deno &>/dev/null; then
    echo ""
    echo "🛠️ Deno not found. Installing via official installer..."
    curl -fsSL https://deno.land/install.sh | sh

    # Wire up for the current session
    export DENO_INSTALL="$HOME/.deno"
    export PATH="$DENO_INSTALL/bin:$PATH"

    # Persist to common shell profiles
    DENO_EXPORT='export DENO_INSTALL="$HOME/.deno"; export PATH="$DENO_INSTALL/bin:$PATH"'
    for PROFILE in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile"; do
        if [ -f "$PROFILE" ] && ! grep -q "DENO_INSTALL" "$PROFILE"; then
            echo "" >> "$PROFILE"
            echo "# Deno (added by Harmonic Studio V2 installer)" >> "$PROFILE"
            echo "$DENO_EXPORT" >> "$PROFILE"
        fi
    done

    echo "✅ Deno installed ($(deno --version | head -1))."
    echo "   PATH wired for this session and added to shell profiles."
else
    echo "✅ Deno already installed ($(deno --version | head -1))."
fi

# 4. Clone repo (if we're not already inside it)
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

# 5. Python AI models + yt-dlp
echo ""
echo "🤖 Installing AI Audio Separators and yt-dlp..."
PIP_BREAK_SYSTEM_PACKAGES=1 python3 -m pip install --upgrade pip
PIP_BREAK_SYSTEM_PACKAGES=1 pip3 install -U demucs spleeter "audio-separator[cpu]" yt-dlp

# 6. Node dependencies
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
echo -e "\033[90m💡 Deno is used by yt-dlp to bypass YouTube throttling.\033[0m"
echo -e "\033[90m   If a new terminal can't find 'deno', run:  source ~/.bashrc\033[0m"
echo "--------------------------------------------------------"
