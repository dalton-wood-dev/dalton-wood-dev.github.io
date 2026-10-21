param(
    [ValidateRange(1, 65535)]
    [int]$Port = 4200
)

$ErrorActionPreference = 'Stop'
$repoDirectory = Split-Path -Parent $PSScriptRoot
$toolDirectory = Join-Path $repoDirectory '.review-tools'
$tunnelExecutable = Join-Path $toolDirectory 'cloudflared.exe'
$origin = "http://localhost:$Port"

try {
    $response = Invoke-WebRequest -Uri $origin -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -ne 200) { throw 'Preview returned an unexpected response.' }
} catch {
    throw "Start the Angular preview on port $Port first, then run this script again."
}

if (-not (Test-Path -LiteralPath $tunnelExecutable)) {
    New-Item -ItemType Directory -Path $toolDirectory -Force | Out-Null
    Write-Host 'Downloading the portable Cloudflare Tunnel client from its official release...'
    $release = Invoke-RestMethod -Uri 'https://api.github.com/repos/cloudflare/cloudflared/releases/latest'
    $asset = $release.assets | Where-Object { $_.name -eq 'cloudflared-windows-amd64.exe' } | Select-Object -First 1
    if (-not $asset) { throw 'The official Windows x64 download could not be found.' }
    $downloadPath = Join-Path $toolDirectory 'cloudflared-download.exe'
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $downloadPath -UseBasicParsing
    if ($asset.digest -and $asset.digest.StartsWith('sha256:')) {
        $actualHash = (Get-FileHash -LiteralPath $downloadPath -Algorithm SHA256).Hash
        if ($actualHash -ne $asset.digest.Substring(7)) {
            throw 'The Cloudflare download checksum does not match its release. The file will not be run.'
        }
    }
    Move-Item -LiteralPath $downloadPath -Destination $tunnelExecutable
}

Write-Host ''
Write-Host 'Open the https://...trycloudflare.com address printed below on your iPhone.'
Write-Host 'Tap Enable tilt, allow motion access, then scroll to the prisms and tilt your phone.'
Write-Host 'Keep this terminal and Angular running. Press Ctrl+C here to close the public preview.'
Write-Host ''
# Preserve the origin Host header so Angular accepts tunnel requests without
# disabling its host validation or allowing arbitrary external hostnames.
& $tunnelExecutable tunnel --no-autoupdate --url $origin --http-host-header "localhost:$Port" --protocol http2
if ($LASTEXITCODE -ne 0) { throw "Cloudflare Tunnel exited with code $LASTEXITCODE." }
