import { create } from 'zustand';
import { contractArticlesApi, type ApiContractArticle } from './contracts-api';
import { payrollListArchiveQuery } from '@/features/hr/organization/lib/archive-scope';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';

export type HRContractArticle = {
  id: string;
  code: string;
  title: string;
  body: string;
  isBasic: boolean;
  isActive: boolean;
  updatedAt: string;
};

export function normalizeArticleBody(raw: string) {
  return raw.replace(/\r\n/g, '\n');
}

function mapApiArticle(a: ApiContractArticle): HRContractArticle {
  return {
    id: a.id,
    code: a.code,
    title: a.titleAr,
    body: normalizeArticleBody(a.bodyAr ?? ''),
    isBasic: a.isBasic,
    isActive: a.isActive,
    updatedAt: a.updatedAt,
  };
}

type State = {
  articles: HRContractArticle[];
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (a: Omit<HRContractArticle, 'id' | 'updatedAt'>) => Promise<HRContractArticle>;
  update: (id: string, patch: Partial<Pick<HRContractArticle, 'code' | 'title' | 'body' | 'isBasic' | 'isActive'>>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  getById: (id: string) => HRContractArticle | undefined;
};

export const useHRContractArticlesStore = create<State>()((set, get) => ({
  articles: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    const companyId = getDefaultCompanyId();
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await contractArticlesApi.list({ companyId, limit: 200, ...payrollListArchiveQuery() });
      set({ articles: result.items.map(mapApiArticle), isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  add: async (a) => {
    const companyId = getDefaultCompanyId() ?? '';
    const created = await contractArticlesApi.create({
      companyId,
      code: a.code.trim() || `ART-${Date.now().toString(36).toUpperCase()}`,
      titleAr: a.title.trim(),
      bodyAr: normalizeArticleBody(a.body),
      isBasic: a.isBasic,
      isActive: a.isActive,
    });
    const row = mapApiArticle(created);
    set(s => ({ articles: [row, ...s.articles] }));
    return row;
  },

  update: async (id, patch) => {
    try {
      const updated = await contractArticlesApi.update(id, {
        code: patch.code?.trim(),
        titleAr: patch.title?.trim(),
        bodyAr: patch.body !== undefined ? normalizeArticleBody(patch.body) : undefined,
        isBasic: patch.isBasic,
        isActive: patch.isActive,
      });
      const row = mapApiArticle(updated);
      set(s => ({ articles: s.articles.map(x => x.id === id ? row : x) }));
      return true;
    } catch {
      return false;
    }
  },

  remove: async (id) => {
    try {
      await contractArticlesApi.delete(id);
      set(s => ({ articles: s.articles.filter(x => x.id !== id) }));
      return true;
    } catch {
      return false;
    }
  },

  getById: (id) => get().articles.find(x => x.id === id),
}));
