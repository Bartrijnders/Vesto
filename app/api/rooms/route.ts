import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import type { Room } from '@/types';

export async function GET() {
  try {
    const result = await query<Room>(`
      SELECT
        r.id,
        r.name,
        r.created_at,
        (
          SELECT COUNT(*) FROM snapshots s WHERE s.room_id = r.id
        ) AS snapshot_count,
        (
          SELECT a.cleanliness_score
          FROM analyses a
          JOIN snapshots s ON a.snapshot_id = s.id
          WHERE s.room_id = r.id
          ORDER BY a.analysed_at DESC
          FETCH FIRST 1 ROWS ONLY
        ) AS latest_score,
        (
          SELECT a.urgency
          FROM analyses a
          JOIN snapshots s ON a.snapshot_id = s.id
          WHERE s.room_id = r.id
          ORDER BY a.analysed_at DESC
          FETCH FIRST 1 ROWS ONLY
        ) AS latest_urgency,
        (
          SELECT a.summary
          FROM analyses a
          JOIN snapshots s ON a.snapshot_id = s.id
          WHERE s.room_id = r.id
          ORDER BY a.analysed_at DESC
          FETCH FIRST 1 ROWS ONLY
        ) AS latest_summary
      FROM rooms r
      ORDER BY r.created_at DESC
    `);

    return Response.json(result.rows ?? []);
  } catch (err) {
    console.error('[GET /api/rooms]', err);
    return Response.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { name?: string };
    const name = body.name?.trim();
    if (!name) {
      return Response.json({ error: 'name is required' }, { status: 400 });
    }

    const result = await query<{ ID: number }>(
      `INSERT INTO rooms (name) VALUES (:name) RETURNING id INTO :id`,
      { name, id: { dir: 3003 /* BIND_OUT */, type: 2010 /* NUMBER */ } }
    );

    const id = (result.outBinds as unknown as { id: number[] }).id[0];
    return Response.json({ id, name }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/rooms]', err);
    return Response.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
