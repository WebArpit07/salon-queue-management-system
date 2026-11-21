import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import socket from '../lib/socket';

const QueueContext = createContext();

const initialQueueState = {
  salonConfig: {
    salonNameEn: 'Studio Kashi Salon',
    salonNameGu: 'સ્ટુડિયો કાશી સલૂન',
    openTime: '09:00',
    closeTime: '21:00',
    isQueueOpen: true,
    onlineCutoffMinutes: 30,
  },
  barbers: [],
  services: [],
  waiting: [],
  called: [],
  inChair: [],
  upNextTop5: [],
  todayStats: {
    servedCount: 0,
    avgWaitMin: 0,
    noShowCount: 0,
    waitingCount: 0,
  },
  onlineStatus: {
    isOpen: true,
    reason: 'open',
    closeTimeFormatted: '21:00',
  },
  timestamp: null,
};

export const QueueProvider = ({ children }) => {
  const [queueState, setQueueState] = useState(initialQueueState);
  const [services, setServices] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial bootstrap data (services catalog) and queue state
  const refreshQueueState = useCallback(async () => {
    try {
      // 1. Fetch bootstrap for full active services catalog
      const bootstrapRes = await api.get('/api/bootstrap');
      if (bootstrapRes.data?.services) {
        setServices(bootstrapRes.data.services);
      }

      // 2. Fetch live queue state snapshot
      const stateRes = await api.get('/api/queue/state');
      if (stateRes.data) {
        setQueueState((prev) => ({
          ...prev,
          ...stateRes.data,
          services: bootstrapRes.data?.services || prev.services,
        }));
      }
    } catch (err) {
      console.warn('[QueueContext] Failed to fetch state:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshQueueState();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const onQueueUpdated = (freshSnapshot) => {
      if (freshSnapshot) {
        setQueueState((prev) => ({
          ...prev,
          ...freshSnapshot,
          // Preserve services if freshSnapshot did not embed services
          services: freshSnapshot.services || prev.services,
        }));
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('queue:updated', onQueueUpdated);

    // Initial socket connection status check
    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('queue:updated', onQueueUpdated);
    };
  }, [refreshQueueState]);

  return (
    <QueueContext.Provider
      value={{
        queueState,
        services: services.length > 0 ? services : queueState.services || [],
        barbers: queueState.barbers || [],
        todayStats: queueState.todayStats || initialQueueState.todayStats,
        onlineStatus: queueState.onlineStatus || initialQueueState.onlineStatus,
        waiting: queueState.waiting || [],
        upNextTop5: queueState.upNextTop5 || [],
        salonConfig: queueState.salonConfig || initialQueueState.salonConfig,
        isConnected,
        isLoading,
        refreshQueueState,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};

export default QueueContext;
