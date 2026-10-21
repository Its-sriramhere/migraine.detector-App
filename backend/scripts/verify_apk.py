"""Verify a built release APK: native libs, baked backend URL, signature."""
import re
import sys
import zipfile

apk = sys.argv[1] if len(sys.argv) > 1 else (
    r"C:\Users\LOQ\Desktop\Migrainedetector-App\mobile\android\app\build\outputs\apk\release\app-release.apk"
)
expected_url = sys.argv[2] if len(sys.argv) > 2 else "migraine-detector-api.onrender.com"

failures = []


def check(label, ok, detail=""):
    print(f"  [{'OK  ' if ok else 'FAIL'}] {label}{(' -> ' + detail) if detail else ''}")
    if not ok:
        failures.append(label)


print(f"=== {apk} ===")

with zipfile.ZipFile(apk) as z:
    names = z.namelist()

    abis = sorted({n.split("/")[1] for n in names if n.startswith("lib/")})
    check("native libs present for every ABI", len(abis) == 4, ", ".join(abis))

    appmodules = [a for a in abis if f"lib/{a}/libappmodules.so" in names]
    check("libappmodules.so present (new architecture)", len(appmodules) == len(abis), ", ".join(appmodules))

    bundle_name = next((n for n in names if n.endswith("index.android.bundle")), None)
    check("JS bundle present", bundle_name is not None, bundle_name or "")

    if bundle_name:
        blob = z.read(bundle_name).decode("utf-8", errors="ignore")
        check("backend URL baked into the bundle", expected_url in blob, expected_url)
        # The old LAN default must not be present, or the app would ignore the bake.
        lan = "192.168.1.84" in blob
        check("no stale LAN default in the bundle", not lan, "192.168.1.84 present" if lan else "")

    icons = [n for n in names if n.startswith("res/") and n.endswith(".png")]
    check("icon bitmaps bundled", len(icons) > 0, f"{len(icons)} png entries")

    size_mb = round(len(open(apk, "rb").read()) / 1024 / 1024, 1)
    print(f"\n  APK size: {size_mb} MB")

print(f"\n=== {len(failures)} failure(s) ===")
for f in failures:
    print("  -", f)
raise SystemExit(1 if failures else 0)
