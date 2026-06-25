import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let ioInstance: Server | null = null;
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "fallback-access-secret-32-chars-long";

export function initSocket(server: any): Server {
  ioInstance = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // JWT socket.io authorization middleware check
  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    if (!token) {
      return next(new Error("Socket.io authentication token is missing."));
    }

    try {
      const decoded = jwt.verify(token as string, ACCESS_SECRET) as { sub: string };
      (socket as any).userId = decoded.sub;
      next();
    } catch {
      next(new Error("Socket.io connection rejected: Invalid verification session."));
    }
  });

  ioInstance.on("connection", (socket: any) => {
    const userId = socket.userId;
    console.log(`[Socket.IO] Client connected to personal live-room: user_${userId} (ID: ${socket.id})`);
    
    // Join room user_${userId} on connection
    socket.join(`user_${userId}`);

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client user_${userId} detached socket subscription.`);
    });
  });

  return ioInstance;
}

export function getSocketIO(): Server {
  if (!ioInstance) {
    throw new Error("Socket.IO is not initialized yet on server startup.");
  }
  return ioInstance;
}

// Global active emitter helpers
export function emitUsageUpdated(userId: string, usage: any) {
  if (!ioInstance) return;
  ioInstance.to(`user_${userId}`).emit("usage:updated", usage);
}

export function emitNewNotification(userId: string, notification: any) {
  if (!ioInstance) return;
  ioInstance.to(`user_${userId}`).emit("notification:new", notification);
}

export function emitCampaignActive(banner: any) {
  if (!ioInstance) return;
  ioInstance.emit("campaign:active", banner); // broadcast to all
}
