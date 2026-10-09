export interface OfflineDraftPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorUsername: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video' | 'clip' | 'image';
  isMuted?: boolean;
  mediaFilter?: string;
  mediaDuration?: number;
  aspectRatio?: string;
  location?: string;
  tags?: string[];
  createdAt: string;
  status: 'offline_draft' | 'syncing' | 'failed';
  error?: string;
}

export type OfflineDraft = OfflineDraftPost;

const OFFLINE_DRAFTS_KEY = 'ravini_offline_drafts_v1';

export function getOfflineDrafts(): OfflineDraftPost[] {
  try {
    const raw = localStorage.getItem(OFFLINE_DRAFTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load offline drafts:', err);
    return [];
  }
}

export function saveOfflineDraft(draft: Omit<OfflineDraftPost, 'id' | 'createdAt' | 'status'>): OfflineDraftPost {
  const drafts = getOfflineDrafts();
  const newDraft: OfflineDraftPost = {
    ...draft,
    id: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    status: 'offline_draft',
  };
  const updated = [newDraft, ...drafts];
  try {
    localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save offline draft:', err);
  }
  return newDraft;
}

export function removeOfflineDraft(draftId: string): void {
  const drafts = getOfflineDrafts();
  const updated = drafts.filter(d => d.id !== draftId);
  try {
    localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to remove offline draft:', err);
  }
}

export function updateOfflineDraftStatus(draftId: string, status: 'offline_draft' | 'syncing' | 'failed', error?: string): void {
  const drafts = getOfflineDrafts();
  const updated = drafts.map(d => d.id === draftId ? { ...d, status, error } : d);
  try {
    localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update draft status:', err);
  }
}
