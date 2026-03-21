import { memo, useState, useMemo, useCallback, useEffect } from 'react';
import { useStore } from '../stores/useStore.ts';
import { getTotalXP, getCurrentLevelProgress, getNextUnlock, getLevelFromXP } from '../utils/xp.ts';

const XpBanner = memo(function XpBanner() {
  const xpEvents = useStore((s) => s.xpEvents);

  const totalXP = useMemo(() => getTotalXP(xpEvents), [xpEvents]);
  const { level, currentXP, xpNeeded, progress } = useMemo(
    () => getCurrentLevelProgress(totalXP),
    [totalXP],
  );
  const nextUnlock = useMemo(() => getNextUnlock(level), [level]);
  const [isLevelingUp, setIsLevelingUp] = useState(false);

  // Subscribe to store changes to detect level-up outside of render
  useEffect(() => {
    let prevLevel = getLevelFromXP(getTotalXP(useStore.getState().xpEvents));

    const unsub = useStore.subscribe((state) => {
      const newLevel = getLevelFromXP(getTotalXP(state.xpEvents));
      if (newLevel > prevLevel) {
        setIsLevelingUp(true);
      }
      prevLevel = newLevel;
    });

    return unsub;
  }, []);

  const handleAnimationEnd = useCallback(() => {
    setIsLevelingUp(false);
  }, []);

  const progressPct = Math.min(Math.max(progress * 100, 0), 100);

  return (
    <div
      style={{
        height: '44px',
        backgroundColor: '#1A1A1A',
        borderBottom: '1px solid #2A2A2A',
      }}
      className="w-full flex items-center px-4"
    >
      {/* Level */}
      <span
        className={`text-white font-bold shrink-0 ${isLevelingUp ? 'animate-level-pulse' : ''}`}
        style={{ fontSize: '16px' }}
        onAnimationEnd={handleAnimationEnd}
      >
        Lvl {level}
      </span>

      {/* Progress bar section */}
      <div className="flex-1 mx-4 min-w-0">
        {/* Bar track */}
        <div
          className="w-full rounded-full"
          style={{ height: '8px', backgroundColor: '#2A2A2A' }}
        >
          <div
            className="rounded-full transition-all duration-500"
            style={{
              height: '8px',
              width: `${progressPct}%`,
              backgroundColor: '#F59E0B',
              boxShadow: '0 0 8px rgba(245, 158, 11, 0.4)',
            }}
          />
        </div>
        {/* XP text */}
        <p
          className="mt-0.5 truncate"
          style={{ fontSize: '11px', lineHeight: '14px', color: '#6B7280' }}
        >
          {currentXP} / {xpNeeded} XP
        </p>
      </div>

      {/* Next unlock */}
      <span
        className="shrink-0 text-right hidden sm:block"
        style={{ fontSize: '12px', color: '#9CA3AF', maxWidth: '200px' }}
      >
        {nextUnlock
          ? `Next: Lvl ${nextUnlock.level} \u2192 ${nextUnlock.description}`
          : 'All unlocks earned'}
      </span>
      <span
        className="shrink-0 text-right sm:hidden truncate"
        style={{ fontSize: '11px', color: '#9CA3AF', maxWidth: '120px' }}
      >
        {nextUnlock
          ? `Lvl ${nextUnlock.level} \u2192 ${nextUnlock.description}`
          : 'All unlocks'}
      </span>
    </div>
  );
});

export default XpBanner;
