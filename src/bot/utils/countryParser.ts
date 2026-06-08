export function parseCountry(text: string): number {
  const map: Record<string, number> = {
    us: 0,
    uk: 1,
    es: 2,
    pl: 3,
    de: 4,
    it: 5,
    fr: 6,
    pt: 7,
    ua: 8,
  };

  return map[text.toLowerCase()] ?? 8;
}
