import { io, Socket } from "socket.io-client";
import { BACKEND_BASE_URL } from "./api";

let socketInstance: Socket | null = null;

export const getSocket = (token: string): Socket => {
  if (!socketInstance) {
    socketInstance = io(BACKEND_BASE_URL, {
      auth: { token },
      autoConnect: false,
      transports: ["polling", "websocket"],
    });
  } else {
    // Dynamically update authorization credentials before handshake
    socketInstance.auth = { token };
  }
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
