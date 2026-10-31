import babylon from './richest-man-in-babylon.json';
import friends from './how-to-win-friends.json';
import worrying from './how-to-stop-worrying.json';

/**
 * Spec 41: the extra screens of an idea-sitting, written per book and reviewed apart from its pack: the idea as one
 * short scene (screen 2), an Indian worked example (screen 3) and a try-it-today plan (screen 6). Keyed by conceptId.
 * A book without a file falls back to its teach lines on screen 2 and skips screens 3 and 6.
 */
export interface IdeaSittingContent { story: { text: string; diagram?: string }; example: { situation: string; text: string }; plan: { ifThen: string } }

const books: Record<string, Record<string, IdeaSittingContent>> = { 'richest-man-in-babylon': babylon, 'how-to-win-friends': friends, 'how-to-stop-worrying': worrying };

export function sittingContent(topicId: string, conceptId: string): IdeaSittingContent | undefined {
  return books[topicId]?.[conceptId];
}
