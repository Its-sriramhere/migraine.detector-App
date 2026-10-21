# Build a signed release APK and publish it without replacing older builds.
#
# The release build is signed with the local keystore under android-keys/,
# which the withReleaseSigning config plugin copies into the generated
# project. The finished APK is published into dist/ under a version-stamped
# name, so the builds from earlier versions stay exactly as they were.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\build-android-apk.ps1
#
# Requirements: JDK 21, the Android SDK, and ANDROID_HOME pointing at it.

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Push-Location $projectRoot

function Write-Step($message) {
  Write-Host ""
  Write-Host "==> $message" -ForegroundColor Cyan
}

try {
  if (-not $env:ANDROID_HOME) {
    $defaultSdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
    if (Test-Path $defaultSdk) {
      $env:ANDROID_HOME = $defaultSdk
      $env:ANDROID_SDK_ROOT = $defaultSdk
      Write-Host "ANDROID_HOME not set, using $defaultSdk" -ForegroundColor Yellow
    }
  }
  if (-not $env:JAVA_HOME) {
    $jdk = Get-ChildItem "C:\Users\LOQ\AppData\Local\Temp\opencode\jdk21" -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($jdk) { $env:JAVA_HOME = $jdk.FullName }
  }

  Write-Step "Building the release APK"
  Push-Location android
  try {
    & .\gradlew.bat assembleRelease --no-daemon
    if ($LASTEXITCODE -ne 0) { throw "gradle failed with exit code $LASTEXITCODE" }
  }
  finally {
    Pop-Location
  }

  $apk = Join-Path $projectRoot "android\app\build\outputs\apk\release\app-release.apk"
  if (-not (Test-Path $apk)) { throw "the build did not produce $apk" }

  Write-Step "Publishing"
  & python scripts\publish_artifact.py --apk $apk
  if ($LASTEXITCODE -ne 0) { throw "publishing failed" }
}
finally {
  Pop-Location
}
