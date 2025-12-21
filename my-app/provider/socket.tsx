"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type SocketContextType = {
  socket: Socket | null;
  connect: () => void;
  disconnect: () => void;
};

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const connect = () => {
    if (!socketRef.current) {
      socketRef.current = io("http://localhost:8000", {
        autoConnect: false,
      });

      socketRef.current.connect();
      setSocket(socketRef.current);
    }
  };

  const disconnect = () => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setSocket(null);
  };

  return (
    <SocketContext.Provider value={{ socket, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used inside SocketProvider");
  }
  return context;
};
