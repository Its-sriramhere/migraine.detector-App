"""Publish a build artifact into dist/ without ever replacing an older one.

Every build is published under a version-stamped name or folder, so the
artifacts from earlier versions stay exactly as they were:

    dist/Migraine-Detector_Beta-1.0.0-beta.1.apk
    dist/ios/Migraine-Detector_Beta-1.0.0-beta.1/

If the target path already exists, a numeric suffix is added rather than
overwriting, and the path that was actually used is printed.

Usage:
    python scripts/publish_artifact.py --apk path/to/app-release.apk
    python scripts/publish_artifact.py --ios-export path/to/ios-export
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist"
IOS_DIR = DIST / "ios"
BASE_NAME = "Migraine-Detector_Beta"


def app_version() -> str:
    """The version from app.json, with the build suffix if there is one."""
    config = json.loads((ROOT / "mobile" / "app.json").read_text(encoding="utf-8"))
    expo = config.get("expo", {})
    version = expo.get("version", "1.0.0")
    android = expo.get("android", {})
    suffix = android.get("version") or ""
    if suffix and suffix != version and suffix.startswith(version):
        return suffix
    return version


def unique_path(directory: Path, stem: str, suffix: str) -> Path:
    """A path that does not exist yet, adding -2, -3 ... if needed."""
    candidate = directory / f"{stem}{suffix}"
    if not candidate.exists():
        return candidate
    index = 2
    while True:
        candidate = directory / f"{stem}-{index}{suffix}"
        if not candidate.exists():
            return candidate
        index += 1


def copy_file(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    print(f"published: {target.relative_to(ROOT)}")


def copy_tree(source: Path, target: Path) -> None:
    if target.exists():
        raise SystemExit(f"refusing to replace an existing build: {target}")
    shutil.copytree(source, target)
    print(f"published: {target.relative_to(ROOT)}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apk", type=Path, help="release APK to publish")
    parser.add_argument("--ios-export", type=Path, help="expo export output for iOS")
    args = parser.parse_args()

    if not args.apk and not args.ios_export:
        parser.error("give --apk and/or --ios-export")

    version = app_version()
    DIST.mkdir(parents=True, exist_ok=True)

    if args.apk:
        source = args.apk.resolve()
        if not source.exists():
            raise SystemExit(f"not found: {source}")
        target = unique_path(DIST, f"{BASE_NAME}-{version}", ".apk")
        copy_file(source, target)

    if args.ios_export:
        source = args.ios_export.resolve()
        if not source.exists():
            raise SystemExit(f"not found: {source}")
        IOS_DIR.mkdir(parents=True, exist_ok=True)
        target = unique_path(IOS_DIR, f"{BASE_NAME}-{version}", "")
        copy_tree(source, target)

    return 0


if __name__ == "__main__":
    sys.exit(main())
