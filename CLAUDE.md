@AGENTS.md

# Vesto — CLAUDE.md

## Project Overview
Vesto (derived from Vesta, Roman goddess of the hearth and home) is a home monitoring app that uses AI vision to analyse the state of rooms and automatically generate cleaning/maintenance tasks. The user uploads photos of rooms (manually via phone for now, later via ESP32-CAM or Raspberry Pi Zero 2W), Claude Vision analyses them, and the app tracks cleanliness over time with gamification.

## Tech Stack
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Oracle Autonomous Database (OCI) — using `oracledb` npm package with Wallet (mTLS)
- **Image Storage**: OCI Object Storage (store URL in DB, binary in OCI bucket)
- **AI**: Anthropic Claude claude-haiku-4-5 with vision (cheap, fast, good enough)
- **Auth**: NextAuth.js (credentials or magic link, keep it simple)
- **Hosting**: Vercel
- **PWA**: `@ducanh2912/next-pwa` — add from the start so it works later

## Tone of Voice
Vesto is not polite. It has personality.
- Licht sarcastisch, direct, een beetje confronterend maar grappig
- "Kitchen's slipping." / "We both know that pile didn't fix itself." / "Chaos level: rising."
- De AI summary in analyses reflecteert dit — nooit droog, altijd met karakter
- Tagline: **"Bring order back home."**

## Design System: Emerald Zenith
Strictly follow this design system. Do not deviate.

### Colors (Tailwind custom config)
- Primary: `#006E2F` (deep botanical green)
- Surface: `#f7f9fb`
- Surface Container Lowest: `#ffffff` (cards)
- On-surface: `#191c1e`
- Outline variant: `#bccbb9`
- Error/Tertiary: `#b91a24`
- Secondary (amber): `#855300`

### Typography
- Headlines/Labels: `Plus Jakarta Sans` (extrabold, tight tracking)
- Body: `Be Vietnam Pro`
- Micro-labels: 10px, uppercase, tracking-[0.2em], font-extrabold

### Rules
- NO 1px borders for section separation — use color depth (white card on #f7f9fb bg)
- Buttons: `rounded-full`, `shadow-primary/20`
- Floating elements: `backdrop-blur-2xl`, `bg-white/80`
- Shadows: always tinted with primary color, never neutral grey
- Glassmorphism: `bg-white/60 backdrop-blur-2xl border border-white/20`
- Progress indicators: SVG ring (not progress bar) for scores
- Status badges: 10px uppercase pill, `rounded-full`

## Project Structure
```
/app
  /api
    /snapshot         POST — receive image, store in OCI, trigger analysis
    /analyse          POST — send image to Claude Vision, store result
    /tasks            GET/POST/PATCH — task management
    /rooms            GET/POST — room management
  /(dashboard)
    /page.tsx         Overview — all rooms, health scores
    /rooms/[id]/      Room detail — camera feed, AI panel, tasks, chaos chart
    /history/         Timeline of snapshots + AI summaries
    /stats/           Streaks, badges, chaos index trends
    /settings/        Camera registration, AI personality, inference schedule
/components
  /ui                 Reusable: RingScore, TaskCard, RoomCard, ChaosChart
  /layout             TopBar, BottomNav
/lib
  /db.ts              Oracle DB connection (singleton, wallet-based)
  /oracle-storage.ts  OCI Object Storage upload helper
  /claude-vision.ts   Image analysis helper — returns structured JSON
  /auth.ts            NextAuth config
/types
  index.ts            All shared TypeScript types
```

## Database Schema (Oracle)
```sql
-- Rooms
CREATE TABLE rooms (
  id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        VARCHAR2(100) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Snapshots (photo per room per analysis)
CREATE TABLE snapshots (
  id              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id         NUMBER REFERENCES rooms(id),
  image_url       VARCHAR2(500) NOT NULL,
  captured_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source          VARCHAR2(50) DEFAULT 'manual' -- 'manual' | 'esp32' | 'pi'
);

-- Analyses (AI result per snapshot)
CREATE TABLE analyses (
  id                  NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  snapshot_id         NUMBER REFERENCES snapshots(id),
  cleanliness_score   NUMBER(3,1),
  summary             VARCHAR2(1000),
  issues              CLOB, -- JSON array
  suggested_tasks     CLOB, -- JSON array
  urgency             VARCHAR2(20), -- 'low' | 'medium' | 'high'
  analysed_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks
CREATE TABLE tasks (
  id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id       NUMBER REFERENCES rooms(id),
  analysis_id   NUMBER REFERENCES analyses(id),
  title         VARCHAR2(200) NOT NULL,
  urgency       VARCHAR2(20) DEFAULT 'low',
  status        VARCHAR2(20) DEFAULT 'pending', -- 'pending' | 'completed' | 'dismissed'
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at  TIMESTAMP
);
```

## Claude Vision Analysis Contract
Every image analysis calls Claude with this prompt and expects this JSON back:

```typescript
// Prompt to Claude Vision
const ANALYSIS_PROMPT = `
Analyse this photo of a room in someone's home.
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
}
`;

// TypeScript type
interface AnalysisResult {
  cleanliness_score: number;
  summary: string;
  issues: string[];
  suggested_tasks: string[];
  urgency: 'low' | 'medium' | 'high';
  zones: Array<{ name: string; status: 'clean' | 'minor_clutter' | 'messy' }>;
}
```

