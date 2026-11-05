// Who is signed in (minimal): lets the edit bar decide whether to appear,
// without making public pages render per visitor.
import { NextResponse } from 'next/server';
import { getViewer } from '@/lib/auth/viewer';

export async function GET() {
  const v = await getViewer();
  return NextResponse.json(
    v ? { signedIn: true, staff: Boolean(v.staffRole), role: v.staffRole, firstName: v.firstName } : { signedIn: false, staff: false },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
