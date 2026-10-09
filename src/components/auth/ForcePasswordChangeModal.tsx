import React, { useState } from 'react';
import { ShieldAlert, Key, Eye, EyeOff, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { NmyUser } from '../../types/nmyTypes';
import { Language } from '../../lib/translations';
import { NmyApiClient } from '../../lib/nmyApiClient';

interface ForcePasswordChangeModalProps {
  currentUser: NmyUser;
  language?: Language;
  onPasswordChanged: (updatedUser: NmyUser) => void;
}

export const ForcePasswordChangeModal: React.FC<ForcePasswordChangeModalProps> = ({
  currentUser,
  language = 'sw',
  onPasswordChanged
}) => {
  const [currentPassword, setCurrentPassword] = useState('1234');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // SUPER_ADMIN is exempt from forced password change
  if (currentUser.role === 'SUPER_ADMIN' || !currentUser.mustChangePassword) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 4) {
      setErrorMsg(language === 'sw' ? 'Nenosiri jipya linapaswa kuwa na angalau tarakimu 4.' : 'New password must be at least 4 characters.');
      return;
    }

    if (newPassword === '1234') {
      setErrorMsg(language === 'sw' ? 'Huwezi kutumia 1234 tena. Weka nenosiri lako salama.' : 'You cannot reuse 1234. Please choose a secure password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(language === 'sw' ? 'Nenosiri jipya halijalingana na uthibitisho.' : 'Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await NmyApiClient.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });

      if (!res.success) {
        setErrorMsg(res.message || (language === 'sw' ? 'Hitilafu imetokea.' : 'An error occurred.'));
        setIsSubmitting(false);
        return;
      }

      const updatedUser: NmyUser = {
        ...currentUser,
        mustChangePassword: false
      };

      setSuccessMsg(language === 'sw' ? 'Nenosiri limebadilishwa! Karibu kwenye RAVINI.' : 'Password updated! Welcome back.');

      setTimeout(() => {
        setIsSubmitting(false);
        onPasswordChanged(updatedUser);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || (language === 'sw' ? 'Hitilafu ya mtandao wakati wa kubadilisha nenosiri.' : 'Network error.'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border-2 border-red-600 overflow-hidden p-6 sm:p-7 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-black text-gray-900">
            {language === 'sw' ? 'Badilisha Nenosiri Lako Sasa' : 'Mandatory Password Change'}
          </h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            {language === 'sw'
              ? 'Akaunti yako iliwekwa nenosiri la muda (1234) na Huduma kwa Wateja. Kwa usalama wako na wa pochi yako ya RVC, lazima uweke nenosiri lako jipya kabla ya kuendelea.'
              : 'Your password was reset to a temporary password (1234). You must create a new private password before using RAVINI.'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {language === 'sw' ? 'Nenosiri la Muda' : 'Temporary Password'}
            </label>
            <input
              type="text"
              readOnly
              value={currentPassword}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-100 border border-gray-300 rounded-xl font-mono text-gray-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {language === 'sw' ? 'Nenosiri Jipya la Siri' : 'New Secure Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:border-red-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {language === 'sw' ? 'Thibitisha Nenosiri Jipya' : 'Confirm New Password'}
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:border-red-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black text-sm rounded-xl shadow-lg shadow-red-600/30 cursor-pointer transition-all disabled:opacity-50 mt-2"
          >
            {isSubmitting 
              ? (language === 'sw' ? 'Inahifadhi Nenosiri...' : 'Saving Password...') 
              : (language === 'sw' ? 'Weka Nenosiri & Anza Kutumia' : 'Set Password & Continue')}
          </button>
        </form>
      </div>
    </div>
  );
};
