# Cloud Deployment Guide

This guide explains how to deploy VibeCoded to a cloud server.

## The "I Have a VPS" Deploy Script (1-Click Docker)
If you already have a Linux VPS (Ubuntu/Debian) running anywhere (DigitalOcean, Hetzner, AWS, etc.), the absolute fastest way to deploy the app securely via Docker Compose is to SSH into your server and run our automated deploy script:

```bash
curl -fsSL https://raw.githubusercontent.com/airiharuki/Harmonic-Studio-V2/main/deploy_server.sh | bash
```

*This script will install Docker and Docker Compose if needed, clone the repo, prompt for your Gemini API key, wire up port 3000, and launch the service in the background.*

---

## Deploying on Oracle Cloud (Always Free Tier)

If you don't have a server, you can get a powerful 24GB RAM ARM server for free on Oracle Cloud.

### 1. Create Your Oracle Cloud Account & Instance

1. Go to [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/) and sign up.
2. In the Oracle Cloud Console, go to **Compute > Instances** and click **Create Instance**.
3. Name your instance (e.g., `vibecoded-server`).
4. **Image and Shape (CRITICAL STEP):**
   - Click **Edit** on Image and Shape.
   - **Image:** Select **Ubuntu** (e.g., Ubuntu 22.04 or 24.04).
   - **Shape:** Click "Change Shape".
     - **The 24GB ARM Beast (Recommended):** Go to **Ampere** and select **VM.Standard.A1.Flex**. Drag the sliders to **4 OCPUs** and **24GB Memory**. (This is the ultimate "Always Free" machine and handles heavy AI audio splitting effortlessly.)
     - **Fallback x86 (If ARM is out of capacity):** Select **Specialty and Previous Generation** → **VM.Standard.E2.1.Micro** (1/8 OCPU, 1GB RAM). Note: This will be too slow for audio separation — use only as a last resort.
5. **Networking:** Leave as default (creates a new VCN and public subnet).
6. **Add SSH Keys:**
   - Select "Generate a key pair for me".
   - **Save the Private Key** to your computer. You MUST do this to log in later.
7. Click **Create**. Wait a few minutes for the instance to provision.

*(Note regarding ARM limits: Oracle sometimes runs out of ARM capacity in specific regions. If it tells you it's "Out of Capacity", you can either retry with a script, upgrade to Pay As You Go to unlock hidden capacity — they won't charge if you stay under 24GB/4 OCPUs — or fall back to x86.)*

---

## 2. Open the Firewall (Oracle Console)

Oracle blocks all ports by default. You need to open port 3000.

1. On your Instance details page, click on the **Subnet** link (e.g., `subnet-xxxx`).
2. Click on the **Security List** (e.g., `Default Security List for vcn-xxxx`).
3. Click **Add Ingress Rules**.
4. Set the following:
   - **Source CIDR:** `0.0.0.0/0`
   - **IP Protocol:** `TCP`
   - **Destination Port Range:** `3000`
5. Click **Add Ingress Rules**.

---

## 3. Connect to Your Server

Open your terminal (Mac/Linux) or PowerShell/Command Prompt (Windows).

1. Find your instance's **Public IP Address** on the Oracle Console.
2. Change the permissions of your downloaded private key (Mac/Linux only):
   ```bash
   chmod 400 path/to/your/private-key.key
   ```
3. SSH into the server:
   ```bash
   ssh -i path/to/your/private-key.key ubuntu@YOUR_PUBLIC_IP
   ```

---

## 4. Install Docker & Git on the Server

Once logged into your Oracle server, run these commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install docker.io docker-compose -y

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to the Docker group (so you don't need sudo for every command)
sudo usermod -aG docker $USER

# Open the Ubuntu internal firewall for port 3000
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
sudo netfilter-persistent save
```

*After running the `usermod` command, log out (`exit`) and SSH back in for the group change to take effect.*

> **Note on Deno:** The app's server auto-downloads a pinned Deno build on first startup — no manual Deno install needed in the Docker path. `curl` and `unzip` are included in the Docker image for this reason.

---

## 5. Deploy the App

1. Clone your repository:
   ```bash
   git clone https://github.com/airiharuki/Harmonic-Studio-V2.git
   cd Harmonic-Studio-V2
   ```

2. Create your `.env` file:
   ```bash
   # Required: Gemini API key for AI chord generation
   echo "GEMINI_API_KEY=your_actual_api_key_here" > .env

   # Required: tells the server which port to bind (must match the Docker mapping)
   echo "PORT=3000" >> .env

   echo "NODE_ENV=production" >> .env
   ```

3. **ARM Specific Caution before Building:**
   Because Oracle's A1 instance runs on `linux/arm64`, downloading pre-compiled Python binaries for things like `onnxruntime` (used by MDX-Net) or TensorFlow (used by Spleeter) inside Docker can occasionally stall. If `docker-compose up` hangs during the `pip install` step, use the native fallback below.

   **Docker (try this first):**
   ```bash
   docker-compose up -d --build
   ```

   **Native ARM Fallback (if Docker compilation fails):**
   Run the native Linux install script directly on your Oracle server — it installs all dependencies including Deno and keeps the app alive via PM2:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/airiharuki/Harmonic-Studio-V2/main/install_linux.sh | bash

   # Keep it alive after SSH disconnect
   npm install -g pm2
   pm2 start npm --name "vibe" -- run dev
   pm2 save
   pm2 startup   # follow the printed command to enable auto-start on reboot
   ```

---

## 6. Access Your App

Wait a few minutes for the Docker build to finish. Once it's running, open your browser:

```
http://YOUR_PUBLIC_IP:3000
```

Your app is now live. For a permanent URL with HTTPS, point a domain at your IP and use **Caddy** (it handles SSL automatically):

```bash
sudo apt install -y caddy
# Then edit /etc/caddy/Caddyfile:
#   yourdomain.com {
#     reverse_proxy localhost:3000
#   }
sudo systemctl reload caddy
```
