# DPDP privacy notice: gap check and draft (cloud job 5, batch 2)

Branch: `ideas/cj2-privacy-notice`, based on `origin/ship-27` @ `b17ec40`.
Date: 22 Oct 2026. Nothing in the app or `public/privacy.html` was changed. The draft is in §5.

**Status: for lawyer review, not final.** This is a reading of the law by a non-lawyer. It is not legal advice.

---

## 1. Sources (what was opened, what was not)

| Source | URL | Opened? |
|---|---|---|
| DPDP Act 2023 (No. 22 of 2023), Gazette of India Extraordinary Part II s.1, 11 Aug 2023 | https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf | Yes. PDF, 182 KB, sha256 `4deb2398…7d15` |
| DPDP Rules 2025, G.S.R. 846(E), Gazette No. 760, dated 13 Nov 2025 (Hindi + English) | https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf | Yes. PDF, 2.5 MB, sha256 `eabc7d05…aa08`. English text starts on gazette p.24 |
| PIB backgrounder "DPDP Rules, 2025 Notified" (17 Nov 2025) | https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf | Yes. Background only, not law |
| egazette.gov.in | https://egazette.gov.in/ | **No.** TLS verification failed through the session proxy (curl error 60). I did not bypass it. The two MeitY PDFs are scans of the gazette itself (gazette headers and the digital signature of the Govt of India Press are in the files). |
| Data Protection Board complaint portal | none found | **No official URL found.** Searches only gave law-firm blogs. The draft leaves a placeholder. |

Dates from the gazette text:
- Rules 1(2): Rules 1, 2 and 17–21 in force on publication (13 Nov 2025).
- Rule 1(3): Rule 4 (Consent Managers) one year later, so **13 Nov 2026**.
- Rule 1(4): Rules 3, 5–16, 22, 23 come into force "eighteen months after the date of publication", so **13 May 2027**. The gazette is dated 13 Nov 2025 but was digitally signed on 14 Nov 2025 at 10:43. A lawyer should say whether "publication" means the 13th or the 14th. Aim for 13 May 2027 either way.
- I found no amendment to the Rules made in 2026, but I ran only two searches (see §6, Q14).

---

## 2. What personal data NANDI processes (measured from the code on ship-27)

### 2a. Stored on the phone (Dexie / IndexedDB `nandi`, `src/data/db.ts:10-37`, schema v3)

All rows carry `updatedAt`, `deleted` and `deviceId` (`src/data/types.ts:3-8`).

| Table | Personal data in it | Sensitivity note |
|---|---|---|
| `tasks` | title, notes, place, first step, times, category, how often it was postponed | Free text. Can hold anything, including other people's names and health details |
| `taskEvents` | every create/postpone/drop with a time and an optional `reason` (free text) | Behaviour log |
| `focus` | focus session start/end, pauses, switches | Behaviour log |
| `reminders` | reminder time, title, body | The body is the task title (`src/platform/reminderSync.ts:16`), so it **shows on the lock screen** |
| `plans` | if/then plans (free text), whether they worked | |
| `programs`, `exState`, `sessions`, `sets`, `prs` | training days, loads (kg), reps, effort, `readiness`, **`painFlag` / `painExerciseIds`** ("Pain or discomfort?" button, `src/ui/train/Workout.tsx:31`) | **Health-adjacent** |
| `puzzleRuns` | puzzle times, hints, grids, `afterBedtime` | Shows night-time use |
| `cards`, `deckProg`, `lessonProg`, `ratings`, `learnConcepts`, `learnItems`, `learnDrops` | learning answers, confidence, mastery, review times | |
| `flags`, `unlocks`, `inventory`, `quests` | flags with free-text `note`, unlocked items, Shard purchases, quest titles | |
| `ledger` | append-only facts: what was done and when. Includes **soft-day state `tired`/`low`** and a short free-text note of up to 140 characters (`src/data/repos/soft.ts:14,27`) | **Mood / wellbeing** |
| `dailyLog` | **lights-out time, bedtime target, self-reported reels time range** (`src/ui/screens/MorningBackfill.tsx:24`), **weekly 1–5 "agency" score** (`src/data/repos/guard.ts:31`), wind-down time, night overrides, app minutes | **Sleep and wellbeing self-reports** |
| `settings` | `profile.adultConfirmedAt` (ISO time of the 18+ tick, `src/ui/welcome/Welcome.tsx:76`), `profile.goals`, `planner.bedtime`, random `deviceId` (a ULID, `src/data/device.ts:6-12`), `owner.opens` (app opens per day, 60 days), `owner.pinHash`, `errorRing` (last 50 error messages and stacks, `src/ui/errorRing.ts`), `night.pause.apps` (which other apps the user picked), `night.pause.openings` / `dismissals` (counts) | `night.pause.apps` reveals which social apps the person uses |
| `packs` | content packs (not personal) | |

