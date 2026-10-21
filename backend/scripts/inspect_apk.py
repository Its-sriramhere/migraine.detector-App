import zipfile
import sys
from collections import Counter

apk = r"C:\Users\LOQ\Desktop\Migrainedetector-App\mobile\android\app\build\outputs\apk\release\app-release.apk"

with zipfile.ZipFile(apk) as z:
    names = z.namelist()

abis = Counter()
libs = []
for n in names:
    if n.startswith("lib/"):
        parts = n.split("/")
        if len(parts) > 2:
            abis[parts[1]] += 1
            if parts[1] == "x86_64":
                libs.append(parts[2])

print("total entries:", len(names))
print("ABI folders:", dict(abis))
print()
print("x86_64 libs:", len(libs))
for l in sorted(libs):
    print("  ", l)
print()
print("appmodules present in APK:", any("appmodules" in n for n in names))
print("bundle present:", any(n.endswith("index.android.bundle") for n in names))
print("mipmap entries:", [n for n in names if "mipmap" in n][:8])
