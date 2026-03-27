import Link from 'next/link';
import RingScore from './RingScore';
import type { Room } from '@/types';

interface RoomCardProps {
  room: Room;
}

const URGENCY_BADGE: Record<string, string> = {
  low: 'bg-green-50 text-[#006E2F]',
  medium: 'bg-amber-50 text-[#855300]',
  high: 'bg-red-50 text-[#b91a24]',
};

export default function RoomCard({ room }: RoomCardProps) {
  const hasData = room.latest_score != null;

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="block rounded-3xl bg-white p-5 transition-transform active:scale-[0.98]"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-base font-extrabold truncate"
            style={{ fontFamily: 'var(--font-display)', color: '#191c1e' }}
          >
            {room.name}
          </h3>

          {hasData ? (
            <>
              <p
                className="text-sm mt-1 leading-snug line-clamp-2"
                style={{ color: '#4a5568', fontFamily: 'var(--font-body)' }}
              >
                {room.latest_summary}
              </p>
              <div className="flex items-center gap-2 mt-3">
                {room.latest_urgency && (
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${URGENCY_BADGE[room.latest_urgency]}`}
                  >
                    {room.latest_urgency}
                  </span>
                )}
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#bccbb9]">
                  {room.snapshot_count ?? 0} {room.snapshot_count === 1 ? 'scan' : 'scans'}
                </span>
              </div>
            </>
          ) : (
            <p
              className="text-sm mt-1"
              style={{ color: '#bccbb9', fontFamily: 'var(--font-body)' }}
            >
              No scans yet. Add one.
            </p>
          )}
        </div>

        {/* Score ring */}
        <div className="flex-shrink-0">
          {hasData ? (
            <RingScore score={room.latest_score!} size={68} />
          ) : (
            <div
              className="w-[68px] h-[68px] rounded-full flex items-center justify-center"
              style={{ background: '#f7f9fb', border: '2px dashed #bccbb9' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4v12M4 10h12" stroke="#bccbb9" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
