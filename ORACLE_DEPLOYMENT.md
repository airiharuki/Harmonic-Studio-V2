# Oracle Cloud Deployment Guide

This guide explains how to deploy VibeCoded to an Oracle Cloud instance. Since you are using trial credits, standard Intel/AMD (x86_64) shapes are highly recommended to bypass ARM availability limits and ensure smooth Docker compatibility!

## 1. Create Your Oracle Cloud Account & Instance

1. Go to [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/) and sign up.
2. In the Oracle Cloud Console, go to **Compute > Instances** and click **Create Instance**.
3. Name your instance (e.g., `vibecoded-server`).
4. **Image and Shape (CRITICAL STEP):**
   - Click **Edit** on Image and Shape.
   - **Image:** Select **Ubuntu** (e.g., Ubuntu 22.04 or 24.04).
   - **Shape:** Click "Change Shape". 
     - **Free Tier alternative:** Select **Specialty and Previous Generation** -> **VM.Standard.E2.1.Micro** (This is an AMD x86_64 "Always Free" instance).
     - **Trial Credits alternative (Recommended for performance):** Select **Intel** or **AMD** and choose a standard Flex shape like **VM.Standard.E3.Flex** or **VM.Standard3.Flex**.
   - **Resources:** If using a flexible shape and your $300 credits, allocate **2-4 OCPUs** and **8-16 GB Memory**. (Note: If using the free E2.1.Micro, resources are locked to 1/8 OCPU and 1 GB Memory, which may be too slow for intense audio splitting tasks).
5. **Networking:** Leave as default (creates a new VCN and public subnet).
6. **Add SSH Keys:** 
   - Select "Generate a key pair for me".
   - **Save the Private Key** to your computer. You MUST do this to log in later.
7. Click **Create**. Wait a few minutes for the instance to provision.

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

# Add your user to the Docker group (so you don't need 'sudo' for docker commands)
sudo usermod -aG docker $USER

# Open the internal Ubuntu firewall for port 3000
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
sudo netfilter-persistent save
```

*Note: After running the `usermod` command, you might need to log out (`exit`) and SSH back in for the group change to take effect.*

## 5. Deploy the App

1. Clone your repository (you'll need to push your code to GitHub first):
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

2. Create your `.env` file with your Gemini API key:
   ```bash
   echo "GEMINI_API_KEY=your_actual_api_key_here" > .env
   ```

3. Build and start the container in the background:
   ```bash
   docker-compose up -d --build
   ```

## 6. Access Your App

Wait a few minutes for the Docker build to finish. Once it's running, open your web browser and go to:

`http://YOUR_PUBLIC_IP:3000`

Your app is now live, private, and running on your active Oracle deployment! If you are using trial credits, remember to monitor your billing dashboard over time.
