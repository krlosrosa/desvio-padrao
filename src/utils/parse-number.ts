/**
 * Converte string numérica (ex.: 26.35, 26,35, 1.000,50) em número.
 */
export const parseFlexibleNumber = (raw: string): number | null => {
  const t = raw.trim();
  if (t.length === 0) {
    return null;
  }

  if (t.includes(",") && t.includes(".")) {
    const normalized = t.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  if (t.includes(",")) {
    const n = Number(t.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }

  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};
