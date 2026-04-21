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

export interface FileNode {
  id: string;
  name: string;
  language: string;
  isMain?: boolean;
}

interface CollaborationState {
  users: CollabUser[];
  messages: Message[];
  files: FileNode[];
  visitedFiles: { name: string; content: string }[];
  activeFileId: string | null;
  terminalOutput: string;
  
  setUsers: (users: CollabUser[]) => void;
  addMessage: (msg: Message) => void;
  setMessages: (msgs: Message[]) => void;
  setFiles: (files: FileNode[]) => void;
  setActiveFileId: (fileId: string | null) => void;
  addVisitedFile: (name: string, content: string) => void;
  appendTerminal: (text: string) => void;
  /** Inject a message from the Developer's Den AI Architect into the chat */
  addAIMessage: (text: string) => void;
}

export const useCollaborationStore = create<CollaborationState>((set) => ({
  users: [],
  messages: [],
  files: [],
  visitedFiles: [],
  activeFileId: null,
  terminalOutput: '',

  setUsers: (users) => set({ users }),
  
  addMessage: (msg) => set((state) => ({ 
    messages: [...state.messages, msg] 
  })),

  setMessages: (messages) => set({ messages }),

  setFiles: (files) => set({ files }),

  setActiveFileId: (activeFileId) => set({ activeFileId }),

  addVisitedFile: (name, content) => set((state) => {
    // Keep only the 5 most recent unique files
    const filtered = state.visitedFiles.filter(f => f.name !== name);
    return {
      visitedFiles: [{ name, content }, ...filtered].slice(0, 5)
    };
  }),

  appendTerminal: (text) => set((state) => ({ 
    terminalOutput: state.terminalOutput + text 
  })),

  addAIMessage: (text) => set((state) => ({
    messages: [
      ...state.messages,
      {
        id: Math.random().toString(36).substring(2, 11),
        senderId: 'emerge-ai',
        senderName: 'Lead Architect',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        seenBy: [],
      },
    ],
  })),
}));
