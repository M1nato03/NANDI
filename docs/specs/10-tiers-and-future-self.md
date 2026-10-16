# 10 · Tiers, future-self forecast and screen-time guard

**Status:** proposal from Jenil, 16 Oct 2026, organised by Claude from his handwritten master plan. The full plan, with its reasoning and sources, is in his Claude doc "NANDI master plan".

**Build order:** after the core app (Phases 0–1 and the baseline week) is stable.

- **Phase "Groundwork"** (buildable now, fully offline):
  - §2 entitlements switch, with every user on `free` or a dev override;
  - §3 configurable home;
  - §4 future-self forecast.
- **Public beta** (needs a server):
  - real purchases;
  - the 14-day trial;
  - accounts and sync;
  - §5 screen-time guard on the APK.
- **Premium+ pilot:** §7.

**Decision change to log in `DECISIONS.md` before building §7:** HANDOVER non-negotiable 1 says the app never calls an AI API.

- Free and Premium keep that rule.
- Premium+ may call an AI API **only with the user's own key**, as an optional add-on. Nothing outside Premium+ may depend on it.
- Jenil requested this; confirm with him in the phase summary.

## 1. Tiers

| Part | Free | Premium | Premium+ |
|---|---|---|---|
| Learn | Lesson packs (Gita, Charaka, Greene, drone track) | + video courses, creator-partner courses | + AI tutor (own key) |
| Train | Default programs | + schedule-fitted plan, form videos, common mistakes | = Premium |
| Puzzles | All current types, mysteries | + harder packs, real-life scenario packs (first aid, plant care, safety and de-escalation) | = Premium |
| Plan | Tasks, postpone ladder, rituals | + weekly insights | + AI control panel (§7) |
| Forecast | One overall forecast | + one per goal | = Premium |
| Home | Fixed 4-part wheel | Rename and reorder the parts | Control panel in the centre |
| Screen-time guard | On | On | On |

**Prices (proposed, untested):**

- Premium: ₹99–199 a month or ₹799–1,499 a year.
- Premium+: ₹349–499 a month, plus AI usage billed to the user's own key.
- All prices live in `rules.config.ts` and come from remote config later.

**Dropped from the raw plan, and why:**

- **Firearm instructions:** Google Play's Dangerous Products policy bans them.
- **Downloading or re-hosting Instagram reels:** this needs a licence. Use official embeds or creator partnerships.
- **"Device control":** use the OS permissions in §5 instead.
- **Collecting users' Claude or ChatGPT logins:** prohibited by both companies. See §7.

## 2. Entitlements (`src/core/entitlements`, pure TS)

- `type Tier = 'free' | 'premium' | 'plus'`
- `type Feature = 'learn.video' | 'learn.partner' | 'train.fitted' | 'puzzles.advanced' | 'puzzles.scenarios' | 'plan.insights' | 'forecast.perGoal' | 'home.rename' | 'home.panel' | 'ai.tutor' | 'ai.panel'`
- `FEATURE_TIER: Record<Feature, Tier>`. This is the only table that maps features to tiers. UI code never checks a tier directly.
- `can(feature, state): boolean`. `state = { tier, trialEndsAt?, now }`. During an active trial, `tier` counts as `premium`.

**Where the tier comes from:**

- **Now:** `settings.tier` (default `'free'`) plus a dev override in the debug screen.
- **Public beta:** a server-verified Play purchase token. The trial is granted server-side (§6).

**Downgrade never deletes or hides the user's data.** Locked features show their content read-only with a quiet "Premium" badge. Anything the user created stays viewable and exportable, and backups include everything.

**Locked-feature copy:** one line plus a link to the plan page. No pop-ups on launch, no repeated prompts. The CCPA dark-pattern guidelines list nagging and confirm shaming.

## 3. Configurable home

- A home wheel with 4 slots. On Free the default slots are Mind, Learn, Train and Plan.
- `settings.home = { slots: [moduleId × 4], labels?: Record<moduleId, string> }`.
  - Labels need `home.rename`. Labels can be at most 16 characters and are validated with Valibot.
  - `home.panel` adds a centre control panel (§7).
- Onboarding: "Pick up to 4 things you want from NANDI" (multi-select from the modules). Unpicked modules stay reachable from a "More" sheet.

