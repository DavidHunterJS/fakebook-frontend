// src/contexts/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import useAuth from '../hooks/useAuth';

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
  const { token } = useAuth();

  useEffect(() => {
    // Only try to connect if we have a token
    if (token) {
      // Use the environment variable for the URL
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
        auth: { token },
        withCredentials: true,
      });

      setSocket(newSocket);

      const onConnect = () => {
        console.log('Socket connected');
        setIsConnected(true);
      };

      const onDisconnect = () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      };

      newSocket.on('connect', onConnect);
      newSocket.on('disconnect', onDisconnect);

      // Cleanup function to run when the component unmounts or token changes
      return () => {
        newSocket.off('connect', onConnect);
        newSocket.off('disconnect', onDisconnect);
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [token]); // Effect depends only on the token

  const value = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};