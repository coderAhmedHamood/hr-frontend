import { NotFoundView } from '@/components/shared/not-found-view';

/** 404 inside the authenticated shell — keeps topbar and avoids broken back navigation. */
export default function AppNotFound() {
  return <NotFoundView embedded />;
}
