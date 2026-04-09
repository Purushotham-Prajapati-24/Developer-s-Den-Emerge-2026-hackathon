import { create } from 'zustand';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  seenBy: string[]; // List of user IDs who have seen this message
}

interface CollabUser {
  id: string;
  name: string;
  color: string;
}

interface CollaborationState {
  users: CollabUser[];
  messages: Message[];
  activeFile: string | null;
  terminalOutput: string;
  
  setUsers: (users: CollabUser[]) => void;
  addMessage: (msg: Message) => void;
  setMessages: (msgs: Message[]) => void;
  setActiveFile: (fileId: string) => void;
  appendTerminal: (text: string) => void;
}

export const useCollaborationStore = create<CollaborationState>((set) => ({
  users: [],
  messages: [],
  activeFile: null,
  terminalOutput: '',

  setUsers: (users) => set({ users }),
  
  addMessage: (msg) => set((state) => ({ 
    messages: [...state.messages, msg] 
  })),

  setMessages: (messages) => set({ messages }),

  setActiveFile: (activeFile) => set({ activeFile }),

  appendTerminal: (text) => set((state) => ({ 
    terminalOutput: state.terminalOutput + text 
  })),
}));
