import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { analyseRoomUrl } from '@/lib/claude-vision';
import type { Analysis } from '@/types';

export async function POST(req: NextRequest): Promise<Response> {
  // Internal calls from /api/snapshot use the same API key
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.ESP32_API_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json() as { snapshot_id?: unknown };
    const snapshotId = Number(body.snapshot_id);
    if (isNaN(snapshotId)) {
      return Response.json({ error: 'snapshot_id is required' }, { status: 400 });
    }

    // Fetch snapshot to get the image URL
    const snapshotResult = await query<{ IMAGE_URL: string; ROOM_ID: number }>(
      `SELECT image_url, room_id FROM snapshots WHERE id = :id`,
      [snapshotId]
    );

    const snapshot = snapshotResult.rows?.[0];
    if (!snapshot) {
      return Response.json({ error: 'Snapshot not found' }, { status: 404 });
    }

    // Run Claude Vision analysis
    const result = await analyseRoomUrl(snapshot.IMAGE_URL);

    // Persist the analysis
    const analysisResult = await query<{ ID: number }>(
      `INSERT INTO analyses (snapshot_id, cleanliness_score, summary, issues, suggested_tasks, urgency)
       VALUES (:snapshot_id, :cleanliness_score, :summary, :issues, :suggested_tasks, :urgency)
       RETURNING id INTO :id`,
      {
        snapshot_id: snapshotId,
        cleanliness_score: result.cleanliness_score,
        summary: result.summary,
        issues: JSON.stringify(result.issues),
        suggested_tasks: JSON.stringify(result.suggested_tasks),
        urgency: result.urgency,
        id: { dir: 3003, type: 2010 },
      }
    );

    const analysisId = (analysisResult.outBinds as unknown as { id: number[] }).id[0];

    // Auto-create tasks when score < 7 or urgency is not 'low'
    if (result.cleanliness_score < 7 || result.urgency !== 'low') {
      for (const taskTitle of result.suggested_tasks) {
        await query(
          `INSERT INTO tasks (room_id, analysis_id, title, urgency)
           VALUES (:room_id, :analysis_id, :title, :urgency)`,
          {
            room_id: snapshot.ROOM_ID,
            analysis_id: analysisId,
            title: taskTitle,
            urgency: result.urgency,
          }
        );
      }
    }

    const analysis: Analysis = {
      id: analysisId,
      snapshot_id: snapshotId,
      cleanliness_score: result.cleanliness_score,
      summary: result.summary,
      issues: result.issues,
      suggested_tasks: result.suggested_tasks,
      urgency: result.urgency,
      analysed_at: new Date().toISOString(),
    };

    return Response.json({ analysis });
  } catch (err) {
    console.error('[POST /api/analyse]', err);
    return Response.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
