import { Platform } from "react-native";

const DEFAULT_API_BASE_URL = "http://192.168.1.4:8080/api";

const trimTrailingSlash = (value) => value?.replace(/\/+$/, "");

const platformFallback = Platform.select({
  android: DEFAULT_API_BASE_URL,
  ios: DEFAULT_API_BASE_URL,
  web: DEFAULT_API_BASE_URL,
  default: DEFAULT_API_BASE_URL,
});

export const appConfig = {
  appName: "TolUnity Mobile",
  apiBaseUrl: trimTrailingSlash(
    process.env.EXPO_PUBLIC_API_BASE_URL || platformFallback,
  ),
  expoProjectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "",
  feedPageSize: 10,
};
