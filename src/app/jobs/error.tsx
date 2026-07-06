'use client';

import { PublicSegmentError } from '@/components/shared/public-segment-error';

export default function JobsSegmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PublicSegmentError error={error} reset={reset} context="jobs-segment" />;
}
