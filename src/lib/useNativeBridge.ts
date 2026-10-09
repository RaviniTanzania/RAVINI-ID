import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';

interface NativeBridgeOptions {
  onHardwareBack?: () => boolean; // return true if handled, false to let default occur
  onAppStateChange?: (isActive: boolean) => void;
}

export function triggerHaptic(style: ImpactStyle = ImpactStyle.Light) {
  try {
    Haptics.impact({ style }).catch(() => {});
  } catch {
    // Ignore in unsupported environments
  }
}

export async function nativeShareSheet(options: {
  title?: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}): Promise<boolean> {
  try {
    await Share.share({
      title: options.title || 'RAVINI',
      text: options.text || '',
      url: options.url || window.location.href,
      dialogTitle: options.dialogTitle || 'Shiriki kupitia RAVINI',
    });
    return true;
  } catch (err) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: options.title || 'RAVINI',
          text: options.text || '',
          url: options.url || window.location.href,
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

/**
 * Android FLAG_SECURE / Privacy Screen Toggle
 * ON: Prevents screenshot & screen recording at native OS layer.
 * OFF: Allows screenshot & screen recording.
 * Note: External physical camera capture cannot be prevented by any software.
 */
export async function setScreenshotProtection(enabled: boolean): Promise<boolean> {
  try {
    if ((window as any)?.Capacitor?.isNativePlatform()) {
      const PrivacyScreen = (window as any)?.Capacitor?.Plugins?.PrivacyScreen;
      if (PrivacyScreen) {
        if (enabled) {
          await PrivacyScreen.enable();
        } else {
          await PrivacyScreen.disable();
        }
        return true;
      }
    }
  } catch (err) {
    console.warn('Native screenshot protection bridge warning:', err);
  }
  return false;
}

export function useNativeBridge(options: NativeBridgeOptions = {}) {
  useEffect(() => {
    // 1. Configure Status Bar for RAVINI Red Theme
    try {
      StatusBar.setBackgroundColor({ color: '#DC2626' }).catch(() => {});
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    } catch {
      // Ignore if not native
    }

    // 2. Android Hardware Back Button
    let backListenerHandle: any = null;
    try {
      CapApp.addListener('backButton', ({ canGoBack }) => {
        if (options.onHardwareBack) {
          const handled = options.onHardwareBack();
          if (handled) return;
        }
        if (canGoBack) {
          window.history.back();
        } else {
          // At root, let Capacitor handle exit or minimize
        }
      }).then(handle => {
        backListenerHandle = handle;
      }).catch(() => {});
    } catch {
      // Web fallback for browser back
    }

    // 3. App State (Foreground / Background)
    let appStateHandle: any = null;
    try {
      CapApp.addListener('appStateChange', (state) => {
        if (options.onAppStateChange) {
          options.onAppStateChange(state.isActive);
        }
      }).then(handle => {
        appStateHandle = handle;
      }).catch(() => {});
    } catch {
      // Fallback
    }

    // Web visibilitychange listener
    const handleVisibilityChange = () => {
      if (options.onAppStateChange) {
        options.onAppStateChange(document.visibilityState === 'visible');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (backListenerHandle && typeof backListenerHandle.remove === 'function') {
        backListenerHandle.remove();
      }
      if (appStateHandle && typeof appStateHandle.remove === 'function') {
        appStateHandle.remove();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [options.onHardwareBack, options.onAppStateChange]);
}
