import { Suspense } from 'react';
import { PosRegisterScreen } from '@/features/pos/components/register/register-screen';

export default function Page() {
  return (
    <Suspense>
      <PosRegisterScreen />
    </Suspense>
  );
}
