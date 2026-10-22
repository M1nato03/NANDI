# Google Play readiness (cloud job 2, Job 4)

Branch read: `origin/ship-27` at `b17ec40`. Date: 22 Oct 2026.
Scope: everything under `android/`, `capacitor.config.ts`, every network call in `src/`, and Google's own policy pages.
Every policy quote below comes from a page I opened today. Anything I could not open or confirm is marked **unconfirmed**.

## Summary

- **Target SDK: no change needed.** `android/variables.gradle:4` already sets `targetSdkVersion = 36`, and `compileSdkVersion = 36` is on line 3. New apps and updates must target 36 from 31 Aug 2026.
- **7 blockers.** 5 need repo changes: the self-updater, `USE_EXACT_ALARM`, `USE_FULL_SCREEN_INTENT`, APK-only builds, and the privacy policy. 2 are Console or process steps: the foreground-service declaration with a video, and the 12-tester closed test.
- **Data safety form: "No data collected, no data shared"** is accurate once the Play build drops the updater. All user data stays on the phone. Backups and shares only leave when the user starts them.
- **Data-loss risk to ask Jenil about:** he and his testers have the sideloaded APK installed. If the Play build uses a different signing key, they must uninstall to switch, and uninstalling wipes IndexedDB. See the "Signing" section.

## What the app does on the network (measured by grep)

Command run in the worktree:

```sh
grep -rnE "fetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|importScripts|navigator\.share|https?://" src \
  --include=*.ts --include=*.tsx | grep -v "\.test\."
grep -rnE "\bfetch\b|caches\.|serviceWorker|registerSW|workbox" src --include=*.ts --include=*.tsx | grep -v "\.test\."
```

| Call | Where | What leaves the phone | In the Android app? |
|---|---|---|---|
| Update check `GET https://nandi-updates.nandi11.workers.dev/version.json?t=…` | `src/platform/updater.ts:4,21`, native `UpdaterPlugin.java:73-93` | Request line, IP, Java `HttpURLConnection` user agent (includes Android version and device model). No app data. | Yes, on open and on resume (`useNativeUpdater.ts`) |
| APK download `nandi-<code>.apk` | `UpdaterPlugin.java:96-137` | Same as above | Yes, when the user taps install |
| `navigator.share` (backup file, kind card, challenge link) | `src/platform/files.ts:29,124` | Whatever the user chooses to share, through the system share sheet | Yes, user-initiated |
| Service worker precache | `src/sw.ts`, `src/platform/sw-register.ts:43` | Nothing. It is skipped when `Capacitor.isNativePlatform()` | No (web only) |
| Fonts | `@fontsource/*` bundled | Nothing. Fonts are local, with no Google Fonts call | n/a |
| `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket` | none found in `src/` | | |
| Analytics or crash SDKs | none (grep for sentry, crashlytics, firebase: 0 hits) | | |

The WebView serves the app from `https://nandi.local` (`capacitor.config.ts:8`), which is bundled assets, not the network.
`updates/wrangler.jsonc` is a static-assets Worker with no logging configured.
**So the only network traffic from the Android app is the updater.** Removing it from the Play build (blocker B1) leaves zero network calls.

## Permissions in the merged manifest

The app manifest is `android/app/src/main/AndroidManifest.xml`. The Capacitor plugins add their own permissions. I checked those with `npm pack @capacitor/local-notifications@8.3.1` (and the other plugins) in `/tmp` and read their `AndroidManifest.xml` files.

