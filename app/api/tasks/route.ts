import { NextRequest } from 'next/server';
import type oracledb from 'oracledb';
import { query } from '@/lib/db';
import type { Task } from '@/types';

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = req.nextUrl;
  const roomId = searchParams.get('room_id');
  const status = searchParams.get('status');

  try {
    let sql = `SELECT id, room_id, analysis_id, title, urgency, status, created_at, completed_at
               FROM tasks WHERE 1=1`;
    const binds: oracledb.BindParameters = {};

    if (roomId) {
      sql += ` AND room_id = :room_id`;
      binds.room_id = Number(roomId);
    }
    if (status) {
      sql += ` AND status = :status`;
      binds.status = status;
    }

    sql += ` ORDER BY
      CASE urgency WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
      created_at DESC`;

    const result = await query<Task>(sql, binds);
    return Response.json(result.rows ?? []);
  } catch (err) {
    console.error('[GET /api/tasks]', err);
    return Response.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json() as {
      room_id?: unknown;
      title?: unknown;
      urgency?: unknown;
    };

    const roomId = Number(body.room_id);
    const title = String(body.title ?? '').trim();
    const urgency = String(body.urgency ?? 'low');

    if (isNaN(roomId)) return Response.json({ error: 'room_id is required' }, { status: 400 });
    if (!title) return Response.json({ error: 'title is required' }, { status: 400 });
    if (!['low', 'medium', 'high'].includes(urgency)) {
      return Response.json({ error: 'urgency must be low, medium or high' }, { status: 400 });
    }

    const result = await query<{ ID: number }>(
      `INSERT INTO tasks (room_id, title, urgency)
       VALUES (:room_id, :title, :urgency)
       RETURNING id INTO :id`,
      { room_id: roomId, title, urgency, id: { dir: 3003, type: 2010 } }
    );

    const id = (result.outBinds as unknown as { id: number[] }).id[0];
    return Response.json({ id, room_id: roomId, title, urgency, status: 'pending' }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/tasks]', err);
    return Response.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json() as { id?: unknown; status?: unknown };
    const id = Number(body.id);
    const status = String(body.status ?? '');

    if (isNaN(id)) return Response.json({ error: 'id is required' }, { status: 400 });
    if (!['pending', 'completed', 'dismissed'].includes(status)) {
      return Response.json({ error: 'status must be pending, completed or dismissed' }, { status: 400 });
    }

    await query(
      `UPDATE tasks
       SET status = :status,
           completed_at = CASE WHEN :status2 = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END
       WHERE id = :id`,
      { status, status2: status, id }
    );

    return Response.json({ id, status });
  } catch (err) {
    console.error('[PATCH /api/tasks]', err);
    return Response.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
