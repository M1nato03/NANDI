# Android notifications that actually arrive in India (cloud job 6, batch 2)

Branch: `ideas/cj2-android-notifications`, based on `origin/ship-27` at `b17ec403a85f871b4cb315a5d6da4d2676409767`.
Date: 22 Oct 2026. No app code changed. Proposed fixes are given as file:line below.

How sure each claim is:
- **Read**: I read it in NANDI's code or in the plugin source (`@capacitor/local-notifications` 8.3.1 from npm).
- **Measured**: a test I ran (code and output are in §9).
- **Official**: Android or Google Play docs, quoted with a URL.
- **Reported**: dontkillmyapp.com, user forums or third-party guides. Not confirmed by the OEM. The test matrix in §7 is there to check these.

---

## 1. Summary

1. **On Android 13+, a fresh install gets no notifications until the user visits You > Settings.** NANDI asks for
   `POST_NOTIFICATIONS` in only two places: the Settings toggles/button and the App pause switch. The night-deck
   and morning nudges are ON by default, so they are scheduled in Dexie but never shown. This does not depend on the
   OEM. (Read)
2. **The night rule is broken for task reminders.** A task with a start time inside lights-out (for example 00:30
   with a 23:30 bedtime) is scheduled on the high-importance `tasks` channel, so it makes a sound. Measured in §9.
   Separately, after a reboot the plugin fires any missed alarm about 15 s after boot, whatever the time is (Read).
3. **`USE_EXACT_ALARM` is a Play blocker and is also what keeps exact alarms working.** Play allows it only for
   alarm, timer or calendar apps (Official). If it is removed and nothing else changes, plugin 8.3.1 opens the
   system "Alarms & reminders" screen on *every* `schedule()` call on Android 14+. With the current
   reconcile-on-every-write loop, that screen would keep popping up. The spec assumes the plugin "silently falls
   back"; 8.3.x does not. (Read)
4. **OEM killers** (Xiaomi/HyperOS, Samsung sleeping apps, OnePlus/Oppo/Realme "swipe = force stop", Vivo background
   power) mostly hurt in three cases. The phone has not been used for days. The app was swiped away. The phone was
   rebooted and NANDI is not allowed to autostart. For a daily user, the real risks are a swipe-away and HyperOS's
   default "Battery saver" mode. NANDI already reschedules on every open, which covers the most common case.
5. **Fix order:** ask for notification permission in context (§8 F1) → keep lights-out quiet (F2–F4) → make
   exactness opt-in, not prompted (F5–F6) → one-time "Keep reminders working" help card with a 2-minute test
   (F7–F9). None of these needs a new Android permission. F2 and F5 are small; F8 needs ~20 lines of Java in the
   existing `NightPausePlugin`.

---

## 2. What NANDI does today (Read, origin/ship-27)

| Piece | Where | What it does |
|---|---|---|
| Channels | `src/platform/notifier.ts:43-48` | `tasks` importance 4 (HIGH), `rest` 4, `planning` 3 (DEFAULT). Plugin default: vibration **off**, system sound **on** (plugin `NotificationChannelManager.kt` `createChannel`). Both HIGH and DEFAULT make a sound. |
| Schedule | `src/platform/notifier.ts:58-65` | `schedule: { at, allowWhileIdle: true }`. `isExactNotification` is not set, so the plugin default `true` applies: `setExactAndAllowWhileIdle` when allowed, otherwise `setAndAllowWhileIdle`. |
| Task + rest reminders | `src/platform/reminderSync.ts:11-23` | Every planned task with `scheduledStart`, and every active rest timer. `bedtime: '01:30', shutdown: '23:15'` are **hard-coded** at line 12. |
| Night guard | `src/core/notificationBudget.ts:14` | `task`, `rest` and `shutdown` return `true` before the night-window check at line 15. Only morning, planning and streak are night-checked. |
| Nudges | `src/core/nudges.ts:24-69`, `src/platform/nudgeSync.ts` | Night deck at effective shutdown, morning at 08:30, opt-in streak reminder. Up to 7 days ahead. Native only. |
| Rescheduling | `src/platform/reminderSync.ts:60-70` | Reconciles on start, on every Dexie change (liveQuery on tasks, sessions, settings, dailyLog, ledger), on `visibilitychange` and on `pageshow`. **Good: this already reschedules on app open.** |
| Reboot | plugin `LocalNotificationRestoreReceiver` (BOOT_COMPLETED, LOCKED_BOOT_COMPLETED, QUICKBOOT_POWERON) | Re-arms stored alarms. A one-shot alarm already in the past is moved to **now + 15 s** ("Show notifications that would have been delivered while the device was off"). |
| Exact status UI | `src/ui/screens/ReminderSettings.tsx:15-19` | Shows "Exact alarms are allowed / off" and a button to open the settings screen. |
| Permission ask | `src/ui/screens/Ground.tsx:77-92, 122` and `src/ui/screens/NightSettings.tsx:35` | **Only** places that call `requestPermission()`. |
| Manifest | `android/app/src/main/AndroidManifest.xml:60-68` | `POST_NOTIFICATIONS`, `USE_EXACT_ALARM` (61), `USE_FULL_SCREEN_INTENT` (67), `RECEIVE_BOOT_COMPLETED`. The plugin's merged manifest adds `SCHEDULE_EXACT_ALARM` and `WAKE_LOCK`. |
| SDK | `android/variables.gradle:2-4` | min 24, target and compile 36 (Android 16). |
| Night pause | `NightPauseService.java:100-118, 200-218` | specialUse foreground service. `night_pause` channel is IMPORTANCE_HIGH with the default sound. Uses `setFullScreenIntent`. Restarted by `NightPauseBootReceiver` on boot. |