| Permission | Source | Play treatment | Action |
|---|---|---|---|
| INTERNET | app `:58` | normal | keep (harmless). Could be dropped from the Play build once the updater is gone |
| REQUEST_INSTALL_PACKAGES | app `:59` | restricted, needs a declaration, self-update banned | **B1: remove from Play build** |
| POST_NOTIFICATIONS | app `:60` + local-notifications plugin | runtime permission, no Console form | keep. Asked only on a user tap (`Ground.tsx:82`, `NightSettings.tsx:35`) |
| USE_EXACT_ALARM | app `:61` | restricted to alarm/timer and calendar apps | **B2: remove** |
| SCHEDULE_EXACT_ALARM | local-notifications plugin manifest (merged in) | user-granted special access, no Console form | keep. `ReminderSettings.tsx:16-18` already handles "denied" |
| VIBRATE | app `:62` + haptics plugin | normal | keep |
| PACKAGE_USAGE_STATS | app `:63` | special access. No Console form, but User Data policy rules apply (prominent disclosure, privacy policy) | keep. Disclosure exists, privacy policy must mention it (B4) |
| SYSTEM_ALERT_WINDOW | app `:64` | special access, user grants in Settings | keep, disclose in privacy policy |
| FOREGROUND_SERVICE, FOREGROUND_SERVICE_SPECIAL_USE | app `:65-66`, service `:12-16` | Console FGS declaration and video required (targets 34+) | **B6: declare** |
| USE_FULL_SCREEN_INTENT | app `:67` | auto-granted only to alarm and calling apps. Play revokes it for others | **B5: remove** |
| RECEIVE_BOOT_COMPLETED | app `:68` + plugin | normal | keep |
| WAKE_LOCK | local-notifications plugin | normal | keep |

## Blockers (would get the app rejected or stop the upload)

### B1 · Self-updater and REQUEST_INSTALL_PACKAGES (hard rejection)

Device and Network Abuse policy, https://support.google.com/googleplay/android-developer/answer/9888379 :
> "An app distributed via Google Play may not modify, replace, or update itself using any method other than Google Play's update mechanism."
> "an app may not download executable code (such as dex, JAR, .so files) from a source other than Google Play."

The permissions policy at https://support.google.com/googleplay/android-developer/answer/9888170 says REQUEST_INSTALL_PACKAGES is for apps whose core function is sending or receiving packages. It may not be used for self-updates. I opened the page, but the fetch tool would only summarise this section, so this is a paraphrase, not a verbatim quote.

NANDI downloads `nandi-<versionCode>.apk` from its own server and opens the package installer. That is exactly the banned pattern.

Change (keep the sideload channel working; build a separate `play` variant):
- `android/app/build.gradle:7-40`: add `flavorDimensions "store"` with `productFlavors { play {} ; sideload {} }`.
- Move `REQUEST_INSTALL_PACKAGES` (`AndroidManifest.xml:59`) into `src/sideload/AndroidManifest.xml`, or remove it in `src/play/AndroidManifest.xml` with `tools:node="remove"`.
- Move `UpdaterPlugin.java` into `src/sideload/java/...`, and drop `registerPlugin(UpdaterPlugin.class)` from the Play build (`MainActivity.java:11`). For example, register it through a flavor-specific helper class.
- `src/platform/updater.ts:15`: make `updaterAvailable()` also return false when the Play build is detected. Use a native flag from the flavor, or a non-secret build constant. With that, `AppShell.tsx:170-174` (Settings "App updates" card) and `NativeUpdateBar` at `AppShell.tsx:190` disappear on their own.
- `android/app/src/main/res/xml/file_paths.xml:2-3`: the `cache-path` entry exists for the APK hand-off. In the Play build, narrow or drop `external-path "."`. This is low risk, not a blocker.
- Optional: in the Play build, offer the Play In-App Updates API later. That is a new dependency, so it needs a DECISIONS.md line.

### B2 · USE_EXACT_ALARM (hard rejection)

Android docs, https://developer.android.com/about/versions/14/changes/schedule-exact-alarms :
> "**Note:** Apps will not be able to publish a version of their app with this permission in the manifest unless they qualify based on the policy language."

Policy (answer/9888170), acceptable uses: "The app is an alarm or timer app." / "The app is a calendar app that shows event notifications." and "If you have a use case for exact alarm functionality that's not covered above, you should evaluate if using `SCHEDULE_EXACT_ALARM` as an alternative is an option."

NANDI is a habits and learning app. A rest timer inside Train does not make it a timer app.

Change: delete `AndroidManifest.xml:61`. `SCHEDULE_EXACT_ALARM` still arrives from the local-notifications plugin manifest. The plugin falls back to inexact alarms when it is denied (`LocalNotificationsPlugin.kt:126,158,180`, `TimedNotificationPublisher.kt:65`), so nothing crashes.

Side effect to accept: on Android 14+, fresh installs start with SCHEDULE_EXACT_ALARM **denied**:
> "`SCHEDULE_EXACT_ALARM` … is no longer being pre-granted to most newly installed apps targeting Android 13 and higher (will be set to denied by default)."

