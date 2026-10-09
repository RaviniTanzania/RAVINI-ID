import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, CheckCircle2, ChevronRight, X, Info } from 'lucide-react';
import { PushClient } from '../../lib/pushClient';
import { NmyApiClient } from '../../lib/nmyApiClient';

interface Props {
  userRole?: string;
  onPermissionChange?: (granted: boolean) => void;
}

const DISMISS_KEY = 'ravini_notif_banner_dismissed';

export const NotificationPermissionBanner: React.FC<Props> = ({ onPermissionChange }) => {
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DISMISS_KEY) === 'true';
  });
  const [showSettingsHelp, setShowSettingsHelp] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [justEnabled, setJustEnabled] = useState(false);

  const checkAndSyncPermission = useCallback(async () => {
    if (!PushClient.isSupported()) {
      setPermissionState('unsupported');
      return;
    }

    let current: NotificationPermission = 'default';
    if (PushClient.isNative()) {
      const nativePerm = await PushClient.checkNativePermission();
      current = nativePerm === 'granted' ? 'granted' : nativePerm === 'denied' ? 'denied' : 'default';
    } else {
      current = PushClient.getPermissionState();
    }
    setPermissionState(current);

    if (current === 'granted') {
      const token = NmyApiClient.getToken();
      if (token) {
        PushClient.autoRegisterIfGranted(token).catch(() => {});
      }
      if (onPermissionChange) onPermissionChange(true);
    } else {
      if (onPermissionChange) onPermissionChange(false);
    }
  }, [onPermissionChange]);

  useEffect(() => {
    checkAndSyncPermission();

    const handleFocus = () => {
      checkAndSyncPermission();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAndSyncPermission();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkAndSyncPermission]);

  // If granted or dismissed or unsupported, do not display nagging banner
  if (permissionState === 'granted' && !justEnabled) {
    return null;
  }

  if (permissionState === 'unsupported' || dismissed) {
    return null;
  }

  const handleRequestPermission = async () => {
    if (permissionState === 'denied') {
      // Cannot request via prompt once denied; open helper guide for device/browser settings
      setShowSettingsHelp(true);
      return;
    }

    setIsRegistering(true);
    try {
      const token = NmyApiClient.getToken();
      if (!token) {
        setIsRegistering(false);
        return;
      }

      const res = await PushClient.subscribe(token);
      checkAndSyncPermission();

      if (res.success) {
        setJustEnabled(true);
        setTimeout(() => setJustEnabled(false), 5000);
      } else {
        const isDenied = PushClient.isNative()
          ? (await PushClient.checkNativePermission()) === 'denied'
          : PushClient.getPermissionState() === 'denied';
        if (isDenied) {
          setPermissionState('denied');
          setShowSettingsHelp(true);
        }
      }
    } catch {
      // fallback
    } finally {
      setIsRegistering(false);
    }
  };

  if (justEnabled) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-sm flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in duration-200 mb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
          <span>Arifa za moja kwa moja zimewashwa kikamilifu kwenye kifaa chako!</span>
        </div>
        <button
          type="button"
          onClick={() => setJustEnabled(false)}
          className="text-emerald-100 hover:text-white p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-neutral-900 text-white rounded-2xl p-3.5 border border-neutral-800 shadow-sm space-y-2 mb-3 animate-in fade-in duration-150">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <div className={`p-2 rounded-xl shrink-0 ${permissionState === 'denied' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-600 text-white'}`}>
              {permissionState === 'denied' ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4 animate-bounce" />}
            </div>
            <div>
              <h4 className="text-xs font-black tracking-tight uppercase">
                {permissionState === 'denied' ? 'Arifa Zimezimwa Kwenye Kifaa' : 'Washa Arifa za Simu'}
              </h4>
              <p className="text-[11px] text-neutral-300 leading-snug mt-0.5">
                {permissionState === 'denied'
                  ? 'Kivinjari/kifaa chako kimezima arifa. Washa kwenye mipangilio ili upate taarifa za maombi yako na Credit kwa wakati.'
                  : 'Pokea taarifa za ombi la NIDA, salio la Credit, na matangazo moja kwa moja hata app ikiwa imefungwa.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setDismissed(true);
              try {
                localStorage.setItem(DISMISS_KEY, 'true');
              } catch {}
            }}
            className="text-neutral-400 hover:text-white p-1 cursor-pointer"
            title="Funga kwa sasa"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleRequestPermission}
            disabled={isRegistering}
            className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer uppercase"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{isRegistering ? 'Inasajili...' : 'WASHA NOTIFICATION'}</span>
          </button>

          {permissionState === 'denied' && (
            <button
              type="button"
              onClick={() => setShowSettingsHelp(true)}
              className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Maelekezo
            </button>
          )}
        </div>
      </div>

      {/* Settings Guidance Modal */}
      {showSettingsHelp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 space-y-4 animate-in zoom-in-95 duration-150 text-neutral-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-neutral-900">
                    Jinsi ya Kuwasha Arifa
                  </h3>
                  <p className="text-[10px] text-neutral-500 font-semibold">
                    Maelekezo ya simu au kivinjari
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsHelp(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-700">
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-1.5">
                <strong className="block font-black text-neutral-900">Kwenye Kivinjari (Chrome / Edge / Opera):</strong>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-600">
                  <li>Bonyeza alama ya kufuli (au Tune icon ⚙️) iliyo upande wa kushoto wa anwani ya tovuti (URL).</li>
                  <li>Tafuta <strong>"Permissions"</strong> au <strong>"Arifa (Notifications)"</strong>.</li>
                  <li>Badilisha kutoka <em>Block/Deny</em> kwenda <strong>"Allow / Ruhusu"</strong>.</li>
                  <li>Rudi hapa kisha fanya Refresh.</li>
                </ol>
              </div>

              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-1.5">
                <strong className="block font-black text-neutral-900">Kwenye Mfumo wa Android (Simu):</strong>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-600">
                  <li>Fungua <strong>Mipangilio (Settings)</strong> ya simu yako.</li>
                  <li>Chagua <strong>Programu (Apps)</strong> kisha tafuta app ya <strong>RAVINI</strong>.</li>
                  <li>Chagua <strong>Arifa (Notifications)</strong> kisha weka <strong>Ruhusu (Allow)</strong>.</li>
                </ol>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSettingsHelp(false);
                  checkAndSyncPermission();
                }}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Nimeelewa / Kagua Tena
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
