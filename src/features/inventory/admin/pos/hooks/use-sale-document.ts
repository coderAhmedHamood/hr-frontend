'use client';

import * as React from 'react';

/**
 * One document number per sale, kept until the sale goes through: a retry
 * after a lost answer sends the same number, and the server refuses a second
 * deduction for it (INVENTORY_SALE_ALREADY_DEDUCTED) instead of deducting twice.
 */
export function useSaleDocument(makeNumber: () => string) {
  const current = React.useRef<string | null>(null);
  return {
    /** The number of the sale being confirmed (the same one on a retry). */
    take: () => (current.current ??= makeNumber()),
    /** The sale went through (or had already): the next sale gets a new number. */
    done: () => {
      current.current = null;
    },
  };
}

/** The server says this sale was already deducted (its first try went through). */
export function isSaleAlreadyDeducted(error: unknown): boolean {
  try {
    return JSON.stringify(error ?? null).includes('INVENTORY_SALE_ALREADY_DEDUCTED');
  } catch {
    return false;
  }
}