So Play users get inexact reminders until they tap "Open alarm settings" (`ReminderSettings.tsx:18`). This is a product trade-off for Jenil; Job 6 covers the details.

### B3 · CI builds an APK; new Play apps need an App Bundle (upload blocker)

https://developer.android.com/guide/app-bundle :
> "From August 2021, new apps are required to publish with the Android App Bundle on Google Play."

`.github/workflows/android.yml:51` runs `./gradlew assembleRelease` only.
Change: add a step `./gradlew bundlePlayRelease` (after B1 flavors exist) and upload `app/build/outputs/bundle/playRelease/*.aab` as a separate artifact. Leave the sideload APK step as it is.
`versionCode` comes from `GITHUB_RUN_NUMBER` (`build.gradle:14`). Both channels share it, which is fine, and it stays monotonic.

### B4 · Privacy policy is a draft and misses required parts (policy rejection)

User Data policy, https://support.google.com/googleplay/android-developer/answer/10144311 :
> "All apps must post a privacy policy link in the designated field within Play Console," and "a privacy policy link or text within the app itself."

It must include:
> "Developer information and a privacy point of contact or a mechanism to submit inquiries." … "The developer's data retention and deletion policy." … "Clear labeling as a privacy policy" … "available on an active, publicly accessible and non-geofenced URL (no PDFs)".

`public/privacy.html` today, live at https://nandi.nandi11.workers.dev/privacy.html (I measured HTTP 200):
- Says "Draft. The final wording will be published before launch."
- Title is "Privacy notice". Google asks for clear "privacy policy" labelling, so add "Privacy policy" to the heading.
- Has no developer name and no contact email.
- Does not mention App pause reading which app is in front (Usage access), the "display over other apps" permission, notifications, or exact alarms.
- After B1 it should not say "The app checks our server for updates" for the Play build, or should say "the Play Store version does not".

The in-app link exists only on the first-run screen (`src/ui/welcome/Welcome.tsx:96`). Add the same link to You > Settings (`AppShell.tsx:170`) so it stays reachable after onboarding.
Job 5 (DPDP notice) drafts the text. This job only lists what Play requires on top of that.

### B5 · USE_FULL_SCREEN_INTENT on the App pause notice (likely rejection or revocation)

https://source.android.com/docs/core/permissions/fsi-limits :
> "Upon installation, the Google Play Store revokes the full-screen intent (FSI) permission"

It "can be granted only to apps that provide calling and alarm functionalities".

Device and Network Abuse policy (answer/9888379) lists as a violation:
> "Apps that use the full-screen intent permission to force user interaction with disruptive ads or notifications."

`NightPauseService.java:216` calls `.setFullScreenIntent(intent, true)` when the user opens Instagram or YouTube. Even with opt-in, a reviewer can read this as forcing interaction.
Change: delete `AndroidManifest.xml:67` and `.setFullScreenIntent(intent, true)` at `NightPauseService.java:216`. The overlay path at `NightPauseService.java:206-208` already brings NANDI to the front when the user allowed "display over other apps". Otherwise the HIGH-importance notification shows as heads-up. That is the same display Android uses when FSI is denied, per the source.android.com test table.
Then answer "No" to the Console full-screen intent question.

### B6 · Foreground service `specialUse` needs a Console declaration and a video (release blocker until filed)

Device and Network Abuse policy (answer/9888379): "Submit a declaration form in your Play Console if targeting Android 14+". The service must be "initiated by the user or is user perceptible", "can be terminated or stopped by the user", and "runs only for as long as necessary to complete the task".

Foreground service help, https://support.google.com/googleplay/android-developer/answer/13392821 : "Include a link to a video demonstrating each foreground service feature."

Android docs, https://developer.android.com/develop/background-work/services/fgs/service-types :
> "These values and corresponding use cases are reviewed when you submit your app in the Google Play Console. The use cases you provide are free-form, and you should make sure to provide enough information to let the reviewer see why you need to use the `specialUse` type."

Status in code:
- Opt-in: yes (`NightSettings.tsx:66`).
- Visible: yes. There is an ongoing notification, "NANDI app pause is on … You can turn it off in You > Settings > App pause." (`NightPauseService.java:116-117`).
- User can stop it: yes (`NightPausePlugin.configure` → `stopService`).

