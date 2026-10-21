const fs = require("fs");
const path = require("path");
const { withAppBuildGradle, withDangerousMod, withGradleProperties, withAndroidManifest } = require("expo/config-plugins");

/** Reproducible local beta signing. Private values stay in android-keys/. */
module.exports = function withReleaseSigning(config) {
  const privateFile = path.resolve(__dirname, "../android-keys/signing.json");
  const local = fs.existsSync(privateFile) ? JSON.parse(fs.readFileSync(privateFile, "utf8")) : {};
  const source = process.env.MIGRAINKE_KEYSTORE || path.resolve(__dirname, "../android-keys/migraine-beta.keystore");
  const secrets = {
    MIGRAINKE_STORE_FILE: "migraine-beta.keystore",
    MIGRAINKE_STORE_PASSWORD: process.env.MIGRAINKE_STORE_PASS || local.storePassword,
    MIGRAINKE_KEY_ALIAS: process.env.MIGRAINKE_KEY_ALIAS || local.keyAlias,
    MIGRAINKE_KEY_PASSWORD: process.env.MIGRAINKE_KEY_PASS || local.keyPassword,
  };

  // This internal beta connects to a LAN HTTP backend. HTTPS continues to
  // work; public deployments should use HTTPS and remove this beta override.
  config = withAndroidManifest(config, (mod) => {
    if (mod.android.package === "com.migrainedetector.beta") {
      mod.modResults.manifest.application[0].$["android:usesCleartextTraffic"] = "true";
    }
    return mod;
  });

  // EAS can supply its own credentials if local signing isn't configured.
  if (!secrets.MIGRAINKE_STORE_PASSWORD || !secrets.MIGRAINKE_KEY_PASSWORD || !secrets.MIGRAINKE_KEY_ALIAS || !fs.existsSync(source)) return config;

  config = withGradleProperties(config, (mod) => {
    mod.modResults = mod.modResults.filter((entry) => !(entry.type === "property" && entry.key.startsWith("MIGRAINKE_")));
    Object.entries(secrets).forEach(([key, value]) => mod.modResults.push({ type: "property", key, value }));
    return mod;
  });
  config = withDangerousMod(config, ["android", async (mod) => {
    fs.copyFileSync(source, path.join(mod.modRequest.platformProjectRoot, "app", "migraine-beta.keystore"));
    return mod;
  }]);
  return withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;
    if (!contents.includes("MIGRAINKE_STORE_PASSWORD")) {
      contents = contents.replace(/signingConfigs\s*\{/, `signingConfigs {
        release {
            storeFile file(project.findProperty("MIGRAINKE_STORE_FILE"))
            storePassword project.findProperty("MIGRAINKE_STORE_PASSWORD")
            keyAlias project.findProperty("MIGRAINKE_KEY_ALIAS")
            keyPassword project.findProperty("MIGRAINKE_KEY_PASSWORD")
        }`);
    }
    contents = contents.replace(/(release\s*\{[^}]*?)signingConfig signingConfigs\.debug/, "$1signingConfig signingConfigs.release");
    mod.modResults.contents = contents;
    return mod;
  });
};