## 4. Future-self forecast (`src/core/forecast`, pure TS, unit-tested)

**What it is:** a projection of the user's own activity at their current pace. **It never invents outcomes**, so no salary, no body changes, and no comparisons with other users.

**Inputs:** ledger facts (and nothing else) from the last `RULES.forecast.windowDays` (28) dayKeys. Five metrics:

- lessons completed;
- workouts (sessions with status `completed`, `minimum` or `partial`);
- focus minutes;
- puzzles solved;
- cards reviewed.

**Gate:** fewer than `RULES.forecast.minDays` (7) days of activity → no numbers. Show instead: "Keep going. Your forecast unlocks on day 7."

**Maths, per metric:**

1. Weekly totals `w[0..3]` over the window. With less than 4 weeks of data, use the weeks that exist (minimum 1, scaled from the active days).
2. `mid = median(w)`, `lo = min(w)`, `hi = max(w)`.
3. With `weeks = RULES.forecast.horizonDays / 7` (90/7):
   - projection = `current + mid × weeks`;
   - range = `current + lo × weeks` to `current + hi × weeks`.
4. Round the range to the nearest 5 (focus: nearest 5 hours). Always show it as a range, for example "40–55 lessons".
5. **"What moves it":** the metric with the lowest `mid` relative to its target gets the line "+1 a week puts you at N".

**Plan step (mental contrasting with if-then plans), shown under the card every time:**

1. "What's the one goal this is for?" (text, ≤ 80 characters).
2. "What's most likely to get in the way?" (text).
3. "When that happens, I'll …". Save it as an if-then plan in the existing `plans` table with `source: 'forecast'`.

Skipping is allowed. Never block the card behind the questions.

**Evidence (for the record):**

- A positive future image alone can reduce effort (Oettingen).
- Pairing it with an obstacle and an if-then plan has a small-to-moderate positive effect: g ≈ 0.24–0.34 across 24 studies (Wang et al. 2021).
- Seeing a future self raised savings in the lab (Hershfield et al. 2011: $172 vs $80 of $1,000) but only slightly in the field (1.5% → 1.7% in a 50,000-person test). Treat it as a nudge.

**Where it appears:**

- At onboarding: an empty-state demo plus the plan step.
- In the weekly review: the updated card.
- On Ground: a "Future you" tile.
- Free gets one overall card; Premium (`forecast.perGoal`) gets one card per goal.

**Copy rules:**

- Neutral "at this pace".
- A slow week: "That's data, not a verdict."
- No countdowns, no "you're falling behind", no red numbers.

## 5. Screen-time guard and side quests (APK only)

**Measure:** Usage access (`PACKAGE_USAGE_STATS`, granted by the user in Settings and read-only).

- Before the request, show a one-screen in-app disclosure: "NANDI reads how long you spend in the apps you choose, to offer a break. This stays on your phone."
- Store only daily totals per chosen app, on the device. Never upload them.
- Use the `<queries>` element. Don't request `QUERY_ALL_PACKAGES`.