Change: make the subtype at `AndroidManifest.xml:15` specific, for example:
`"User-enabled digital wellbeing pause: while on, checks which app is in front (Usage access, on device only) and offers a breathing pause before chosen social apps at bedtime"`.
Then record a 30-60 s video: turn on App pause, grant Usage access, open Instagram, see the pause, turn it off.

Risk note (judgment, not a quote): the service runs all day when "During the day" is not "off" (`NightPauseService.java:51,90`). "Runs only as long as necessary" is the part a reviewer may question. If it is rejected, limit the service to the night window plus the day-limit mode, and stop it outside them.

### B7 · Closed test before production (process blocker, new personal accounts)

https://support.google.com/googleplay/android-developer/answer/14151465 : "personal developer accounts created after November 13, 2023" need "a minimum of 12 testers who have been opted in continuously for at least 14 days" before "you can apply for production access".
Plan at least 2-3 weeks for this. It does not apply to an organisation account.

## Data safety form: exact answers

Rule used (https://support.google.com/googleplay/android-developer/answer/10787469):
- "Collect" means transmitting data off the device.
- Data "only processed locally on the user's device and not sent off device does not need to be disclosed".
- Transfers "based on a specific user-initiated action, where the user reasonably expects" it are not "sharing".
- "Even developers with apps that do not collect any user data must complete this form and provide a link to their privacy policy."

| Console question | Answer for the Play build (after B1) |
|---|---|
| Does your app collect or share any of the required user data types? | **No** |
| Privacy policy URL | https://nandi.nandi11.workers.dev/privacy.html (after B4) |
| Account creation / deletion | No accounts; deletion URL not needed |

What the "No" rests on, per data type:

| Data type (Play list) | On device? | Collected? | Shared? | Why |
|---|---|---|---|---|
| Location | no | no | no | not read |
| Personal info (name, email, IDs) | profile settings, goals, bedtime, `adultConfirmedAt` | no | no | stored in IndexedDB only |
| Financial info | no | no | no | no payments; Shards are earned, never bought |
| Health and fitness | workouts, soft days | no | no | on device only |
| Messages, Contacts, Calendar | no | no | no | not read |
| Photos and videos, Audio | no | no | no | not read |
| Files and docs | backup JSON | no | no | written to Documents or the share sheet only when the user taps it (user-initiated exemption) |
| App activity: app interactions, in-app actions, user-generated content (tasks, answers) | yes | no | no | on device only |
| App activity: installed apps / other apps' usage (App pause) | yes, Usage events read live, package names in SharedPreferences | no | no | `NightPauseService.java:28` "never leave the device"; confirmed, the service has no network code |
| Web browsing | no | no | no | |
| App info and performance (crash logs, diagnostics) | no | no | no | no crash or analytics SDK |
| Device or other IDs | `deviceId` (ULID) | no | no | only inside a user-made backup file |

The sideload build's updater sends IP and user agent to Cloudflare. Google says IP handling is disclosed "based on their particular usage and practices", and the page does not cover update checks. That build is not on Play, so this does not matter for the form. It does matter for the DPDP notice (Job 5).

Caveat: Google lists "On-device transfer to another app" as sharing. The backup and kind-card shares go through the system share sheet, which the user picks every time, so the user-initiated exemption applies. That is my reading; Google's page does not give a share-sheet example.

## Content rating questionnaire (IARC)

Source: https://support.google.com/googleplay/android-developer/answer/9859655 and /188189. Every app needs it. "Misrepresentation of your app's content may result in its removal or suspension." Answer 9859455 adds that "Unrated" apps may be removed.
IARC's FAQ (https://globalratings.com/faq/) names the topics: "violence, profanity, sexual content, nudity, gambling or other pertinent material".
**Unconfirmed:** Google's help pages I opened do not list the question set or the category names. The category names and question wording below come from the Console form as I know it, not from a page opened today. Check them in the Console.

Suggested category: **"Reference, News, or Educational"** if the store category is Education. Use "Utility, Productivity, Communication, or Other" if it is Productivity. Do **not** pick Game: puzzles are one part of Mind.

Answers, checked against `content/` with a word scan (script below):

| Topic | Answer | Evidence |
|---|---|---|
| Violence / blood / gore | No | "blood" appears only in nutrition and biology items and a NASA "Blood Moon" source title |
| Fear / horror | No | mystery arcs: grep for murder, kill, knife found 0 hits; `\bgun\b` found 0 whole-word hits |
| Sexuality / nudity | No sexual content. One non-explicit reference | `content/lessons/lessons.charaka-holds-up.json` quotes Charaka listing "exercise, laughing, talking, walking, sex, and staying awake at night" as things not to overdo. Answer "No" for sexual content. If the form asks about sexual *references*, disclose this one line (judgment) |
| Language / crude humour | No | 0 profanity hits |
| Controlled substances (drugs, alcohol, tobacco) | No | "Drugs" appears only as "Drugs and Magic Remedies Act"; "smoke" only in "as fire is covered by smoke" (Gita 18.48) |
| Gambling / simulated gambling | No | `topic.psychology.json`: a loss-aversion thought experiment ("bet ₹50"). No wagering mechanic; Shards are not random |
| Users can interact or exchange content | No | no chat, no accounts. Sharing goes out through the OS share sheet only |
| Shares user location | No | |
| Digital purchases | No | no in-app purchases; the Shard shop uses earned points only |
| Unrestricted internet access | No | no in-app browser |

Expected result: the lowest age band (IARC 3+, PEGI 3, ESRB Everyone). This is an **estimate**; IARC sets the final rating.
The low rating is fine with an 18+ audience: the rating describes the content, and the target-audience setting controls who can get the app.

Word scan used (run in the worktree):

```python
import re,glob
for f in glob.glob('content/**/*.json',recursive=True):
    t=open(f,encoding='utf-8').read()
    for m in re.finditer(r'(?i)\b(dead|blood|poison|smok\w*|drug\w*|casino|sex|shit|hell|self-harm|gun|bet)\b',t):
        print(f, m.group(0), t[max(0,m.start()-70):m.end()+50].replace('\n',' '))
```

## Target audience and content

Source: https://support.google.com/googleplay/android-developer/answer/9867159.

- Target age groups: **"18 and over" only.** Leave every younger group unticked.
- "Any apps that include children in their target audience must comply with Google Play's Families Policy." NANDI does not include children, so Families does not apply. Do not opt into Designed for Families or Teacher Approved.
- **Restrict Minor Access: turn it on.** The page says: "select 18 and over as your app's only target age group" then "you can enable the Restrict Minor Access feature to restrict minors from your app." This backs up the in-app 18+ confirmation (`Welcome.tsx:76`, `profile.adultConfirmedAt`) with Google's own age signals.
- Store listing: no cartoon mascots aimed at kids. The page warns that marketing that suggests the app is for children can lead to rejection. The bull logo and plain copy are fine.

## App access

Source: https://support.google.com/googleplay/android-developer/answer/9859455. Instructions are needed only "If your entire app or parts of your app are restricted based on login credentials".

Answer: **"All functionality is available without special access."** NANDI has no login.
Still add one note in "Any other instructions" so the reviewer can reach the FGS feature:

> First screen: confirm you are 18+, pick any goal, Continue. App pause (foreground service): You > Settings > App pause > tap "Open Usage access settings", allow NANDI, come back, tick "App pause on", tap "Try it now for N minutes", then open YouTube.

The real menu labels are in `NightSettings.tsx:60-75`, and N comes from `RULES.night.pauseTestMin`.

## Ads declaration

Source: answer/9859455. Declare ads "delivered through third-party ad SDKs", and answer yes for house ads such as a "small ad banner, interstitial ad, ad wall, and/or widget to promote my other apps".

Answer: **"No, my app does not contain ads."** There is no ad SDK in `package.json` or `android/app/build.gradle:48-58`, and no house ads. The home-screen widget (`NandiWidgetProvider.java`) shows the user's own plan, not promotion.

## Other App content forms that every app must file

| Form | Source | Answer |
|---|---|---|
| Health apps declaration | https://support.google.com/googleplay/android-developer/answer/14738291 "All developers that have an app published on Google Play must complete the Health apps declaration" | Tick **Activity and Fitness** (Train), **Sleep Management** (bedtime, Night deck), **Stress Management, Relaxation, Mental Acuity** (Mind, puzzles). **Decision for Jenil:** whether the Charaka lessons and `topic.health-nutrition` count as "Medical Reference and Education". My view is no (they are graded educational lessons), but ticking it is the more cautious answer |
| Health Content and Services policy | https://support.google.com/googleplay/android-developer/answer/16679511 | Store description must say the app is "not a medical device and does not diagnose, treat, cure, or prevent any medical condition" and "remind users to consult a healthcare professional". The in-app footer "Educational, not medical advice." (`LessonPlayer.tsx:51`) already exists; add the same to the Play description |
| Financial features declaration | https://support.google.com/googleplay/android-developer/answer/13849271 "All developers that have an app published on Google Play must complete the Financial features declaration" | **"My app doesn't provide any financial features"**. The money-markets topic is education only |
| News app, COVID-19 apps | answer/9859455 | No / No |
| Government app | — | No |

## Target SDK

Source: https://developer.android.com/google/play/requirements/target-sdk and https://support.google.com/googleplay/android-developer/answer/11926878 :
> "New apps and app updates must target Android 16 (API level 36) or higher to be submitted to Google Play" (from August 31, 2026).
> Extension: "you'll be able to request an extension to November 1, 2026."

NANDI: `android/variables.gradle:4` `targetSdkVersion = 36`, `:3` `compileSdkVersion = 36`, `minSdkVersion = 24` (`:2`). AGP 8.13.0 (`android/build.gradle:9`). CI installs `platforms;android-36` (`android.yml:38`). **Meets the requirement. No change needed.**
Not checked here (needs a device): Android 16 behaviour changes for target 36, such as edge-to-edge without opt-out. Worth a Job 6 or 9 device pass.

## Signing (data-loss risk, ask Jenil)

`CLAUDE.md`: "Never change the signing key … either loses his data."
Play App Signing lets a new app "Provide a copy of your app signing key" instead of a Google-generated one, using the PEPK tool (https://support.google.com/googleplay/android-developer/answer/9842756).

- If Jenil uploads the **same key** the sideload APK uses, a phone with the sideloaded app can update from Play with no uninstall and no data loss. The Play build's `versionCode` must be higher than the installed one.
- If Google generates a new key, every current user must export a backup, uninstall, install from Play, and restore.

This choice is made once, when the app is created in the Console, and cannot be undone. **Ask Jenil before creating the app.**

Related (not a Play blocker): Android developer verification will cover sideloaded apps on certified devices "globally … in 2027" (https://developer.android.com/developer-verification). The sideload channel will need a registered developer then.

## Smaller items (not blockers)

| Item | File:line | Note |
|---|---|---|
| "Allow restricted settings" help text | `NightSettings.tsx:63` | Only needed for sideloaded installs. Play installs are not restricted; hide it in the Play build |
| Broad FileProvider path | `res/xml/file_paths.xml:2` `external-path path="."` | Narrow it to what the updater or share actually need |
| Privacy link only on first run | `Welcome.tsx:96` | Also add it to Settings (part of B4) |
| FGS subtype text | `AndroidManifest.xml:15` | Part of B6 |

## Blocker checklist

| # | Blocker | Fix where | Type |
|---|---|---|---|
| B1 | Self-update + REQUEST_INSTALL_PACKAGES | `AndroidManifest.xml:59`, `MainActivity.java:11`, `UpdaterPlugin.java`, `updater.ts:15`, `build.gradle` flavors | code |
| B2 | USE_EXACT_ALARM | `AndroidManifest.xml:61` | code |
| B3 | APK, not AAB | `.github/workflows/android.yml:51` | CI |
| B4 | Privacy policy draft, no contact, no Usage access text | `public/privacy.html`, `AppShell.tsx:170` | content |
| B5 | USE_FULL_SCREEN_INTENT | `AndroidManifest.xml:67`, `NightPauseService.java:216` | code |
| B6 | FGS specialUse declaration + video | Console; `AndroidManifest.xml:15` text | Console |
| B7 | 12 testers × 14 days closed test | Console | process |

## Pages I could not use

- https://www.globalratings.com/how-iarc-works.aspx returned 404. I used https://globalratings.com/faq/ instead.
- https://support.google.com/googleplay/android-developer/answer/12253906 (linked from the exact-alarm doc) opened, but it showed the policy-updates page with no exact-alarm text. I used answer/9888170 and the Android docs quote instead.
- The fetch tool gave only paraphrases for the REQUEST_INSTALL_PACKAGES and USE_FULL_SCREEN_INTENT sections of answer/9888170. The quotes above are marked accordingly.
