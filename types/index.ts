// ─── Domain types ────────────────────────────────────────────────────────────

export interface Room {
  id: number;
  name: string;
  created_at: string;
  /** Joined from latest analysis — not always present */
  latest_score?: number;
  latest_urgency?: 'low' | 'medium' | 'high';
  latest_summary?: string;
  snapshot_count?: number;
}

export interface Snapshot {
  id: number;
  room_id: number;
  image_url: string;
  captured_at: string;
  source: 'manual' | 'esp32' | 'pi';
}

export interface Analysis {
  id: number;
  snapshot_id: number;
  cleanliness_score: number;
  summary: string;
  issues: string[];
  suggested_tasks: string[];
  urgency: 'low' | 'medium' | 'high';
  analysed_at: string;
}

export interface Task {
  id: number;
  room_id: number;
  analysis_id: number | null;
  title: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'dismissed';
  created_at: string;
  completed_at: string | null;
}

// ─── Claude Vision contract ───────────────────────────────────────────────────

export interface AnalysisResult {
  cleanliness_score: number;
  summary: string;
  issues: string[];
  suggested_tasks: string[];
  urgency: 'low' | 'medium' | 'high';
  zones: Array<{ name: string; status: 'clean' | 'minor_clutter' | 'messy' }>;
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface ApiError {
  error: string;
}

export interface SnapshotResponse {
  snapshot_id: number;
  image_url: string;
}

export interface AnalyseResponse {
  analysis: Analysis;
}
