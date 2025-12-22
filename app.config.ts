// Load environment variables with proper priority (system > .env)
require("./scripts/load-env.cjs");
import type { ExpoConfig } from "expo/config";

// Bundle ID format: space.manus.<project_name_dots>.<timestamp>
// e.g., "my-app" created at 2024-01-15 10:30:45 -> "space.manus.my.app.t20240115103045"
const bundleId = "com.ausflugfinder.ausflugfinder";
// Extract timestamp from bundle ID and prefix with "manus" for deep link scheme
// e.g., "space.manus.my.app.t20240115103045" -> "manus20240115103045"
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
  // App branding - update these values directly (do not use env vars)
  appName: 'AusflugFinder',
  appSlug: 'ausflugfinder-app',
  // S3 URL of the app logo - set this to the URL returned by generate_image when creating custom logo
  // Leave empty to use the default icon from assets/images/icon.png
  logoUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663166174123/oLWXQCLfCASeitve.png',
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.4",
  platforms: ["ios", "android", "web"],
  orientation: "portrait",
  // icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  owner: "stibe88",
  extra: {
    eas: {
      projectId: "9f46e400-a516-4bd1-8cfc-9329531d5ae4"
    }
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyBWdywvMrHBFABO6D0vXF0ErXvrhvmLNNs",
    },
    infoPlist: {
      UIBackgroundModes: ["audio", "location", "fetch", "remote-notification"],
      NSLocationWhenInUseUsageDescription: "AusflugFinder benötigt deinen Standort, um Ausflugsziele in deiner Nähe anzuzeigen und dich zu benachrichtigen, wenn du in der Nähe eines Ausflugsziels bist.",
      NSLocationAlwaysAndWhenInUseUsageDescription: "AusflugFinder benötigt deinen Standort im Hintergrund, um dich zu benachrichtigen, wenn du in der Nähe eines Ausflugsziels bist.",
      NSLocationAlwaysUsageDescription: "AusflugFinder benötigt deinen Standort im Hintergrund, um dich zu benachrichtigen, wenn du in der Nähe eines Ausflugsziels bist.",
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#FFFFFF",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyBWdywvMrHBFABO6D0vXF0ErXvrhvmLNNs",
      },
    },
    permissions: ["POST_NOTIFICATIONS", "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    // [
    //   "expo-splash-screen",
    //   {
    //     image: "./assets/images/splash-icon.png",
    //     imageWidth: 200,
    //     resizeMode: "contain",
    //     backgroundColor: "#ffffff",
    //     dark: {
    //       backgroundColor: "#000000",
    //     },
    //   },
    // ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission: "AusflugFinder benötigt deinen Standort, um dich zu benachrichtigen, wenn du in der Nähe eines Ausflugsziels bist.",
      },
    ],
    [
      "react-native-maps",
      {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyBWdywvMrHBFABO6D0vXF0ErXvrhvmLNNs",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
