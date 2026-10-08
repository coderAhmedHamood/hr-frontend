/**
 * Live participants, read only, through the platform's existing endpoints:
 * the company's users (`GET /users`, needs `system.users.read`) and internal
 * contacts (`GET /contacts/partners?isInternal=true`, needs the contacts app
 * and `cnt.partners.read`). The expenses app imports neither app's code and
 * changes nothing in them; when a source is refused or unavailable the app
 * runs on its sample participants and says so.
 */
import { apiRequest } from '@/shared/api/client';
import { mergeParticipants, type LiveContact, type LiveUser } from '../domain/participants';
import type { Participant } from '../domain/types';

export type SourceState = 'live' | 'unavailable';

export type ParticipantsLoad = {
  participants: Participant[];
  users: SourceState;
  contacts: SourceState;
};

type Paged<T> = { items?: T[] } | T[];
const itemsOf = <T,>(res: Paged<T> | null | undefined): T[] =>
  Array.isArray(res) ? res : (res?.items ?? []);

type UserDto = {
  id: string;
  email: string | null;
  fullNameAr: string | null;
  fullNameEn: string | null;
  isActive: boolean;
  companies?: Array<{ companyId: string }>;
};

type PartnerDto = {
  id: string;
  companyId: string;
  userId: string | null;
  displayName?: string | null;
  name?: string | null;
  email: string | null;
  isInternal: boolean;
  archivedAt: string | null;
};

export async function loadLiveParticipants(
  companyId: string,
  currentUser: { id: string; name: string; email: string | null } | null,
): Promise<ParticipantsLoad> {
  const [usersRes, contactsRes] = await Promise.allSettled([
    apiRequest<Paged<UserDto>>('/users', {
      query: { page: 1, limit: 200 },
      silent: true,
      throwOnError: true,
    }),
    apiRequest<Paged<PartnerDto>>('/contacts/partners', {
      query: { companyId, isInternal: true, page: 1, limit: 200 },
      silent: true,
      throwOnError: true,
    }),
  ]);

  const users: LiveUser[] =
    usersRes.status === 'fulfilled'
      ? itemsOf(usersRes.value).map((u) => ({
          id: u.id,
          name: u.fullNameAr?.trim() || u.fullNameEn?.trim() || u.email || 'مستخدم',
          email: u.email,
          isActive: u.isActive,
          companyIds: (u.companies ?? []).map((c) => c.companyId),
        }))
      : [];
  const contacts: LiveContact[] =
    contactsRes.status === 'fulfilled'
      ? itemsOf(contactsRes.value).map((p) => ({
          id: p.id,
          name: p.displayName?.trim() || p.name?.trim() || 'جهة اتصال',
          email: p.email,
          userId: p.userId,
          companyId: p.companyId,
          isInternal: p.isInternal,
          archived: Boolean(p.archivedAt),
        }))
      : [];

  return {
    participants: mergeParticipants({ companyId, users, contacts, currentUser }),
    users: usersRes.status === 'fulfilled' ? 'live' : 'unavailable',
    contacts: contactsRes.status === 'fulfilled' ? 'live' : 'unavailable',
  };
}
