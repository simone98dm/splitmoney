/**
 * localStorage is a trust boundary: the user can edit it, another tab can
 * corrupt it, and an old build can have written a different shape. Everything
 * that comes back out is untrusted until a parser has vetted it.
 */

/**
 * Reads `key` and hands the raw parsed JSON to `parse`. Returns `fallback`
 * when the entry is missing, unreadable, not valid JSON, or rejected.
 */
export const readStored = <T>(
  key: string,
  parse: (raw: unknown) => T | null,
  fallback: T
): T => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    return parse(JSON.parse(stored)) ?? fallback;
  } catch {
    return fallback;
  }
};

/** Returns false when the write failed (quota exceeded, storage disabled). */
export const writeStored = (key: string, value: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

/** Keeps only the non-empty strings, without duplicates. */
export const parseNameList = (raw: unknown): string[] | null => {
  if (!Array.isArray(raw)) return null;

  const names = raw.filter(
    (name): name is string => typeof name === "string" && name.trim() !== ""
  );

  return [...new Set(names)];
};
