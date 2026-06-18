import { redirect } from 'next/navigation';
import { hrDisciplineSections } from '@/features/hr/discipline/lib/types';

export default function DisciplinePage() {
  redirect(`/hr/discipline/${hrDisciplineSections[0].slug}`);
}
