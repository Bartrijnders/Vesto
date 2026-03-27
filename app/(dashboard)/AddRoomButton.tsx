'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddRoomButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      setName('');
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white transition-opacity active:opacity-80"
        style={{
          background: '#006E2F',
          boxShadow: 'var(--shadow-btn)',
          fontFamily: 'var(--font-display)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Add room
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(25,28,30,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl bg-white p-6"
            style={{ boxShadow: 'var(--shadow-float)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-[#bccbb9] mx-auto mb-6" />
            <h2
              className="text-lg font-extrabold mb-4"
              style={{ fontFamily: 'var(--font-display)', color: '#191c1e' }}
            >
              Name your room
            </h2>
            <input
              type="text"
              placeholder="Kitchen, Living room, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
              style={{
                background: '#f7f9fb',
                color: '#191c1e',
                fontFamily: 'var(--font-body)',
                border: '2px solid transparent',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#006E2F')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
            />
            <button
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className="mt-4 w-full rounded-full py-3 text-sm font-bold text-white transition-opacity disabled:opacity-50"
              style={{
                background: '#006E2F',
                boxShadow: 'var(--shadow-btn)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {loading ? 'Creating…' : 'Create room'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
