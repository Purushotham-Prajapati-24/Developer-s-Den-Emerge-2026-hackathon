import * as Y from 'yjs';
// @ts-ignore
import { WebsocketProvider } from 'y-websocket';
// @ts-ignore
import { MonacoBinding } from 'y-monaco';
import { editor } from 'monaco-editor';
import { useCollaborationStore } from '../../store/useCollaborationStore';
import { useAuthStore } from '../../store/useAuthStore';

interface CollaborationSetupParams {
  projectId: string;
  user: { id: string; name: string; color: string };
  editor: editor.IStandaloneCodeEditor;
  monacoModel: editor.ITextModel;
}

export class CollaborationEngine {
  private doc: Y.Doc;
  private provider: WebsocketProvider | null = null;
  private binding: MonacoBinding | null = null;

  constructor() {
    this.doc = new Y.Doc();
  }
  public connect({ projectId, user, editor, monacoModel }: CollaborationSetupParams) {
    const ytext = this.doc.getText('monaco');
    const ymessages = this.doc.getArray('messages');
    const ymeta = this.doc.getMap('metadata');

    // Clean up any existing connection first
    this.disconnect();

    // Use the same WebSocket server as the main backend (8080)
    const serverUrl = import.meta.env.VITE_WS_SERVER_URL || 'ws://localhost:8080';
    const token = useAuthStore.getState().accessToken;
    
    console.log(`[YJS-SYNC] Connecting to ${serverUrl} for project ${projectId}...`);

    this.provider = new WebsocketProvider(serverUrl, projectId, this.doc, {
      params: token ? { token } : {}
    });

    this.provider.on('status', (event: any) => {
      console.log(`[YJS-SYNC] Status: ${event.status}`); // 'connected', 'disconnected', 'connecting'
    });

    this.provider.on('connection-error', (error: any) => {
      console.error('[YJS-SYNC] Connection Error:', error);
    });

    if (!this.provider) {
      throw new Error('Collaboration provider failed to initialize.');
    }

    const awareness = this.provider.awareness;

    // Presence / Awareness Setup
    const localId = user.id || 'anon-' + Math.random().toString(36).substr(2, 5);
    awareness.setLocalStateField('user', {
      id: localId,
      name: user.name,
      color: user.color,
    });

    // Sync active users to Zustand store (deduplicated by ID)
    awareness.on('change', () => {
      const states = Array.from(awareness.getStates().values());
      const uniqueUsersMap = new Map();
      
      states.forEach((s: any) => {
        const u = s.user;
        if (u && (u.id || u._id)) {
          const id = u.id || u._id;
          // Only add if not already present or if this state is more complete
          if (!uniqueUsersMap.has(id)) {
            uniqueUsersMap.set(id, u);
          }
        }
      });
      
      const users = Array.from(uniqueUsersMap.values());
      useCollaborationStore.getState().setUsers(users);
    });

    // Sync Messages to Zustand
    const syncMessages = () => {
      const messages = ymessages.map((item: any) => {
        // Resilience: Handle both new Y.Map structure and legacy plain objects
        if (typeof item?.toJSON === 'function') {
           return item.toJSON();
        }
        return item;
      });
      useCollaborationStore.getState().setMessages(messages as any);
    };

    ymessages.observeDeep((_event) => {
      syncMessages();
    });

    // Initial sync
    syncMessages();

    // Sync Metadata (Active File, etc.)
    ymeta.observe(() => {
      const activeFile = ymeta.get('activeFile') as string;
      if (activeFile) useCollaborationStore.getState().setActiveFile(activeFile);
    });

    // Bind Monaco
    this.binding = new MonacoBinding(
      ytext,
      monacoModel,
      new Set([editor]),
      awareness
    );

    // Save references to helper syncers on the engine if needed
    (window as any).__collabDoc = this.doc;
    (window as any).__collabMessages = ymessages;
    (window as any).__collabMeta = ymeta;

    return () => this.disconnect();
  }

  public sendMessage(text: string, sender: { id: string; name: string }) {
    const ymessages = this.doc.getArray('messages');
    
    // Create a Y.Map for the message to allow reactive field updates (like 'seenBy')
    const messageMap = new Y.Map();
    messageMap.set('id', Math.random().toString(36).substr(2, 9));
    messageMap.set('senderId', sender.id);
    messageMap.set('senderName', sender.name);
    messageMap.set('text', text);
    messageMap.set('timestamp', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    messageMap.set('seenBy', []);

    ymessages.push([messageMap]);
  }

  public disconnect() {
    this.binding?.destroy();
    this.provider?.disconnect();
    this.doc?.destroy();
  }
}
