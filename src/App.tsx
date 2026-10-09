import React, { useState, useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { NmyApiClient } from './lib/nmyApiClient';
import { PushClient } from './lib/pushClient';
import { realtimeClient } from './lib/realtimeClient';
import { NmyUser } from './types/nmyTypes';
import { UnifiedAuthScreen } from './components/auth/UnifiedAuthScreen';
import { CustomerWorkspace } from './components/customer/CustomerWorkspace';
import { AdminWorkspace } from './components/admin/AdminWorkspace';
import { SuperAdminWorkspace } from './components/superadmin/SuperAdminWorkspace';
import { ForcePasswordChangeModal } from './components/auth/ForcePasswordChangeModal';
import { ToastProvider } from './components/common/Toast';
import { OfflineStateModal } from './components/common/OfflineStateModal';
import { Loader2, ShieldCheck } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<NmyUser | null>(() => NmyApiClient.getCurrentUser());
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Native Android Hardware/Gesture Back Button handling
    let backSub: Promise<any> | null = null;
    if (PushClient.isNative()) {
      backSub = CapApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack && window.history.length > 1) {
          window.history.back();
        } else {
          // If on home/root screen, minimize app smoothly
          CapApp.minimizeApp();
        }
      });
    }

    // Verify session with backend
    const initialToken = NmyApiClient.getToken();
    if (initialToken) {
      realtimeClient.connect(initialToken);
    }

    NmyApiClient.getMe()
      .then((res) => {
        if (res.success && res.user) {
          setCurrentUser(res.user);
          if (initialToken) {
            PushClient.autoRegisterIfGranted(initialToken).catch(() => {});
          }
        } else if (res.status === 401) {
          setCurrentUser(null);
          realtimeClient.disconnect();
        }
        setIsInitializing(false);
      })
      .catch(() => {
        setIsInitializing(false);
      });

    return () => {
      if (backSub) {
        backSub.then((h) => h?.remove?.()).catch(() => {});
      }
    };
  }, []);

  const handleAuthenticated = (user: NmyUser) => {
    setCurrentUser(user);
    const token = NmyApiClient.getToken();
    if (token) {
      realtimeClient.connect(token);
      PushClient.autoRegisterIfGranted(token).catch(() => {});
    }
  };

  const handleLogout = () => {
    const token = NmyApiClient.getToken();
    if (token) {
      PushClient.unsubscribe(token).catch(() => {});
    }
    realtimeClient.disconnect();
    NmyApiClient.clearAuth();
    setCurrentUser(null);
  };

  const handleUserUpdated = (updatedUser: NmyUser) => {
    setCurrentUser(updatedUser);
  };

  if (isInitializing) {
    return (
      <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-red-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-xl shadow-red-600/20 mb-3 animate-pulse">
          <ShieldCheck className="w-8 h-8 stroke-[2.2px]" />
        </div>
        <h2 className="text-sm font-black text-neutral-900 uppercase tracking-tight mb-1">
          RAVINI
        </h2>
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
          <span>Inaanzisha mfumo...</span>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-[100dvh] bg-[#FAFAFA] text-neutral-900 font-sans selection:bg-red-100 selection:text-red-600">
        <OfflineStateModal language={currentUser?.language || 'sw'} />

        {/* Forced Password Change Modal for users with temporary password 1234 */}
        {currentUser && currentUser.mustChangePassword && (
          <ForcePasswordChangeModal
            currentUser={currentUser}
            language={currentUser.language || 'sw'}
            onPasswordChanged={(updatedUser) => {
              handleUserUpdated(updatedUser);
            }}
          />
        )}

        {/* Unified Authentication or Workspace Router */}
        {!currentUser ? (
          <UnifiedAuthScreen onAuthenticated={handleAuthenticated} />
        ) : currentUser.role === 'SUPER_ADMIN' ? (
          <SuperAdminWorkspace
            user={currentUser}
            onLogout={handleLogout}
            onUserUpdated={handleUserUpdated}
          />
        ) : (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN_OPERATIONS') ? (
          <AdminWorkspace
            user={currentUser}
            onLogout={handleLogout}
            onUserUpdated={handleUserUpdated}
          />
        ) : (
          <CustomerWorkspace
            user={currentUser}
            onLogout={handleLogout}
            onUserUpdated={handleUserUpdated}
          />
        )}
      </div>
    </ToastProvider>
  );
}

export default App;
