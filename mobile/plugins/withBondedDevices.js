const fs = require("fs");
const path = require("path");
const { withMainApplication, withDangerousMod } = require("expo/config-plugins");

const KOTLIN_DIR = path.join(__dirname, "bonded-devices");

/**
 * Adds the BondedDevices native module.
 *
 * react-native-ble-plx can only see devices that are advertising right now.
 * The Android Bluetooth settings also shows the devices already bonded to
 * the phone, and a paired watch is often out of range, so it would never
 * appear in a scan. This module exposes that list to the app.
 *
 * The Kotlin sources live in the plugin folder and are copied into the
 * generated Android project, so `expo prebuild` stays reproducible.
 */
module.exports = function withBondedDevices(config) {
  config = withDangerousMod(config, [
    "android",
    async (mod) => {
      const javaDir = path.join(
        mod.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "java",
        "com",
        "migrainedetector",
        "beta",
      );
      fs.mkdirSync(javaDir, { recursive: true });
      for (const file of fs.readdirSync(KOTLIN_DIR)) {
        if (!file.endsWith(".kt")) continue;
        fs.copyFileSync(path.join(KOTLIN_DIR, file), path.join(javaDir, file));
      }
      return mod;
    },
  ]);

  config = withMainApplication(config, (mod) => {
    let contents = mod.modResults.contents;
    if (contents.includes("add(BondedDevicesPackage())")) return mod;
    contents = contents.replace(
      /PackageList\(this\)\.packages\.apply \{/,
      "PackageList(this).packages.apply {\n          // Lists the watches already paired to this phone, which a scan cannot see.\n          add(BondedDevicesPackage())",
    );
    mod.modResults.contents = contents;
    return mod;
  });

  return config;
};
