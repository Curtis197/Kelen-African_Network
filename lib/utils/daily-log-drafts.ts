import { get, set, del, keys, clear } from 'idb-keyval';
import type { LogDraft, LogFormData } from '@/lib/types/daily-logs';

const DRAFT_KEY_PREFIX = 'draft-log-';
const SYNC_QUEUE_KEY = 'sync-queue';
const LAST_GPS_KEY = 'last-gps';
const FORM_STATE_KEY = 'form-state';

// ── Draft Management ─────────────────────────────────────────────

export async function saveDraft(projectId: string, formData: LogFormData, draftId?: string): Promise<string> {
  const id = draftId || crypto.randomUUID();
  const draft: LogDraft = {
    id,
    projectId,
    stepId: null,
    formData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pendingSync: false,
  };

  await set(`${DRAFT_KEY_PREFIX}${id}`, draft);

  // Add to sync queue if pending
  if (draft.pendingSync) {
    const queue = await getSyncQueue();
    if (!queue.includes(id)) {
      queue.push(id);
      await set(SYNC_QUEUE_KEY, queue);
    }
  }

  return id;
}

export async function getDraft(draftId: string): Promise<LogDraft | null> {
  const draft = await get<LogDraft>(`${DRAFT_KEY_PREFIX}${draftId}`);
  return draft || null;
}

export async function getAllDrafts(projectId?: string): Promise<LogDraft[]> {
  const allKeys = await keys<string>();
  const drafts: LogDraft[] = [];

  for (const key of allKeys) {
    if (key.startsWith(DRAFT_KEY_PREFIX)) {
      const draft = await get<LogDraft>(key);
      if (draft && (!projectId || draft.projectId === projectId)) {
        drafts.push(draft);
      }
    }
  }

  return drafts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function deleteDraft(draftId: string): Promise<void> {
  await del(`${DRAFT_KEY_PREFIX}${draftId}`);

  // Remove from sync queue
  const queue = await getSyncQueue();
  const filtered = queue.filter(id => id !== draftId);
  await set(SYNC_QUEUE_KEY, filtered);
}

export async function markDraftPendingSync(draftId: string, pending: boolean): Promise<void> {
  const draft = await getDraft(draftId);
  if (!draft) return;

  draft.pendingSync = pending;
  await set(`${DRAFT_KEY_PREFIX}${draftId}`, draft);

  // Update sync queue
  const queue = await getSyncQueue();
  if (pending && !queue.includes(draftId)) {
    queue.push(draftId);
    await set(SYNC_QUEUE_KEY, queue);
  } else if (!pending) {
    const filtered = queue.filter(id => id !== draftId);
    await set(SYNC_QUEUE_KEY, filtered);
  }
}

// ── Sync Queue ────────────────────────────────────────────────────

export async function getSyncQueue(): Promise<string[]> {
  const queue = await get<string[]>(SYNC_QUEUE_KEY);
  return queue || [];
}

export async function clearSyncQueue(): Promise<void> {
  await set(SYNC_QUEUE_KEY, []);
}

// ── Cached GPS ────────────────────────────────────────────────────

export async function saveLastGPS(lat: number, lng: number): Promise<void> {
  await set(LAST_GPS_KEY, { latitude: lat, longitude: lng, timestamp: Date.now() });
}

export async function getLastGPS(): Promise<{ latitude: number; longitude: number; timestamp: number } | null> {
  return await get(LAST_GPS_KEY) || null;
}

// ── Form State (auto-save) ────────────────────────────────────────

export async function saveFormState(projectId: string, state: Partial<LogFormData>): Promise<void> {
  await set(`${FORM_STATE_KEY}-${projectId}`, state);
}

export async function getFormState(projectId: string): Promise<Partial<LogFormData> | null> {
  return await get(`${FORM_STATE_KEY}-${projectId}`) || null;
}

export async function clearFormState(projectId: string): Promise<void> {
  await del(`${FORM_STATE_KEY}-${projectId}`);
}

// ── Utility ───────────────────────────────────────────────────────

export async function clearAllDrafts(): Promise<void> {
  const allKeys = await keys<string>();
  for (const key of allKeys) {
    if (key.startsWith(DRAFT_KEY_PREFIX) || key.startsWith(FORM_STATE_KEY)) {
      await del(key);
    }
  }
  await clearSyncQueue();
}
