export function toIso(value: string | Date): string {
  return typeof value === 'string' ? value : value.toISOString();
}

export function parseCoord(value: string | number): number {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}
