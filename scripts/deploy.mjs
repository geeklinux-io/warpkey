import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const configPath = new URL('../wrangler.jsonc', import.meta.url);
let config = readFileSync(configPath, 'utf8');
const placeholder = '00000000-0000-0000-0000-000000000000';
const wrangler = process.platform === 'win32' ? 'node_modules/.bin/wrangler.cmd' : 'node_modules/.bin/wrangler';

function run(args, options = {}) {
  const result = spawnSync(wrangler, args, { encoding: 'utf8', ...options });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || 'Wrangler command failed\n');
    process.exit(result.status || 1);
  }
  return result.stdout || '';
}

if (config.includes(placeholder)) {
  let databaseId = process.env.D1_DATABASE_ID;
  if (!databaseId) {
    console.log('Creating the D1 database…');
    const createArgs = ['d1', 'create', 'warpkey-edge-console-db'];
    if (process.env.D1_LOCATION) createArgs.push('--location', process.env.D1_LOCATION);
    const output = run(createArgs);
    databaseId = output.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
  }
  if (!databaseId) {
    console.error('Could not find the D1 database id in Wrangler output.');
    process.exit(1);
  }
  config = config.replace(placeholder, databaseId);
  writeFileSync(configPath, config);
  console.log(`Bound D1 database ${databaseId}`);
}

console.log('Applying D1 migrations…');
run(['d1', 'migrations', 'apply', 'DB', '--remote']);

console.log('Deploying the Worker…');
const deployed = run(['deploy']);
process.stdout.write(deployed);

const workerUrl = deployed.match(/https:\/\/[^\s]+\.workers\.dev/)?.[0];
console.log('\nWarpKey is live:');
console.log(`  ${workerUrl ?? 'https://<your-worker>.workers.dev'}`);
