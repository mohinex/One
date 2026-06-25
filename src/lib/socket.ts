import { io, Socket } from "socket.io-client";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/auth.store";

let socket: Socket | null = null;

export function connectSocket(accessToken: string): Socket {
  if (socket) {
    socket.disconnect();
  }

  // Use location origin since socket is hosted by the same process
  const socketUrl = window.location.origin;

  socket = io(socketUrl, {
    auth: { token: accessToken },
    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on("connect", () => {
    console.log("[Socket.IO] Client connected to live events gateway");
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket.IO] Client disconnected from live events gateway. Reason:", reason);
  });

  socket.on("connect_error", (err) => {
    console.warn("[Socket.IO] Connection handshake error or server unavailable:", err.message);
  });

  socket.on("reconnect_attempt", (attempt) => {
    console.log(`[Socket.IO] Reconnection attempt #${attempt}`);
  });

  socket.on("reconnect", (attemptNumber) => {
    console.log(`[Socket.IO] Reconnected successfully after ${attemptNumber} attempts`);
  });

  socket.on("reconnect_failed", () => {
    console.warn("[Socket.IO] Socket reconnection failed completely.");
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Custom React Hook to retrieve active socket and handle automatic cleanup / token sync
export function useSocket() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const [activeSocket, setActiveSocket] = useState<Socket | null>(socket);

  useEffect(() => {
    if (accessToken && user) {
      const s = connectSocket(accessToken);
      setActiveSocket(s);
    } else {
      disconnectSocket();
      setActiveSocket(null);
    }

    return () => {
      // Do not hard-disconnect on every tiny re-render unless tokens change
    };
  }, [accessToken, user?.id]);

  return activeSocket;
}
