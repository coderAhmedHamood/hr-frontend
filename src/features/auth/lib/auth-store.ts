import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AccessProfile } from '@/features/auth/types/access-profile';
import type { AuthUser } from '@/features/auth/types/access-profile';
import {
  clearDefaultCompanyId,
  persistDefaultCompanyId,
} from '@/features/hr/organization/lib/default-company-id';

interface AuthState {
  user: AuthUser | null;
  accessProfile: AccessProfile | null;
  activeCompanyId: string | null;
  activeBranchId: string | null;

  setUser: (user: AuthUser) => void;
  setAccessProfile: (profile: AccessProfile) => void;
  setActiveContext: (companyId: string, branchId?: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessProfile: null,
      activeCompanyId: null,
      activeBranchId: null,

      setUser: (user) => set({ user }),

      setAccessProfile: (profile) => {
        persistDefaultCompanyId(profile.defaultCompanyId);
        return set({
          accessProfile: profile,
          activeCompanyId: profile.defaultCompanyId,
          activeBranchId: profile.defaultBranchId,
        });
      },

      setActiveContext: (companyId, branchId = null) =>
        set({ activeCompanyId: companyId, activeBranchId: branchId }),

      clear: () => {
        clearDefaultCompanyId();
        set({
          user: null,
          accessProfile: null,
          activeCompanyId: null,
          activeBranchId: null,
        });
      },
    }),
    {
      name: 'rose-hr-auth',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist the data fields, not the action functions
      partialize: (state) => ({
        user: state.user,
        accessProfile: state.accessProfile,
        activeCompanyId: state.activeCompanyId,
        activeBranchId: state.activeBranchId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessProfile?.defaultCompanyId) {
          persistDefaultCompanyId(state.accessProfile.defaultCompanyId);
        }
      },
    },
  ),
);
