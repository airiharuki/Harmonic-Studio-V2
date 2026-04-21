# Oracle Cloud Deployment Guide

This guide explains how to deploy VibeCoded to an Oracle Cloud instance. 

## 1. Create Your Oracle Cloud Account & Instance

1. Go to [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/) and sign up.
2. In the Oracle Cloud Console, go to **Compute > Instances** and click **Create Instance**.
3. Name your instance (e.g., `vibecoded-server`).
4. **Image and Shape (CRITICAL STEP):**
   - Click **Edit** on Image and Shape.
   - **Image:** Select **Ubuntu** (e.g., Ubuntu 22.04 or 24.04).
   - **Shape:** Click "Change Shape". 
     - **The 24GB ARM Beast (Recommended):** Go to **Ampere** and select **VM.Standard.A1.Flex**. Drag the sliders to **4 OCPUs** and **24GB Memory**. (This is the ultimate "Always Free" machine and handles the heavy AI audio splitting effortlessly).
     - **Fallback x86 (If ARM is out of capacity):** Select **Specialty and Previous Generation** -> **VM.Standard.E2.1.Micro** (1/8 OCPU, 1GB RAM. Note: This will be too slow for audio separation, so only use this if you have to).
5. **Networking:** Leave as default (creates a new VCN and public subnet).
6. **Add SSH Keys:** 
   - Select "Generate a key pair for me".
   - **Save the Private Key** to your computer. You MUST do this to log in later.
7. Click **Create**. Wait a few minutes for the instance to provision.

*(Note regarding ARM limits: Oracle sometimes runs out of ARM capacity in specific regions. If it tells you it's "Out of Capacity", you can either use a script to constantly retry for an ARM instance, upgrade to Pay As You Go to unlock hidden capacity (they won't charge you if you stay under 24GB/4OCPUs), or use the x86 fallback).*

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

# Add your user to the Docker group
sudo usermod -aG docker $USER

# Open the internal Ubuntu firewall for port 3000
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
sudo netfilter-persistent save
```

*Note: After running the `usermod` command, you might need to log out (`exit`) and SSH back in for the group change to take effect.*

## 5. Deploy the App (ARM Warning)

1. Clone your repository:
   ```bash
   git clone https://github.com/airiharuki/Harmonic-Studio-V2.git
   cd Harmonic-Studio-V2
   ```

2. Create your `.env` file with your Gemini API key:
   ```bash
   echo "GEMINI_API_KEY=your_actual_api_key_here" > .env
   ```

3. **ARM Specific Caution before Building:** 
   Because Oracle's A1 instance runs on `linux/arm64` architecture, downloading the pre-compiled Python binaries for things like `onnxruntime` (used by MDX-Net) or TensorFlow (used by Spleeter) inside a Docker container can occasionally stall. If `docker-compose up` hangs during the `pip install` step, we have created an explicit manual ARM script that skips docker and installs directly to Ubuntu!

   **To use Docker (Try this first):**
   ```bash
   docker-compose up -d --build
   ```

   **The Native ARM Backup Plan (If Docker compilation fails):**
   Run the native Linux install script right on your Oracle Server instead of using Docker!
   ```bash
   curl -fsSL https://raw.githubusercontent.com/airiharuki/Harmonic-Studio-V2/main/install_linux.sh | bash
   
   # We strongly recommend running the server via PM2 or screen to keep it alive
   # npm install -g pm2
   # pm2 start npm --name "vibe" -- run dev
   ```

## 6. Access Your App

Wait a few minutes for the build to finish. Once it's running, open your web browser and go to:

`http://YOUR_PUBLIC_IP:3000`

Your app is now live and running on your active Oracle deployment!
