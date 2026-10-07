# METAVERSE environment — like a Python venv, but for Node.
#
#   (Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned) ; (& C:\Users\shaur\metaverse\activate.ps1)
#
# First run creates env\ in the project folder: a private copy of Node.js LTS (downloaded from
# nodejs.org, checksum-verified) plus its own npm cache, then installs all packages (Electron,
# React, Vite, Express…) with it. Your system Node is not touched or used.
#
# While active: prompt shows (metaverse), you're in the project folder, and node / npm /
# metaverse / vite / electron all come from this project. `deactivate` undoes it.
#
#   & .\activate.ps1 -Start       activate, then run the website + desktop app (metaverse start)
#   & .\activate.ps1 -Recreate    delete env\ and build it again from scratch
#   Remove-Item -Recurse env      remove the environment completely

param([switch]$Recreate, [switch]$Start)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$envDir = Join-Path $root 'env'
$nodeDir = Join-Path $envDir 'node'

if ($env:METAVERSE_ACTIVE) {
    if ($Start) { & (Join-Path $root 'metaverse.cmd') start; return }
    Write-Host "METAVERSE environment is already active. Run 'deactivate' first." -ForegroundColor Yellow
    return
}

function New-NodeRuntime {
    $arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
    Write-Host 'Creating METAVERSE environment in env\ ...' -ForegroundColor Cyan

    # Newest LTS release that ships a Windows zip for this CPU.
    $release = (Invoke-RestMethod 'https://nodejs.org/dist/index.json') |
        Where-Object { $_.lts -and $_.files -contains "win-$arch-zip" } |
        Select-Object -First 1
    $ver = $release.version
    $name = "node-$ver-win-$arch"
    $base = "https://nodejs.org/dist/$ver"
    Write-Host "  Downloading Node.js $ver LTS ($arch)..."

    New-Item -ItemType Directory -Force $envDir | Out-Null
    $zip = Join-Path $envDir "$name.zip"
    $ProgressPreference = 'SilentlyContinue' # the progress bar makes Invoke-WebRequest ~10x slower
    Invoke-WebRequest "$base/$name.zip" -OutFile $zip

    # Verify against the official checksum list before using it.
    $expected = ((Invoke-WebRequest "$base/SHASUMS256.txt" -UseBasicParsing).Content -split "`n" |
        Where-Object { $_ -match "\s$name\.zip$" }) -replace '\s.*$', ''
    $actual = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
    if (-not $expected -or $actual -ne $expected.Trim()) {
        Remove-Item $zip -Force
        throw "Checksum mismatch for $name.zip - download was corrupted or tampered with. Try again."
    }
    Write-Host '  Checksum verified.'

    Expand-Archive $zip -DestinationPath $envDir -Force
    Move-Item (Join-Path $envDir $name) $nodeDir
    Remove-Item $zip -Force
    Set-Content (Join-Path $envDir 'VERSION') $ver
    Write-Host "  Node.js $ver installed in env\node" -ForegroundColor Green
}

if ($Recreate -and (Test-Path $envDir)) {
    Write-Host 'Removing old environment...' -ForegroundColor Cyan
    Remove-Item -Recurse -Force $envDir
}

try {
    if (-not (Test-Path (Join-Path $nodeDir 'node.exe'))) { New-NodeRuntime }
} catch {
    Write-Host "Could not create the environment: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'Check your internet connection and run the script again.'
    return
}

# Remember what to restore on deactivate.
$global:_METAVERSE_OLD_PATH = $env:Path
$global:_METAVERSE_OLD_PROMPT = $function:prompt
$global:_METAVERSE_OLD_LOCATION = (Get-Location).Path
$global:_METAVERSE_OLD_NPM_CACHE = $env:npm_config_cache

$env:METAVERSE_ACTIVE = '1'
$env:METAVERSE_ROOT = $root
$env:npm_config_cache = Join-Path $envDir 'npm-cache'
$env:npm_config_update_notifier = 'false' # npm upgrades come with a new Node via -Recreate
# The env's Node goes first, so it wins over any system-wide Node.
$env:Path = "$nodeDir;$root;$(Join-Path $root 'node_modules\.bin');$env:Path"

function global:prompt {
    Write-Host '(metaverse) ' -NoNewline -ForegroundColor Green
    & $global:_METAVERSE_OLD_PROMPT
}

function global:deactivate {
    $env:Path = $global:_METAVERSE_OLD_PATH
    $env:npm_config_cache = $global:_METAVERSE_OLD_NPM_CACHE
    if (-not $env:npm_config_cache) { Remove-Item env:npm_config_cache -ErrorAction SilentlyContinue }
    Set-Item function:global:prompt $global:_METAVERSE_OLD_PROMPT
    Set-Location $global:_METAVERSE_OLD_LOCATION
    Remove-Item env:METAVERSE_ACTIVE, env:METAVERSE_ROOT, env:npm_config_update_notifier -ErrorAction SilentlyContinue
    Remove-Variable _METAVERSE_OLD_PATH, _METAVERSE_OLD_PROMPT, _METAVERSE_OLD_LOCATION, _METAVERSE_OLD_NPM_CACHE -Scope Global -ErrorAction SilentlyContinue
    Remove-Item -Path function:deactivate
    Write-Host 'METAVERSE environment deactivated.' -ForegroundColor DarkGray
}

Set-Location $root

# Install packages with the env's own Node/npm if they're missing or were built by another Node.
$stamp = Join-Path $envDir 'installed-with'
$ver = Get-Content (Join-Path $envDir 'VERSION')
if (-not (Test-Path (Join-Path $root 'node_modules')) -or (Get-Content $stamp -ErrorAction SilentlyContinue) -ne $ver) {
    Write-Host "Installing packages with the environment's Node $ver ..." -ForegroundColor Cyan
    & (Join-Path $root 'metaverse.cmd') setup
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Package install failed - the environment is active but incomplete. Fix the error above, then run: metaverse setup' -ForegroundColor Red
    } else {
        Set-Content $stamp $ver
    }
}

Write-Host ''
Write-Host "METAVERSE environment active  (Node $(node --version), npm $(npm --version))" -ForegroundColor Green
Write-Host "  node / npm from    $nodeDir"
Write-Host '  metaverse start    web app in your browser + desktop app'
Write-Host '  metaverse dev      web app  -> http://localhost:5180'
Write-Host '  metaverse desktop  desktop app'
Write-Host '  metaverse help     all commands'
Write-Host '  deactivate         leave the environment'
Write-Host ''

if ($Start) { & (Join-Path $root 'metaverse.cmd') start }
