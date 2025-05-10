import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (token: string) => {
  if (socket) return socket;

  socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
    auth: {
      token,
    },
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};