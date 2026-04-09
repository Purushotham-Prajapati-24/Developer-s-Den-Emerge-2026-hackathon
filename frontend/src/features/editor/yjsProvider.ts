import * as Y from 'yjs';
// @ts-ignore — y-socket.io client types not available
import { SocketIOProvider } from 'y-socket.io';
// @ts-ignore — y-monaco types not always available
import { MonacoBinding } from 'y-monaco';
import { editor } from 'monaco-editor';
import { useCollaborationStore } from '../../store/useCollaborationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { io, Socket } from 'socket.io-client';

// Serialize a Yjs Y.Map to a plain JS object safely
function serializeYMap(item: any): any {
  if (item && typeof item.toJSON === 'function') return item.toJSON();
  if (item && typeof item.get === 'function') {
    // Manual extraction from Y.Map
    return {
      id: item.get('id'),
      senderId: item.get('senderId'),
      senderName: item.get('senderName'),
      text: item.get('text'),
      timestamp: item.get('timestamp'),
      seenBy: item.get('seenBy') || [],
    };
  }
  return item;
}

interface CollaborationSetupParams {
  projectId: string;
  user: { id: string; name: string; color: string };
  editor: editor.IStandaloneCodeEditor;
  monacoModel: editor.ITextModel;
}

/**
 * CollaborationEngine
 *
 * Uses y-socket.io (SocketIOProvider) for Yjs CRDT sync — same approach
 * as reference repo (ankurdotio/docker-aws). The provider handles:
 *  - Full document state on connect (late-join support)
 *  - Incremental CRDT update relay between all clients
 *  - Awareness (cursor positions, presence)
 *
 * Also maintains a plain Socket.IO connection for app-level events
 * (chat relay, project room membership).
 */
export class CollaborationEngine {
  public doc: Y.Doc;
  private provider: SocketIOProvider | null = null;
  private binding: MonacoBinding | null = null;
  private appSocket: Socket | null = null;

  constructor() {
    this.doc = new Y.Doc();
  }

