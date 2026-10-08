/**
 * Participants from the company's users and internal contacts (read only).
 *
 * - Users count only when they belong to the active company and are active —
 *   a user of another company is never offered, even if the caller can see it.
 * - Internal contacts of the active company count, with or without a user
 *   account. A contact linked to one of those users is the same participant.
 * - The signed-in user is always a participant.
 *
 * Ids are stable per source: `u:<userId>` for users (and linked contacts),
 * `c:<contactId>` for contacts without an account.
 */
import type { Participant } from './types';

export type LiveUser = {
  id: string;
  name: string;
  email: string | null;
  isActive: boolean;
  companyIds: string[];
};

export type LiveContact = {
  id: string;
  name: string;
  email: string | null;
  userId: string | null;
  companyId: string;
  isInternal: boolean;
  archived: boolean;
};

export const userParticipantId = (userId: string) => `u:${userId}`;
export const contactParticipantId = (contactId: string) => `c:${contactId}`;

export function mergeParticipants(args: {
  companyId: string;
  users: readonly LiveUser[];
  contacts: readonly LiveContact[];
  currentUser?: { id: string; name: string; email: string | null } | null;
}): Participant[] {
  const byId = new Map<string, Participant>();
  for (const user of args.users) {
    if (!user.isActive || !user.companyIds.includes(args.companyId)) continue;
    byId.set(userParticipantId(user.id), {
      id: userParticipantId(user.id),
      name: user.name,
      email: user.email,
      kind: 'user',
      userId: user.id,
      contactId: null,
      source: 'live',
      active: true,
    });
  }
  if (args.currentUser && !byId.has(userParticipantId(args.currentUser.id))) {
    byId.set(userParticipantId(args.currentUser.id), {
      id: userParticipantId(args.currentUser.id),
      name: args.currentUser.name,
      email: args.currentUser.email,
      kind: 'user',
      userId: args.currentUser.id,
      contactId: null,
      source: 'live',
      active: true,
    });
  }
  for (const contact of args.contacts) {
    if (!contact.isInternal || contact.archived || contact.companyId !== args.companyId) continue;
    const linked = contact.userId ? byId.get(userParticipantId(contact.userId)) : undefined;
    if (linked) {
      linked.kind = 'user_contact';
      linked.contactId = contact.id;
      continue;
    }
    byId.set(contactParticipantId(contact.id), {
      id: contactParticipantId(contact.id),
      name: contact.name,
      email: contact.email,
      kind: 'contact',
      userId: null,
      contactId: contact.id,
      source: 'live',
      active: true,
    });
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
}
