/**
 * Spec 40 §4 with b2's call (6 Nov): up to 40 XP for spotting warning signs (10 per sign month, once) is OFF by
 * default, behind the setting `bookGame.signXp`. It goes to Jenil as an Ask ("up to 40 XP for spotting warning signs,
 * or no XP"); turning it on is a one-line change. With the flag off no `book-game:*` fact is ever written, so turning
 * it on later pays only from its own cutoff (economy.v11From) and nothing backwards.
 */
export const BOOK_GAME_SIGN_XP = 10;
export const SIGN_XP_FLAG = 'bookGame.signXp';
export const SIGN_XP_DEFAULT = false;
export const bookGameFactId = (bookId: string, month: number) => `book-game:${bookId}:${month}`;
