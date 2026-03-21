import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../stores/useStore.ts';
import { getTotalXP, getLevelFromXP, getUnlockTiers } from '../utils/xp.ts';

interface ToastItem {
  level: number;
  description: string;
}

const STORAGE_KEY = 'shownUnlocks';

function getShownUnlocks(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr: number[] = JSON.parse(raw);
      return new Set(arr);
    }
  } catch {
    // ignore
  }
  return new Set();
}

function saveShownUnlocks(set: Set<number>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

/** Mark all tiers at or below the given level as shown, without producing toasts. */
function seedShownUnlocks(level: number): void {
  const tiers = getUnlockTiers();
  const shown = getShownUnlocks();
  let changed = false;
  for (const tier of tiers) {
    if (tier.level <= 1) continue;
    if (level >= tier.level && !shown.has(tier.level)) {
      shown.add(tier.level);
      changed = true;
    }
  }
  if (changed) {
    saveShownUnlocks(shown);
  }
}

function computeAndSaveNewUnlocks(level: number): ToastItem[] {
  const tiers = getUnlockTiers();
  const shown = getShownUnlocks();
  const newToasts: ToastItem[] = [];

  for (const tier of tiers) {
    if (tier.level <= 1) continue;
    if (level >= tier.level && !shown.has(tier.level)) {
      shown.add(tier.level);
      newToasts.push({ level: tier.level, description: tier.description });
    }
  }

  if (newToasts.length > 0) {
    saveShownUnlocks(shown);
  }

  return newToasts;
}

export default function UnlockToast() {
  const [queue, setQueue] = useState<ToastItem[]>(() => {
    // On first load, mark all already-earned tiers as shown without displaying toasts
    const level = getLevelFromXP(getTotalXP(useStore.getState().xpEvents));
    seedShownUnlocks(level);
    return [];
  });
  const [dismissing, setDismissing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Subscribe to store to detect level changes outside of render
  useEffect(() => {
    let prevLevel = getLevelFromXP(getTotalXP(useStore.getState().xpEvents));

    const unsub = useStore.subscribe((state) => {
      const newLevel = getLevelFromXP(getTotalXP(state.xpEvents));
      if (newLevel > prevLevel) {
        const newToasts = computeAndSaveNewUnlocks(newLevel);
        if (newToasts.length > 0) {
          setQueue((prev) => [...prev, ...newToasts]);
        }
      }
      prevLevel = newLevel;
    });

    return unsub;
  }, []);

  const current = queue.length > 0 ? queue[0] : null;

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (current && !dismissing) {
      timerRef.current = setTimeout(() => {
        setDismissing(true);
      }, 4000);
      return () => clearTimeout(timerRef.current);
    }
  }, [current, dismissing]);

  const handleAnimationEnd = useCallback(() => {
    if (dismissing) {
      setQueue((prev) => prev.slice(1));
      setDismissing(false);
    }
  }, [dismissing]);

  const handleDismiss = useCallback(() => {
    clearTimeout(timerRef.current);
    setDismissing(true);
  }, []);

  if (!current) return null;

  return (
    <div
      className={`fixed z-50 ${dismissing ? 'animate-toast-out' : 'animate-toast-in'}`}
      style={{
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
      }}
      onClick={handleDismiss}
      onAnimationEnd={handleAnimationEnd}
      role="alert"
    >
      <div
        className="rounded-lg shadow-lg cursor-pointer select-none"
        style={{
          backgroundColor: '#1A1A1A',
          borderLeft: '4px solid #F59E0B',
          padding: '12px 16px',
          color: '#ffffff',
          minWidth: '240px',
        }}
      >
        {'\uD83D\uDD13'} Level {current.level} Unlocked! {current.description}
      </div>
    </div>
  );
}
