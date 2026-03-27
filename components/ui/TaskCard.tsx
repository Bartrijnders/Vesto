'use client';

import { useState } from 'react';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onStatusChange?: (id: number, status: Task['status']) => void;
}

const URGENCY_PILL: Record<string, string> = {
  high: 'bg-red-50 text-[#b91a24]',
  medium: 'bg-amber-50 text-[#855300]',
  low: 'bg-green-50 text-[#006E2F]',
};

export default function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleAction(status: Task['status']) {
    setLoading(true);
    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: task.id, status }),
      });
      onStatusChange?.(task.id, status);
    } finally {
      setLoading(false);
    }
  }

  const isDone = task.status !== 'pending';

  return (
    <div
      className="flex items-start gap-3 rounded-2xl bg-white p-4"
      style={{ boxShadow: 'var(--shadow-card)', opacity: isDone ? 0.5 : 1 }}
    >
      {/* Checkbox */}
      <button
        onClick={() => handleAction(isDone ? 'pending' : 'completed')}
        disabled={loading}
        aria-label={isDone ? 'Mark pending' : 'Mark completed'}
        className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: isDone ? '#006E2F' : '#bccbb9',
          backgroundColor: isDone ? '#006E2F' : 'transparent',
        }}
      >
        {isDone && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium leading-snug"
          style={{
            color: '#191c1e',
            textDecoration: isDone ? 'line-through' : 'none',
            fontFamily: 'var(--font-body)',
          }}
        >
          {task.title}
        </p>

        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={`text-[10px] font-extrabold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${URGENCY_PILL[task.urgency]}`}
          >
            {task.urgency}
          </span>
          {task.status === 'dismissed' && (
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              dismissed
            </span>
          )}
        </div>
      </div>

      {/* Dismiss */}
      {!isDone && (
        <button
          onClick={() => handleAction('dismissed')}
          disabled={loading}
          aria-label="Dismiss task"
          className="flex-shrink-0 text-[#bccbb9] hover:text-[#b91a24] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
