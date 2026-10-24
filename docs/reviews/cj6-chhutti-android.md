# cj6 · Phone ki chhutti on Android: prove it works (batch 6, job 5)

Branch `ideas/cj6-chhutti-android`, based on origin/main `92da451`. Research only: no app code or content changed.

Inputs read: `docs/reviews/cj5-focus.md` §4-5 (branch `ideas/cj5-focus`), `docs/specs/24-signature-mechanics.md`
(branch `ideas/spec-24-signature`), and on main: `NightPauseService.java`, `NightPausePlugin.java`,
`NightPauseBootReceiver.java`, `AndroidManifest.xml`, `variables.gradle` (minSdk 24, targetSdk 36, compileSdk 36),
`src/core/time/dayKey.ts`.

## Short answer

| Question | Answer |
|---|---|
| How far back? | The docs only say "a few days". AOSP source for Android 10, 11, 12, 13, 14, 15 and `main` gives the same rule: events are read from daily files, and daily files older than **10 days** are deleted. A window less than about 9 days old can be read on stock Android. Plan for **7 days** to leave a margin |
| OEM difference? | **Nothing official was found** for Xiaomi/HyperOS, Samsung One UI or Nothing OS. One third-party README says "some OEMs restrict background data collection" (anecdotal). Test on real phones |
| Foreground / background | `ACTIVITY_RESUMED` (1) and `ACTIVITY_PAUSED` (2). `MOVE_TO_FOREGROUND`/`MOVE_TO_BACKGROUND` are the **same numbers**, deprecated in API 29. Both are reported **per activity**, so track each activity, not each package |
| Screen off | The lifecycle guide says an activity stays resumed "until ... the device screen turning off", so screen-off ends the session with a PAUSED event. `SCREEN_NON_INTERACTIVE` (API 28+) is a safety net and the source of "phone dark" minutes |
| Reboot | After every boot AOSP adds a `DEVICE_SHUTDOWN` (last save time) and a `DEVICE_STARTUP` event. Up to 20 minutes of events before an unclean shutdown can be lost |
| Revoked access / locked | **The real `queryEvents(long,long)` never returns null.** In AOSP source, no access and a locked user both come back as an **empty** list. An empty list looks like "0 minutes, kept". The code must check access and unlock itself first |
| Extra permission? | No. `PACKAGE_USAGE_STATS` plus the user's Usage access switch is enough |
| Play policy | No section and no declaration form for Usage access in the pages read. The general rules apply: the feature must be promoted in the listing, the data counts as personal and sensitive, and a prominent in-app disclosure is needed when the use "may not be within the reasonable expectation of the user". On-device only data "does not need to be disclosed" in Data safety |
| Existing code | `readUsedToday` is fine for a rough live total. It is **not** safe to reuse for chhutti: it keys by package, has no reboot or screen-off handling, sums overlapping apps, and treats "no access" as 0. §7 lists 7 differences |

## 1. How far back does `queryEvents` keep events? (Android 10-15)

### Official docs

