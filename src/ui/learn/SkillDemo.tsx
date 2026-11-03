import { useState } from 'react';
import fixture from '../../../tests/fixtures/skill-track.practice.json';
import type { SkillTrackPack } from '../../data/packs/skillTrack';
import { SkillPractice } from './SkillPractice';

/**
 * E2E build only (route read/skill-demo): the spec 43 practice engine on the neutral test fixture, so the loop can be
 * tested and shot before any real course ships. AppShell imports this only when VITE_E2E is set, and the release build
 * check (scripts/check-release-bundle.ts) fails if the fixture ever reaches dist/. `?lesson=say-2&variant=1` picks one.
 */
export function SkillDemo() {
  const track = fixture as unknown as SkillTrackPack;
  const params = new URLSearchParams(location.search);
  const [stopped, setStopped] = useState(false);
  const lesson = track.body.lessons.find(item => item.lessonId === (params.get('lesson') ?? 'say-1'));
  if (stopped) return <section className="screen"><h1>Practice demo</h1><p role="status">Stopped.</p></section>;
  if (!lesson) return <section className="screen"><h1>Practice demo</h1><p role="status">No such lesson.</p></section>;
  return <SkillPractice key={lesson.lessonId} trackId={track.body.trackId} lesson={lesson} variantIndex={Number(params.get('variant') ?? 0)} onStop={() => setStopped(true)} />;
}
