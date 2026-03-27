import Anthropic from '@anthropic-ai/sdk';
import type { AnalysisResult } from '@/types';

const ANALYSIS_PROMPT = `Analyse this photo of a room in someone's home.
You are Vesto — direct, slightly sarcastic, but genuinely helpful.
Respond ONLY with valid JSON, no explanation, no markdown.

{
  "cleanliness_score": <number 1-10, where 10 is spotless>,
  "summary": "<one sentence, witty but honest, max 120 chars>",
  "issues": ["<specific observed problem>", ...],
  "suggested_tasks": ["<actionable task>", ...],
  "urgency": "<low|medium|high>",
  "zones": [
    { "name": "<area name>", "status": "<clean|minor_clutter|messy>" }
  ]
}`;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

/**
 * Analyse a room image URL with Claude Vision.
 * The image must be publicly accessible (OCI Object Storage public-read).
 */
export async function analyseRoomUrl(imageUrl: string): Promise<AnalysisResult> {
  const anthropic = getClient();

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'url',
              url: imageUrl,
            },
          },
          {
            type: 'text',
            text: ANALYSIS_PROMPT,
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text content');
  }

  return parseAnalysisResult(textBlock.text);
}

/**
 * Analyse a room image from a raw base64 buffer.
 * Used when the image is not yet uploaded to storage (e.g. during testing).
 */
export async function analyseRoomBase64(
  imageData: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
): Promise<AnalysisResult> {
  const anthropic = getClient();

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageData,
            },
          },
          {
            type: 'text',
            text: ANALYSIS_PROMPT,
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text content');
  }

  return parseAnalysisResult(textBlock.text);
}

function parseAnalysisResult(raw: string): AnalysisResult {
  // Strip any accidental markdown fences Claude might wrap around the JSON.
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Claude returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }

  const result = parsed as Record<string, unknown>;

  if (
    typeof result.cleanliness_score !== 'number' ||
    typeof result.summary !== 'string' ||
    !Array.isArray(result.issues) ||
    !Array.isArray(result.suggested_tasks) ||
    !['low', 'medium', 'high'].includes(result.urgency as string) ||
    !Array.isArray(result.zones)
  ) {
    throw new Error(`Claude returned unexpected shape: ${cleaned.slice(0, 200)}`);
  }

  return result as unknown as AnalysisResult;
}
