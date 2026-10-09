import React from 'react';
import { NetworkStatusType } from '../../lib/useNetworkStatus';
import { triggerHaptic } from '../../lib/useNativeBridge';

interface TopConnectionIndicatorProps {
  status: NetworkStatusType;
  isChecking: boolean;
  onCheckHealth: () => void;
  onOpenModal?: () => void;
}

export const TopConnectionIndicator: React.FC<TopConnectionIndicatorProps> = ({
  status,
  isChecking,
  onCheckHealth,
  onOpenModal,
}) => {
  const handleClick = () => {
    triggerHaptic();
    onCheckHealth();
    if (status !== 'ONLINE' && onOpenModal) {
      onOpenModal();
    }
  };

  if (isChecking) {
    return (
      <button
        id="connection-indicator-checking"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold shadow-xs cursor-pointer hover:bg-amber-100 transition-colors"
        title="RAVINI inakagua muunganisho wa mfumo..."
      >
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
        <span>🟡 Inaunganisha...</span>
      </button>
    );
  }

  if (status === 'ONLINE') {
    return (
      <button
        id="connection-indicator-online"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold shadow-xs cursor-pointer hover:bg-emerald-100 transition-colors"
        title="Muunganisho uko thabiti. Bofya ili kukagua tena."
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span>🟢 Imeunganishwa</span>
      </button>
    );
  }

  if (status === 'SERVER_UNREACHABLE') {
    return (
      <button
        id="connection-indicator-server-down"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-300 text-rose-800 text-[11px] font-bold shadow-xs cursor-pointer hover:bg-rose-100 transition-colors animate-pulse"
        title="Seva haijibu kwa sasa. Bofya ili kujaribu tena."
      >
        <span className="w-2 h-2 rounded-full bg-rose-600"></span>
        <span>🔴 Seva haijibu</span>
      </button>
    );
  }

  // OFFLINE or CONNECTION_LOST or REQUEST_TIMEOUT
  return (
    <button
      id="connection-indicator-offline"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-300 text-red-800 text-[11px] font-bold shadow-xs cursor-pointer hover:bg-red-100 transition-colors"
      title="Hakuna intaneti. Bofya ili kujaribu tena."
    >
      <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
      <span>🔴 Hakuna intaneti</span>
    </button>
  );
};
