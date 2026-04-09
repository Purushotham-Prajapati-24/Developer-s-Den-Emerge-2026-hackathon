import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'owner' | 'editor' | 'commenter' | 'reader';

interface ProjectAccess {
  projectId: string;
  role: Role;
}

interface AuthState {
  accessToken: string | null;
  user: any | null;       
  projects: ProjectAccess[];
  setAuth: (token: string, user: any) => void;
  logout: () => void;
  updateProjectRole: (projectId: string, role: Role) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      projects: [],

      setAuth: (token, user) => set({ accessToken: token, user }),
      
      logout: () => set({ accessToken: null, user: null, projects: [] }),
      
      updateProjectRole: (projectId, role) => 
        set((state) => ({
          projects: [...state.projects.filter(p => p.projectId !== projectId), { projectId, role }]
        })),
    }),
    {
      name: 'auth-storage', // saves to localStorage implicitly for the accessToken mapping
      partialize: (state) => ({ accessToken: state.accessToken }), // ONLY persist token, sensitive data stays in memory
    }
  )
);
