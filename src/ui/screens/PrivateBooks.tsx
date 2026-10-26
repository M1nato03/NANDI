import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { checkPrivatePack, privateTopicPacks, removePrivatePack, savePrivatePack } from '../../data/packs/privateBooks';
import { bookTitle } from '../../core/learn/books';
import '../learn/read.css';

/**
 * Spec 33 §7: You → Import a private book. One .json book, checked by the same validator, marked private, kept on
 * this phone only (never shared, never in the app build). Remove deletes the book; what was learned stays.
 */
export function PrivateBooks() {
  const rows = useLiveQuery(() => db.privatePacks.toArray(), []);
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const books = privateTopicPacks(rows ?? []);
  const pick = async (file: File | undefined) => {
    if (!file) return;
    setMessage('');
    try {
      const { pack, errors } = checkPrivatePack(JSON.parse(await file.text()) as unknown);
      if (!pack) { setMessage(`This book could not be added. ${errors.slice(0, 3).join(' ')}`); return; }
      const now = Date.now();
      await savePrivatePack(db, pack, await getOrCreateDeviceId(db, now), now);
      setMessage(`${bookTitle(pack)} is on your Private shelf.`);
    } catch { setMessage('This file is not a NANDI book.'); }
    finally { if (input.current) input.current.value = ''; }
  };
  return <section className="card you-private" aria-label="Private books"><h2>Private books</h2>
    <p className="small">Books you own, written up for you. They stay on this phone and are never shared.</p>
    {books.length > 0 && <ul className="you-private-list">{books.map(pack => <li key={pack.id}><span>{bookTitle(pack)}</span>
      {confirm === pack.id ? <span className="you-private-confirm"><button type="button" onClick={() => { setConfirm(null); void removePrivatePack(db, pack.id).then(() => setMessage(`${bookTitle(pack)} was removed.`)); }}>Remove it</button><button type="button" className="secondary" onClick={() => setConfirm(null)}>Keep</button></span>
        : <button type="button" className="secondary" aria-label={`Remove ${bookTitle(pack)}`} onClick={() => setConfirm(pack.id)}>Remove</button>}</li>)}</ul>}
    <label className="ui-button-secondary you-private-import">Import a private book<input ref={input} type="file" accept=".json,application/json" className="visually-hidden" onChange={event => void pick(event.target.files?.[0])} /></label>
    {message && <p role="status">{message}</p>}
  </section>;
}
