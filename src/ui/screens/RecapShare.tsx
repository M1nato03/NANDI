import { useEffect, useState } from 'react';
import { recapCardContent, type WeeklyRecapData } from '../../core/recap';
import { weekShareText } from '../../core/puzzles/share';
import { shareFileNow, shareNote, useShareDay } from '../shareActions';
import { recapPng } from './recapCard';
import { useModalFocus } from '../shell/useModalFocus';

export function RecapShare({ recap, link = false }: { recap: WeeklyRecapData; link?: boolean }) {
  const card = recapCardContent(recap);
  const [open, setOpen] = useState(false);
  const dialog = useModalFocus<HTMLElement>(() => setOpen(false));
  const [preview, setPreview] = useState('');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  // Spec 19: the week card hides after shutdown like every other share, and checks again when tapped.
  const day = useShareDay();
  useEffect(() => {
    if (!open) return;
    let active = true;
    let url = '';
    void recapPng(card).then(image => {
      if (!active) return;
      url = URL.createObjectURL(image);
      setBlob(image);
      setPreview(url);
    }).catch(() => { if (active) setMessage('Could not make the recap image.'); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); setPreview(''); setBlob(null); };
    // The card is fixed while this sheet is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  if (card.lines.length < 2 || (!day && !message)) return null;
  const share = async () => {
    if (!blob) return;
    setBusy(true);
    try {
      // One line plus the app's link travels with the image, so a friend has somewhere to go.
      const result = await shareFileNow(new File([blob], `nandi-week-${recap.from}.png`, { type: 'image/png' }), weekShareText(card.lines), { title: 'What my week became', dialogTitle: 'Share my week' });
      setOpen(false);
      setMessage(result === 'shared' ? 'Week shared.' : result === 'downloaded' ? 'Recap image downloaded.' : shareNote(result));
    } catch { setMessage('Could not share the recap image.'); }
    finally { setBusy(false); }
  };
  return <>
    {day && <button type="button" className={link ? 'text-button recap-link' : 'secondary recap-trigger'} onClick={() => { setMessage(''); setOpen(true); }}>{link ? 'Your week is ready to share' : 'Share my week'}</button>}
    {open && day && <div className="recap-sheet-backdrop sheet-backdrop" onClick={() => setOpen(false)}><section ref={dialog} tabIndex={-1} className="recap-sheet ui-sheet" role="dialog" aria-modal="true" aria-label="Weekly recap preview" onClick={event => event.stopPropagation()}>
      <div className="ui-sheet-handle" aria-hidden="true" />
      <h2>What my week became</h2>
      {preview ? <img src={preview} width="1080" height="1350" alt={`Weekly recap, ${card.dates}: ${card.lines.join(', ')}. ${card.highlight}.`} /> : <p>Making your card…</p>}
      <div className="recap-sheet-actions"><button type="button" onClick={() => void share()} disabled={!blob || busy}>Share</button><button type="button" className="secondary" onClick={() => setOpen(false)}>Not now</button></div>
    </section></div>}
    {message && <p role="status">{message}</p>}
  </>;
}
