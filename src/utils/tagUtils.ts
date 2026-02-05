export interface ParsedTags {
  raw: string[];
  map: Record<string, string>;
}

export function parseTags(tags: string[] | null | undefined): ParsedTags {
  const raw = tags ?? [];
  const map: Record<string, string> = {};
  for (const t of raw) {
    const idx = t.indexOf(':');
    if (idx === -1) continue;
    const key = t.slice(0, idx).trim().toLowerCase();
    const value = t.slice(idx + 1).trim();
    if (!key) continue;
    map[key] = value;
  }
  return { raw, map };
}

export function getTagValue(tags: string[] | null | undefined, key: string): string | undefined {
  return parseTags(tags).map[key.trim().toLowerCase()];
}

export function setTagValue(tags: string[] | null | undefined, key: string, value: string): string[] {
  const k = key.trim().toLowerCase();
  const parsed = parseTags(tags);
  const next = parsed.raw.filter((t) => t.toLowerCase() !== `${k}:${parsed.map[k] ?? ''}`.toLowerCase());
  // Remove any existing key:* entries
  const filtered = next.filter((t) => !t.toLowerCase().startsWith(`${k}:`));
  filtered.push(`${k}:${value}`);
  return filtered;
}

export function incrementTagInt(
  tags: string[] | null | undefined,
  key: string,
  delta: number,
  min = 0,
): { tags: string[]; value: number } {
  const currentStr = getTagValue(tags, key);
  const current = Number(currentStr ?? 0);
  const nextValue = Number.isFinite(current) ? Math.max(min, current + delta) : Math.max(min, delta);
  return { tags: setTagValue(tags, key, String(nextValue)), value: nextValue };
}

export function parseMoneyUSD(value: string | null | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}
