import { redirect } from 'next/navigation';

/** Legacy inventory path — cashier lives as a standalone app at /pos. */
export default function Page() {
  redirect('/pos');
}
