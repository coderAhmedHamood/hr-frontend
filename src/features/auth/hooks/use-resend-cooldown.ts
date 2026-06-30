'use client';

import * as React from 'react';

export const AUTH_RESEND_COOLDOWN_SECONDS = 120;

export function formatResendCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

/** Blocks resend for `AUTH_RESEND_COOLDOWN_SECONDS` after `startCooldown()` is called. */
export function useResendCooldown(active: boolean) {
  const [secondsLeft, setSecondsLeft] = React.useState(0);

  const startCooldown = React.useCallback(() => {
    setSecondsLeft(AUTH_RESEND_COOLDOWN_SECONDS);
  }, []);

  React.useEffect(() => {
    if (!active || secondsLeft <= 0) return;

    const id = window.setInterval(() => {
      setSecondsLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(id);
  }, [active, secondsLeft]);

  return {
    secondsLeft,
    canResend: secondsLeft === 0,
    startCooldown,
  };
}
