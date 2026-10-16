import type { NativeUpdaterState } from './useNativeUpdater';

export function NativeUpdateBar({ updater }: { updater: NativeUpdaterState }) {
  if (!updater.visible && !updater.busy) return null;
  return <div className="native-update-bar" role="region" aria-label="Android update">
    <div className="native-update-content">
      <span>{updater.message || 'New version ready'}</span>
      {updater.progress !== null && <progress value={updater.progress} max={100} aria-label="Update download" />}
    </div>
    {updater.update && !updater.busy && <div className="update-bar-actions">
      <button type="button" onClick={() => void updater.install()}>{updater.error ? 'Try again' : 'Update'}</button>
      {updater.visible && <button type="button" className="secondary" onClick={() => void updater.later()}>Later</button>}
    </div>}
  </div>;
}
