import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { uploadToStorage, snapshotKey } from '@/lib/oracle-storage';
import type { SnapshotResponse } from '@/types';

const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest): Promise<Response> {
  // Validate API key
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.ESP32_API_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const image = formData.get('image') as File | null;
    const roomIdRaw = formData.get('room_id');

    if (!image) return Response.json({ error: 'image is required' }, { status: 400 });
    if (!roomIdRaw) return Response.json({ error: 'room_id is required' }, { status: 400 });

    const roomId = Number(roomIdRaw);
    if (isNaN(roomId)) return Response.json({ error: 'room_id must be a number' }, { status: 400 });

    if (!VALID_TYPES.includes(image.type)) {
      return Response.json({ error: `Unsupported image type: ${image.type}` }, { status: 400 });
    }

    // Upload to OCI Object Storage
    const buffer = Buffer.from(await image.arrayBuffer());
    const key = snapshotKey(roomId, image.name || 'snapshot.jpg');
    const imageUrl = await uploadToStorage(key, buffer, image.type);

    // Store snapshot record
    const result = await query<{ ID: number }>(
      `INSERT INTO snapshots (room_id, image_url, source)
       VALUES (:room_id, :image_url, 'manual')
       RETURNING id INTO :id`,
      {
        room_id: roomId,
        image_url: imageUrl,
        id: { dir: 3003, type: 2010 },
      }
    );

    const snapshotId = (result.outBinds as unknown as { id: number[] }).id[0];

    // Trigger analysis in the background (fire-and-forget, don't await)
    void triggerAnalysis(snapshotId, req);

    const response: SnapshotResponse = { snapshot_id: snapshotId, image_url: imageUrl };
    return Response.json(response, { status: 201 });
  } catch (err) {
    console.error('[POST /api/snapshot]', err);
    return Response.json({ error: 'Failed to process snapshot' }, { status: 500 });
  }
}

async function triggerAnalysis(snapshotId: number, req: NextRequest): Promise<void> {
  const base = process.env.NEXTAUTH_URL ?? `http://localhost:3000`;
  try {
    await fetch(`${base}/api/analyse`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ESP32_API_KEY ?? '',
      },
      body: JSON.stringify({ snapshot_id: snapshotId }),
    });
  } catch (err) {
    console.error('[triggerAnalysis]', err);
  }
}
