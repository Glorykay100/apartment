const { spawnSync } = require('node:child_process');
const path = require('node:path');
const dotenv = require('dotenv');

const backendDir = path.resolve(__dirname, '..');
// Keep the Node executable running this script in front of system Node when
// child npm commands invoke their CLI shims (useful in CI and local runtimes).
process.env.PATH = `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH || ''}`;
const envPath = path.join(backendDir, '.env.test');
const loaded = dotenv.config({ path: envPath, override: true });
if (loaded.error) {
  console.error('Refusing to run backend tests: backend/.env.test is required.');
  process.exit(2);
}

const connection = new URL(process.env.DATABASE_URL || '');
const database = connection.pathname.replace(/^\//, '');
if (!['127.0.0.1', 'localhost', '::1'].includes(connection.hostname) || database !== 'yahsab_test') {
  console.error(`Refusing to run backend tests: expected local database yahsab_test, got host=${connection.hostname || '(missing)'} database=${database || '(missing)'}.`);
  process.exit(2);
}

process.env.NODE_ENV = 'test';
process.env.PAYSTACK_SECRET_KEY = 'sk_test_mock_secret_key_1234567890';
process.env.PAYSTACK_PUBLIC_KEY = 'pk_test_mock_public_key_1234567890';
process.env.CLIENT_URL = 'http://localhost:3000';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(args) {
  const result = spawnSync(npm, args, { cwd: backendDir, env: process.env, stdio: 'inherit' });
  return result.status ?? 1;
}

let result = run(['exec', 'prisma', '--', 'db', 'push', '--force-reset', '--accept-data-loss']);
if (result === 0) result = run(['run', 'prisma:seed']);
if (result === 0) result = run(['exec', 'vitest', '--', 'run']);
if (result === 0) result = run(['exec', 'vitest', '--', 'run', '--coverage']);

// Leave the disposable database empty even if a test fails.
const cleanupResult = run(['exec', 'prisma', '--', 'db', 'push', '--force-reset', '--accept-data-loss']);
if (cleanupResult !== 0) {
  console.error('Test database cleanup failed; the isolated yahsab_test database may contain test data.');
  process.exit(1);
}
process.exit(result);
