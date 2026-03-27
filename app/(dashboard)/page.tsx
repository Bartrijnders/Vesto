/**
 * NOTE: This file is intentionally NOT the active dashboard page.
 * The dashboard lives at app/page.tsx to avoid the Next.js route conflict
 * caused by having both app/page.tsx and app/(dashboard)/page.tsx resolve to /.
 *
 * This file can be deleted safely — it is never reached.
 */
import { redirect } from 'next/navigation';

export default function UnreachablePage() {
  redirect('/');
}