Also on the phone, outside IndexedDB:
- **Android SharedPreferences `night-pause`** (`android/.../NightPausePlugin.java:96-110`): enabled flag, bedtime, chosen app package names, the app currently paused.
- **Usage access.** When the user turns App pause on and grants Usage access, `NightPauseService` reads Android usage events (which app is in front, and today's minutes in the chosen apps) every 1.5 s while watching (`NightPauseService.java:56-100, 152-200`). It is read on the device only and never stored in full or sent. Permission: `PACKAGE_USAGE_STATS` (`AndroidManifest.xml:63`).
- **Home-screen widget prefs**: day title/subtitle text (`WidgetPlugin.java:13-20`).
- **localStorage / sessionStorage**: UI "seen" markers only (`src/ui/shell/EconomyFeedback.tsx:43-137`). No personal content.

No name, email, phone number, contacts, location, camera, microphone or account. No analytics or crash SDK (dependency list in `package.json`).

### 2b. What can leave the phone

| Path | Trigger | What leaves | Where it goes | Code |
|---|---|---|---|---|
| Manual backup | user taps Save in You › Settings › Backup | **Whole database** as plain JSON (Dexie export plus `deviceId`), not encrypted. The screen says so: "The file is plain text and contains your personal data." | Written to **Documents/** first, then the Android share sheet (Drive, WhatsApp, etc.) | `src/ui/screens/Backup.tsx:64,120`; `src/platform/files.ts:17-19` |
| **Automatic backup** | **on by default** (`enabled?.value !== false`), once a day | Whole database, plain JSON | **Documents/NANDI/auto/** on shared phone storage, 7 kept | `src/data/autoBackup.ts:35`; `src/core/autoBackup.ts:3-4`; `src/platform/files.ts:65-75` |
| Pre-update backup | before an in-app APK update | Whole database | Documents/ | `src/platform/files.ts:55-58` |
| Weekly summary export | user taps export in Weekly review | Detailed JSON summary of tasks, focus, logs, training, puzzles, ledger and settings for the week | Share sheet / download | `src/ui/screens/Planner.tsx:125-132` |
| Share tiles | user taps Share | Puzzle time and hints; "what my week became" counts; kind-word card text | Share sheet | `src/ui/screens/Mind.tsx:397`, `src/ui/screens/recapCard.ts`, `src/ui/soft/SoftDay.tsx:87` |
| Challenge link | user taps Challenge a friend | Puzzle type, difficulty, seed, the user's time | Share sheet / clipboard | `src/platform/files.ts:123-124`, `src/core/puzzles/challenge.ts:7` |
| **Update check** (Android only) | on open and resume, at most every 30 min | Plain HTTPS GET of `version.json`. No app data, no ID. The server sees the **IP address**, TLS/HTTP metadata and Java's default User-Agent | Cloudflare Worker `nandi-updates.nandi11.workers.dev` | `src/platform/updater.ts:4,19-27`; `src/core/updates.ts:2`; `UpdaterPlugin.java:59-66` |
| APK download | user accepts an update | Same as above | same host | `UpdaterPlugin.java:100-110` |
| Web build | opening https://nandi.nandi11.workers.dev | IP address and request metadata, as for any website. CSP `connect-src 'self'` blocks other hosts | Cloudflare | `public/_headers:2`; `wrangler.jsonc` |
| Notifications | scheduled reminders | Task title on the lock screen | Phone only, but visible to anyone holding it | `src/platform/reminderSync.ts:16` |

What does not leave: Android cloud backup is off (`android:allowBackup="false"`, `AndroidManifest.xml:5`). No fetch, XHR, sendBeacon or WebSocket in `src/` (grep). No third-party scripts or fonts (fonts are bundled).

### 2c. The 18+ confirmation
- First screen: a "Privacy notice" link (`Welcome.tsx:96`), then a checkbox "I'm 18 or older." (`Welcome.tsx:97`). "Let's start" stays disabled until it is ticked.
- It stores `profile.adultConfirmedAt` as an ISO time (`Welcome.tsx:76`). No date of birth, no check. It is a self-declaration.

### 2d. Errors in today's `public/privacy.html`
1. **"Removing the app or clearing its data erases it from this phone."** (`public/privacy.html:26`) is **false on Android**. Automatic backups (on by default) and manual backups sit in `Documents/` and `Documents/NANDI/auto/`. Files an app writes to shared Documents are not removed when the app is uninstalled. The draft notice fixes the wording. Check it on a real phone before launch.
2. **"A backup or a share leaves the phone only when you choose to make one."** (`:24`). The automatic backup writes a full plain-text copy to shared storage with no tap. It stays on the phone, but it leaves the app's private storage, and file-manager apps with all-files access or a PC over USB can read it.
3. It does not mention Usage access, the health-adjacent and wellbeing fields, lock-screen text, the IP address seen by the update server, any contact, rights, grievance or the Board.

---

## 3. Notice and related requirements, checked against NANDI

Legend: ✅ met · 🟡 partly · ❌ not met · ⚪ may not apply (lawyer)

| # | Requirement | Source (Act s. / Rule r.) | NANDI today | Gap and fix |
|---|---|---|---|---|
| 1 | A notice must accompany or come before every request for consent | Act s.5(1) | 🟡 Link sits above the 18+ tick on Welcome. No consent is actually asked | Show the short notice on Welcome (not only a link) before "Let's start" |
| 2 | Itemised description of the personal data | s.5(1)(i); r.3(b)(i) | ❌ "tasks, workouts, answers and settings" | Use the item list in §5 |
| 3 | The specified purpose(s), with a specific description of the goods/services or uses | s.5(1)(i); r.3(b)(ii); s.2(za) | ❌ Not stated | Add "Why" per group |
| 4 | Understandable on its own, without other documents | r.3(a) | ✅ Standalone page | Keep it self-contained |
| 5 | Clear and plain language; a fair account | r.3(b); s.6(3) | ✅ Style OK, content incomplete | |
| 6 | How to withdraw consent, as easy as giving it | s.6(4); r.3(c)(i) | ❌ Not described. There is no in-app "erase everything" | Describe the per-feature off switches and Android "Clear storage". Consider an in-app erase-all with a backup prompt (product decision) |
| 7 | How to use rights under s.6(4) and s.13 (and ss.11–14 generally) | s.5(1)(ii); r.3(c)(ii); r.14(1)(a) | ❌ | "Your choices and rights" section |
| 8 | How to complain to the Data Protection Board | s.5(1)(iii); r.3(c)(iii) | ❌ | Add Board route (official link still to be found) |
| 9 | The particular communication link to the website/app | r.3(c) | 🟡 The page is in the app and on the web, but there is no contact link | Add a contact email |
| 10 | Option to read the notice in English or any Eighth Schedule language | s.5(3); s.6(3) | ❌ English only | Add at least Hindi before launch (ties in with job 10, Hinglish) |
| 11 | Publish business contact of a DPO or a person who can answer questions, prominently on website/app | s.8(9); r.9; s.6(3) | ❌ | Add name/role and email. A DPO is only required for a Significant Data Fiduciary (s.10(2)(a)) |
| 12 | Effective grievance mechanism, with the response time (≤ 90 days) published | s.8(10); s.13(1)-(2); r.14(3) | ❌ | Publish an email and "we reply within N days (never more than 90)" |
| 13 | Right to nominate someone (death or incapacity) | s.14; r.14(4) | ❌ | Say how. Practically: the nominee can be given the phone or a backup |
| 14 | Say which identifier is needed to make a request | r.14(1)(b), r.14(5) | ❌ (no account exists) | Say "we have no account for you; no ID is needed" |
| 15 | Notice for people who consented before the Rules took effect, "as soon as reasonably practicable" | s.5(2)(a) | ❌ | Show a one-time in-app notice on the first open after the May 2027 build |
| 16 | Consent is free, specific, informed, unconditional, a clear affirmative act, limited to necessary data | s.6(1) | ⚪/🟡 No consent step except the 18+ tick. Usage access is a separate Android grant (a clear act) | Lawyer: rely on s.7(a) "voluntarily provided" legitimate use, or add one consent tap? |
| 17 | Children: verifiable parental consent before processing a child's data; no tracking or behavioural monitoring of children | s.9(1),(3); r.10 | ⚪ 18+ self-declared only. **App pause monitors which app is in front.** If a minor gets past the tick, that could be "behavioural monitoring" | Lawyer: is a self-declaration "appropriate technical and organisational measures"? |
| 18 | Reasonable security safeguards (encryption, access control, logs, backups) | s.8(5); r.6(1)(a)-(g) | ⚪/🟡 Data is unencrypted in IndexedDB. Backups are plain JSON in shared Documents. The update server needs no auth (holds no personal data) | Lawyer: is on-device data "in its possession or under its control"? Product: offer an encrypted backup option? |
| 19 | Breach notice to each affected person and the Board (72 h detail) | s.8(6); r.7 | ⚪ No channel to users (no account). The only server-side personal data is IPs at Cloudflare | Plan: an in-app banner via update manifest + this page. Lawyer: does a breach of the update server count? |
| 20 | Erase when the purpose is served or consent is withdrawn; 3-year inactivity erasure for big platforms | s.8(7)-(8); r.8(1)-(2), Third Schedule | ⚪ Third Schedule covers e-commerce ≥ 2 crore users, online gaming ≥ 50 lakh, social media ≥ 2 crore. NANDI is none of these | Nothing to do now |
| 21 | Keep personal data, traffic data and processing logs for at least 1 year | r.8(3), Seventh Schedule | ⚪ Neither worker turns on logs (`wrangler.jsonc`, `updates/wrangler.jsonc` have no `observability`). Cloudflare's own retention is outside NANDI's control | **Lawyer**: does r.8(3) require NANDI to *keep* update-check logs for a year? This pulls against data minimisation |
| 22 | Processors only under a valid contract | s.8(2) | ⚪ Cloudflare (hosting, update server) under its standard terms and DPA; Google Play if listed | Lawyer: are the standard terms enough? |
| 23 | Data accuracy if used for decisions or disclosed | s.8(3) | ⚪ No decisions about the person, no disclosure | |
| 24 | Transfer outside India allowed unless restricted | s.16; r.15 | ⚪ Cloudflare edge may be outside India (IP only) | Say so in the notice |
| 25 | Startup exemption from s.5 notice | s.17(3) | ⚪ Only for notified, incorporated startups. Jenil is an individual | Do not rely on it |

Penalty scale, for context (Act Schedule): security failure up to ₹250 crore (item 1). Breach notice up to ₹200 crore (2). Children up to ₹200 crore (3). Any other breach, which includes the notice rules, up to ₹50 crore (7).

---

## 4. The main legal unknown in one paragraph

The Act applies to "processing" of digital personal data (s.3(a)). It defines a Data Fiduciary as whoever "determines the purpose and means of processing" (s.2(i)). NANDI's design means the publisher never receives the user's tasks, moods or workouts. The user's phone does all of the processing, and s.3(c)(i) excludes "personal data processed by an individual for any personal or domestic purpose". One reading: the user is processing their own data for a personal purpose, so the Act does not reach the on-device data at all. NANDI would then be a Data Fiduciary only for what it actually receives (update-check IPs, the web host's request data, and any emails people send). The other reading: by writing the code, NANDI "determines the purpose and means", so it is the Data Fiduciary even though it never holds the data. The draft notice is written to satisfy the stricter reading, because that costs little.

---

## 5. Draft notice for `public/privacy.html`

**For lawyer review, not final.** Paste-ready `<main>` body that keeps the page's current CSS. Placeholders are in `[square brackets]`. Indian English, short lines. Menu paths match ship-27 copy: "You > Settings > App pause" (`NightPauseService.java:117`) and "You > Settings > Backup". Check them against the app before publishing.

```html
<main>
  <h1>Privacy notice</h1>
  <p class="draft">Draft for lawyer review, not final. Last updated [date].</p>
  <p class="draft">Read this in: English · [हिन्दी]</p>

  <h2>The short version</h2>
  <ul>
    <li>What you put into NANDI stays on your phone.</li>
    <li>There is no NANDI account. We never see your tasks, workouts, answers or how your day went.</li>
    <li>No ads. No trackers. No analytics. We do not sell or share your data.</li>
    <li>Data leaves the app only when you save or share a backup or a card, or when the app checks for an update. Details below.</li>
  </ul>

  <h2>Who runs NANDI</h2>
  <p>NANDI is made by [Jenil Shah], an individual in [city], India.</p>
  <p>Questions about your data: [privacy contact email]. We reply within [15] days, and never later than 90 days.</p>

  <h2>What NANDI keeps on your phone, and why</h2>
  <p>All of this stays in the app's storage on this phone. It is there so the app can work for you, and for no other reason.</p>
  <ul>
    <li><b>Plans and tasks.</b> Titles, notes, places, times, when you moved a task and the reason you gave. Used to plan your day and remind you.</li>
    <li><b>Focus sessions.</b> Start, end and pauses. Used for timers and your weekly review.</li>
    <li><b>Reminders.</b> Times and the text shown. Your task title appears in the notification, so it can show on your lock screen.</li>
    <li><b>Workouts.</b> Exercises, sets, reps, weights, effort, how ready you felt, and any "pain or discomfort" taps. Used to pick your next workout and keep it safe.</li>
    <li><b>Learning and puzzles.</b> Your answers, scores, times and hints. Used to choose what to review and to show your progress.</li>
    <li><b>Night and check-ins.</b> Your bedtime, the time you put the phone down, the reels-time range you pick, your weekly 1 to 5 score, tired or low days, and any short note you write. Used for the bedtime plan and gentle days.</li>
    <li><b>Rewards.</b> XP, Shards and items, and a record of what you did to earn them.</li>
    <li><b>Settings.</b> Your goals, bedtime, the time you confirmed you are 18 or older, a random code for this install, how many times you opened the app each day, and recent error messages. Used to run the app and fix problems on this phone.</li>
    <li><b>App pause (Android, only if you turn it on).</b> The apps you choose, and how often a pause appeared. To work, NANDI reads on your phone which app is open and for how long today. That reading never leaves your phone and is not saved as a history.</li>
  </ul>
  <p>NANDI does not ask for your name, email, phone number, contacts, location, camera or microphone.</p>

  <h2>When something leaves the app</h2>
  <ul>
    <li><b>Backup you save or share.</b> One file with everything listed above. It is plain text and not locked with a password. It goes wherever you send it (for example Drive or a chat), and that service's own rules then apply. A copy also stays in your phone's Documents folder.</li>
    <li><b>Automatic backup (Android).</b> On by default. Once a day NANDI saves a full copy to Documents/NANDI/auto on this phone and keeps the last 7. It is plain text. File-manager apps and a computer you plug in can read it. Turn it off in You &gt; Settings &gt; Backup.</li>
    <li><b>Cards and files you share.</b> A puzzle result, a picture of your week, a kind-word card, a challenge link or a weekly summary file. Only what is on that card or in that file is shared. The weekly summary file is detailed, so check it before you send it.</li>
    <li><b>Update check (Android app).</b> When open, the app asks our update server (run on Cloudflare) if a new version exists. It sends none of your data. Like any internet request, the server sees your IP address and basic connection details. [Retention: to be confirmed.]</li>
    <li><b>Web version.</b> The site is served by Cloudflare. Loading it shares your IP address, as with any website. Your data stays in your browser on that device.</li>
  </ul>
  <p>Cloudflare may handle these requests on servers outside India.</p>

  <h2>Phone permissions</h2>
  <ul>
    <li>Notifications and alarms: to remind you at the time you set.</li>
    <li>Usage access and "display over other apps" (optional): only for App pause. You can turn them off in Android settings at any time.</li>
    <li>Internet and install apps: only for the update check and installing an update you accept.</li>
  </ul>

  <h2>Your choices and rights</h2>
  <ul>
    <li><b>See your data.</b> It is all in the app. To see every field, save a backup and open the file.</li>
    <li><b>Correct it.</b> Edit or delete any task, plan or setting in the app.</li>
    <li><b>Stop a use.</b> Turn off a reminder, automatic backup or App pause in the app, or remove a permission in Android settings. This works as easily as turning it on.</li>
    <li><b>Erase everything.</b> In Android Settings &gt; Apps &gt; NANDI, tap Clear storage, or uninstall. Then delete the Documents/NANDI folder and any backup files you saved or sent. On the web, clear this site's data in your browser.</li>
    <li><b>Name someone.</b> You can name a person to act on your data if you die or cannot act yourself. Tell us at [privacy contact email]. Because your data is on your phone, they will also need the phone or a backup.</li>
    <li>We have no account or copy of your data, so we cannot open, change or delete it for you. Write to us anyway and we will help. No ID is needed.</li>
  </ul>

  <h2>Complaints</h2>
  <p>Write to [privacy contact email] first. We will reply within [15] days, and never later than 90 days.</p>
  <p>If you are not happy with our reply, you can complain to the Data Protection Board of India: [official complaint link].</p>

  <h2>Age</h2>
  <p>NANDI is for people aged 18 or older. If you are under 18, please do not use it.</p>

  <h2>Keeping it safe</h2>
  <p>Your data is only as safe as your phone. Use a screen lock. Keep backup files somewhere private.</p>
  <p>If we learn of a problem that affects your data, we will tell you in the app and on this page, along with what you can do.</p>

  <h2>Changes</h2>
  <p>If this notice changes, the app will show you what changed before it applies.</p>

  <p><a href="./">Back to NANDI</a></p>
</main>
```

Notes on the draft:
- It is long for a phone. Rule 3(a) needs a notice that works on its own, so the Welcome screen should show the 4 "short version" bullets and the 18+ tick, with "Read the full notice" linking to this page.
- `<b>` keeps the current page's styling simple. If the banned-words or copy checks complain, swap it for `<strong>`.
- The page must also exist in Hindi (s.5(3)). Translate it after the lawyer signs off the English.

---

## 6. Questions a lawyer must answer

1. **Is NANDI (Jenil) a Data Fiduciary for data that never leaves the phone?** Does s.3(c)(i) (personal or domestic purpose) cover the user processing their own data in an app, or does writing the app "determine the purpose and means" (s.2(i))?
2. If NANDI is a fiduciary only for update-check IPs and web-host request data: is the IP address alone personal data here (s.2(t), "identifiable")? Which ground applies, consent (s.6) or legitimate use (s.7(a))?
3. **Consent vs legitimate use.** Can NANDI rely on s.7(a) ("voluntarily provided … for the specified purpose") for on-device features? Or does it need one consent tap on Welcome, and a separate one for App pause, which reads which app is in front?
4. **Wellbeing and health-adjacent fields** (pain taps, tired/low days, sleep times, reels time, agency score). The DPDP Act has no "sensitive" category. Does any other law (IT Act s.43A and the 2011 SPDI Rules, if still in force for this) add duties?
5. **Children.** Is an unverified "I'm 18 or older" tick enough as "appropriate technical and organisational measures" under s.9 and r.10? If a minor gets past it, is App pause "behavioural monitoring" of a child under s.9(3)? Should App pause ask for the age again?
6. **Grievance officer / contact.** Who is the "person able to answer" under s.8(9) and r.9? Must it be a named individual with a postal address, or is an email enough for a one-person maker? Is a DPO needed (only if notified as Significant, s.10)?
7. **Response time.** What period should we publish under r.14(3) (the gazette text there is garbled; it reads "within a reasonable period not exceeding ninety days")? Is 15 days a sensible promise?
8. **Consent Manager.** Must NANDI support Consent Managers (s.6(7)-(9), r.4, in force 13 Nov 2026)? Our view: no, because using one is the Data Principal's option and there is no consent stored server-side. Please confirm.
9. **Rule 8(3) log retention.** If NANDI is a fiduciary for update checks, must it keep "traffic data and other logs" for at least one year? Today no logs are kept on purpose. Does turning on Cloudflare logs create more risk than it removes?
10. **Processors.** Are Cloudflare's standard terms and DPA a "valid contract" under s.8(2)? Same question for Google Play if the app is listed there (job 4).
11. **Breach (s.8(6), r.7).** With no accounts, is an in-app banner (pushed through the update manifest) plus a notice on the website an acceptable "mode of communication"? Does a breach of the update server, which holds no user data, need to be reported?
12. **Automatic backup to shared Documents**, on by default. Is that consistent with "reasonable security safeguards" (s.8(5), r.6(1)(a)), given it is plain text that other apps with file access can read? Should it be off by default, encrypted, or moved to app-private storage?
13. **Pre-existing users (s.5(2)).** Is a one-time in-app notice on the first open after the May 2027 build "as soon as reasonably practicable"?
14. **Dates.** Is "publication" 13 Nov 2025 (gazette date) or 14 Nov 2025 (signature date)? Has anything changed the Rules since? I found no 2026 amendment in two searches. egazette.gov.in could not be opened from here.
15. **Language.** Does s.5(3) require an Eighth Schedule translation to exist at launch, or only the "option"? Is Hindi alone enough?
16. **Third parties' data in free text.** Tasks and notes can name other people ("call Riya about her surgery"). Does that make the user, or NANDI, a fiduciary for those people? Our view: personal/domestic use by the user. Please confirm.
17. **Web build.** Is the browser version at nandi.nandi11.workers.dev treated the same as the app? It has no update check, but Cloudflare serves it.

---

## 7. Suggested follow-ups (not done here, app code unchanged)

| Priority | Change | Where |
|---|---|---|
| High | Remove the false "erases it from this phone" line now, even before the full notice. | `public/privacy.html:26` |
| High | Fix "leaves the phone only when you choose" so it mentions automatic backup. | `public/privacy.html:24` |
| High | Product decision for Jenil: should automatic backup stay on by default, in shared Documents, unencrypted? (data-loss vs privacy trade-off) | `src/data/autoBackup.ts:35`, `src/platform/files.ts:65-75` |
| Medium | Show the 4-bullet short notice on Welcome above the 18+ tick. | `src/ui/welcome/Welcome.tsx:96-97` |
| Medium | Option to hide task titles in lock-screen notifications (generic body "A task block starts"). | `src/platform/reminderSync.ts:16` |
| Medium | Hindi version of the notice. | `public/privacy.hi.html` (new) |
| Low | One-time "privacy notice updated" card on the first open after the May 2027 build (s.5(2)). | shell |
| Low | In-app "Erase everything on this phone" (with a backup prompt first). Needs its own backup round-trip test. | You › Settings › Backup |

---

## 8. Re-running this check

```bash
# sources
curl -sSLo act.pdf   https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf
curl -sSLo rules.pdf https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf
pdftotext -layout act.pdf act.txt; pdftotext -layout rules.pdf rules.txt   # Rules English text from line ~1000

# what leaves the app (run in the repo)
grep -rnE "fetch\(|XMLHttpRequest|sendBeacon|WebSocket|navigator\.share|Share\.share|Filesystem\." src --include=*.ts --include=*.tsx | grep -v '\.test\.'
grep -n "uses-permission\|allowBackup" android/app/src/main/AndroidManifest.xml
grep -rn "HttpURLConnection\|URL(" android/app/src/main/java
```
