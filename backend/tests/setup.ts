/**
 * Global test setup — runs before any test file.
 *
 * 1. Loads .env.test so tests never touch production credentials.
 * 2. Stubs the Supabase client to avoid WebSocket requirement on Node 18.
 * 3. Seeds the test database if empty.
 */
import { config } from 'dotenv';

// Load .env.test with override so production .env never leaks into tests.
config({ path: '.env.test', override: true });

// ── Stub WebSocket for @supabase/supabase-js on Node < 22 ──────────
// The Supabase JS SDK requires native WebSocket for its realtime client,
// which only exists on Node 22+. In tests we never use realtime, so we
// provide a minimal stub to let the client constructor succeed.
if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = class {
    constructor() {}
    close() {}
    send() {}
    addEventListener() {}
    removeEventListener() {}
    onopen: any = null;
    onmessage: any = null;
    onerror: any = null;
    onclose: any = null;
    readyState = 0;
  };
}
