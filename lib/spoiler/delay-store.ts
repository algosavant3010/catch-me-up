import { createPersistentStore } from "@/lib/utils/persistent-store";

export interface SpoilerShieldState extends Record<string, unknown> {
  delaySeconds: number;
}

export const spoilerStore = createPersistentStore<SpoilerShieldState>("catch-me-up:spoiler:v1", {
  delaySeconds: 0,
});
