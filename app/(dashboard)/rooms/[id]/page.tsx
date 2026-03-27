import { notFound } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import RingScore from '@/components/ui/RingScore';
import TaskCard from '@/components/ui/TaskCard';
import RoomUpload from './RoomUpload';
import type { Room, Task, Snapshot, Analysis } from '@/types';

const BASE = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

async function getRoom(id: string): Promise<Room | null> {
  try {
    const res = await fetch(`${BASE}/api/rooms`, { cache: 'no-store' });
    if (!res.ok) return null;
    const rooms: Room[] = await res.json();
    return rooms.find((r) => r.id === Number(id)) ?? null;
  } catch {
    return null;
  }
}

async function getTasks(roomId: number): Promise<Task[]> {
  try {
    const res = await fetch(`${BASE}/api/tasks?room_id=${roomId}&status=pending`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [room, tasks] = await Promise.all([getRoom(id), getTasks(Number(id))]);

  if (!room) notFound();

  const hasAnalysis = room.latest_score != null;

  return (
    <div style={{ background: 'var(--color-surface)', minHeight: '100%' }}>
      <TopBar title={room.name} subtitle="Room detail" />

      <div className="max-w-lg mx-auto px-5 pt-6 pb-4 flex flex-col gap-5">
        {/* AI Analysis panel */}
        {hasAnalysis ? (
          <AnalysisPanel room={room} />
        ) : (
          <NoAnalysisCard />
        )}

        {/* Upload */}
        <RoomUpload roomId={room.id} />

        {/* Tasks */}
        {tasks.length > 0 && (
          <section>
            <h2
              className="text-[10px] font-extrabold uppercase tracking-[0.2em] mb-3"
              style={{ color: '#bccbb9' }}
            >
              Open tasks ({tasks.length})
            </h2>
            <div className="flex flex-col gap-2">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </section>
        )}

        {tasks.length === 0 && hasAnalysis && (
          <div
            className="rounded-3xl bg-white p-6 text-center"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <p
              className="text-sm font-medium"
              style={{ color: '#bccbb9', fontFamily: 'var(--font-body)' }}
            >
              No open tasks. Surprisingly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalysisPanel({ room }: { room: Room }) {
  return (
    <div
      className="rounded-3xl bg-white p-5"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-start gap-4">
        <RingScore score={room.latest_score!} size={80} />
        <div className="flex-1 min-w-0">
          <p
            className="text-[10px] font-extrabold uppercase tracking-[0.2em]"
            style={{ color: '#bccbb9' }}
          >
            Latest scan
          </p>
          <p
            className="text-sm font-medium mt-1 leading-snug"
            style={{ color: '#191c1e', fontFamily: 'var(--font-body)' }}
          >
            {room.latest_summary}
          </p>
          {room.latest_urgency && (
            <span
              className="inline-block mt-2 text-[10px] font-extrabold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
              style={{
                background:
                  room.latest_urgency === 'high'
                    ? '#fff0f0'
                    : room.latest_urgency === 'medium'
                    ? '#fffbeb'
                    : '#f0fdf4',
                color:
                  room.latest_urgency === 'high'
                    ? '#b91a24'
                    : room.latest_urgency === 'medium'
                    ? '#855300'
                    : '#006E2F',
              }}
            >
              {room.latest_urgency} urgency
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function NoAnalysisCard() {
  return (
    <div
      className="rounded-3xl bg-white p-6 text-center"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div
        className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
        style={{ background: 'rgba(0,110,47,0.08)' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 4.5C7.305 4.5 3.135 7.454 1.5 12c1.635 4.546 5.805 7.5 10.5 7.5s8.865-2.954 10.5-7.5C20.865 7.454 16.695 4.5 12 4.5Z" stroke="#006E2F" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="3" stroke="#006E2F" strokeWidth="1.8" />
        </svg>
      </div>
      <h3
        className="text-base font-extrabold"
        style={{ fontFamily: 'var(--font-display)', color: '#191c1e' }}
      >
        Uncharted territory.
      </h3>
      <p className="text-sm mt-1" style={{ color: '#bccbb9', fontFamily: 'var(--font-body)' }}>
        Upload a photo and let Vesto assess the damage.
      </p>
    </div>
  );
}
