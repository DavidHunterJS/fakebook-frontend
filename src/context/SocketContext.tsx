import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import AuthContext from './AuthContext';

interface ISocketContext {
  socket: Socket | null;
  isSocketConnected: boolean;
}

const SocketContext = createContext<ISocketContext>({
  socket: null,
  isSocketConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  
  const { isAuthenticated, logout } = useContext(AuthContext);

  useEffect(() => {
    // This effect now correctly handles the socket lifecycle based ONLY on the
    // user's authentication status, preventing the infinite loop.
    if (isAuthenticated) {
      const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        secure: process.env.NODE_ENV === 'production',
      });

      setSocket(newSocket);
      
      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        setIsSocketConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.warn('Socket disconnected:', reason);
        setIsSocketConnected(false);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        if (err.message === 'unauthorized') {
          console.error('Socket authentication failed. Logging out to prevent loop.');
          logout(); // Trigger a logout if the session is rejected.
        }
      });

      // The cleanup function runs when the component unmounts or when `isAuthenticated` becomes false.
      return () => {
        console.log('Cleaning up socket connection.');
        newSocket.off('connect');
        newSocket.off('disconnect');
        newSocket.off('connect_error');
        newSocket.close();
        setSocket(null);
        setIsSocketConnected(false);
      };
    }
    // ✅ FIX: The effect no longer depends on `socket`, which breaks the infinite loop.
  }, [isAuthenticated, logout]);

  const contextValue = useMemo(() => ({
    socket,
    isSocketConnected,
  }), [socket, isSocketConnected]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

