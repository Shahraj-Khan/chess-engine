import { useCallback, useState } from 'react'

function readStored<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed: unknown = JSON.parse(raw)
    return isValid(parsed) ? parsed : fallback
  } catch {
    // Storage can be unavailable (private mode) or hold corrupt data; fall back quietly.
    return fallback
  }
}

/** useState that persists to localStorage and validates whatever it reads back. */
export function useLocalStorageState<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): readonly [T, (next: T) => void] {
  const [value, setValue] = useState<T>(() => readStored(key, fallback, isValid))

  const update = useCallback(
    (next: T) => {
      setValue(next)
      try {
        window.localStorage.setItem(key, JSON.stringify(next))
      } catch {
        // Persisting is best-effort.
      }
    },
    [key],
  )

  return [value, update] as const
}
