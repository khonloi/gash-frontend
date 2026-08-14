import { useState, useCallback } from "react";
import { storage } from "../utils/storage";

/**
 * Custom hook for synchronized state with localStorage
 * @param {string} key - localStorage key
 * @param {any} defaultValue - Fallback value if key doesn't exist
 * @returns {[any, Function]} [value, setValue]
 */
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => storage.getItem(key, defaultValue));

  const setStoredValue = useCallback(
    (newValue) => {
      setValue((prev) => {
        const valToStore =
          typeof newValue === "function" ? newValue(prev) : newValue;
        storage.setItem(key, valToStore);
        return valToStore;
      });
    },
    [key]
  );

  return [value, setStoredValue];
}

export default useLocalStorage;
