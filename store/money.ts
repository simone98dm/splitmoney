/**
 * Money is handled in integer cents everywhere except at the UI boundary.
 * Floating point euros silently lose fractions of a cent, and once several
 * balances are rounded independently they stop summing to zero — which makes
 * a settlement plan that never fully clears the debts.
 */

export const CENTS_PER_UNIT = 100;

export const toCents = (amount: number): number =>
  Math.round(amount * CENTS_PER_UNIT);

export const toEuro = (cents: number): number => cents / CENTS_PER_UNIT;

const EURO = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Always two decimals, Italian separators: 1.234,50 €. */
export const formatEuro = (amount: number): string => EURO.format(amount);

/**
 * Same, with an explicit + or −. The sign is what makes a balance readable
 * without color, so it is never optional on a figure that can go either way.
 */
export const formatSignedEuro = (amount: number): string => {
  if (amount === 0) return EURO.format(0);
  const sign = amount > 0 ? "+" : "−"; // U+2212, aligns with digits
  return `${sign}${EURO.format(Math.abs(amount))}`;
};

/**
 * Splits `totalCents` into `shareCount` shares that sum back to EXACTLY
 * `totalCents`. The indivisible remainder is spread one cent at a time, so no
 * cent is ever created or destroyed.
 *
 * `offset` picks who absorbs those extra cents. Always starting at index 0
 * would make whoever sits first in the list pay the extra cent on every single
 * expense, which adds up; callers pass a per-expense offset to rotate it.
 *
 * splitEvenly(1000, 3) -> [334, 333, 333]
 * splitEvenly(1000, 3, 1) -> [333, 334, 333]
 */
export const splitEvenly = (
  totalCents: number,
  shareCount: number,
  offset = 0
): number[] => {
  if (!Number.isInteger(totalCents)) {
    throw new Error(
      `splitEvenly richiede centesimi interi, ricevuto ${totalCents}`
    );
  }

  if (shareCount <= 0) return [];

  const base = Math.trunc(totalCents / shareCount);
  const remainder = totalCents - base * shareCount;
  // remainder keeps the sign of totalCents, so negative totals split correctly
  const step = remainder >= 0 ? 1 : -1;
  const extraShares = Math.abs(remainder);
  const start = ((offset % shareCount) + shareCount) % shareCount;

  const shares = new Array<number>(shareCount).fill(base);
  for (let i = 0; i < extraShares; i++) {
    shares[(start + i) % shareCount] += step;
  }
  return shares;
};
