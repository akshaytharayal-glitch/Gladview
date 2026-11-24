// Watch history for people who are not logged in (kept in this browser only).
const KEY = "gladi_guest_history";
const MAX_ITEMS = 30;

export type GuestHistoryItem = {
  animeId: string;
  title: string;
  poster: string;
  episodeId: string;
  episodeNumber: number;
  current: number;
  duration: number;
  updatedAt: number;
};

export function getGuestHistory(): GuestHistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveGuestProgress(
  item: Omit<GuestHistoryItem, "updatedAt">,
): void {
  try {
    const list = getGuestHistory().filter((i) => i.animeId !== item.animeId);
    list.unshift({ ...item, updatedAt: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
  } catch {
    /* storage unavailable (private mode / full): ignore */
  }
}

// Forget one anime from the guest watch history.
export function removeGuestProgress(animeId: string): void {
  try {
    const list = getGuestHistory().filter(
      (i) => String(i.animeId) !== String(animeId),
    );
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable: nothing to remove */
  }
}
