import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
// @ts-ignore — y-socket.io ships CJS/ESM without full TS types
import { YSocketIO } from 'y-socket.io/dist/server';

interface SetupSocketOptions {
  server: HttpServer;
  corsOrigin: string | string[];
}

export const initSocketService = ({ server, corsOrigin }: SetupSocketOptions) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── y-socket.io: initialize FIRST, before any middleware ─────────────────
  // CRITICAL: y-socket.io creates its own sub-namespace (yjs|<room>).
  // If we attach auth middleware to io.use(), it blocks that sub-namespace.
  // y-socket.io must be initialized on the io instance with NO global auth middleware.
  const ySocketIO = new YSocketIO(io, {
    gcEnabled: false, // Keep room state so late-joiners get full doc
  });
  ySocketIO.initialize();

  console.log('[SOCKET] y-socket.io CRDT engine initialized');

  // ── Default namespace: app events (chat relay, project join) ─────────────
  // Auth middleware applied ONLY to the default namespace connection handler.
  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token || (socket.handshake.query?.token as string);

    if (!token) {
      console.warn(`[SOCKET] No token, rejecting ${socket.id}`);
      socket.disconnect(true);
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      (socket as any).user = decoded;
    } catch {
      console.warn(`[SOCKET] Invalid token, rejecting ${socket.id}`);
      socket.disconnect(true);
      return;
    }

    const user = (socket as any).user;
    console.log(`[SOCKET] Authenticated: ${socket.id} (${user?.id || user?.sub || 'unknown'})`);

    // Room join — used by app-level broadcast (e.g. notifications, cursor list)
    socket.on('join-project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      console.log(`[SOCKET] ${socket.id} joined room project:${projectId}`);
    });

    // ── Chat relay over Socket.IO (fallback alongside Yjs array) ─────────────
    // This lets clients that aren't in sync yet still receive messages instantly.
    socket.on('chat-message', (data: { projectId: string; message: any }) => {
      const { projectId, message } = data;
      // Broadcast to all others in this project room
      socket.to(`project:${projectId}`).emit('chat-message', message);
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] Disconnected: ${socket.id}`);
    });
  });

  return io;
};
