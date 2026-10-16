import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const versionCode = Number(process.env.VERSION_CODE);
const apk = `updates-site/nandi-${versionCode}.apk`;
const bytes = readFileSync(apk);
if (bytes.length > 25 * 1024 * 1024) throw new Error('Signed APK exceeds the 25 MiB Worker static asset limit.');
const sha256 = createHash('sha256').update(bytes).digest('hex');
const versionName = JSON.parse(readFileSync('package.json', 'utf8')).version;
const notes = execFileSync('git', ['log', '-1', '--format=%s'], { encoding: 'utf8' }).trim();
writeFileSync('updates-site/version.json', JSON.stringify({
  versionCode, versionName, sha256,
  url: `https://nandi-updates.nandi11.workers.dev/nandi-${versionCode}.apk`,
  builtAt: new Date().toISOString(), commit: process.env.COMMIT_SHA, notes,
}) + '\n');
