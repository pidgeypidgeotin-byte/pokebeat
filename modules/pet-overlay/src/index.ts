import { requireNativeModule } from "expo-modules-core";

export type PetOverlayNative = {
  canDrawOverlays(): boolean;
  openOverlaySettings(): void;
  start(): void;
  stop(): void;
};

export function getPetOverlay() {
  return requireNativeModule<PetOverlayNative>("PetOverlay");
}

export default getPetOverlay;
