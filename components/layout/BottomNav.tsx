'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  {
    href: '/',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M3 10.5L11 3L19 10.5V19H14v-5H8v5H3V10.5Z"
          stroke={active ? '#006E2F' : '#bccbb9'}
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill={active ? 'rgba(0,110,47,0.1)' : 'none'}
        />
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'History',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke={active ? '#006E2F' : '#bccbb9'} strokeWidth="1.8" />
        <path d="M11 7v4l3 2" stroke={active ? '#006E2F' : '#bccbb9'} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/stats',
    label: 'Stats',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="12" width="4" height="7" rx="1" fill={active ? 'rgba(0,110,47,0.1)' : 'none'} stroke={active ? '#006E2F' : '#bccbb9'} strokeWidth="1.8" />
        <rect x="9" y="8" width="4" height="11" rx="1" fill={active ? 'rgba(0,110,47,0.1)' : 'none'} stroke={active ? '#006E2F' : '#bccbb9'} strokeWidth="1.8" />
        <rect x="15" y="4" width="4" height="15" rx="1" fill={active ? 'rgba(0,110,47,0.1)' : 'none'} stroke={active ? '#006E2F' : '#bccbb9'} strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="3" stroke={active ? '#006E2F' : '#bccbb9'} strokeWidth="1.8" />
        <path
          d="M11 2v2M11 18v2M2 11h2M18 11h2M4.22 4.22l1.42 1.42M16.36 16.36l1.42 1.42M4.22 17.78l1.42-1.42M16.36 5.64l1.42-1.42"
          stroke={active ? '#006E2F' : '#bccbb9'}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-2xl border-t border-white/20"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-around px-4 py-2">
        {ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-colors"
            >
              {icon(active)}
              <span
                className="text-[10px] font-extrabold uppercase tracking-[0.2em]"
                style={{ color: active ? '#006E2F' : '#bccbb9' }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
