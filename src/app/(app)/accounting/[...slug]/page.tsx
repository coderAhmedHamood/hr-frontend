import { redirect } from 'next/navigation';

/** Accounting sub-routes are not built yet — land on the module home. */
export default function AccountingCatchAllPage() {
  redirect('/accounting');
}
