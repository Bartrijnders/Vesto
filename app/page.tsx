import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import RoomCard from '@/components/ui/RoomCard';
import AddRoomButton from './(dashboard)/AddRoomButton';
import type { Room } from '@/types';

async function getRooms(): Promise<Room[]> {
  try {
    const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const res = await fetch(`${base}/api/rooms`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const rooms = await getRooms();

  const scoredRooms = rooms.filter((r) => r.latest_score != null);
  const avgScore =
    scoredRooms.length > 0
      ? (scoredRooms.reduce((sum, r) => sum + (r.latest_score ?? 0), 0) / scoredRooms.length).toFixed(1)
      : null;

  return (
    <div style={{ background: 'var(--color-surface)', minHeight: '100%' }}>
      <TopBar
        title="Vesto"
        subtitle="Bring order back home."
        right={<AddRoomButton />}
      />

      <main className="max-w-lg mx-auto px-5 pt-6 pb-28 flex flex-col gap-5">
        {/* Hero stat */}
        {avgScore && (
          <div
            className="rounded-3xl p-5 flex items-center justify-between"
            style={{
              background: 'linear-gradient(135deg, #006E2F 0%, #008a3a 100%)',
              boxShadow: 'var(--shadow-float)',
            }}
          >
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-green-200">
                Home score
              </p>
              <p
                className="text-4xl font-extrabold text-white mt-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {avgScore}
                <span className="text-lg font-bold text-green-200">/10</span>
              </p>
              <p className="text-sm text-green-100 mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                Across {scoredRooms.length} scanned {scoredRooms.length === 1 ? 'room' : 'rooms'}
              </p>
            </div>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" opacity="0.3">
              <path d="M32 8L56 28v28H40V40H24v16H8V28L32 8Z" fill="white" />
            </svg>
          </div>
        )}

        {/* Rooms list */}
        <div className="flex items-center justify-between">
          <h2
            className="text-[10px] font-extrabold uppercase tracking-[0.2em]"
            style={{ color: '#bccbb9' }}
          >
            Rooms ({rooms.length})
          </h2>
        </div>

        {rooms.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-3xl bg-white p-8 text-center"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div
        className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
        style={{ background: 'rgba(0,110,47,0.08)' }}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 4L26 14v12H18V18H10v8H2V14L14 4Z" stroke="#006E2F" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>
      <h3
        className="text-lg font-extrabold"
        style={{ fontFamily: 'var(--font-display)', color: '#191c1e' }}
      >
        Nothing to judge yet.
      </h3>
      <p className="text-sm mt-2" style={{ color: '#bccbb9', fontFamily: 'var(--font-body)' }}>
        Add your first room and let Vesto tell you how bad it really is.
      </p>
    </div>
  );
}