Plugin behaviour that matters (Read, `LocalNotificationsPlugin.kt` `doSchedule`, about lines 103-135, plugin 8.3.1):

```kotlin
val honorExact = ... notifications.any { it.isExactNotification }      // default true
if (honorExact && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !canScheduleExactAlarms()) {
    startActivityForResult(call, Intent(ACTION_REQUEST_SCHEDULE_EXACT_ALARM, ...), "exactAlarmScheduleCallback")
    return
}
```

The plugin's TypeScript docs say the same thing: "if the app isn't yet allowed to schedule exact alarms the system
'Alarms & reminders' settings screen is opened so the user can grant it — regardless of `isExactMandatory`."

---

## 3. Platform rules that apply in 2025-2026 (Official)

| Rule | What it means for NANDI | Source |
|---|---|---|
| Inexact alarms (`set`, `setAndAllowWhileIdle`) on Android 12+ fire "within one hour of the supplied trigger time, unless any battery-saving restrictions are in effect such as battery saver or Doze." `setWindow` windows under 10 min are "typically clipped to 600000". | Without exact permission, a nudge can be up to 1 h late, or later in Doze. | https://developer.android.com/develop/background-work/services/alarms/schedule |
| Android 14: `SCHEDULE_EXACT_ALARM` is "no longer being pre-granted to most newly installed apps targeting Android 13 and higher". `USE_EXACT_ALARM` is for calendar and alarm clock apps. | If `USE_EXACT_ALARM` goes, fresh installs on 14+ have exact alarms **off**. | https://developer.android.com/about/versions/14/changes/schedule-exact-alarms |
| Play: `USE_EXACT_ALARM` is "a highly restricted permission used only for apps whose core, user-facing functionality genuinely requires precise timing". The examples are "The app is an alarm or timer app." and "The app is a calendar app that shows event notifications." Apps that don't qualify can be blocked from publishing. | NANDI is a planner and learning app, so it is very unlikely to qualify. Fine for a sideloaded APK; a blocker on Play (see Job 4). | https://support.google.com/googleplay/android-developer/answer/16558241 |
| Play: `USE_FULL_SCREEN_INTENT` is "auto-granted *only* for apps whose core function is setting alarms or handling calls" on Android 14+. | Night pause's `setFullScreenIntent` falls back to a heads-up notice on most installs. That is already expected (DECISIONS 2026-10-20). | same page |
| Doze: "Neither `setAndAllowWhileIdle()` nor `setExactAndAllowWhileIdle()` can fire alarms more than once per nine minutes, per app." The power-details page says while-idle alarms are "Limited to 7 per hour". | Two NANDI alarms 1 minute apart in Doze: the second is delayed ~9 min. Night and streak nudges are ≥ 15 min apart, so this is fine. | https://developer.android.com/training/monitoring-device-state/doze-standby , https://developer.android.com/topic/performance/power/power-details |
| Standby buckets, alarms: Working set 10/h, Frequent 2/h, Rare 1/h, **Restricted "One alarm per day"**. The Restricted inactivity trigger is 8 days on Android 13 (45 on 12). Exempt from Restricted: apps with `USE_EXACT_ALARM` and **apps with active widgets**. | A lapsed user gets at most one NANDI alarm a day. NANDI's home-screen widget is an official, permission-free exemption. | https://developer.android.com/topic/performance/appstandby , power-details page above |
| App hibernation (unused "a few months"): permissions reset, "can't run jobs or alerts from the background", and the system does not reschedule them. | Covered by reschedule-on-open. Not a daily-user issue. | https://developer.android.com/topic/performance/app-hibernation |
| Android 15 stopped state: "the system also cancels all pending intents when the app enters the stopped state". `BOOT_COMPLETED` is re-delivered when the user launches the app again. | Force stop wipes every NANDI alarm until the next open. On OEMs where swipe-from-recents is a force stop, that is the same. | https://developer.android.com/about/versions/15/behavior-changes-all |
| Android 15: `BOOT_COMPLETED` receivers may not start `dataSync`, `camera`, `mediaPlayback`, `phoneCall`, `mediaProjection`, `microphone` foreground services. | `specialUse` (night pause) is not on the list. OK. | https://developer.android.com/about/versions/15/behavior-changes-15 |
| Android 16: JobScheduler quota changes. No alarm or notification changes on the all-apps page. | NANDI uses AlarmManager via the plugin, not jobs. No impact found. | https://developer.android.com/about/versions/16/behavior-changes-all |
| `POST_NOTIFICATIONS` (13+): for apps targeting 13+, "your app has complete control over when the permission dialog is displayed". Ask "in the correct context". | NANDI must ask itself; Android will not ask for it. | https://developer.android.com/develop/ui/views/notifications/notification-permission |
| Battery-optimisation exemption: "Google Play policies prohibit apps from requesting direct exemption ... unless the core function of the app is adversely affected". Most apps may use `ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS` (opens the list and needs no permission). | Do **not** add `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`. Linking to the settings list is allowed. | Doze page above |

