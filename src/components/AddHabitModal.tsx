import { useState, useCallback } from 'react';
import { useStore } from '../stores/useStore';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose(): void;
}

export default function AddHabitModal({ isOpen, onClose }: AddHabitModalProps) {
  const addHabit = useStore((s) => s.addHabit);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        className="absolute inset-0 bg-black/60 animate-overlay-fade"
        onClick={handleClose}
        role="presentation"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-gray-900 rounded-t-2xl p-6 pb-8 animate-slide-up overflow-y-auto"
        style={{ maxHeight: '90vh' }}
        role="dialog"
        aria-modal="true"
        aria-label="Add new habit"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">New Habit</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-sm">
            <p>{error}</p>
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="habit-name" className="block text-sm font-medium text-gray-300 mb-1">
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
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

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
      </div>
    </div>
  );
}