## Key API Routes

### POST /api/snapshot
- Accepts: `multipart/form-data` with `image` (file) and `room_id`
- Validates API key header: `X-API-Key`
- Uploads image to OCI Object Storage
- Stores snapshot record in DB
- Triggers /api/analyse
- Returns: `{ snapshot_id, image_url }`

### POST /api/analyse
- Accepts: `{ snapshot_id }`
- Fetches image URL from DB
- Sends to Claude Vision with ANALYSIS_PROMPT
- Parses JSON response
- Stores analysis in DB
- Auto-creates tasks from suggested_tasks (only if score < 7 or urgency != 'low')
- Returns: `{ analysis }`

## Environment Variables
```env
# Oracle DB
ORACLE_USER=
ORACLE_PASSWORD=
ORACLE_CONNECTION_STRING=
ORACLE_WALLET_LOCATION=/app/wallet  # path to unzipped wallet

# OCI Object Storage
OCI_NAMESPACE=
OCI_BUCKET_NAME=
OCI_REGION=
OCI_ACCESS_KEY_ID=
OCI_SECRET_ACCESS_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# ESP32 / device auth
ESP32_API_KEY=
```

## Sprint 1 Goals (build these first, in order)
1. Oracle DB connection working (`/lib/db.ts`) — test with a simple query
2. OCI Object Storage upload working (`/lib/oracle-storage.ts`)
3. Claude Vision analysis working (`/lib/claude-vision.ts`) — test with a hardcoded image URL
4. POST /api/snapshot endpoint — full flow: upload → store → analyse → tasks
5. Dashboard UI — room cards with latest score, empty state if no snapshots
6. Room detail page — manual upload button, AI panel with score ring, task list
7. Bottom navigation working between pages

## What NOT to build in Sprint 1
- Auth (hardcode a single user for now, add NextAuth in Sprint 2)
- Hardware integration (manual upload only)
- History page (data will exist, build UI in Sprint 2)
- Badges/gamification (Sprint 3)
- PWA manifest (scaffold it but don't spend time on it)

## Code Style
- TypeScript strict mode
- All DB calls through `/lib/db.ts` — never import oracledb directly in routes
- All OCI storage through `/lib/oracle-storage.ts`
- All Claude calls through `/lib/claude-vision.ts`
- Prefer `async/await` over `.then()`
- Error handling: always return `{ error: string }` with appropriate HTTP status
- No `any` types — define proper interfaces in `/types/index.ts`