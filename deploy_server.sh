#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🚀 VibeCoded Music Lab - Automated Server Deployment 🚀"
echo "=========================================================="

echo -e "\n[1/5] Checking System Dependencies..."

if ! command -v git &> /dev/null; then
    echo "Installing Git..."
    sudo apt-get update
    sudo apt-get install -y git
fi

if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    sudo systemctl enable docker
    sudo systemctl start docker
fi

if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose Plugin..."
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin || sudo apt-get install -y docker-compose
fi

echo -e "\n[2/5] Fetching Repository..."
if [ ! -f "docker-compose.yml" ]; then
    if [ ! -d "Harmonic-Studio-V2" ]; then
        git clone https://github.com/airiharuki/Harmonic-Studio-V2.git
    fi
    cd Harmonic-Studio-V2 || exit
fi

echo -e "\n[3/5] Setting up Environment Variables..."
if [ ! -f ".env" ]; then
    echo -e "\n🔑 The application requires a Gemini API Key for AI features."
    echo -n "Enter your GEMINI_API_KEY (or press Enter to skip for now): "
    read -r api_key
    echo "GEMINI_API_KEY=$api_key" > .env
    echo "NODE_ENV=production" >> .env
else
    echo ".env file already exists. Skipping..."
fi

echo -e "\n[4/5] Preparing File Storage Permissions..."
mkdir -p downloads output
# Make directories writable for the docker container
sudo chmod -R 777 downloads output

echo -e "\n[5/5] Building and Launching Docker Containers..."
# Try modern docker compose first, fallback to older docker-compose
if docker compose version &> /dev/null; then
    sudo docker compose up -d --build
else
    sudo docker-compose up -d --build
fi

echo -e "\n=========================================================="
echo "✅ SERVER DEPLOYED SUCCESSFULLY!"
echo "=========================================================="
echo "The application is running in the background via Docker on port 3000."
echo "To view live logs: sudo docker compose logs -f"
echo "To stop the server: sudo docker compose down"
echo ""
echo "Next steps if you are on a VPS:"
echo "1. Forward port 80/443 to port 3000 using Nginx or Caddy."
echo "2. Don't forget to set up your DNS and an SSL certificate!"
