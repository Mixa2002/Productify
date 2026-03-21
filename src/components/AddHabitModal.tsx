import { useState, useCallback, useMemo } from 'react';
import { useStore } from '../stores/useStore';
import { getTotalXP, getLevelFromXP, getCapsForLevel, getUnlockTiers } from '../utils/xp.ts';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose(): void;
}

export default function AddHabitModal({ isOpen, onClose }: AddHabitModalProps) {
  const addHabit = useStore((s) => s.addHabit);
  const habits = useStore((s) => s.habits);
  const xpEvents = useStore((s) => s.xpEvents);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const capInfo = useMemo(() => {
    const level = getLevelFromXP(getTotalXP(xpEvents));
    const caps = getCapsForLevel(level);
    const habitCount = habits.length;
    const atCap = habitCount >= caps.habitCap;

    const tiers = getUnlockTiers();
    const currentHabitCap = caps.habitCap;
    const nextHabitTier = tiers.find((t) => t.level > level && t.habitCap > currentHabitCap);
    const atFinalCap = currentHabitCap >= 8;

    return { habitCount, habitCap: caps.habitCap, atCap, nextHabitTier, atFinalCap };
  }, [xpEvents, habits]);

  const resetForm = useCallback(() => {
    setName('');
    setError('');
    setIsSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Habit name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      await addHabit(trimmed);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, name, addHabit, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 animate-overlay-fade"
        onClick={handleClose}
        role="presentation"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-t-2xl p-6 pb-8 animate-slide-up overflow-y-auto"
        style={{ maxHeight: '90vh', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Add new habit"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>New Habit</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-2xl leading-none transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {capInfo.atCap && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}
          >
            {capInfo.atFinalCap
              ? `Maximum habit slots reached (${capInfo.habitCount}/${capInfo.habitCap})`
              : `Habit limit reached (${capInfo.habitCount}/${capInfo.habitCap}). Reach Level ${capInfo.nextHabitTier!.level} to unlock ${capInfo.nextHabitTier!.description}.`}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#dc2626' }}>
            <p>{error}</p>
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="habit-name" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Habit Name
          </label>
          <input
            id="habit-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. Read 30 minutes"
            autoFocus
            disabled={capInfo.atCap}
            className="w-full px-3 py-2 rounded-lg border focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#ffffff', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          />
        </div>

        {!capInfo.atCap && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent)' }}
            onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = 'var(--accent-light)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
          >
            {isSubmitting ? 'Adding...' : 'Add Habit'}
          </button>
        )}
      </div>
    </div>
  );
}
