import { useState, useEffect, useCallback, useRef } from 'react';

export type NetworkStatusType = 
  | 'ONLINE'
  | 'OFFLINE'
  | 'CONNECTION_LOST'
  | 'SERVER_UNREACHABLE'
  | 'CONNECTION_RESTORED'
  | 'REQUEST_TIMEOUT';

export type NetworkModalType =
  | 'NO_INTERNET'
  | 'MOBILE_DATA_OFF'
  | 'CONNECTION_LOST'
  | 'SERVER_UNREACHABLE'
  | 'ACTION_REQUIRES_INTERNET'
  | 'UPLOAD_INTERRUPTED'
  | 'LOGIN_OFFLINE'
  | 'REQUEST_TIMEOUT';

export interface NetworkModalState {
  isOpen: boolean;
  type: NetworkModalType;
  onRetry?: () => void;
  customTitle?: string;
  customMessage?: string;
}

// Global listeners for network restoration and safe request retries
const safeReconnectCallbacks = new Set<() => void>();

export function registerSafeReconnectCallback(cb: () => void): () => void {
  safeReconnectCallbacks.add(cb);
  return () => {
    safeReconnectCallbacks.delete(cb);
  };
}

export function triggerSafeReconnectSync(): void {
  safeReconnectCallbacks.forEach(cb => {
    try {
      cb();
    } catch (err) {
      console.warn('Error in safe reconnect callback:', err);
    }
  });
}

// Singleton modal event bus to allow opening network modal from anywhere
let globalSetModal: ((modal: NetworkModalState) => void) | null = null;

export function openNetworkModal(
  type: NetworkModalType = 'NO_INTERNET',
  onRetry?: () => void,
  customOptions?: { title?: string; message?: string }
): void {
  if (globalSetModal) {
    globalSetModal({
      isOpen: true,
      type,
      onRetry,
      customTitle: customOptions?.title,
      customMessage: customOptions?.message
    });
  }
}

export function closeNetworkModal(): void {
  if (globalSetModal) {
    globalSetModal({
      isOpen: false,
      type: 'NO_INTERNET'
    });
  }
}

export function useNetworkStatus(onReconnectCallback?: () => void) {
  const [status, setStatus] = useState<NetworkStatusType>(() => {
    if (typeof navigator === 'undefined') return 'ONLINE';
    return navigator.onLine ? 'ONLINE' : 'OFFLINE';
  });

  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [showReconnectedAlert, setShowReconnectedAlert] = useState<boolean>(false);
  const [modalState, setModalState] = useState<NetworkModalState>({
    isOpen: false,
    type: 'NO_INTERNET'
  });

  const wasOnlineRef = useRef<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const reconnectedTimeoutRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<any>(null);

  // Bind singleton modal controller
  useEffect(() => {
    globalSetModal = setModalState;
    return () => {
      if (globalSetModal === setModalState) {
        globalSetModal = null;
      }
    };
  }, []);

  // Register optional component-level reconnect callback
  useEffect(() => {
    if (onReconnectCallback) {
      return registerSafeReconnectCallback(onReconnectCallback);
    }
  }, [onReconnectCallback]);

  /**
   * Verify real end-to-end communication with backend via /api/health
   */
  const checkHealth = useCallback(async (silent = false): Promise<boolean> => {
    if (typeof window === 'undefined') return true;

    // Fast path: browser is definitely offline
    if (!navigator.onLine) {
      const newStatus = wasOnlineRef.current ? 'CONNECTION_LOST' : 'OFFLINE';
      setStatus(newStatus);
      wasOnlineRef.current = false;
      return false;
    }

    if (!silent) setIsChecking(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const hadDisconnected = !wasOnlineRef.current || status === 'OFFLINE' || status === 'CONNECTION_LOST' || status === 'SERVER_UNREACHABLE';

        if (hadDisconnected) {
          setStatus('CONNECTION_RESTORED');
          setShowReconnectedAlert(true);
          wasOnlineRef.current = true;

          // Trigger safe read-only synchronization
          triggerSafeReconnectSync();

          // Auto-transition to stable ONLINE after notification
          if (reconnectedTimeoutRef.current) clearTimeout(reconnectedTimeoutRef.current);
          reconnectedTimeoutRef.current = setTimeout(() => {
            setStatus('ONLINE');
            setShowReconnectedAlert(false);
          }, 4000);
        } else {
          setStatus('ONLINE');
          wasOnlineRef.current = true;
        }

        if (!silent) setIsChecking(false);
        return true;
      } else {
        // HTTP error on health check -> server issue
        setStatus('SERVER_UNREACHABLE');
        wasOnlineRef.current = false;
        if (!silent) setIsChecking(false);
        return false;
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (!silent) setIsChecking(false);

      if (err.name === 'AbortError') {
        setStatus('REQUEST_TIMEOUT');
        return false;
      }

      // If navigator is still reported as online but fetch failed, server is unreachable
      if (navigator.onLine) {
        setStatus('SERVER_UNREACHABLE');
      } else {
        setStatus(wasOnlineRef.current ? 'CONNECTION_LOST' : 'OFFLINE');
      }
      wasOnlineRef.current = false;
      return false;
    }
  }, [status]);

  // Handle browser 'online' event
  const handleOnline = useCallback(() => {
    // Probe backend to confirm actual internet access through captive portals / mobile data
    checkHealth(false);
  }, [checkHealth]);

  // Handle browser 'offline' event
  const handleOffline = useCallback(() => {
    setStatus('CONNECTION_LOST');
    wasOnlineRef.current = false;
    setShowReconnectedAlert(false);
  }, []);

  // Listen to browser network changes & visibility
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab brought into foreground: check connection quietly
        checkHealth(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial background health check
    checkHealth(true);

    // Non-intrusive heartbeat check every 25s when tab is active
    heartbeatIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkHealth(true);
      }
    }, 25000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (reconnectedTimeoutRef.current) clearTimeout(reconnectedTimeoutRef.current);
    };
  }, [handleOnline, handleOffline, checkHealth]);

  const dismissReconnectedAlert = useCallback(() => {
    setShowReconnectedAlert(false);
    if (status === 'CONNECTION_RESTORED') {
      setStatus('ONLINE');
    }
  }, [status]);

  const isOnline = status === 'ONLINE' || status === 'CONNECTION_RESTORED';

  return {
    status,
    isOnline,
    isChecking,
    showReconnectedAlert,
    dismissReconnectedAlert,
    checkHealth,
    checkConnectionHealth: checkHealth,
    modalState,
    setModalState,
    openModal: openNetworkModal,
    closeModal: closeNetworkModal,
  };
}
