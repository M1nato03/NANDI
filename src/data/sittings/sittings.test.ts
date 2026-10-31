import { describe, expect, it } from 'vitest';
import { sittingContent } from './index';
import babylon from '../../../content/topics/book.richest-man-in-babylon.json';
import friends from '../../../content/topics/book.how-to-win-friends.json';
import worrying from '../../../content/topics/book.how-to-stop-worrying.json';

// Spec 41: every book's extra sitting screens cover each of its ideas.
type Pack = { body: { modules: { concepts: { id: string; steps?: unknown[] }[] }[] } };
const ideasOf = (pack: Pack) => pack.body.modules.flatMap(module => module.concepts).filter(concept => concept.steps?.length).map(concept => concept.id);

describe('spec 41 sitting screens', () => {
  for (const [book, pack] of [['richest-man-in-babylon', babylon], ['how-to-win-friends', friends], ['how-to-stop-worrying', worrying]] as [string, Pack][]) {
    it(`${book}: a story, an example and a plan for every idea`, () => {
      for (const id of ideasOf(pack)) {
        const content = sittingContent(book, id);
        expect(content?.story.text, id).toBeTruthy();
        expect(content?.example.text, id).toBeTruthy();
        expect(content?.plan.ifThen, id).toBeTruthy();
      }
    });
  }
});
