import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const FALLBACK_PREFIX = "pokebeat.secure-fallback.";
let fallbackWarned = false;

async function canUseSecureStore() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

function warnFallback() {
  if (!fallbackWarned) {
    fallbackWarned = true;
    console.warn("PokéBeat: SecureStore no está disponible en este runtime; se usa almacenamiento compatible temporal.");
  }
}

export async function setProtectedItem(key: string, value: string) {
  if (await canUseSecureStore()) {
    try {
      await SecureStore.setItemAsync(key, value);
      return;
    } catch {
      // Algunos runtimes antiguos reportan SecureStore disponible pero no exponen
      // setValueWithKeyAsync; continuamos con el fallback para no bloquear OAuth.
    }
  }
  warnFallback();
  await AsyncStorage.setItem(`${FALLBACK_PREFIX}${key}`, value);
}

export async function getProtectedItem(key: string) {
  if (await canUseSecureStore()) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // Leeremos el fallback si el módulo nativo tiene una API antigua.
    }
  }
  warnFallback();
  return AsyncStorage.getItem(`${FALLBACK_PREFIX}${key}`);
}

export async function deleteProtectedItem(key: string) {
  if (await canUseSecureStore()) {
    try {
      await SecureStore.deleteItemAsync(key);
      return;
    } catch {
      // El fallback puede contener una sesión creada por un runtime anterior.
    }
  }
  warnFallback();
  await AsyncStorage.removeItem(`${FALLBACK_PREFIX}${key}`);
}