---

## 4. What will fail, per OEM

dontkillmyapp.com's current ranking (no date on the page) puts Xiaomi, OnePlus and Samsung at 5/5 (worst), Oppo at
4, and Vivo and realme at 3. Source: https://dontkillmyapp.com/ . I found **no official Xiaomi, Oppo, Realme, Vivo or
OnePlus developer page** on background limits in 2025-26. Searches turned up only third-party guides and forum
posts. Samsung is the only OEM with an official developer page.

Rows assume NANDI as shipped: exact alarms granted through `USE_EXACT_ALARM`, permission already granted.

| OEM / skin (India models) | What the OS does | NANDI effect for a daily user | NANDI effect after days without opening | User fix | Confidence |
|---|---|---|---|---|---|
| **Xiaomi / Redmi / POCO, HyperOS 2-3** | Per-app battery mode defaults to "Battery saver (recommended)". Other choices: "Close apps after 10 minutes of background activity" and "Restrict background apps". "Background autostart" is off for most apps (the guide's screenshot shows 4 of 43 apps allowed). dontkillmyapp: "In default settings, background processing simply does not work right". A Jul 2026 forum report says PowerKeeper overrides user battery settings after updates. | Alarms set while NANDI is alive *usually* fire, but this is unverified (T3, T4). After a reboot, with autostart off, the plugin's boot receiver is reportedly blocked, so **all reminders are missing until NANDI is opened** (T5). Swiping from recents can kill the process and clear alarms (reported). | Same as a reboot. "Pause app activity if unused" also stops notifications. | Settings > Apps > NANDI > **Power > No restrictions**. Settings > Apps > **Background autostart** > NANDI on. Turn off **Pause app activity if unused**. Lock NANDI in Recents. | HyperOS 3.0 menu names: DriveQuant guide screenshots. Effects: Reported. |
| **Samsung, One UI 6-8** | Official (developer.samsung.com): apps unused for "about 3 days" and hurting battery go to **Sleeping**, where "Job, Alarm, and Foreground-service are restricted". After 16 days, **Deep sleeping**: "Inactive applications can't perform any activities, including notifications". Since One UI 6, foreground services of apps targeting 14 are "guaranteed to work as intended". | Opened most days, so it rarely sleeps. Low risk. The night pause FGS should survive. | Morning and night nudges stop after ~3 idle days. Nothing after 16 days. That fits "no chasing", so it is not a bug. | Settings > Battery (and device care) > Background usage limits > **Never sleeping apps** > add NANDI. Turn off "Put unused apps to sleep" if wanted. Samsung documents a deep-link intent (see F8). | Official (Samsung) |
| **OnePlus, OxygenOS 14-16** | dontkillmyapp: "one of the most severe background limits", settings "got reset with firmware updates". "Sleep standby optimization" blocks network while asleep, which does not matter for local alarms. "Deep optimization / Adaptive Battery" is "the main app killer". Swipe-away may kill the app. | If swiping is a force stop, on Android 15+ every pending NANDI alarm is cancelled (Official, stopped state) until the next open. | Same. | Lock in Recents. Battery > Battery optimization > NANDI > Don't optimize. Turn off "Deep optimization" if shown. Re-check after OS updates. | Reported, plus the Official stopped-state rule |
| **Oppo, ColorOS 14-16** | dontkillmyapp (F1S-era data only): "Background services are being killed ... every time you turn the screen off". Needs "Allow Auto Start-up" and "Run in background". | Pending AlarmManager alarms are system-held. Process death alone should not drop them, but a force stop does. Night pause FGS at risk. Unverified on current ColorOS. | Reboot plus no auto-launch: missing until open. | App info > Battery usage > **Allow background activity** + **Allow auto launch**. Lock in Recents. | Reported (old data) |
| **Realme, Realme UI 5-6** (ColorOS base) | dontkillmyapp: "Sleep stand-by optimization", "App quick freeze" ("cannot receive or send notifications"), and "Super power saving mode" (at most 6 apps). | Same as Oppo. If NANDI is in App quick freeze: **nothing** arrives. | Same. | Battery > App battery management > NANDI > allow auto-launch, foreground and background activity. Turn off sleep stand-by optimization. Remove NANDI from App quick freeze. | Reported |
| **Vivo / iQOO, Funtouch OS 15 → OriginOS 6** | dontkillmyapp: needs **Autostart**, plus "High background power consumption" allowed. Restrictions "not fully uncovered". A secondary source says OriginOS 6 (Android 16) replaced Funtouch from Oct 2025; unverified. | Reboot plus no autostart: missing until open. Daily alarms: unknown. | Same. | Settings > Battery > **High background power consumption** > NANDI on. Settings > Apps > **Autostart** > NANDI on. Lock in Recents. | Reported |
| **Stock-ish (Pixel, Motorola, Nothing)** | Doze and buckets only. | Works with exact. Inexact can be up to 1 h late. | One alarm/day after 8 idle days (Restricted). | Usually nothing. | Official |

**What fails on every OEM, before any OEM restriction (Read and Measured):**
- Android 13+ fresh install with no visit to Settings: **0 notifications**. See finding A.
- Task reminders inside lights-out make a sound. See finding B.
- Reboot catch-up fires missed alarms ~15 s after boot, even at 2 am. See finding C.

---

## 5. Findings, worst first

**A. P0: no permission ask outside Settings (all Android 13+).**
`requestPermission()` is only reachable from `Ground.tsx:82` (the nudge toggles at :91 and the button at :122) and
`NightSettings.tsx:35`. The defaults `nudge.night.enabled` and `nudge.morning.enabled` are ON (`nudges.ts:21`,
`on()` is true unless the value is `false`). So they are wanted, but `reconcileNudges` returns at
`nudgeSync.ts` (`checkPermission() !== 'granted'`) and `reconcileReminders` returns at `reminderSync.ts:42`. The user
never learns this unless they open Settings. The first-run "Tonight" plan (`AppShell.tsx`, route `you/tonight`) and
the timed-task flow (`TaskQuickAdd.tsx:47`) never ask.

**B. P0 (night rule): task and rest reminders ignore lights-out.**
`notificationBudget.ts:14` returns `true` for `task`, `rest` and `shutdown` before the night check, and
`reminderSync.ts:12` uses the hard-coded `bedtime '01:30'`, not the user's setting. Measured (§9): with
bedtime 23:30, a task at 00:30 is in the `lightsOut` window, and `wantedReminders` still returns it on the
`tasks` channel (importance 4, sound on).

**C. P1 (night rule): reboot catch-up.** The plugin's `LocalNotificationRestoreReceiver` moves every missed
one-shot alarm to now + 15 s. If the phone restarts during lights-out (an OS update at 2 am is common), a stale
22:00 task reminder or the night-deck nudge goes off at about 2:00 with sound. JS cannot stop this, because the app
is not running.

**D. P1 (night rule, inexact mode): late nudges can land after bedtime.** Measured slack between the night-deck
nudge and bedtime: 135 min with defaults (23:15 / 01:30), 45 min (22:45 / 23:30), 30 min (22:00 / 22:30), and only
**15 min** when shutdown is within 15 min of bedtime (`effectiveShutdown` clamps it, `planner.ts:8-10`). Inexact
alarms may be up to 60 min late (Official), so in inexact mode the night nudge can go off in lights-out on the
`planning` channel (importance 3, sound on). The streak nudge always has ≥ 91 min of slack, so it is safe.

**E. P1 (Play): `USE_EXACT_ALARM` at `AndroidManifest.xml:61`.** Not allowed for a non-alarm, non-calendar app
(Official). Removing it alone triggers finding F.

**F. P1: implicit "Alarms & reminders" screen.** With `isExactNotification` unset (`notifier.ts:59-63`) and exact
alarms not granted, every `schedule()` on Android 12+ opens the system settings screen (plugin `doSchedule`). Each
Dexie write starts a reconcile (`reminderSync.ts:65`), and each new or changed reminder calls `schedule()`. Result:
the settings screen pops up on task edits, on plan changes and on cold start after a force stop. It also contradicts
spec `01-architecture.md:193` ("the plugin silently falls back"). This is latent today only because
`USE_EXACT_ALARM` hides it.

**G. P2: rest timer depends on an exact alarm.** A 60-120 s rest notification needs exactness. In inexact mode the
backstop may be minutes late. The keep-awake plugin (`@capacitor-community/keep-awake`, DECISIONS 2026-10-16) plus
the in-app timer and haptic is the dependable path. The notification is only the backstop.

**H. P2: denied permission is a dead end.** `Ground.tsx:122` says "Allow NANDI notifications in Android app
settings." but offers no button. Android stops showing the dialog after repeated denials, so the user has to find
the setting by hand.

**I. P2: night-pause channel sound.** `NightPauseService.java:111` creates `night_pause` as IMPORTANCE_HIGH with the
default sound. It fires only when the user opens a chosen app at night, so it is a response to the user's own
action, not a buzz from nowhere. Still, a silent heads-up fits "nothing buzzes" better (call `setSound(null, null)`
on that channel). Channels cannot be changed once created, so it needs a new id (the same pattern as
`night_watch_quiet` at :104-110).

**J. Info: lapsed users go quiet.** Nudges are scheduled 7 days ahead and refreshed only on open. Samsung sleeping
(3 days), Android Restricted (8 days, 1 alarm/day) and HyperOS limits then cut them further. This matches "no
chasing", so **do not fight it**.

---

## 6. What NANDI can do without new permissions

1. **Ask for notifications in context, once.** Ask (a) at the end of the first-run "Tonight" plan: "Want one quiet
   reminder at 22:45 to start your night deck?" [Yes, remind me] [Not now]. Ask (b) the first time a task gets a
   start time. Store `NUDGE_PERMISSION_ASKED` as today. After a denial, show a button that opens the app's
   notification settings (F8).
2. **Inexact by default, exact only if already granted.** Pass `isExactNotification: exactGranted && channel !== 'planning'`.
   Never let a `schedule()` call open a settings screen. Keep the existing ReminderSettings button as the *only* way
   to grant exact alarms. Nudges do not need minute precision; task blocks and rest do.
3. **Keep lights-out quiet in code.** (a) Read the user's bedtime and shutdown in `wantedReminders`. (b) For any
   reminder whose `at` is in wind-down or lights-out, use a new **silent** channel (`quiet`, importance 2 = LOW: in
   the shade, no sound, no heads-up), or skip it. Skip task blocks in lights-out. Put rest in `quiet` if a workout
   runs past bedtime. (c) In inexact mode, put the night-deck nudge on the quiet channel whenever the slack to bedtime
   is < 60 min (finding D). A late nudge then shows up silently and never buzzes.
4. **Reschedule on open: already done** (`reminderSync.ts:60-70`). Keep it. Add small
   self-healing: on open, any `reminders` row with `status 'scheduled'`, `at < now` and no matching delivered
   notification just becomes `fired`. That is already true for nudges (`nudgeSync.ts`); do the same for task rows so
   old rows do not pile up.
5. **One-time "Keep reminders working" help card** (draft copy below). Show it once, *only* after the user has
   turned on a reminder and NANDI has evidence one went missing: on open, a `scheduled` reminder more than 10 min
   in the past that is neither pending nor in `getDeliveredNotifications()`. Accept that a user who dismissed it
   also counts, so the card says "might" and is shown only once. Also reachable any time from Settings > Reminders.
6. **2-minute test button**, the same pattern as night pause's `pauseTestMin: 2`. "Send a test in 2 minutes. Lock
   your phone and wait." This lets the user check their own phone without NANDI knowing the OEM.
7. **Brand picker, not detection.** "Which phone is this?" with Xiaomi/Redmi/POCO · Samsung · OnePlus · Oppo/Realme
   · Vivo/iQOO · Other. No new plugin, no device data read, nothing leaves the phone.
8. **Settings shortcuts without permissions** (native, in `NightPausePlugin.java`). `ACTION_APP_NOTIFICATION_SETTINGS`;
   `ACTION_APPLICATION_DETAILS_SETTINGS` (Xiaomi Power and Autostart, Vivo, Oppo all live under App info);
   `ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS` (the list; Play allows this, unlike the direct request); Samsung's
   documented intent `com.samsung.android.sm.ACTION_OPEN_CHECKABLE_LISTACTIVITY`, package
   `com.samsung.android.lool`, extra `activity_type = 2` (Never sleeping apps), from
   https://developer.samsung.com/mobile/app-management.html . Wrap each one in try/catch and fall back to App info.
9. **Point to Android's own Bedtime mode / Do Not Disturb.** A line in the night plan: "Tip: set your phone's Bedtime
   mode to start at 23:30 too." The OS then silences *everything*, including NANDI's reboot catch-up (finding C).
   No permission needed.
10. **Widget tip (optional, once).** Apps with an active widget are exempt from the Restricted bucket (Official).
    NANDI already ships `NandiWidgetProvider`. One line in the help card: "Adding the NANDI widget also helps
    reminders arrive." No pressure, no repeat.

### Draft help card copy (short, coach-like, no shame)

> **Keep reminders working**
> Some phones pause apps to save battery, and that can hold back reminders. Two minutes here fixes it.
> Which phone is this? [Xiaomi / Redmi / POCO] [Samsung] [OnePlus] [Oppo / Realme] [Vivo / iQOO] [Other]
>
> *Xiaomi / Redmi / POCO:* App info › Power › **No restrictions**. Then Apps › **Background autostart** › NANDI on.
> Turn off **Pause app activity if unused**. [Open App info]
> *Samsung:* Battery › Background usage limits › **Never sleeping apps** › add NANDI. [Open the list]
> *OnePlus:* Battery › Battery optimisation › NANDI › **Don't optimise**. In Recents, lock NANDI. [Open App info]
> *Oppo / Realme:* App info › Battery usage › allow **background activity** and **auto launch**. [Open App info]
> *Vivo / iQOO:* Battery › **High background power consumption** › NANDI on. Apps › **Autostart** › NANDI on. [Open App info]
> *Other:* App info › Battery › **Unrestricted**. [Open App info]
>
> [Send a test in 2 minutes]  [Done]
> Reminders never ring after your bedtime.

(Menu names change between OS versions. The Xiaomi names are from HyperOS 3.0 screenshots; the others are from
dontkillmyapp. Check them in the matrix before shipping the copy.)

---

## 7. Ten-phone manual test matrix (for Jenil and friends)

Phones: choose any models running these skins. Popular Indian models are given as examples. Record the OS version
from Settings > About.

| # | Phone (example) | Skin | Why |
|---|---|---|---|
| P1 | Redmi Note 13/14 | HyperOS 2 or 3 | Most common killer in India |
| P2 | POCO X6/X7 or M6/M7 | HyperOS | Same, a second sample |
| P3 | Galaxy A15/A35/M35 | One UI 6-8 | Samsung sleeping apps |
| P4 | Galaxy S2x / S2x FE | One UI 7-8 | Newer Samsung |
| P5 | OnePlus Nord CE3/CE4 | OxygenOS 14-16 | Swipe = kill? |
| P6 | Realme Narzo / 12 / 14 | Realme UI 5-6 | Quick freeze, sleep stand-by |
| P7 | Oppo A-series / Reno | ColorOS 14-16 | Auto launch |
| P8 | Vivo Y/T-series | Funtouch OS 14-15 | Autostart, bg power |
| P9 | Vivo V-series / iQOO | OriginOS 6 | New skin |
| P10 | Pixel / Motorola g-series | Stock-ish 15-16 | Control |

Setup on each phone: install the APK, open it once, allow notifications in Settings, and note the "Exact alarms"
line in Settings. Set bedtime to the real bedtime. Do **not** apply the help-card fixes until test T8.

| Test | Steps | Pass if | Record |
|---|---|---|---|
| T1 Permission | Fresh install. Make a task with a start time 10 min ahead **without** opening Settings. Lock the phone. | Today: expected **fail** on Android 13+ (finding A). After F1: the ask appears and the reminder arrives. | Arrived Y/N |
| T2 Background | Task 10 min ahead. Press Home (do not swipe). Screen off. | Arrives within 1 min | Delay (min) |
| T3 Swiped | Task 10 min ahead. Swipe NANDI from Recents. Screen off. | Arrives within 1 min | Delay, or missing |
| T4 Overnight | Morning nudge on (08:30). Leave the phone untouched and unplugged overnight. | Arrives 08:30 ± 2 min | Delay |
| T5 Reboot | Task 30 min ahead. Restart the phone. **Do not open NANDI.** | Arrives on time | Arrived Y/N |
| T6 Rest | Start a workout, finish a set, lock the screen during rest. | Rest-over arrives within 10 s | Delay (s) |
| T7 Night rule | Set bedtime to now + 15 min. Add a task at now + 25 min. Wait. | **No sound or vibration** after bedtime (today: expected fail, finding B) | Buzzed Y/N |
| T8 Reboot at night | Task at now + 5 min. Power off before it fires. Set bedtime to now + 10 min. Power on after bedtime. | No sound (today: expected fail, finding C) | Buzzed Y/N, time |
| T9 After fixes | Apply the help-card steps for the brand. Repeat T3, T4 and T5. | All pass | Delta vs before |
| T10 Idle 4 days | Do not open NANDI for 4 days (Samsung P3/P4 and HyperOS P1). | Silence is fine. Note which nudges still come. | Count |

If a laptop is handy (optional, any phone with USB debugging), these commands are from the official Doze and
Android 16 pages:

```sh
adb shell dumpsys alarm | grep -A3 app.nandi.personal      # are NANDI's alarms still registered?
adb shell dumpsys deviceidle force-idle                     # force Doze, then wait for a reminder
adb shell dumpsys deviceidle unforce && adb shell dumpsys battery reset
adb shell am set-standby-bucket app.nandi.personal restricted   # simulate 8 idle days (1 alarm/day)
adb shell am get-standby-bucket app.nandi.personal
```

A shared sheet with one row per phone × test (P1-T2 … P10-T10, 100 cells) is enough. Report delay in minutes, with
"x" for missing.

---

## 8. Fixes (file:line)

| ID | File:line | Change | Size |
|---|---|---|---|
| F1 | `src/ui/screens/Ground.tsx:77-86` → extract `askPermission` into `src/platform/notifyPermission.ts`. Call it from the first-run `you/tonight` plan (`src/ui/shell/AppShell.tsx`, the `NightPlanSetting firstRun` route) and from `src/ui/tasks/TaskQuickAdd.tsx:47` when `scheduledStart` is set for the first time. | Ask in context, once (finding A) | S |
| F2 | `src/platform/reminderSync.ts:11-12` | Take `settings` and use the user's `planner.bedtime` / `planner.shutdown` (same `clock()` reading as `nudges.ts:29-30`), not `'01:30'` / `'23:15'`. | S |
| F3 | `src/core/notificationBudget.ts:14` | Return a decision object, not a boolean: `{ ok, quiet }`. For `task`: skip if `nightWindow(at) === 'lightsOut'`. For `rest` and `shutdown` in wind-down or lights-out: `quiet: true`. Add Vitest cases from spec 05 §10 plus "task at 00:30 with bedtime 23:30 → not scheduled". | S |
| F4 | `src/platform/notifier.ts:4, 43-48` | Add `'quiet'` to the `Reminder.channel` union and `createChannel({ id: 'quiet', name: 'Quiet reminders', importance: 2, vibration: false })`. Route `quiet: true` reminders there. Also route the night-deck nudge there when exact alarms are off and the slack to bedtime is < 60 min (finding D). | S |
| F5 | `src/platform/notifier.ts:58-63` | Add `isExactNotification: this.exact && reminder.channel !== 'planning'`, where `this.exact` is cached from `checkExactNotificationSetting()` once per reconcile. This means **no implicit settings screen** (finding F). Leave `isExactMandatory` unset. | S |
| F6 | `android/app/src/main/AndroidManifest.xml:61` | Remove `USE_EXACT_ALARM` **for the Play build** (finding E). Keep `SCHEDULE_EXACT_ALARM` (merged in from the plugin). `ReminderSettings.tsx:17-18` already offers the grant. Change its copy to: "Exact timing is off. Reminders can be up to an hour late. [Turn on exact timing]". Update spec `01-architecture.md:190, 193` to match the 8.3.x behaviour. Log in DECISIONS. | S |
| F7 | `src/ui/screens/ReminderSettings.tsx:16-19` | Add "Keep reminders working" (§6 copy), the brand picker and "Send a test in 2 minutes" (schedule `id: 'test:<ulid>'`, `at: now + 120_000`, on the `tasks` channel). | M |
| F8 | `android/app/src/main/java/app/nandi/personal/NightPausePlugin.java` (new `@PluginMethod`s next to `openUsageSettings` at :41) | `openNotificationSettings` (`Settings.ACTION_APP_NOTIFICATION_SETTINGS` + `EXTRA_APP_PACKAGE`), `openAppDetails` (`ACTION_APPLICATION_DETAILS_SETTINGS`), `openBatteryList` (`ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS`), `openSamsungNeverSleeping` (the intent above, falling back to app details). No manifest change. | S-M |
| F9 | `src/ui/screens/Ground.tsx:122` | When `asked && permission !== 'granted'`, add the button "Open notification settings" → F8. | XS |
| F10 | `src/platform/reminderSync.ts:33-39` (cancel loop) | Rows for past `task:` reminders become `fired`, as in `nudgeSync.ts` (§6.4). Keeps the `reminders` table small. | XS |
| F11 | `android/app/src/main/java/app/nandi/personal/NightPauseService.java:111` | New channel id `night_pause_quiet`, IMPORTANCE_HIGH, `setSound(null, null)`, and delete `night_pause`. Heads-up without sound (finding I). | XS |
| F12 | Night plan screen (`NightPlanSetting`) | One line: "Tip: set your phone's Bedtime mode to start at {bedtime} too." Covers finding C without native code. | XS |
| F13 (optional) | Plugin patch (`patch-package`) on `LocalNotificationRestoreReceiver.kt` | Skip the catch-up re-arm if the missed alarm is older than 30 min, or when the channel is `tasks`. Only if T8 fails on real phones and F12 is not enough. A new dependency means a DECISIONS line. | M |

F2-F5 need Vitest tests first (CLAUDE.md). F5 and F6 together must be tested on one Android 14+ phone: install
fresh, make 3 edits, and check that the "Alarms & reminders" screen never appears.

---

## 9. Probe test (Measured)

The test runs against the real `wantedReminders`, `wantedNudges` and `nightWindow` on `origin/ship-27`. It lives in
`/tmp`, not in the repo. Run with `TZ=Asia/Kolkata npx vitest run --config /tmp/cj2/job6-scratch/vitest.config.mts`
from the worktree.

`/tmp/cj2/job6-scratch/vitest.config.mts`:

```ts
export default ({
  root: '/tmp/cj2/job6',
  server: { fs: { allow: ['/tmp/cj2'] } },
  test: { environment: 'node', dir: '/tmp/cj2/job6-scratch', include: ['**/*.test.ts'], setupFiles: ['/tmp/cj2/job6/src/data/test-setup.ts'] },
});
```

`/tmp/cj2/job6-scratch/night-rule.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: {} }));
import { wantedReminders } from '/tmp/cj2/job6/src/platform/reminderSync';
import { wantedNudges } from '/tmp/cj2/job6/src/core/nudges';
import { nightWindow, effectiveShutdown } from '/tmp/cj2/job6/src/core/tasks/planner';

const meta = { updatedAt: 0, deleted: 0 as const, deviceId: 'd' };
const set = (key: string, value: unknown) => ({ key, value, ...meta });
const at = (s: string) => new Date(s).getTime();

describe('night rule vs scheduled notifications', () => {
  it('task reminder inside the user\'s lights-out window', () => {
    const now = at('2026-11-05T20:00:00');
    const taskAt = at('2026-11-06T00:30:00');
    const reminders = wantedReminders([{ id: 't1', title: 'Late task', status: 'planned', dayKey: '2026-11-05', scheduledStart: taskAt, ...meta } as never], [], now);
    const window = nightWindow(taskAt, effectiveShutdown('22:45', '23:30'), '23:30');
    console.log('task at 00:30, user bedtime 23:30 -> window =', window, '; reminders =', JSON.stringify(reminders));
    expect(window).toBe('lightsOut');
    expect(reminders.length).toBe(1); // BUG: scheduled on the HIGH-importance "tasks" channel
  });
  it('nudge times vs bedtime (slack before lights-out)', () => {
    const now = at('2026-11-05T09:00:00');
    for (const [shutdown, bedtime] of [['23:15', '01:30'], ['22:45', '23:30'], ['23:20', '23:30'], ['22:00', '22:30']]) {
      const n = wantedNudges({ now, settings: [set('planner.bedtime', bedtime), set('planner.shutdown', shutdown), set('nudge.streak.enabled', true)], tasks: [], logs: [] })
        .filter(r => r.id.endsWith('2026-11-05'));
      const bed = new Date(`2026-11-05T${bedtime}:00`); if (Number(bedtime.slice(0, 2)) < 4) bed.setDate(bed.getDate() + 1);
      console.log(`shutdown ${shutdown} bedtime ${bedtime}:`, n.map(r => `${r.id.split(':')[1]} at ${new Date(r.at).toTimeString().slice(0, 5)} (slack ${Math.round((bed.getTime() - r.at) / 60000)} min)`).join(', '));
    }
  });
});
```

Output (vitest 5.0.3, 2 passed):

```
task at 00:30, user bedtime 23:30 -> window = lightsOut ; reminders = [{"id":"task:t1","at":1793905200000,"title":"Task block starts","body":"Late task","channel":"tasks"}]
shutdown 23:15 bedtime 01:30: night at 23:15 (slack 135 min), streak at 23:14 (slack 136 min)
shutdown 22:45 bedtime 23:30: night at 22:45 (slack 45 min), streak at 21:59 (slack 91 min)
shutdown 23:20 bedtime 23:30: night at 23:15 (slack 15 min), streak at 21:59 (slack 91 min)
shutdown 22:00 bedtime 22:30: night at 22:00 (slack 30 min), streak at 20:59 (slack 91 min)
```

Note: with the default settings (23:15 / 01:30), the streak nudge lands 1 min before the night nudge. That is fine
(two separate notifications), but in Doze the second may be ~9 min late (the "once per nine minutes" rule).

Not measured: real delivery delays on any phone. No device or emulator was available in this cloud session.
Every OEM delay in §4 is Reported or Expected until the §7 matrix is run.

---

## 10. Sources

Official (Android / Google / Samsung):
- Schedule alarms: https://developer.android.com/develop/background-work/services/alarms/schedule
- Android 14 exact alarms: https://developer.android.com/about/versions/14/changes/schedule-exact-alarms
- Doze and App Standby: https://developer.android.com/training/monitoring-device-state/doze-standby
- App Standby buckets: https://developer.android.com/topic/performance/appstandby
- Power management limits: https://developer.android.com/topic/performance/power/power-details
- App hibernation: https://developer.android.com/topic/performance/app-hibernation
- Notification permission: https://developer.android.com/develop/ui/views/notifications/notification-permission
- Android 15 changes (targeting 15): https://developer.android.com/about/versions/15/behavior-changes-15
- Android 15 changes (all apps, stopped state): https://developer.android.com/about/versions/15/behavior-changes-all
- Android 16 changes (all apps): https://developer.android.com/about/versions/16/behavior-changes-all
- Google Play, Permissions and APIs that Access Sensitive Information (exact alarm, full-screen intent): https://support.google.com/googleplay/android-developer/answer/16558241
- Samsung app management (sleeping 3 days, deep sleeping 16 days, deep-link intent): https://developer.samsung.com/mobile/app-management.html
- Samsung support, sleeping apps: https://www.samsung.com/us/support/answer/ANS00088422/
- Capacitor Local Notifications v8 docs: https://capacitorjs.com/docs/apis/local-notifications
- Plugin source read: `npm pack @capacitor/local-notifications@8.3.1` (`LocalNotificationsPlugin.kt`, `LocalNotificationManager.kt`, `LocalNotificationRestoreReceiver.kt`, `NotificationChannelManager.kt`, `dist/esm/definitions.d.ts`)

Reported (not OEM-official):
- dontkillmyapp ranking: https://dontkillmyapp.com/
- Xiaomi: https://dontkillmyapp.com/xiaomi (MIUI 10-14; no HyperOS text)
- Samsung: https://dontkillmyapp.com/samsung
- OnePlus: https://dontkillmyapp.com/oneplus
- Oppo: https://dontkillmyapp.com/oppo (F1S-era only)
- Realme: https://dontkillmyapp.com/realme
- Vivo: https://dontkillmyapp.com/vivo
- HyperOS 3.0 settings screenshots (DriveQuant guide, PDF): https://info.drivequant.com/hubfs/Tuto%20Smartphones%20-%20EN/Xiaomi/Xiaomi%20-%20HyperOS%203.0%20-%20EN.pdf
- HyperOS 2026 PowerKeeper/FCM forum report (search result only, not opened): https://redlib.groet-infra.nl/r/HyperOS/s/OvQLzgZc65
- OriginOS 6 replacing Funtouch, Oct 2025 (secondary, not verified): https://didongviet.vn/dchannel/funtouch-os-la-gi/

Pages that could not be used:
- https://support.google.com/googleplay/android-developer/answer/12253906 opened as a policy-deadlines index with no
  exact-alarm text. I used answer/16558241 instead.
- The anchor `#exact-acceptable-use-cases` on the alarms page was not in the fetched text.
- No official Xiaomi, Oppo, Realme, Vivo or OnePlus developer page on background limits was found in search.
