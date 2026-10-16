# Device test checklist: Nothing Phone 3a Pro

Run these in Phase 0 (PWA items) and Phase 2 (APK items). Record results in `DECISIONS.md` with the date, OS build and app version. ❌ means implement the fallback listed.

## Setup on the phone
- [ ] Developer options and USB debugging on. `adb devices` sees the phone.
- [ ] Settings → Apps → Prime Pocket → Battery → **Unrestricted**.
- [ ] Notifications allowed for Prime Pocket. Channels are visible: Task blocks, Rest timer, Planning.

## PWA (Chrome WebAPK)
- [ ] Install from the Chrome menu. Check the launcher icon, the standalone window, and the splash screen.
- [ ] Offline: airplane mode, then cold-start. Every tab loads. Today's Daily Drop is playable.
- [ ] `navigator.storage.persist()` result shown on the Backup screen (expect `true` after install or engagement).
- [ ] Backup → **Share** offers WhatsApp, Drive and Files with a `.json` attachment. ❌ → share as `.txt`, or use Download only.
- [ ] Backup → **Download** saves to Downloads. Restore from that file works with a preview.
- [ ] A service-worker update shows a prompt and never reloads mid-session.

## APK (Capacitor, sideloaded)
- [ ] Export a backup before every APK update (the in-app reminder appears on version change).
- [ ] Install over `adb install -r`. Update over the old build **without uninstalling**, and confirm the data is still there. That proves the stable signing key and the pinned `androidScheme`/`hostname`. Repeat with a CI-built APK over a locally built one (same keystore).
- [ ] `POST_NOTIFICATIONS` prompt appears at the right moment (first reminder setup, not at launch).
- [ ] **Exact alarm:** schedule a task reminder 3 min ahead, lock the screen, leave the phone idle. It fires within 1 minute of the time. Repeat with the app swiped away from recents.
- [ ] **Doze:** schedule a reminder 45 min ahead with the phone idle and unplugged. It fires (allowWhileIdle).
- [ ] **Reboot:** schedule a reminder 10 min ahead, reboot the phone, don't open the app. ❌ (alarm lost) → reschedule on boot (BOOT_COMPLETED receiver) or document "open the app once after a reboot", and reschedule on every launch anyway.
- [ ] **Rest timer:** start a 90 s rest, lock the screen. The rest-end notification fires on time. Unlock: the timer shows the correct elapsed time.
- [ ] **Keep-awake** during a workout: the screen stays on for 10+ minutes on the session screen and sleeps normally after leaving it.
- [ ] **Haptics** fire with sound on, on vibrate, and in silent mode. Note the behaviour for each.
- [ ] **Full-screen "do this now" alarm** (optional): check whether a full-screen intent is allowed for a sideloaded app on Android 16. ❌ → use a high-priority heads-up notification.
- [ ] **Backup** in the APK writes the file through Filesystem and opens the share sheet. Restore by picking the file.
- [ ] **Migration:** PWA export → APK import. Record counts per table, which must match.
- [ ] **Packs:** "Check for content" fetches `/packs/index.json` from the hosted origin (CORS OK). Airplane mode → the bundled packs still work.
- [ ] **Performance:** cold start under 2 s. Puzzle generation p95 under 300 ms (hard types). Scrolling stays at 60 fps on Today and Ground.

## Night behaviour (with test bedtime = now + 5 min)
- [ ] Night pause starts off. In You > Night, read the Usage access explanation, grant it in Android settings, and opt in. Opening a selected app after bedtime − 30 min offers the breath card or a heads-up notification. Both choices work; "Go anyway" is never blocked.
- [ ] With the screen off or before the pause window, no selected-app check fires. Turn Night pause off in You > Night; the ongoing watcher notification stops. Opening a chosen app no longer prompts. Opening and dismissal counts stay local.
- [ ] Wind-down shows only leftovers and reviews, and the 10-minute cap triggers.
- [ ] After bedtime, Mind earns 0 XP, with no sound or animation. Sharing is hidden.
- [ ] No engagement notification is scheduled at or after min(bedtime − 90 min, shutdown) on the night timeline, and none during wind-down or lights-out.
