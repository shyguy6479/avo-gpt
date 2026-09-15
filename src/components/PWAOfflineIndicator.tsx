import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const PWAOfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  if (showReconnected) {
    return (
      <div className="fixed bottom-5 left-5 z-[9999] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-600/90 text-white text-xs font-semibold shadow-2xl backdrop-blur-md border border-emerald-400/40 animate-in slide-in-from-bottom duration-300">
        <Wifi className="w-4 h-4 text-emerald-100" />
        <span>Back online — Connected to Avo AI Cloud</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 left-5 z-[9999] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-amber-600/95 text-white text-xs font-semibold shadow-2xl backdrop-blur-md border border-amber-400/40 animate-in slide-in-from-bottom duration-300">
      <WifiOff className="w-4 h-4 text-amber-100 animate-pulse" />
      <span>Offline Mode — Cached local workspace active</span>
    </div>
  );
};
