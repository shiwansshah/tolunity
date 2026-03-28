import { Stack } from "expo-router";
import AuthProvider from "../src/context/AuthProvider";
import NotificationProvider from "../src/context/NotificationProvider";

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </NotificationProvider>
    </AuthProvider>
  );
}
