/**
 * OCI Object Storage upload helper.
 *
 * OCI Object Storage exposes an S3-compatible API, so we use @aws-sdk/client-s3.
 *
 * Setup instructions:
 * 1. In OCI Console → Identity → Users → <your user> → Customer Secret Keys.
 * 2. Generate a key pair — that gives you OCI_ACCESS_KEY_ID + OCI_SECRET_ACCESS_KEY.
 * 3. Set OCI_NAMESPACE (tenancy namespace, visible in Object Storage settings).
 * 4. Set OCI_BUCKET_NAME (the bucket you created for Vesto images).
 * 5. Set OCI_REGION (e.g. eu-amsterdam-1).
 *
 * The S3-compatible endpoint is:
 *   https://<namespace>.compat.objectstorage.<region>.oraclecloud.com
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

function getClient(): S3Client {
  const namespace = process.env.OCI_NAMESPACE;
  const region = process.env.OCI_REGION;
  if (!namespace) throw new Error('OCI_NAMESPACE is not set');
  if (!region) throw new Error('OCI_REGION is not set');
  if (!process.env.OCI_ACCESS_KEY_ID) throw new Error('OCI_ACCESS_KEY_ID is not set');
  if (!process.env.OCI_SECRET_ACCESS_KEY) throw new Error('OCI_SECRET_ACCESS_KEY is not set');

  return new S3Client({
    region,
    endpoint: `https://${namespace}.compat.objectstorage.${region}.oraclecloud.com`,
    credentials: {
      accessKeyId: process.env.OCI_ACCESS_KEY_ID,
      secretAccessKey: process.env.OCI_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true, // required for OCI S3-compatible API
  });
}

/**
 * Upload a buffer to OCI Object Storage and return the public URL.
 *
 * @param key     Object key / path within the bucket (e.g. "snapshots/room-1/abc.jpg")
 * @param body    File content as Buffer
 * @param contentType  MIME type (e.g. "image/jpeg")
 */
export async function uploadToStorage(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const bucket = process.env.OCI_BUCKET_NAME;
  const namespace = process.env.OCI_NAMESPACE;
  const region = process.env.OCI_REGION;
  if (!bucket) throw new Error('OCI_BUCKET_NAME is not set');

  const client = getClient();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Make objects publicly readable — adjust if you need pre-signed URLs instead.
      ACL: 'public-read',
    })
  );

  // Return the public URL of the uploaded object.
  return `https://${namespace}.compat.objectstorage.${region}.oraclecloud.com/${bucket}/${key}`;
}

/**
 * Generate a unique storage key for a room snapshot.
 */
export function snapshotKey(roomId: number, filename: string): string {
  const ts = Date.now();
  const ext = filename.split('.').pop() ?? 'jpg';
  return `snapshots/room-${roomId}/${ts}.${ext}`;
}
