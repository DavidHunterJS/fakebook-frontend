// src/context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import useAuth from '../hooks/useAuth'; // Assuming useAuth provides isAuthenticated

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Get the isAuthenticated status from your auth hook
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
        withCredentials: true,  
      });

      setSocket(newSocket);

      const onConnect = () => {
        console.log('✅ Socket connected successfully using session cookie.');
        setIsConnected(true);
      };

      const onDisconnect = () => {
        console.log('Socket disconnected.');
        setIsConnected(false);
      };

      newSocket.on('connect', onConnect);
      newSocket.on('disconnect', onDisconnect);

      return () => {
        newSocket.off('connect', onConnect);
        newSocket.off('disconnect', onDisconnect);
        newSocket.disconnect();
      };
    }
  // ❗️ Change the dependency array
  }, [isAuthenticated]);

  const value = { socket, isConnected };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};