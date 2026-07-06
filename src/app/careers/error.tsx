'use client';

import { PublicSegmentError } from '@/components/shared/public-segment-error';

export default function CareersSegmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PublicSegmentError error={error} reset={reset} context="careers-segment" />;
}
