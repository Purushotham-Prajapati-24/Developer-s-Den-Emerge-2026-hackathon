import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import WebSocket from 'ws';
import jwt from 'jsonwebtoken';
// @ts-ignore
import { setupWSConnection } from 'y-websocket/bin/utils';

interface SetupSocketOptions {
  server: HttpServer;
  corsOrigin: string;
}

export const initSocketService = ({ server, corsOrigin }: SetupSocketOptions) => {
  const io = new SocketIOServer(server, {
    cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
  });

  const wss = new WebSocket.Server({ noServer: true });

  wss.on('connection', (conn: any, req: any, { documentName }: any) => {
    console.log(`[YJS-SYNC] Client connected to collaborative doc: ${documentName}`);
    setupWSConnection(conn, req, { docName: documentName, gc: true });
  });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    
    if (!url.pathname.startsWith('/socket.io')) {
      const documentName = url.pathname.substring(1) || 'default-room';
      
      // Basic Security: Check for 'token' in query or Authorization header
      const token = url.searchParams.get('token') || (request.headers['authorization'] as string)?.split(' ')[1];
      
      if (!token) {
        console.warn(`[YJS-AUTH] Disconnecting anonymous client for room: ${documentName}`);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      try {
        jwt.verify(token, process.env.JWT_SECRET as string);
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request, { documentName });
        });
      } catch (err) {
        console.warn(`[YJS-AUTH] Invalid token for room: ${documentName}`);
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
      }
    }
  });

  return io;
};
