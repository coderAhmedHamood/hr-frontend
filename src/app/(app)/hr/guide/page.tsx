import { redirect } from 'next/navigation';
import { DEFAULT_GUIDE_SLUG } from '@/features/hr/guide/constants/project-guide-content';

export default function ProjectGuideIndexPage() {
  redirect(`/hr/guide/${DEFAULT_GUIDE_SLUG}`);
}
