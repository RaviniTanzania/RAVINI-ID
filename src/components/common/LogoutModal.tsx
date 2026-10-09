import React from 'react';
import { LogOut } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-100 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
          <LogOut className="w-6 h-6 stroke-[2.2px]" />
        </div>
        
        <h3 className="text-lg font-bold text-neutral-900">Thibitisha Kuondoka</h3>
        <p className="text-xs text-neutral-500 mt-1 mb-5">
          Je, una uhakika unataka kuondoka kwenye app ya RAVINI?
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full py-2.5 px-4 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
          >
            Hapana, Baki Ndani
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-2.5 px-4 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            {loading ? 'Inaondoka...' : 'Ndiyo, Ondoka Sasa'}
          </button>
        </div>
      </div>
    </div>
  );
};
