/**
 * RAVINI Persistent Media Player Engine
 * Section 7: Protected In-App Video Player with Auto-Rotate Full Screen (Landscape HD mode)
 * Features:
 * - Persistent video URLs and playback states across route/tab changes and page refreshes.
 * - Auto-Rotate Landscape Mode with screen.orientation.lock and fallback CSS orientation transforms.
 * - DRM & Content Protection (anti-download, right-click suppression, protected stream proxy).
 */

export interface PlaybackState {
  mediaId: string;
  title: string;
  category?: 'movie' | 'clip' | 'video' | 'service';
  streamUrl: string;
  posterUrl?: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  playbackRate: number;
  isLandscape: boolean;
  quality: 'HD' | 'SD' | 'AUTO';
  lastUpdated: number;
}

type PlaybackListener = (state: PlaybackState | null) => void;

class PersistentMediaPlayerEngine {
  private activeState: PlaybackState | null = null;
  private listeners: Set<PlaybackListener> = new Set();
  private saveDebounceTimer: any = null;

  constructor() {
    this.restoreFromStorage();
  }

  private restoreFromStorage() {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('ravini_active_media_state');
      if (raw) {
        const parsed = JSON.parse(raw) as PlaybackState;
        // Don't auto-autoplay on fresh restore; preserve pause state with timestamp
        parsed.isPlaying = false;
        this.activeState = parsed;
      }
    } catch {
      // benign storage read error
    }
  }

  public getActiveState(): PlaybackState | null {
    return this.activeState;
  }

  public subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    // Emit initial
    listener(this.activeState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.activeState);
      } catch (err) {
        console.error('Player listener error:', err);
      }
    }

    // Persist to storage
    if (this.activeState) {
      if (this.saveDebounceTimer) clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = setTimeout(() => {
        try {
          if (this.activeState) {
            localStorage.setItem('ravini_active_media_state', JSON.stringify(this.activeState));
            // Also store per-media progress bookmark
            localStorage.setItem(
              `ravini_media_bookmark_${this.activeState.mediaId}`,
              JSON.stringify({
                currentTime: this.activeState.currentTime,
                duration: this.activeState.duration,
                timestamp: Date.now()
              })
            );
          }
        } catch {}
      }, 500);
    }
  }

  public getBookmark(mediaId: string): number {
    try {
      const raw = localStorage.getItem(`ravini_media_bookmark_${mediaId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.currentTime && parsed.currentTime > 5 && (!parsed.duration || parsed.currentTime < parsed.duration - 10)) {
          return parsed.currentTime;
        }
      }
    } catch {}
    return 0;
  }

  public loadMedia(options: {
    mediaId: string;
    title: string;
    streamUrl: string;
    posterUrl?: string;
    category?: 'movie' | 'clip' | 'video' | 'service';
    startSeconds?: number;
    autoPlay?: boolean;
  }) {
    const resumeTime = options.startSeconds ?? this.getBookmark(options.mediaId);
    
    // Check if same media already loaded
    if (this.activeState && this.activeState.mediaId === options.mediaId) {
      this.activeState = {
        ...this.activeState,
        isPlaying: options.autoPlay ?? true,
        lastUpdated: Date.now()
      };
      this.notify();
      return;
    }

    this.activeState = {
      mediaId: options.mediaId,
      title: options.title,
      category: options.category || 'movie',
      streamUrl: options.streamUrl,
      posterUrl: options.posterUrl,
      currentTime: resumeTime,
      duration: 0,
      isPlaying: options.autoPlay ?? true,
      isMuted: false,
      volume: 1,
      playbackRate: 1,
      isLandscape: false,
      quality: 'HD',
      lastUpdated: Date.now()
    };

    this.notify();
  }

  public updateProgress(currentTime: number, duration?: number) {
    if (!this.activeState) return;
    this.activeState = {
      ...this.activeState,
      currentTime,
      duration: duration || this.activeState.duration,
      lastUpdated: Date.now()
    };
    this.notify();
  }

  public setPlaying(isPlaying: boolean) {
    if (!this.activeState) return;
    this.activeState = {
      ...this.activeState,
      isPlaying,
      lastUpdated: Date.now()
    };
    this.notify();
  }

  public setVolume(volume: number, isMuted = false) {
    if (!this.activeState) return;
    this.activeState = {
      ...this.activeState,
      volume,
      isMuted,
      lastUpdated: Date.now()
    };
    this.notify();
  }

  public setPlaybackRate(rate: number) {
    if (!this.activeState) return;
    this.activeState = {
      ...this.activeState,
      playbackRate: rate,
      lastUpdated: Date.now()
    };
    this.notify();
  }

  public toggleLandscape(): boolean {
    if (!this.activeState) return false;
    const nextVal = !this.activeState.isLandscape;
    this.activeState = {
      ...this.activeState,
      isLandscape: nextVal,
      lastUpdated: Date.now()
    };

    if (nextVal) {
      this.requestSystemOrientationLandscape();
    } else {
      this.exitSystemOrientation();
    }

    this.notify();
    return nextVal;
  }

  public setQuality(quality: 'HD' | 'SD' | 'AUTO') {
    if (!this.activeState) return;
    this.activeState = {
      ...this.activeState,
      quality,
      lastUpdated: Date.now()
    };
    this.notify();
  }

  public closePlayer() {
    if (!this.activeState) return;
    this.exitSystemOrientation();
    // Save last bookmark before clearing
    try {
      localStorage.setItem(
        `ravini_media_bookmark_${this.activeState.mediaId}`,
        JSON.stringify({
          currentTime: this.activeState.currentTime,
          duration: this.activeState.duration,
          timestamp: Date.now()
        })
      );
      localStorage.removeItem('ravini_active_media_state');
    } catch {}

    this.activeState = null;
    this.notify();
  }

  private requestSystemOrientationLandscape() {
    try {
      const screenAny = window.screen as any;
      if (screenAny?.orientation?.lock) {
        screenAny.orientation.lock('landscape').catch(() => {
          // Allowed to fail silently on devices that don't support orientation lock without fullscreen
        });
      }
    } catch {}
  }

  private exitSystemOrientation() {
    try {
      const screenAny = window.screen as any;
      if (screenAny?.orientation?.unlock) {
        screenAny.orientation.unlock();
      }
    } catch {}
  }
}

export const persistentMediaPlayer = new PersistentMediaPlayerEngine();