**Trigger:** the user's chosen apps pass the user's own daily limit (default: off; suggested 4 h, from Jenil's notes). Offer one side quest:

- offline, 10–30 minutes, from a `sidequests` content pack (walk, call family, cook, water plants, 20 push-ups, read 10 pages);
- completing it is a self-reported check-in that counts as a Body or Mind action under the existing caps.

**Pause before opening (optional, later):** an AccessibilityService that only reads the foreground package name. It never reads screen content. It shows NANDI's own pause screen with "Open anyway" and "Not now".

- **Play requirements:** do **not** set `isAccessibilityTool`, show a separate prominent disclosure, get consent, and complete the Play Console Accessibility declaration with a video.
- **Fallback:** Usage-access polling plus an overlay, for users who refuse Accessibility or run Android 17 Advanced Protection Mode.

**Never:** device admin, device owner, VPN blocking, or anything that hides how to switch the guard off. Switching it off is one tap in Settings.

**iOS (if ever):** the Screen Time API (FamilyControls, individual authorization, ManagedSettings shields, DeviceActivity thresholds). Apple's Family Controls distribution entitlement is required.

## 6. Trial, pricing and purchase rules (public beta)

- **Reverse trial:** a new account gets `premium` for `RULES.trial.days` (14) days with no payment method, granted server-side. At the end it drops to `free` automatically. **Nothing is charged unless the user buys.**
- **Reminder:** an in-app message on day 11 ("Premium ends in 3 days; you keep everything either way"). No push storms.
- **Purchase:** Google Play Billing subscriptions (a 15% fee in India in 2026). The price is shown tax-inclusive before purchase, with renewal date and cancel path stated. Account settings has a one-tap cancel / manage-subscription link to Play's Subscription Center.
- **Never:**
  - "₹1 trials" that auto-debit;
  - pre-ticked add-ons;
  - fake countdowns;
  - confirm-shaming decline buttons ("No, I don't want to improve");
  - a less prominent dismiss button.
  These are listed in the CCPA Dark Patterns Guidelines 2023. McAfee and PhysicsWallah were fined in 2026.
- **Age:** 18+ at launch, with an age gate at sign-up. Under India's DPDP Act, under-18 users need verifiable parental consent and can't get behaviour-based personalisation.
- **Privacy:** before 13 May 2027 (when the DPDP Rules' main duties apply), add:
  - a standalone plain-language notice;
  - unbundled consent per purpose;
  - withdrawal as easy as consent;
  - a breach plan (Board report within 72 h);
  - grievance handling within 90 days.

## 7. Premium+ AI (optional; the user's own key only)

**Never** ask for, store or proxy Claude.ai or ChatGPT logins, cookies or session tokens.

- Anthropic forbids third-party apps from collecting Claude.ai credentials and has enforced this since Jan 2026.
- OpenAI's terms ban credential sharing.

**Allowed routes:**

1. **Bring your own API key** (Anthropic Console, OpenAI Platform, Gemini, DeepSeek).
   - Store it encrypted: Tink AEAD with the keyset wrapped by Android Keystore, kept in DataStore and excluded from backups.
   - Never put it in a `VITE_*` variable or a backup file.
   - Calls go from the device directly to the provider.
2. **NANDI as a remote MCP connector** for Claude and ChatGPT. One server serves both, and users bring their own chat subscription. Neither store allows selling the subscription inside the chat, so purchases stay in the app.
3. **OpenAI "Sign in with ChatGPT" plan usage:** apply through OpenAI's interest form for commercial apps. Not available by default.

**Features, in order:**

1. **AI tutor** in lessons (`ai.tutor`).
2. **Control panel** (`ai.panel`): start and watch jobs on the user's own agents. The routes are the Claude Agent SDK, the Codex SDK, the Jules API (early v1alpha) and DeepSeek's Anthropic-compatible endpoint. NANDI only triggers jobs and shows status. The agents run on the user's machine or cloud.
3. **Creator automation:** sold first as a done-for-you service, not in-app. If built in, video goes through Veo via the Gemini API on a server, at roughly $0.05–0.40 per second of video, and is charged per video. Google Flow itself has no API.

**Feedback copy** for any AI that reviews the user's work: one fix at a time, start with what worked, phrase the fix as a next step. Offer an optional "strict coach" setting.

## 8. Acceptance tests

1. `can()`:
   - every feature in `FEATURE_TIER` returns false on `free`;
   - all `premium` features are true during an active trial;
   - after `trialEndsAt` they're false again;
   - no UI file references a tier string directly (a lint rule).
2. A downgrade from Premium to Free deletes no rows. Premium-only content is still readable, and backup → restore round-trips it.
3. Forecast with 6 days of data → no numbers and the unlock message. With 7+ days → a range where `lo ≤ mid ≤ hi`, rounded to 5.
4. Forecast inputs come only from ledger facts: a test fixture with known facts gives exact expected ranges.
5. The plan step saves an if-then plan with `source: 'forecast'`. Skipping still shows the card.
6. Guard:
   - no Usage-access request happens before the disclosure screen is confirmed;
   - with the guard off, nothing is read;
   - totals never leave the device (no network call contains them).
7. Side quest completion counts once per dayKey and respects existing caps.
8. Trial (server):
   - the 14-day grant needs no payment method;
   - day 11 shows one reminder;
   - day 15 is `free` with no charge.
9. No copy in the app matches the banned-pattern list (a lint list of confirm-shaming phrases, "only today", fake timers).
10. Premium+:
    - the API key is stored encrypted and never appears in exports or logs;
    - removing the key disables `ai.*` features, and nothing else breaks.
