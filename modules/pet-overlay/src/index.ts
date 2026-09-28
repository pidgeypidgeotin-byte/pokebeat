import { requireNativeModule } from "expo-modules-core";

export type PetOverlayNative = {
  canDrawOverlays(): boolean;
  openOverlaySettings(): void;
  start(speciesId?: number): void;
  stop(): void;
};

export function getPetOverlay() {
  return requireNativeModule<PetOverlayNative>("PetOverlay");
}

export default getPetOverlay;
