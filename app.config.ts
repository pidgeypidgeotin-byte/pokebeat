import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "PokéBeat",
  slug: "pokebeat",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "pokebeat",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  ios: { supportsTablet: true, bundleIdentifier: "com.pokebeat.app", infoPlist: { ITSAppUsesNonExemptEncryption: false } },
  android: {
    package: "com.pokebeat.app",
    adaptiveIcon: { backgroundColor: "#0d0b1b", foregroundImage: "./assets/images/android-icon-foreground.png", backgroundImage: "./assets/images/android-icon-background.png", monochromeImage: "./assets/images/android-icon-monochrome.png" },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: ["POST_NOTIFICATIONS", "FOREGROUND_SERVICE", "FOREGROUND_SERVICE_SPECIAL_USE", "SYSTEM_ALERT_WINDOW"],
    intentFilters: [{ action: "VIEW", data: [{ scheme: "pokebeat", host: "*" }], category: ["BROWSABLE", "DEFAULT"] }],
  },
  web: { bundler: "metro", output: "static", favicon: "./assets/images/favicon.png" },
  plugins: ["expo-router", ["expo-splash-screen", { image: "./assets/images/splash-icon.png", imageWidth: 200, resizeMode: "contain", backgroundColor: "#0d0b1b" }], ["expo-build-properties", { android: { buildArchs: ["armeabi-v7a", "arm64-v8a"], minSdkVersion: 24 } }]],
  experiments: { typedRoutes: true, reactCompiler: true },
};

export default config;
