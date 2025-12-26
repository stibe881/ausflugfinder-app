import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Removed auto-registration on mount. 
  // Token registration is now handled by NotificationInitializer which respects auth state.

  const registerPushToken = async () => {
    if (Platform.OS === "web") {
      return; // Push notifications not supported on web
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync();
      console.log('[useNotifications] Push token:', token.data);

      // Save token to backend
      const { savePushToken } = await import("@/lib/supabase-api");
      const result = await savePushToken(token.data, Platform.OS);

      if (result.success) {
        console.log('[useNotifications] Push token saved successfully');
      } else {
        console.error('[useNotifications] Failed to save push token:', result.error);
      }
    } catch (error) {
      console.error('[useNotifications] Error registering push token:', error);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === "web") {
      // Notifications not supported on web
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    const granted = finalStatus === "granted";
    setPermissionGranted(granted);
    return granted;
  };

  const scheduleNotification = async (
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput
  ) => {
    if (!permissionGranted) {
      const granted = await requestPermissions();
      if (!granted) {
        console.log("Notification permissions not granted");
        return null;
      }
    }

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger,
      });
      return id;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      return null;
    }
  };

  const scheduleTripReminder = async (tripTitle: string, daysBeforeTrip: number = 1) => {
    const trigger: Notifications.NotificationTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: daysBeforeTrip * 24 * 60 * 60, // Convert days to seconds
      repeats: false,
    };

    return scheduleNotification(
      "Ausflug bald!",
      `Dein Ausflug "${tripTitle}" steht bevor. Vergiss nicht deine Packliste zu überprüfen!`,
      trigger
    );
  };

  const cancelNotification = async (notificationId: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error("Error canceling notification:", error);
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Error canceling all notifications:", error);
    }
  };

  return {
    permissionGranted,
    requestPermissions,
    scheduleNotification,
    scheduleTripReminder,
    registerPushToken,
    cancelNotification,
    cancelAllNotifications,
  };
}
