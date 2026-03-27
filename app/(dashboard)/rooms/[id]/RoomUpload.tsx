'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import RingScore from '@/components/ui/RingScore';
import type { AnalysisResult } from '@/types';

interface RoomUploadProps {
  roomId: number;
}

type UploadState =
  | { phase: 'idle' }
  | { phase: 'uploading' }
  | { phase: 'analysing' }
  | { phase: 'done'; result: AnalysisResult }
  | { phase: 'error'; message: string };

export default function RoomUpload({ roomId }: RoomUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ phase: 'idle' });
  const [preview, setPreview] = useState<string | null>(null);
  const router = useRouter();

  async function handleFile(file: File) {
    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setState({ phase: 'uploading' });

    try {
      // 1. Upload snapshot
      const form = new FormData();
      form.append('image', file);
      form.append('room_id', String(roomId));

      const snapRes = await fetch('/api/snapshot', {
        method: 'POST',
        headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY ?? '' },
        body: form,
      });

      if (!snapRes.ok) {
        const err = await snapRes.json();
        throw new Error(err.error ?? 'Upload failed');
      }

      const { snapshot_id } = await snapRes.json();
      setState({ phase: 'analysing' });

      // 2. Run analysis
      const analyseRes = await fetch('/api/analyse', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY ?? '',
        },
        body: JSON.stringify({ snapshot_id }),
      });

      if (!analyseRes.ok) {
        const err = await analyseRes.json();
        throw new Error(err.error ?? 'Analysis failed');
      }

      const { analysis } = await analyseRes.json();

      // Reconstruct the AnalysisResult shape from the stored analysis
      const result: AnalysisResult = {
        cleanliness_score: analysis.cleanliness_score,
        summary: analysis.summary,
        issues: typeof analysis.issues === 'string' ? JSON.parse(analysis.issues) : analysis.issues,
        suggested_tasks:
          typeof analysis.suggested_tasks === 'string'
            ? JSON.parse(analysis.suggested_tasks)
            : analysis.suggested_tasks,
        urgency: analysis.urgency,
        zones: [],
      };

      setState({ phase: 'done', result });
      router.refresh();
    } catch (err) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'Something went wrong' });
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function reset() {
    setState({ phase: 'idle' });
    setPreview(null);
  }

  const isWorking = state.phase === 'uploading' || state.phase === 'analysing';

  return (
    <section>
      <h2
        className="text-[10px] font-extrabold uppercase tracking-[0.2em] mb-3"
        style={{ color: '#bccbb9' }}
      >
        New scan
      </h2>

      {/* Result card */}
      {state.phase === 'done' && (
        <ResultCard result={state.result} preview={preview} onDismiss={reset} />
      )}

      {/* Error */}
      {state.phase === 'error' && (
        <div
          className="rounded-2xl p-4 mb-3 flex items-start gap-3"
          style={{ background: '#fff0f0' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 mt-0.5">
            <circle cx="9" cy="9" r="8" stroke="#b91a24" strokeWidth="1.8" />
            <path d="M9 5v5M9 13v.5" stroke="#b91a24" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <p className="text-sm flex-1" style={{ color: '#b91a24', fontFamily: 'var(--font-body)' }}>
            {state.message}
          </p>
          <button onClick={reset} className="text-[#b91a24] text-xs font-bold underline">
            Retry
          </button>
        </div>
      )}

      {/* Upload area */}
      {state.phase !== 'done' && (
        <button
          onClick={() => !isWorking && inputRef.current?.click()}
          disabled={isWorking}
          className="w-full rounded-3xl flex flex-col items-center justify-center gap-3 py-8 transition-opacity"
          style={{
            background: isWorking ? 'rgba(0,110,47,0.06)' : 'white',
            border: '2px dashed #bccbb9',
            boxShadow: 'var(--shadow-card)',
            cursor: isWorking ? 'default' : 'pointer',
          }}
        >
          {isWorking ? (
            <Spinner phase={state.phase} />
          ) : (
            <>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,110,47,0.08)' }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M11 2v14M5 8l6-6 6 6" stroke="#006E2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 18h18" stroke="#006E2F" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="text-center">
                <p
                  className="text-sm font-bold"
                  style={{ color: '#191c1e', fontFamily: 'var(--font-display)' }}
                >
                  Upload a photo
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#bccbb9', fontFamily: 'var(--font-body)' }}>
                  JPG, PNG or WEBP
                </p>
              </div>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />
    </section>
  );
}

function Spinner({ phase }: { phase: 'uploading' | 'analysing' }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        className="animate-spin"
        style={{ animationDuration: '0.9s' }}
      >
        <circle cx="16" cy="16" r="13" stroke="#bccbb9" strokeWidth="3" />
        <path
          d="M16 3 A13 13 0 0 1 29 16"
          stroke="#006E2F"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <p
        className="text-xs font-bold"
        style={{ color: '#006E2F', fontFamily: 'var(--font-display)' }}
      >
        {phase === 'uploading' ? 'Uploading…' : 'Vesto is judging…'}
      </p>
    </div>
  );
}

function ResultCard({
  result,
  preview,
  onDismiss,
}: {
  result: AnalysisResult;
  preview: string | null;
  onDismiss: () => void;
}) {
  return (
    <div
      className="rounded-3xl bg-white overflow-hidden mb-3"
      style={{ boxShadow: 'var(--shadow-float)' }}
    >
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Uploaded room" className="w-full h-48 object-cover" />
      )}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <RingScore score={result.cleanliness_score} size={72} />
          <div className="flex-1">
            <p
              className="text-sm font-medium leading-snug"
              style={{ color: '#191c1e', fontFamily: 'var(--font-body)' }}
            >
              {result.summary}
            </p>
            <span
              className="inline-block mt-2 text-[10px] font-extrabold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
              style={{
                background:
                  result.urgency === 'high' ? '#fff0f0' : result.urgency === 'medium' ? '#fffbeb' : '#f0fdf4',
                color:
                  result.urgency === 'high' ? '#b91a24' : result.urgency === 'medium' ? '#855300' : '#006E2F',
              }}
            >
              {result.urgency} urgency
            </span>
          </div>
        </div>

        {result.issues.length > 0 && (
          <div className="mt-4">
            <p
              className="text-[10px] font-extrabold uppercase tracking-[0.2em] mb-2"
              style={{ color: '#bccbb9' }}
            >
              Issues spotted
            </p>
            <ul className="flex flex-col gap-1.5">
              {result.issues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: '#b91a24' }}
                  />
                  <span className="text-sm" style={{ color: '#191c1e', fontFamily: 'var(--font-body)' }}>
                    {issue}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={onDismiss}
          className="mt-4 text-xs font-bold underline"
          style={{ color: '#bccbb9' }}
        >
          Scan another
        </button>
      </div>
    </div>
  );
}