`UsageStatsManager.queryEvents(long, long)` (https://developer.android.com/reference/android/app/usage/UsageStatsManager, page "Last updated 2026-08-28 UTC"):

> "Query for events in the given time range. Events are only kept by the system for a few days."

> "Note: Starting from Android R, if the user's device is not in an unlocked state (as defined by UserManager.isUserUnlocked()), then null will be returned."

`beginTime` is "The inclusive beginning" and `endTime` is "The exclusive end" of the range.

The docs give no number. They also say nothing per version or per OEM.

### AOSP source (android.googlesource.com, `platform/frameworks/base`)

1. `queryEvents` reads only the **daily** files. `UserUsageStatsService.queryEvents` calls `queryStats(INTERVAL_DAILY, beginTime, endTime, ...)`.
   Checked in tags `android-10.0.0_r1` (line 378), `android-12.0.0_r1` (line 510), `android-15.0.0_r1` (line 557), and present in 11, 13 and 14.
   https://android.googlesource.com/platform/frameworks/base/+/refs/tags/android-15.0.0_r1/services/usage/java/com/android/server/usage/UserUsageStatsService.java
2. Daily files are deleted after 10 days. `UsageStatsDatabase.prune()`, Android 15, lines 943-947:
   ```java
   // prune all files older than 10 days in the weekly directory
   mCal.setTimeInMillis(currentTimeMillis);
   mCal.addDays(-10);
   pruneFilesOlderThan(mIntervalDirs[UsageStatsManager.INTERVAL_DAILY],
           mCal.getTimeInMillis());
   ```
   (The comment says "weekly", but the code prunes the daily folder.) `pruneFilesOlderThan` deletes a file when its `beginTime < expiryTime`.
   https://android.googlesource.com/platform/frameworks/base/+/refs/tags/android-15.0.0_r1/services/usage/java/com/android/server/usage/UsageStatsDatabase.java
3. A second cap, `MAX_FILES_PER_INTERVAL_TYPE = new int[]{100, 50, 12, 10}`, keeps at most 100 daily files, so the 10-day rule is the one that bites.
4. `prune` runs at each daily rollover (`UserUsageStatsService.rolloverStats`, line 873: `mDatabase.prune(currentTimeMillis);`).

| Android | Tag read | Daily files pruned after | Daily file cap | `queryEvents` reads |
|---|---|---|---|---|
| 10 | android-10.0.0_r1 | `addDays(-10)` | 100 | INTERVAL_DAILY |
| 11 | android-11.0.0_r1 | `addDays(-10)` | 100 | INTERVAL_DAILY |
| 12 | android-12.0.0_r1 | `addDays(-10)` | 100 | INTERVAL_DAILY |
| 13 | android-13.0.0_r1 | `addDays(-10)` | 100 | INTERVAL_DAILY |
| 14 | android-14.0.0_r1 | `addDays(-10)` | 100 | INTERVAL_DAILY |
| 15 | android-15.0.0_r1 | `addDays(-10)` | 100 | INTERVAL_DAILY |
| main | refs/heads/main | `addDays(-10)` | 100 | (not re-checked) |

What this means. A file is kept while its start is under 10 days old, and a daily file covers at most a day. So an
event less than **9 days** old is still there on stock Android. Older events may be gone, with no error: the query just
returns fewer events. **Recommendation:** read a window only while `from` is under `readableForDays` = 7 days old.
Older windows go to self-report.

Two smaller source facts:
- **Clock changes.** With `persist.debug.time_correction` (default `true`), a wall-clock jump of more than 2 seconds
  (`TIME_CHANGE_THRESHOLD_MILLIS = 2 * 1000`) makes `UsageStatsDatabase.onTimeChanged` move the stored files by the difference.
  Timestamps around a manual clock change can be shifted. Treat a backwards timestamp as `uncertain`.
- **New API, different permission.** The reference page also lists `queryAppUsageDuration` ("Added in version 37.2"): "Data can
  only be queried for the past 30 days" and it "Requires Manifest.permission.QUERY_APP_USAGE". Its buckets are calendar days
  ("midnight to midnight local time"). It cannot answer a 21:00-22:00 window and needs another permission. Not useful here.

### OEM differences (Xiaomi / HyperOS, Samsung One UI, Nothing OS)

| OEM | Official or primary source found | What it says |
|---|---|---|
| Xiaomi / MIUI / HyperOS | None | Searches returned only the Android reference pages |
| Samsung One UI | None about usage events | Samsung community posts only give the menu path to "Usage data access" (community forum, not official) |
| Nothing OS | None | No Nothing developer page on usage stats was found |
| Any OEM | Anecdotal only | The `react-native-app-usage-stats@1.0.1` README (https://cdn.jsdelivr.net/npm/react-native-app-usage-stats@1.0.1/README.md): "Samsung / Xiaomi / Huawei: Some OEMs restrict background data collection. If `getUsageByApps` returns 0 for all apps despite permission being granted, advise users to also disable battery optimization for your app." A third-party README, not tested, and about a different method |

The 10-day value is a Java constant, not a system property (the only property nearby, `ro.usagestats.chooser.retention`, is for share-sheet counts).
An OEM could still change the code. OEM framework source is not public, so **nothing is documented**. Use the 7-day cut and
the device test in §9.

## 2. Which events mark foreground and background, and how is screen-off counted?

From `UsageEvents.Event` (https://developer.android.com/reference/android/app/usage/UsageEvents.Event):

| Event | Value | API | Docs (quoted) |
|---|---|---|---|
| `ACTIVITY_RESUMED` | 1 | 29 | "An event type denoting that an Activity moved to the foreground. ... If a package has multiple activities, this event is reported for each activity that moves to foreground. This event is corresponding to Activity.onResume()" |
| `ACTIVITY_PAUSED` | 2 | 29 | "An event type denoting that an Activity moved to the background. ... If a package has multiple activities, this event is reported for each activity that moves to background. This event is corresponding to Activity.onPause()" |
| `ACTIVITY_STOPPED` | 23 | 29 | "An activity becomes invisible on the UI, corresponding to Activity.onStop()" |
| `MOVE_TO_FOREGROUND` | **1** | 21, deprecated 29 | "This constant was deprecated in API level 29. by ACTIVITY_RESUMED" |
| `MOVE_TO_BACKGROUND` | **2** | 21, deprecated 29 | "This constant was deprecated in API level 29. by ACTIVITY_PAUSED" |
| `SCREEN_INTERACTIVE` | 15 | 28 | "the screen has gone in to an interactive state (turned on for full user interaction, not ambient display or other non-interactive state)" |
| `SCREEN_NON_INTERACTIVE` | 16 | 28 | "the screen has gone in to a non-interactive state (completely turned off or turned on only in a non-interactive state like ambient display)" |
| `KEYGUARD_SHOWN` | 17 | 28 | "the screen's keyguard has been shown, whether or not the screen is off" |
| `KEYGUARD_HIDDEN` | 18 | 28 | "This typically happens when the user unlocks their phone after turning it on" |
| `DEVICE_SHUTDOWN` | 26 | 29 | see §3 |
| `DEVICE_STARTUP` | 27 | 29 | see §3 |

Points that change the algorithm:
- **Old and new names are the same event.** Testing `type == ACTIVITY_RESUMED || type == MOVE_TO_FOREGROUND` is harmless but redundant.
  On API 24-28 the same value 1 arrives under the old name.
- **Per activity, not per package.** One app can have two activities, and the docs say the event "is reported for each activity".
  AOSP's own foreground counter (`UsageStats.updateActivity`, Android 15, line 479 on) keys open activities by instance and counts time
  while any of them is RESUMED. The public API has no instance id, so use `getClassName()`.
- **Multi-window.** "Android 10 (API level 29) and higher versions support multi-resume—all activities remain in the RESUMED state when the
  device is in multi-window mode. An activity can be paused if a transparent activity is on top of the activity or the activity is not
  focusable, for example, the activity is in picture-in-picture mode."
  (https://developer.android.com/develop/ui/views/layout/support-multi-window-mode). So two chosen apps can be resumed at once
  (count the minutes once, as a union). A video in picture-in-picture is paused, so it does not count.
- **Screen off.** Activity lifecycle guide (https://developer.android.com/guide/components/activities/activity-lifecycle): in
  onResume, "The app stays in this state until something happens to take focus away from the app, such as the device receiving a
  phone call, the user navigating to another activity, or the device screen turning off." "When an interruptive event occurs, the
  activity enters the Paused state and the system invokes the onPause callback." So screen-off normally logs `ACTIVITY_PAUSED`,
  and time with the screen off is not counted as app time.
- **"Phone dark" time** = window length minus the time between `SCREEN_INTERACTIVE` and `SCREEN_NON_INTERACTIVE`, on API 28+ only.
  `queryEventStats` aggregates exactly these four screen/keyguard types, but only per day, so the window needs the raw events.
- **Background audio is not app time.** A service playing audio logs `FOREGROUND_SERVICE_START`/`STOP`, not RESUMED. Counting only
  RESUMED time leaves out background play. That fits "time in the app".

## 3. Reboot, revoked Usage Access, locked phone

### Reboot

Docs, `DEVICE_SHUTDOWN`:

> "A DEVICE_SHUTDOWN event should be treated as if all started activities and foreground services are now stopped and no explicit
> ACTIVITY_STOPPED and FOREGROUND_SERVICE_STOP events will be generated for them. The DEVICE_SHUTDOWN timestamp is actually the
> last time UsageStats database is persisted before the actual shutdown. Events (if there are any) between this timestamp and the
> actual shutdown is not persisted in the database. So any open events without matching close events between DEVICE_SHUTDOWN and
> DEVICE_STARTUP should be ignored because the closing time is unknown."

`DEVICE_STARTUP`: "the Android runtime started up. This could be after a shutdown or a runtime restart."

AOSP source:
- After **every** boot, `UserUsageStatsService.init` adds both events (Android 15, lines 176-188, same in 10-14):
  "During system reboot, add a DEVICE_SHUTDOWN event to the end of event list, the timestamp is last time UsageStatsDatabase is
  persisted to disk or the last event's time whichever is higher ... Also add a DEVICE_STARTUP event with current system timestamp."
  So a crash or battery pull also gets the pair. `DEVICE_STARTUP` carries the time of this init, not the moment power came back.
- Events are saved every 20 minutes (`FLUSH_INTERVAL = ... TWENTY_MINUTES`, `UsageStatsService` line 167). An orderly shutdown
  saves first (`shutdown()`, line 902 on). An unclean one can lose up to about 20 minutes of events.
- AOSP's own counter ends open activities at the shutdown time: `UsageStats.update`, `case DEVICE_SHUTDOWN:` "update usage of all
  active activities/services" (line 616 on). Doing the same gives a **lower bound** that is a fact: the app was in front at least until then.
- Events that happen while the phone is still locked after boot are kept as "pending" and merged after unlock (`loadPendingEventsLocked`), so they are not lost.

### Revoked Usage Access

Docs: "declaring the permission implies intention to use the API and the user of the device still needs to grant permission
through the Settings application." Nothing on what a call returns without access.

AOSP source, Android 15:
- `UsageStatsService` binder `queryEvents` (line 2423): `if (!hasQueryPermission(callingPackage)) { return null; }`.
- Client `UsageStatsManager.queryEvents(long, long)` (line 590; the same in 10 and 11):
  ```java
  UsageEvents iter = mService.queryEvents(beginTime, endTime, mContext.getOpPackageName());
  if (iter != null) { return iter; }
  ...
  return sEmptyResults;
  ```
  `sEmptyResults = new UsageEvents()`.

So **without access the app gets an empty list, not an error**, and the "0 minutes, kept" result would be wrong.
The access check (`AppOpsManager.OPSTR_GET_USAGE_STATS`, `MODE_ALLOWED`, as `NightPausePlugin.usageAllowed` does) must come first.
`hasQueryPermission` only falls back to the manifest permission on `MODE_DEFAULT`, which normal apps do not hold, so `usageAllowed` matches it.

Recording does not depend on any app's access. `reportEvent` has no reader permission check; the check sits only on the query path. So if Jenil turns access
off and back on within the retention time, past windows can be read again. (This is read from the source; no doc states it.)

Hibernation does not apply: the hibernation page says only "Your app's runtime permissions are reset", and Usage access is a
special app access, not a runtime permission (https://developer.android.com/topic/performance/app-hibernation). NANDI is also opened daily.

### Locked phone

Docs: `UserManager.isUserUnlocked()`: "On devices with direct boot, a user is unlocked only after they've entered their credentials
(such as a lock pattern or PIN)." (https://developer.android.com/reference/android/os/UserManager#isUserUnlocked())

Source: `queryEventsWithQueryFilters` (line 1548): `if (!mUserUnlockedStates.contains(userId)) { ... return null; }`, and the
client again turns that into `sEmptyResults`. **The docs say `null`. The 2-argument method in AOSP returns an empty list.** Either
way, check `isUserUnlocked()` first. NANDI's WebView cannot run before unlock, so this matters mostly for the service after a reboot.

## 4. Anything beyond `PACKAGE_USAGE_STATS`? Play policy

### Android

- Manifest reference: "Allows an application to collect component usage statistics. Declaring the permission implies intention to use
  the API and the user of the device can grant permission through the Settings application. Protection level:
  signature|privileged|development|appop|retailDemo" (https://developer.android.com/reference/android/Manifest.permission#PACKAGE_USAGE_STATS).
- Reading **past** events needs nothing else. There is no extra permission for history, for other apps, or for screen events. NANDI already
  declares `PACKAGE_USAGE_STATS` and asks for it through `Settings.ACTION_USAGE_ACCESS_SETTINGS`.
- That settings action: "In some cases, a matching Activity may not exist, so ensure you safeguard against this."
  (https://developer.android.com/reference/android/provider/Settings#ACTION_USAGE_ACCESS_SETTINGS). See bug B1.
- Sideloaded APKs on Android 13+: NANDI's own copy (`NightSettings.tsx:63`) already tells Jenil to use "Allow restricted settings" when
  the switch is greyed out. Google's help page (https://support.google.com/android/answer/12623953) says "some device settings may be
  restricted when you install an app" and that the steps "work only on Android 13 and up". It does not name Usage access. This is an
  install-path step, not a permission.
- Optional (API 35+): `queryEvents(UsageEventsQuery)` takes type and package filters. Its docs say an empty filter "may cause additional
  system overhead". If a package filter is used, add `android`: AOSP files device events under `DEVICE_EVENT_PACKAGE_NAME = "android"`
  (`UsageEvents.java`), and the filter drops any event whose package is not listed (`UserUsageStatsService` line 594). Which package the
  screen events use was not checked, so filter by **type** only, or test it first.

### Google Play

"Permissions and APIs that Access Sensitive Information" (https://support.google.com/googleplay/android-developer/answer/9888170, opened 24 Oct 2026):
- The page has **no section about `PACKAGE_USAGE_STATS` or Usage access** (zero matches for "USAGE_STATS" or "usage access").
  Its only "App usage tracking" line is in the VpnService section and does not apply.
- "You may only request permissions and APIs that access sensitive information that are necessary to implement current features or
  services in your app that are promoted in your Google Play listing. You may not use permissions or APIs that access sensitive
  information that give access to user or device data for undisclosed, unimplemented, or disallowed features or purposes."
- "restricted permissions are permissions that are designated as Dangerous, Special, Signature, or as documented below." The
  word "Special" links to developer.android.com's special-permissions section, so Usage access is a restricted permission, and
  "User or device data accessed through Restricted Permissions is considered as personal and sensitive user data. The requirements of
  the User Data policy apply."
- "You must make a reasonable effort to accommodate users who do not grant access to sensitive permissions." Self-report covers this.
- "Direct users to the system settings page for approval of special permissions (for example, SYSTEM_ALERT_WINDOW)." NANDI does.

User Data policy (https://support.google.com/googleplay/android-developer/answer/10144311):
- Personal and sensitive data includes "inventory of other apps on the device ... and other sensitive device or usage data."
- Prominent disclosure applies "In cases where your app's access, collection, use, or sharing of personal and sensitive user data may
  not be within the reasonable expectation of the user ... (for example, if data collection occurs in the background when the user is
  not engaging with your app)". The disclosure "Must be within the app itself", "Must describe the data being accessed or collected",
  and a consent request "must be immediately preceded by an in-app disclosure". Suggested format: "[This app] collects/transmits/syncs/stores [type of data] to enable ["feature"], [in what scenario]."

Data safety (https://support.google.com/googleplay/android-developer/answer/10787469): "User data accessed by your app that is only
processed locally on the user's device and not sent off device does not need to be disclosed." v1 chhutti stays on the phone. The v2 shared
chhutti hour sends `kept` off the device, so Data safety needs a fresh look then.

Declaration form (https://support.google.com/googleplay/android-developer/answer/9214102): it appears for "high-risk or sensitive
permissions" and names SMS and Call Log. Nothing in the pages read lists Usage access, so **no Usage-access-specific form was found**.
NANDI's Play declarations come from other permissions (specialUse FGS, `USE_FULL_SCREEN_INTENT`, `USE_EXACT_ALARM`; see cj2-play-store).

**Is chhutti an allowed purpose?** Yes, under the rules read: it is the app's own feature, on the device, promoted in the listing. Do these:
1. Name both App pause and Phone ki chhutti in the Play listing as features that use Usage access.
2. Before sending the user to Usage access settings, show one in-app line (one-time, needs a tap), for example:
   "NANDI reads which apps were open and when, on this phone only, to show minutes in the apps you picked during your chhutti and App pause. Nothing leaves the phone."
3. Keep self-report as the alternative when access is off.

## 5. The algorithm: minutes in chosen apps between `from` and `to` on day D

Design choice: native code returns the **raw events** for the range (chosen packages plus device and screen events) in memory.
All the logic is a **pure function in `src/core`**, tested first with Vitest from §6 (CLAUDE.md: "Write src/core logic test-first").
Only minutes are stored. New tunables go in `rules.config.ts` under `plan.chhutti`:
`lookbackMin: 360`, `readableForDays: 7`, `settleSec: 60` (and the existing proposal `graceMin: 5`).

```text
TYPES  RESUMED=1  PAUSED=2  STOPPED=23  SCREEN_ON=15  SCREEN_OFF=16  SHUTDOWN=26  STARTUP=27
Event  { ts: ms, type, pkg, cls }

# ---- A. Window bounds (core, pure). D is a dayKey; the day runs 04:00 D to 04:00 D+1 (dayBoundaryHour) ----
windowBounds(D, fromHHMM, toHHMM):
  dayStart = localMs(D, "04:00");  dayEnd = localMs(D + 1 day, "04:00")
  f = localMs(D, fromHHMM); if fromHHMM < "04:00": f = localMs(D + 1 day, fromHHMM)
  t = localMs(D, toHHMM);   if toHHMM  <= "04:00": t = localMs(D + 1 day, toHHMM)
  if t <= f: t = t + 1 day          # e.g. 23:30-00:30 written loosely
  f = max(f, dayStart); t = min(t, dayEnd)
  if t <= f: return INVALID         # reject at plan time; spec 24 keeps windows 04:00..shutdown
  return (f, t)
  # localMs uses calendar fields in the device zone (DST-safe), the same way dayKey() does.

# ---- B. Read (native gate, then raw events) ----
readWindow(D, window, chosen, now):
  (f, t) = windowBounds(D, window.from, window.to)
  if not android:                         return { status: 'web' }        # self-report
  if now < t + settleSec*1000:            return { status: 'not-ended' }  # retry next open
  if not usageAllowed():                  return { status: 'no-access' }  # empty list would look like 0
  if not UserManager.isUserUnlocked():    return { status: 'locked' }     # same
  qStart = f - lookbackMin*60000          # catches a session that began before `from`
  if f < now - readableForDays*86400000:  return { status: 'too-old' }    # events may be pruned
  it = queryEvents(qStart, t)             # end exclusive; never trust null/empty as "no use" without the gates above
  raw = []
  for e in it:
    if e.type in {RESUMED, PAUSED, STOPPED} and e.pkg in chosen: raw.add(e)
    else if e.type in {SCREEN_ON, SCREEN_OFF, SHUTDOWN, STARTUP}: raw.add(e)
  return { status: 'ok', sdk: SDK_INT, events: raw }   # events stay in memory only

# ---- C. Count (core, pure) ----
countWindow(events, f, t, qStart, chosen, sdk):
  sort events by ts (stable)                      # docs promise no order; clock jumps can reorder
  state   = map pkg -> map cls -> RESUMED|PAUSED  # like AOSP UsageStats.mActivities
  openAt  = map pkg -> ms                         # when pkg's first activity became RESUMED
  appIntervals = [];  screenOn = [];  screen = UNKNOWN;  onSince = null
  inReboot = false;  uncertain = false;  lastTs = null

  isFront(p)  = any value RESUMED in state[p]
  close(p, at): if p in openAt: appIntervals.add([openAt[p], at]); delete openAt[p]
  closeAll(at): for p in openAt: close(p, at)
                for p in state: set every cls in state[p] to PAUSED
  scrOff(at):   if screen == ON: screenOn.add([onSince, at])
                if screen == UNKNOWN: screenOn.add([qStart, at])   # it was on before; start unknown, assume on (not dark)
                screen = OFF
  scrOn(at):    if screen != ON: onSince = at; screen = ON

  for e in events:
    if lastTs != null and e.ts < lastTs: uncertain = true
    switch e.type:
      SHUTDOWN:   closeAll(e.ts); scrOff(e.ts); inReboot = true        # lower bound, as AOSP does
      STARTUP:    state.clear(); openAt.clear(); inReboot = false      # nothing carries over a reboot
      SCREEN_OFF: closeAll(e.ts); scrOff(e.ts)                         # safety net if PAUSED is missing
      SCREEN_ON:  scrOn(e.ts)
      RESUMED:    if inReboot: skip                                    # docs: ignore opens between SHUTDOWN and STARTUP
                  if not isFront(e.pkg): openAt[e.pkg] = e.ts
                  state[e.pkg][e.cls or ""] = RESUMED
      PAUSED:     if e.pkg in state: state[e.pkg][e.cls or ""] = PAUSED
                  if not isFront(e.pkg): close(e.pkg, e.ts)
      STOPPED:    delete state[e.pkg][e.cls or ""]                     # covers a missing PAUSED
                  if not isFront(e.pkg): close(e.pkg, e.ts)
    lastTs = e.ts

  for p in openAt: appIntervals.add([openAt[p], t])                    # still in front at `to`: clip there
  if screen == ON: screenOn.add([onSince, t])

  chosenMs = lengthOfUnion(clip(appIntervals, f, t))                   # overlaps count once
  if sdk < 28 or (screen == UNKNOWN and no SHUTDOWN seen): darkMs = null
  else: darkMs = (t - f) - lengthOfUnion(clip(screenOn, f, t))         # a powered-off phone counts as dark
  if sdk < 29: uncertain = true                                        # no STOPPED/SHUTDOWN events before API 29
  return { chosenMs, chosenMin: round(chosenMs / 60000), darkMs, uncertain }

lengthOfUnion(list): sort by start; merge where next.start <= cur.end; sum (end - start)
clip(list, f, t):    keep [max(a,f), min(b,t)] where min(b,t) > max(a,f)

# ---- D. Decide (core) ----
kept = status == 'ok' and chosenMs <= graceMin * 60000
'not-ended' | 'locked'   -> stay pending; try again at the next open
'no-access' | 'web'      -> ask the self-report question; if access comes back first and the window is still readable, read it
'too-old'                -> self-report only
Write the ledger fact once, id chhutti:<dayKey>:<windowId>; first write wins (idempotent), source 'usage' or 'self'.
```

Known limits, stated plainly:
- A chosen app that stayed in front for longer than `lookbackMin` before `from` with **no** event at all is missed. With screen-off
  events this needs over 6 hours of unbroken screen-on use.
- On API 24-27 there are no screen events. A missing PAUSED then runs to `to` (overcount), and `darkMs` is null.
- Two instances of the **same** activity class in one app look like one. (The public API has no instance id.)
- After screen-off, the activities are marked PAUSED. If an app came back to the front without a new RESUMED event (not seen in the
  docs), that time would be missed. This errs toward fewer minutes.

## 6. Test cases (expected minutes)

Day D = `2026-10-20`, Asia/Kolkata. Window 21:00-22:00 unless stated. `lookbackMin` 360 (query starts 15:00), `graceMin` 5, API 34.
I = `com.instagram.android`, Y = `com.google.android.youtube` (both chosen), W = `com.whatsapp` (not chosen).
"Old loop" = `readUsedToday`'s rules (package key, RESUMED/PAUSED only), with the result clipped to the window.

| # | Case | Events (local time) | Expected chosen min | Expected dark min | Kept | Old loop |
|---|---|---|---|---|---|---|
| 1 | Plain session, then a gap | 20:40 SCREEN_OFF · 21:09 SCREEN_ON · 21:10 I/Main RESUMED · 21:25 I/Main PAUSED · 21:26 SCREEN_OFF · (nothing after) | **15** | 43 | no | 15 |
| 2 | Crosses `from` | 20:50 I/Main RESUMED · 21:05 I/Main PAUSED | **5** | — | yes (5 ≤ 5) | 5 |
| 3 | Crosses `to` (close not in range) | 21:50 Y/Watch RESUMED · (22:20 PAUSED is after `to`, not returned) | **10** | — | no | 10 |
| 4 | Two chosen apps overlap (split screen) | 21:10 I/Main RESUMED · 21:15 Y/Watch RESUMED · 21:30 I/Main PAUSED · 21:40 Y/Watch PAUSED | **30** (union) | — | no | 45 (sum) |
| 5 | Same app, two activities out of order | 21:10 I/Main RESUMED · 21:11 I/Story RESUMED · 21:12 I/Main PAUSED · 21:20 I/Story PAUSED | **10** | — | no | 2 |
| 6 | PAUSED missing, screen-off closes | 20:40 SCREEN_OFF · 21:09 SCREEN_ON · 21:10 I/Main RESUMED · 21:20 SCREEN_OFF · 21:50 SCREEN_ON · 21:50 W/Home RESUMED | **10** | 39 | no | 50 |
| 7 | Reboot inside the window | 20:40 SCREEN_OFF · 21:05 SCREEN_ON · 21:10 I/Main RESUMED · 21:18 DEVICE_SHUTDOWN · 21:22 DEVICE_STARTUP · 21:22 SCREEN_ON · 21:30 I/Main RESUMED · 21:35 I/Main PAUSED · 21:36 SCREEN_OFF | **13** (8 + 5) | 33 | no | 25 |
| 8 | Window crosses midnight | Window 23:30-00:30 on D (to = 2026-10-21 00:30) · 00:10 I/Main RESUMED · 00:45 I/Main PAUSED | **20** | — | no | 20 |

Status cases (no minutes, and never 0):

| # | Case | Input | Expected |
|---|---|---|---|
| S1 | Usage access off | `usageAllowed()` false; `queryEvents` would return an empty list | `status: 'no-access'`, `chosenMin: null`, self-report offered, **not** `kept: true` |
| S2 | Window not over | now = 21:59:30 | `status: 'not-ended'` |
| S3 | Too old | window 9 days before now | `status: 'too-old'`, self-report only |
| S4 | Window past 04:00 | D, window 03:30-04:30 | `windowBounds` clips to 03:30-04:00 on 2026-10-21, or rejects at plan time (recommended) |

Arithmetic for the dark column: #1 screen on 21:09-21:26 = 17, so 60-17 = 43. #6 on 21:09-21:20 (11) + 21:50-22:00 (10) = 21, so 39.
#7 on 21:05-21:18 (13) + 21:22-21:36 (14) = 27, off and powered-down count as dark, so 33. "—" means not under test.

## 7. Compared with `NightPauseService.readUsedToday` (main, lines 179-208)

| # | Where | `readUsedToday` does | Should be (for chhutti) | Effect |
|---|---|---|---|---|
| D1 | line 199-204 | Keys open sessions by **package**; first PAUSED of any activity closes the app | Track each activity (`getClassName()`), close when none is RESUMED | Undercount when activities overlap (case 5: 2 vs 10) |
| D2 | whole loop | No `DEVICE_SHUTDOWN`/`DEVICE_STARTUP` handling | Close at SHUTDOWN, reset at STARTUP | If the PAUSED was lost before a reboot, the session runs on until the next PAUSED or `now`. That can add hours, and the day-limit pause then fires early |
| D3 | whole loop | No `SCREEN_NON_INTERACTIVE` or `ACTIVITY_STOPPED` | Use both as closers | Overcount when PAUSED is missing (case 6: 50 vs 10) |
| D4 | line 206 | Adds each package's time (sum) | Union across chosen apps | Double count in split screen (case 4: 45 vs 30). For a "used today" limit a sum may be acceptable, but it is not the same as wall-clock minutes |
| D5 | line 189 | Query starts at 04:00 | Start `lookbackMin` before the window | A session open across 04:00 loses its post-04:00 part (its PAUSED finds no open entry) |
| D6 | line 190 | `if (events == null) return 0;` | Check `usageAllowed()` and `isUserUnlocked()` first; treat "unknown" as unknown | On AOSP the null branch never runs (§3). No access or locked gives an empty list, so 0. The service already checks `usageAllowed` each tick, so App pause is safe. Chhutti would be wrong without the gate |
| D7 | line 199, 201 | `ACTIVITY_RESUMED \|\| MOVE_TO_FOREGROUND` | Either constant | Same value (1 and 2). Harmless, can be simplified |

cj5-focus bug #3 ("`queryEvents` can return `null` ... Neither method checks for it") is out of date: main now checks at lines 158 and 190.
But the check guards a value the 2-argument call does not return (D6).

cj5 says the new `windowUsage` is "built from the same loop as `readUsedToday`". **Do not reuse that loop.** Use §5, in core, with §6 as its tests.

## 8. What changes in the cj5 / spec 24 plan

| cj5 / spec 24 says | Change |
|---|---|
| "Events are only kept by the system for a few days ... fall back to self-report" | Keep, with a number: read while `from` is under 7 days old (`readableForDays`); AOSP keeps 10 |
| Native `windowUsage({ from, to, packages }) → { chosenAppMs, darkMs \| null }` | Native `usageEvents({ beginMs, endMs, packages }) → { status, sdk, events }`; minutes are computed in `src/core` (pure, Vitest) |
| "It handles a `null` result" | Gate on `usageAllowed()` and `isUserUnlocked()` **before** reading; never write `kept: true` from an empty read |
| `darkMin \| null` on API 28+ | Yes; also null when no screen event is in range. Powered-off time counts as dark |
| "no new Play declaration" | Correct for Usage access in the pages read. Add the listing line and the one-time in-app disclosure (§4) |

## 9. Device test before building (owner panel, 30 minutes)

On each phone available (Pixel or stock-like, one Xiaomi/HyperOS, one Samsung, one Nothing if possible):
1. Open Instagram 21:10-21:25, lock the screen, wait, unlock, open WhatsApp. Read the window. Expect 15 ± 1.
2. Split-screen Instagram and YouTube for 10 minutes. Expect 10, not 20.
3. Open Instagram, hold power and restart, open Instagram again for 5 minutes. Expect the SHUTDOWN/STARTUP pair and both parts counted.
4. Turn Usage access off, read a past window. Expect `no-access`, never 0.
5. Read a window 8 days old. Note whether events are still there (an OEM retention check).
Write the results into this file's follow-up before shipping. That is the only way to cover the OEMs, since nothing official exists.

## 10. Bugs found (not fixed)

| # | File · function | What |
|---|---|---|
| B1 | `android/app/src/main/java/app/nandi/personal/NightPausePlugin.java` · `openUsageSettings` | `startActivity(ACTION_USAGE_ACCESS_SETTINGS)` has no `ActivityNotFoundException` guard. The docs say "a matching Activity may not exist, so ensure you safeguard against this." `openOverlaySettings` in the same file already has a fallback. What Capacitor does with the uncaught exception was not checked |
| B2 | `NightPauseService.java` · `readUsedToday` | No `DEVICE_SHUTDOWN` handling (D2). A session open at a reboot can be counted for hours, so the day-limit pause can fire early |
| B3 | `NightPauseService.java` · `readUsedToday` | Package-level key (D1) undercounts. No STOPPED/screen-off closer (D3) can overcount |
| B4 | `NightPauseService.java` · `readUsedToday`, `currentForeground` | The `null` guards cover a case the AOSP client never returns. Empty results from no access or a locked user read as 0 (D6). Low risk today because of the `usageAllowed` check per tick |

## 11. Sources

Opened and quoted:
- https://developer.android.com/reference/android/app/usage/UsageStatsManager
- https://developer.android.com/reference/android/app/usage/UsageEvents.Event
- https://developer.android.com/reference/android/app/usage/UsageEventsQuery
- https://developer.android.com/reference/android/os/UserManager (isUserUnlocked)
- https://developer.android.com/guide/components/activities/activity-lifecycle
- https://developer.android.com/develop/ui/views/layout/support-multi-window-mode
- https://developer.android.com/reference/android/Manifest.permission (PACKAGE_USAGE_STATS)
- https://developer.android.com/reference/android/provider/Settings (ACTION_USAGE_ACCESS_SETTINGS)
- https://developer.android.com/guide/topics/permissions/overview
- https://developer.android.com/topic/performance/app-hibernation
- AOSP `platform/frameworks/base`, tags android-10.0.0_r1 … android-15.0.0_r1 and `main`:
  `services/usage/java/com/android/server/usage/UsageStatsDatabase.java`, `UserUsageStatsService.java`, `UsageStatsService.java`,
  `IntervalStats.java`; `core/java/android/app/usage/UsageStatsManager.java`, `UsageStats.java`, `UsageEvents.java`
  (e.g. https://android.googlesource.com/platform/frameworks/base/+/refs/tags/android-15.0.0_r1/services/usage/java/com/android/server/usage/UsageStatsDatabase.java)
- https://support.google.com/googleplay/android-developer/answer/9888170 (Permissions and APIs that Access Sensitive Information)
- https://support.google.com/googleplay/android-developer/answer/10144311 (User Data)
- https://support.google.com/googleplay/android-developer/answer/10787469 (Data safety)
- https://support.google.com/googleplay/android-developer/answer/9214102 (Declare permissions)
- https://support.google.com/android/answer/12623953 (Restricted settings)
- https://cdn.jsdelivr.net/npm/react-native-app-usage-stats@1.0.1/README.md (anecdotal OEM note)

Could not find or open:
- No official Xiaomi/HyperOS, Samsung One UI or Nothing OS developer page about usage events or their retention. Searches returned only Android docs, community posts and third-party pages.
- cs.android.com was not used. android.googlesource.com served the same files.
- The `refs/tags/main` path returned 404. `refs/heads/main` worked.
- The `queryEvents` loop in tags 11, 13 and 14 was checked only by a grep for `queryStats(INTERVAL_DAILY`, not read in full.
- No Play page names a Usage access declaration. "Not found" here means not in the pages above, not proven absent everywhere.
