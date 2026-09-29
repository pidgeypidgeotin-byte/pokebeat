import { requireNativeModule } from "expo-modules-core";

export type PetOverlayNative = {
  canDrawOverlays(): boolean;
  openOverlaySettings(): void;
  start(speciesId?: number, accessToken?: string): void;
  stop(): void;
  consumePendingPlaybackMs(): number;
};

export function getPetOverlay() {
  return requireNativeModule<PetOverlayNative>("PetOverlay");
}

export default getPetOverlay;
