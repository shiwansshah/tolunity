import { Stack } from "expo-router";
import AuthProvider from "../src/context/AuthProvider";
import AlertProvider from "../src/context/AlertProvider";
import NotificationProvider from "../src/context/NotificationProvider";
import PushNotificationBootstrap from "../src/components/PushNotificationBootstrap";

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AlertProvider>
          <PushNotificationBootstrap />
          <Stack screenOptions={{ headerShown: false }} />
        </AlertProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
