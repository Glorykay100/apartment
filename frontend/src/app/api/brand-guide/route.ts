import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const pdf = await readFile(
    resolve(process.cwd(), '../docs/yahsab-brand-guide.pdf')
  );

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="yahsab-brand-guide.pdf"',
      'Content-Length': String(pdf.byteLength),
      'Cache-Control': 'no-store',
    },
  });
}
