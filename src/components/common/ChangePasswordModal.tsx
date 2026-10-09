import React, { useState } from 'react';
import { X, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { NmyApiClient } from '../../lib/nmyApiClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Tafadhali jaza nafasi zote.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Maneno mapya ya siri hayafanani.');
      return;
    }

    if (newPassword.length < 4) {
      setError('Neno jipya la siri lazima liwe na angalau tarakimu 4.');
      return;
    }

    setLoading(true);
    try {
      const res = await NmyApiClient.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });

      if (res.success) {
        setSuccess('Neno la siri limebadilishwa kikamilifu!');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(res.message || 'Hitilafu ya kubadili neno la siri.');
      }
    } catch {
      setError('Muunganisho wa mtandao unasumbua.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-neutral-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">Badilisha Neno la Siri</h3>
            <p className="text-[11px] text-neutral-500">Weka neno la siri la sasa na jipya</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Neno la Siri la Sasa
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Weka neno la siri la sasa"
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-red-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Neno Jipya la Siri
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Weka neno jipya"
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-red-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Rudia Neno Jipya la Siri
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Rudia neno jipya"
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-red-500 focus:bg-white"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center cursor-pointer"
            >
              {loading ? 'Inasasisha...' : 'BADILISHA NENO LA SIRI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
