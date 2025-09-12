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
  // ✅ FIX: Use a ref to hold the socket instance. This will not trigger re-renders.
  const socketRef = useRef<Socket | null>(null);
  
  // State is now only used to report the connection status, not to hold the instance.
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  
  const { isAuthenticated, logout } = useContext(AuthContext);

  useEffect(() => {
    // This effect now robustly manages the socket's lifecycle.
    if (isAuthenticated) {
      // Only create a socket if one doesn't already exist in our ref.
      if (!socketRef.current) {
        console.log('User is authenticated, creating new socket connection.');
        
        const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:5000', {
          withCredentials: true,
          transports: ['websocket', 'polling'],
          secure: process.env.NODE_ENV === 'production',
        });

        // Store the instance in the ref for persistence.
        socketRef.current = newSocket;

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
            console.error('Socket authentication failed. Logging out.');
            logout();
          }
        });
      }
    } else {
      // If the user is not authenticated, ensure any existing socket is disconnected.
      if (socketRef.current) {
        console.log('User is not authenticated, cleaning up existing socket.');
        socketRef.current.close();
        socketRef.current = null;
        setIsSocketConnected(false);
      }
    }

    // This cleanup function will run when the SocketProvider itself is unmounted.
    return () => {
      if (socketRef.current) {
        console.log('SocketProvider is unmounting, ensuring socket is closed.');
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, logout]);

  // The context value provides the current socket instance from the ref.
  const contextValue = useMemo(() => ({
    socket: socketRef.current,
    isSocketConnected,
  }), [isSocketConnected]); // Only re-calculate when the connection status changes.

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

