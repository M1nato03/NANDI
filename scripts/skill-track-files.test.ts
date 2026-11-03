import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { validateAll } from './validate-packs';
import { releaseBundleErrors } from './check-release-bundle';

// Spec 43: a skill track under content/skill-tracks is checked against content/skill-tracks/rights, and no test
// fixture or e2e-only demo may reach the release dist/.
const dirs: string[] = [];
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });
const temp = () => { const dir = mkdtempSync(join(tmpdir(), 'skill-43-')); dirs.push(dir); return dir; };
const fixture = readFileSync(join('tests', 'fixtures', 'skill-track.practice.json'), 'utf8');
const rights = readFileSync(join('tests', 'fixtures', 'skill-track.rights.json'), 'utf8');

describe('spec 43: skill tracks in validate-packs', () => {
  it('a track passes with its rights register beside it, and the register is not read as a pack', async () => {
    const dir = temp();
    mkdirSync(join(dir, 'skill-tracks', 'rights'), { recursive: true });
    writeFileSync(join(dir, 'skill-tracks', 'skill-track.practice-fixture.json'), fixture);
    writeFileSync(join(dir, 'skill-tracks', 'rights', 'practice.json'), rights);
    expect(await validateAll(dir)).toEqual([]);
  });
  it('without the register every lesson is reported', async () => {
    const dir = temp();
    mkdirSync(join(dir, 'skill-tracks'), { recursive: true });
    writeFileSync(join(dir, 'skill-tracks', 'skill-track.practice-fixture.json'), fixture);
    const errors = await validateAll(dir);
    expect(errors.filter(error => error.includes('rights entry'))).toHaveLength(3);
  });
});

describe('spec 43: the release bundle check', () => {
  it('passes a clean dist and names any file carrying the fixture or the demo route', async () => {
    const dir = temp();
    mkdirSync(join(dir, 'assets'));
    writeFileSync(join(dir, 'assets', 'index.js'), 'export const a = 1;');
    expect(await releaseBundleErrors(dir)).toEqual([]);
    writeFileSync(join(dir, 'assets', 'SkillDemo.js'), 'const t = "practice-fixture"; go("read/skill-demo");');
    const errors = await releaseBundleErrors(dir);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain('SkillDemo.js');
  });
});
