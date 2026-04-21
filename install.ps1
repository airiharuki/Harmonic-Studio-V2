# VibeCoded Music Lab Setup (Harmonic Studio V2)
Write-Host "🎵 VibeCoded Music Lab Setup 🎵" -ForegroundColor Cyan
Write-Host "Fully automated: Git -> Repo -> Python/Node/FFmpeg -> AI Models -> React"
Write-Host ""

if (!(Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ERROR: winget not found. Please install winget or update Windows to continue." -ForegroundColor Red
    exit
}

# 1. Check for Git and Clone
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "🛠️ Git is not installed. Auto-installing silently via Winget..." -ForegroundColor Yellow
    winget install Git.Git --accept-package-agreements --accept-source-agreements --silent
    
    Write-Host "🔄 Refreshing environment variables to add Git to PATH..." -ForegroundColor Cyan
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    if (!(Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Host "❌ ERROR: Git installation failed or PATH couldn't be resolved. Please install manually from https://git-scm.com/" -ForegroundColor Red
        Exit 1
    }
    Write-Host "✅ Git installed and PATH updated successfully!" -ForegroundColor Green
} else {
    Write-Host "✅ Git is already installed." -ForegroundColor Green
}

if (-not (Test-Path "package.json")) {
    $repoUrl = "https://github.com/airiharuki/Harmonic-Studio-V2.git"
    $targetDir = "Harmonic-Studio-V2"
    
    if (-not (Test-Path $targetDir)) {
        Write-Host "📦 Cloning repository from $repoUrl..." -ForegroundColor Cyan
        git clone $repoUrl $targetDir
    }
    
    Write-Host "📂 Switching to $targetDir directory..." -ForegroundColor Cyan
    Set-Location $targetDir
} else {
    Write-Host "✅ Repository files found locally." -ForegroundColor Green
}

# 2. Check for core dependencies (Node, Python, FFmpeg)
$refreshPath = $false

if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "🛠️ Node.js not found. Auto-installing..." -ForegroundColor Yellow
    winget install OpenJS.NodeJS --accept-package-agreements --accept-source-agreements --silent
    $refreshPath = $true
} else {
    Write-Host "✅ Node.js is already installed." -ForegroundColor Green
}

if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "🛠️ Python not found. Auto-installing v3.11..." -ForegroundColor Yellow
    winget install Python.Python.3.11 --accept-package-agreements --accept-source-agreements --silent
    $refreshPath = $true
} else {
    Write-Host "✅ Python is already installed." -ForegroundColor Green
}

if (!(Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Host "🛠️ FFmpeg not found. Auto-installing..." -ForegroundColor Yellow
    winget install Gyan.FFmpeg --accept-package-agreements --accept-source-agreements --silent
    $refreshPath = $true
} else {
    Write-Host "✅ FFmpeg is already installed." -ForegroundColor Green
}

if ($refreshPath) {
    Write-Host "🔄 Refreshing environment variables..." -ForegroundColor Cyan
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# 3. Python AI Separator & Downloader Dependencies
Write-Host "`n🤖 Installing AI Audio Separators and yt-dlp..." -ForegroundColor Cyan
python -m pip install --upgrade pip
pip install -U demucs spleeter "audio-separator[gpu]" yt-dlp

# 4. Node Dependencies
Write-Host "`n📦 Installing Node dependencies..." -ForegroundColor Cyan
npm install

Write-Host "`n✅ Setup Complete!" -ForegroundColor Magenta
Write-Host "--------------------------------------------------------"
Write-Host "To start the lab, ensure your terminal is inside the Harmonic-Studio-V2 folder and run:"
Write-Host "  npm run dev" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------"
