# Build an installable iOS .ipa through EAS cloud builds.
#
# iOS binaries can only be compiled with Xcode on macOS, so the build runs on
# EAS's own macOS machines. This script does the whole flow: it makes sure
# you are logged in, links the project to an EAS project, starts the build
# and prints the link to the finished .ipa.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\build-ios-ipa.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\build-ios-ipa.ps1 -Profile preview
#
# You need a free Expo account for the build. Installing the finished app on
# a physical iPhone additionally needs an Apple Developer account, because
# iOS will not install an unsigned app.

param(
  [string]$Profile = "preview",
  [switch]$Simulator,
  [switch]$SkipLoginCheck
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Push-Location $projectRoot

function Write-Step($message) {
  Write-Host ""
  Write-Host "==> $message" -ForegroundColor Cyan
}

try {
  Write-Step "Checking the EAS CLI"
  & npx eas-cli --version | Out-Null

  if (-not $SkipLoginCheck) {
    Write-Step "Checking the Expo session"
    $whoami = & npx eas-cli whoami 2>&1 | Out-String
    if ($whoami -match "Not logged in") {
      Write-Host "You are not logged in to Expo." -ForegroundColor Yellow
      Write-Host ""
      Write-Host "Create a free account at https://expo.dev/signup, then run:" -ForegroundColor Yellow
      Write-Host "    npx eas-cli login" -ForegroundColor White
      Write-Host ""
      Write-Host "That opens a browser to sign in. Once it is done, run this script again." -ForegroundColor Yellow
      exit 1
    }
    Write-Host "Signed in as: $($whoami.Trim())" -ForegroundColor Green
  }

  Write-Step "Validating the project configuration"
  & npx expo config --type public | Out-Null

  $args = @("eas-cli", "build", "--platform", "ios", "--profile", $Profile)
  if ($Simulator) {
    $args += "--target", "simulator"
  }

  Write-Step "Starting the iOS build (profile: $Profile)"
  Write-Host "The build takes roughly 10-20 minutes. EAS prints a link when it is done."
  Write-Host ""

  & npx @args
  $exitCode = $LASTEXITCODE

  if ($exitCode -ne 0) {
    Write-Host ""
    Write-Host "The build did not finish. Scroll up for the reason EAS gave." -ForegroundColor Yellow
    exit $exitCode
  }

  Write-Host ""
  Write-Host "The build is queued or finished. EAS prints a link to the .ipa." -ForegroundColor Green
  Write-Host "You can also list the finished builds with:" -ForegroundColor Cyan
  Write-Host "    npx eas-cli build:list --platform ios" -ForegroundColor White
}
finally {
  Pop-Location
}
