import { useEffect, useRef, useState } from 'react';
import { receiptContent, receiptShareLines, receiptWeek, type WeeklyRecapData } from '../../core/recap';
import { weekShareText } from '../../core/puzzles/share';
import { saveFileNow, shareFileNow, shareNote, useShareDay } from '../shareActions';
import { recapPng } from './recapCard';
import { useModalFocus } from '../shell/useModalFocus';
import { Kachhua } from '../cast/Cast';

/** Spec 53: the week as a receipt. Share sends the image with one text line and the app's link; Save keeps the image. */
export function RecapShare({ recap, link = false }: { recap: WeeklyRecapData; link?: boolean }) {
  // An open week says "so far" on the receipt (You's card, and Sunday evening before the week closes).
  const card = receiptContent(recap, Date.now()); // eslint-disable-line react-hooks/purity
  const [open, setOpen] = useState(false);
  const dialog = useModalFocus<HTMLElement>(() => setOpen(false));
  const [preview, setPreview] = useState('');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  // The receipt's shop logo is Kachhua's own drawing, taken from this hidden copy.
  const logo = useRef<HTMLDivElement>(null);
  // Spec 19: the week card hides after shutdown like every other share, and checks again when tapped.
  const day = useShareDay();
  useEffect(() => {
    if (!open) return;
    let active = true;
    let url = '';
    void recapPng(card, logo.current?.querySelector('svg')).then(image => {
      if (!active) return;
      url = URL.createObjectURL(image);
      setBlob(image);
      setPreview(url);
    }).catch(() => { if (active) setMessage('Could not make the receipt image.'); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); setPreview(''); setBlob(null); };
    // The card is fixed while this sheet is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  if (card.lines.length < 2 || (!day && !message)) return null;
  const file = () => new File([blob!], `nandi-receipt-${recap.from}.png`, { type: 'image/png' });
  const share = async () => {
    if (!blob) return;
    setBusy(true);
    try {
      // One line plus the app's link travels with the image, so a friend has somewhere to go.
      const result = await shareFileNow(file(), weekShareText(receiptShareLines(card)), { title: "My week's receipt", dialogTitle: 'Share my receipt' });
      setOpen(false);
      setMessage(result === 'shared' ? 'Receipt shared.' : result === 'downloaded' ? 'Receipt image downloaded.' : shareNote(result));
    } catch { setMessage('Could not share the receipt.'); }
    finally { setBusy(false); }
  };
  const save = async () => {
    if (!blob) return;
    setBusy(true);
    try {
      const result = await saveFileNow(file());
      setOpen(false);
      // On Android this is a file in Documents/NANDI, not a photo in the gallery, and the line says where it is.
      setMessage(result === 'saved' ? 'Saved in Documents/NANDI' : result === 'downloaded' ? 'Image saved.' : shareNote(result));
    } catch { setMessage('Could not save the receipt.'); }
    finally { setBusy(false); }
  };
  return <>
    <div ref={logo} className="recap-logo-source" hidden aria-hidden="true"><Kachhua pose="cheer" size={170} /></div>
    {day && <button type="button" className={link ? 'text-button recap-link' : 'secondary recap-trigger'} onClick={() => { setMessage(''); setOpen(true); }}>{link ? "Your week's receipt is ready" : 'Share my week'}</button>}
    {open && day && <div className="recap-sheet-backdrop sheet-backdrop" onClick={() => setOpen(false)}><section ref={dialog} tabIndex={-1} className="recap-sheet ui-sheet" role="dialog" aria-modal="true" aria-label="Your week's receipt" onClick={event => event.stopPropagation()}>
      <div className="ui-sheet-handle" aria-hidden="true" />
      <h2>Your week's receipt</h2>
      {preview ? <img src={preview} width="1080" height="1920" alt={`Receipt, ${receiptWeek(card)}: ${receiptShareLines(card).join(', ')}.`} /> : <p>Making your receipt…</p>}
      <div className="recap-sheet-actions">
        <button type="button" onClick={() => void share()} disabled={!blob || busy}>Share</button>
        <button type="button" className="secondary" onClick={() => void save()} disabled={!blob || busy}>Save image</button>
        <button type="button" className="text-button" onClick={() => setOpen(false)}>Not now</button>
      </div>
    </section></div>}
    {message && <p role="status">{message}</p>}
  </>;
}
