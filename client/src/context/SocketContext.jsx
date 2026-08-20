import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsersMap, setOnlineUsersMap] = useState({});

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = window.location.origin;
    const newSocket = io(socketUrl, {
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket connected:', newSocket.id);
    });

    newSocket.on('user_status_change', ({ userId, isOnline, lastSeen }) => {
      setOnlineUsersMap((prev) => ({
        ...prev,
        [userId]: { isOnline, lastSeen }
      }));
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user?.id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsersMap }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context;
};
