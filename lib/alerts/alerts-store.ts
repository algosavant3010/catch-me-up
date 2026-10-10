import { createPersistentStore } from "@/lib/utils/persistent-store";

export interface AlertsPreferences extends Record<string, unknown> {
  notificationsOptIn: boolean;
  vibrationOptIn: boolean;
}

export const alertsStore = createPersistentStore<AlertsPreferences>("catch-me-up:alerts:v1", {
  notificationsOptIn: false,
  vibrationOptIn: false,
});
