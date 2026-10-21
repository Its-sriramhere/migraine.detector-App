#!/usr/bin/env bash
# Assemble an installable .ipa on macOS.
#
# The iOS binary can only be compiled with Xcode, so this script has to run
# on a Mac. It generates the native project, installs the pods, builds the
# app in Release, and packages the .app into a version-stamped .ipa.
#
# Usage:
#   ./scripts/build-ipa-on-mac.sh                 # unsigned ipa
#   ./scripts/build-ipa-on-mac.sh --simulator     # simulator ipa
#   ./scripts/build-ipa-on-mac.sh --sign "iPhone Distribution" \
#       --team  ABCDE12345 --profile "Migraine Detector Beta"
#
# The result is written to dist/ios/ and never replaces an earlier build.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$PROJECT_ROOT/.." && pwd)"
DIST="$REPO_ROOT/dist/ios"
BASE_NAME="Migraine-Detector_Beta"
VERSION="$(python3 -c "import json;d=json.load(open('$PROJECT_ROOT/app.json'))['expo'];print(d.get('android',{}).get('version') or d.get('version','1.0.0'))")"

TARGET="device"
SIGN_IDENTITY=""
TEAM_ID=""
PROFILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --simulator) TARGET="simulator"; shift ;;
    --sign) SIGN_IDENTITY="$2"; shift 2 ;;
    --team) TEAM_ID="$2"; shift 2 ;;
    --profile) PROFILE="$2"; shift 2 ;;
    -h|--help) sed -n '2,16p' "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "An .ipa can only be built on macOS, because Xcode is required." >&2
  echo "From Windows or Linux use the EAS cloud build instead:" >&2
  echo "    npx eas-cli build --platform ios --profile preview" >&2
  exit 1
fi

command -v xcodebuild >/dev/null || {
  echo "Xcode command line tools are not installed." >&2
  exit 1
}

echo "==> Version $VERSION, target $TARGET"

cd "$PROJECT_ROOT"

echo "==> Generating the iOS project"
npx expo prebuild --platform ios --clean

echo "==> Installing the pods"
cd ios
pod install

SCHEME="MigraineDetectorBeta"
WORKSPACE="MigraineDetectorBeta.xcworkspace"
DERIVED="$PROJECT_ROOT/ios/build"
SDK="iphoneos"
if [[ "$TARGET" == "simulator" ]]; then
  SDK="iphonesimulator"
fi

echo "==> Building the app"
XCODE_ARGS=(
  -workspace "$WORKSPACE"
  -scheme "$SCHEME"
  -configuration Release
  -sdk "$SDK"
  -derivedDataPath "$DERIVED"
)
if [[ -n "$SIGN_IDENTITY" ]]; then
  XCODE_ARGS+=(
    -allowProvisioningUpdates
    DEVELOPMENT_TEAM="$TEAM_ID"
    CODE_SIGN_StYLE=Manual
    CODE_SIGN_IDENTITY="$SIGN_IDENTITY"
  )
  if [[ -n "$PROFILE" ]]; then
    XCODE_ARGS+=( -provisioningProfileSpecifier "$PROFILE" )
  fi
else
  echo "    (no signing identity given, building unsigned)"
  XCODE_ARGS+=( CODE_SIGNING_ALLOWED=NO )
fi

xcodebuild "${XCODE_ARGS[@]}" build

APP="$DERIVED/Build/Products/Release-$SDK/$SCHEME.app"
if [[ ! -d "$APP" ]]; then
  echo "the build did not produce $APP" >&2
  exit 1
fi

echo "==> Packaging the .ipa"
mkdir -p "$DIST"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/Payload"
cp -r "$APP" "$STAGE/Payload/"

IPA="$DIST/${BASE_NAME}-${VERSION}.ipa"
if [[ -e "$IPA" ]]; then
  index=2
  while [[ -e "$DIST/${BASE_NAME}-${VERSION}-${index}.ipa" ]]; do
    index=$((index + 1))
  done
  IPA="$DIST/${BASE_NAME}-${VERSION}-${index}.ipa"
fi

( cd "$STAGE" && zip -qry "$IPA" Payload )

echo ""
echo "==> Built $IPA"
echo "    $(du -h "$IPA" | cut -f1)"
echo ""
if [[ "$TARGET" == "simulator" ]]; then
  echo "This is a simulator build. It runs in the iOS Simulator on a Mac and"
  echo "cannot be installed on a physical iPhone."
else
  echo "Install it on a device with Apple Configurator, Xcode, or a signing"
  echo "service. An unsigned build needs a jailbroken device or a tool that"
  echo "allows ad-hoc installs."
fi