  public connect({ projectId, user, editor, monacoModel }: CollaborationSetupParams) {
    this.disconnectInternal();
    this.doc = new Y.Doc();

    // Backend URL — must be just the origin (e.g. http://localhost:8080)
    // y-socket.io appends its own namespace internally
    const serverUrl = (import.meta.env.VITE_WS_SERVER_URL || 'http://localhost:8080') as string;
    const token = useAuthStore.getState().accessToken || '';

    console.log(`[YJS] Connecting SocketIOProvider → ${serverUrl}, room="${projectId}"`);

    // ── Yjs CRDT Provider ─────────────────────────────────────────────────────
    this.provider = new SocketIOProvider(
      serverUrl,
      projectId,
      this.doc,
      {
        autoConnect: true,
        auth: { token },  // Sent in handshake.auth so backend can verify
      }
    );

    this.provider.on('connect', () => {
      console.log(`[YJS] ✅ SocketIOProvider connected to room "${projectId}"`);
    });

    this.provider.on('disconnect', (reason: string) => {
      console.warn(`[YJS] Disconnected from room "${projectId}": ${reason}`);
    });

    // ── Awareness: set local user state ──────────────────────────────────────
    this.provider.awareness.setLocalStateField('user', {
      id: user.id,
      name: user.name,
      color: user.color,
    });

    // ── Sync awareness → Zustand (collaborators list) ─────────────────────────
    const syncUsers = () => {
      if (!this.provider) return;
      const states = Array.from(this.provider.awareness.getStates().values()) as any[];
      const map = new Map<string, any>();
      states.forEach((s) => {
        const u = s?.user;
        if (u) {
          const id = u.id || u._id;
          if (id) map.set(id, u);
        }
      });
      useCollaborationStore.getState().setUsers(Array.from(map.values()));
    };
    this.provider.awareness.on('change', syncUsers);
    syncUsers();

    // ── Yjs shared text → Monaco binding ─────────────────────────────────────
    const ytext = this.doc.getText('monaco');
    this.binding = new MonacoBinding(
      ytext,
      monacoModel,
      new Set([editor]),
      this.provider.awareness
    );

    // ── Yjs shared array for chat messages ────────────────────────────────────
    const ymessages = this.doc.getArray<Y.Map<any>>('messages');

    const syncMessages = () => {
      const msgs = ymessages.map((item) => serializeYMap(item));
      useCollaborationStore.getState().setMessages(msgs);
    };
    ymessages.observeDeep(() => syncMessages());
    // Sync current state immediately
    syncMessages();

    // ── Yjs shared map for workspace metadata ─────────────────────────────────
    const ymeta = this.doc.getMap<string>('metadata');
    ymeta.observe(() => {
      const af = ymeta.get('activeFile');
      if (af) useCollaborationStore.getState().setActiveFile(af);
    });

    // ── Separate Socket.IO connection for app-level events ────────────────────
    // (chat relay, project room join)  — uses the default namespace
    this.appSocket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.appSocket.on('connect', () => {
      console.log(`[SOCKET] App socket connected: ${this.appSocket?.id}`);
      this.appSocket?.emit('join-project', projectId);
    });

    // Receive chat messages broadcast from other clients via the app socket
    this.appSocket.on('chat-message', (msg: any) => {
      // Only add if not already in Yjs (prevents duplicates for sender)
      const current = useCollaborationStore.getState().messages;
      if (!current.find((m: any) => m.id === msg.id)) {
        useCollaborationStore.getState().addMessage(msg);
      }
    });

    this.appSocket.on('disconnect', () => {
      console.log('[SOCKET] App socket disconnected');
    });

    // ── Expose globally for ChatPanel / ExecutionTerminal ─────────────────────
    (window as any).__collabDoc = this.doc;
    (window as any).__collabMessages = ymessages;
    (window as any).__collabMeta = ymeta;
    (window as any).__appSocket = this.appSocket;
    (window as any).__collabProjectId = projectId;

    // Clear awareness on unload
    const handleBeforeUnload = () => {
      this.provider?.awareness.setLocalStateField('user', null);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    (window as any).__beforeUnloadHandler = handleBeforeUnload;
  }

  public sendMessage(text: string, sender: { id: string; name: string }, projectId: string) {
    const msg = {
      id: Math.random().toString(36).substring(2, 11),
      senderId: sender.id,
      senderName: sender.name,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      seenBy: [],
    };

    // 1. Add to Yjs doc (syncs to late-joiners)
    const ymessages = this.doc.getArray<Y.Map<any>>('messages');
    if (ymessages) {
      const ymap = new Y.Map<any>();
      Object.entries(msg).forEach(([k, v]) => ymap.set(k, v));
      ymessages.push([ymap]);
    }

    // 2. Relay via app socket instantly (for real-time delivery)
    (window as any).__appSocket?.emit('chat-message', { projectId, message: msg });
  }

  private disconnectInternal() {
    // Destroy in correct order: binding → awareness → provider → socket
    this.binding?.destroy();
    this.binding = null;

    if (this.provider) {
      this.provider.awareness.destroy();
      this.provider.disconnect();
      this.provider = null;
    }

    if (this.appSocket) {
      this.appSocket.disconnect();
      this.appSocket = null;
    }

    const h = (window as any).__beforeUnloadHandler;
    if (h) {
      window.removeEventListener('beforeunload', h);
      (window as any).__beforeUnloadHandler = null;
    }

    (window as any).__collabDoc = null;
    (window as any).__collabMessages = null;
    (window as any).__collabMeta = null;
    (window as any).__appSocket = null;
    (window as any).__collabProjectId = null;
  }

  public disconnect() {
    this.disconnectInternal();
    this.doc?.destroy();
  }
}
