import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
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
  const socketRef = useRef<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const { isAuthenticated, logout } = useContext(AuthContext);

  useEffect(() => {
    if (isAuthenticated) {
      if (!socketRef.current) {
        console.log('[SocketContext] User authenticated, creating new socket connection...');
        
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:5000';

        const newSocket = io(backendUrl, {
          withCredentials: true,
          transports: ['websocket', 'polling'],
          secure: process.env.NODE_ENV === 'production',
          
          // ✅ --- THIS IS THE FINAL FIX ---
          // This tells the client to connect to the specific path
          // that the server is listening on.
          path: '/socket.io/',
          // --- END OF FIX ---
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
          console.log('✅ [SocketContext] Socket connected successfully:', newSocket.id);
          setIsSocketConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
          console.warn('[SocketContext] Socket disconnected:', reason);
          setIsSocketConnected(false);
        });

        newSocket.on('connect_error', (err) => {
          console.error('[SocketContext] Socket connection error:', err.message);
          if (err.message === 'unauthorized') {
            console.error('[SocketContext] Socket authentication failed. Triggering protective logout.');
            logout();
          }
        });
      }
    } else {
      if (socketRef.current) {
        console.log('[SocketContext] User is not authenticated, closing existing socket.');
        socketRef.current.close();
        socketRef.current = null;
        setIsSocketConnected(false);
      }
    }

    return () => {
      if (socketRef.current) {
        console.log('[SocketContext] Provider unmounting, ensuring socket is closed.');
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, logout]);

  const contextValue = useMemo(() => ({
    socket: socketRef.current,
    isSocketConnected,
  }), [isSocketConnected]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

