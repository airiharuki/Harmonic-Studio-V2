#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🚀 VibeCoded Music Lab - Automated Server Deployment 🚀"
echo "=========================================================="

echo -e "\n[1/5] Checking System Dependencies..."

if ! command -v git &>/dev/null; then
    echo "Installing Git..."
    sudo apt-get update -qq
    sudo apt-get install -y git
fi

if ! command -v docker &>/dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    sudo systemctl enable docker
    sudo systemctl start docker
fi

if ! docker compose version &>/dev/null && ! command -v docker-compose &>/dev/null; then
    echo "Installing Docker Compose Plugin..."
    sudo apt-get update -qq
    sudo apt-get install -y docker-compose-plugin || sudo apt-get install -y docker-compose
fi

echo -e "\n[2/5] Fetching Repository..."
if [ ! -f "docker-compose.yml" ]; then
    if [ ! -d "Harmonic-Studio-V2" ]; then
        git clone https://github.com/airiharuki/Harmonic-Studio-V2.git
    fi
    cd Harmonic-Studio-V2 || exit 1
fi

echo -e "\n[3/5] Setting up Environment Variables..."
if [ ! -f ".env" ]; then
    echo ""
    echo "🔑 The application needs a Gemini API Key for AI features (chord generation)."
    echo -n "Enter your GEMINI_API_KEY (or press Enter to skip for now): "
    read -r gemini_key
    echo "GEMINI_API_KEY=${gemini_key}" > .env
    echo "NODE_ENV=production" >> .env
    echo "PORT=3000" >> .env
    echo ""
    echo "✅ .env file created."
else
    # Ensure PORT is set even in an existing .env
    if ! grep -q "^PORT=" .env; then
        echo "PORT=3000" >> .env
        echo "PORT=3000 added to existing .env."
    fi
    echo ".env file already exists — skipping key prompts."
fi

echo -e "\n[4/5] Preparing File Storage Permissions..."
mkdir -p downloads output
sudo chmod -R 777 downloads output

echo -e "\n[5/5] Building and Launching Docker Containers..."
# Modern docker compose first, fallback to older docker-compose
if docker compose version &>/dev/null; then
    sudo docker compose up -d --build
else
    sudo docker-compose up -d --build
fi

echo -e "\n=========================================================="
echo "✅ SERVER DEPLOYED SUCCESSFULLY!"
echo "=========================================================="
echo "The application is running in the background via Docker on port 3000."
echo ""
echo "Useful commands:"
echo "  View logs:    sudo docker compose logs -f"
echo "  Stop server:  sudo docker compose down"
echo "  Restart:      sudo docker compose restart"
echo ""
echo "Next steps if you are on a VPS:"
echo "1. Forward port 80/443 to port 3000 using Nginx or Caddy."
echo "2. Set up your DNS and an SSL certificate (Caddy handles this automatically)."
echo ""
echo "Note: yt-dlp uses Deno to bypass YouTube throttling. The server"
echo "auto-downloads a pinned Deno build on first run — no manual install needed."
