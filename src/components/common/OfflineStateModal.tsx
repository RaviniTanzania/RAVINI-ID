import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../../lib/useNativeBridge';

interface OfflineStateModalProps {
  language?: 'sw' | 'en';
}

export const OfflineStateModal: React.FC<OfflineStateModalProps> = ({ language = 'sw' }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    triggerHaptic();
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      if (navigator.onLine) {
        setIsOffline(false);
      }
    }, 1200);
  };

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 flex flex-col items-center animate-scaleUp">
        <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mb-4 shadow-sm">
          <WifiOff className="w-8 h-8 animate-pulse" />
        </div>

        <h3 className="text-lg font-black text-gray-900 mb-2 tracking-tight">
          HAUNA INTERNET
        </h3>

        <p className="text-xs text-gray-600 leading-relaxed mb-4">
          Tafadhali washa Mobile Data au Wi-Fi kisha ujaribu tena.
        </p>

        <p className="text-[11px] text-gray-400 bg-gray-50 rounded-xl p-2.5 mb-6 border border-gray-100">
          🛡️ Data zako zote ziko salama na zimehifadhiwa kwenye mfumo wa <strong>RAVINI</strong>.
        </p>

        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-red-200 cursor-pointer active:scale-95 transition-transform uppercase tracking-wider"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>JARIBU TENA</span>
        </button>
      </div>
    </div>
  );
};
