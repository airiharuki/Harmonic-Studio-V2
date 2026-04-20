# VibeCoded Music Lab - Audio AI Installer
Write-Host "🎵 VibeCoded Music Lab Setup 🎵" -ForegroundColor Cyan
Write-Host "Installing automated stack for local Audio Processing (Demucs, MDX-Net, Spleeter, BS-Roformer)"

# Check winget
if (!(Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Host "winget not found. Please install winget to continue." -ForegroundColor Red
    exit
}

Write-Host "`n[1/3] Installing base dependencies (Node, Python, FFmpeg)..."
winget install -e --id OpenJS.NodeJS --accept-package-agreements --accept-source-agreements
winget install -e --id Python.Python.3.11 --accept-package-agreements --accept-source-agreements
winget install -e --id Gyan.FFmpeg --accept-package-agreements --accept-source-agreements

Write-Host "`n[2/3] Installing AI Audio Separation Models..."
python -m pip install --upgrade pip
pip install -U demucs spleeter
pip install "audio-separator[gpu]"

Write-Host "`n[3/3] Installing Node dependencies..."
npm install

Write-Host "`n✅ Setup Complete! Restart your PowerShell, then run 'npm run dev' to boot the lab." -ForegroundColor Green
