import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIState {
  // Map of projectId -> messages
  histories: Record<string, AIMessage[]>;
  
  addMessage: (projectId: string, message: AIMessage) => void;
  clearHistory: (projectId: string) => void;
  getHistory: (projectId: string) => AIMessage[];
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      histories: {},

      addMessage: (projectId, message) => {
        set((state) => {
          const projectHistory = state.histories[projectId] || [
            {
              role: 'assistant',
              content: "Hello! I'm your AI coding assistant. Use the quick actions below or ask me anything about your code.",
            }
          ];
          
          return {
            histories: {
              ...state.histories,
              [projectId]: [...projectHistory, message]
            }
          };
        });
      },

      clearHistory: (projectId) => {
        set((state) => {
          const { [projectId]: _, ...rest } = state.histories;
          return { histories: rest };
        });
      },

      getHistory: (projectId) => {
        return get().histories[projectId] || [
          {
            role: 'assistant',
            content: "Hello! I'm your AI coding assistant. Use the quick actions below or ask me anything about your code.",
          }
        ];
      },
    }),
    {
      name: 'emerge-ai-history', // LocalStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
