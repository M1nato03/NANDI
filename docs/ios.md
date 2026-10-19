# NANDI on iPhone (iOS)

Owner question, 19 Oct 2026: "Is it compatible with iOS?" This note records the answer so it is not lost.

## Short answer

Yes, the app itself is iPhone-ready; only the Android-specific extras need iOS versions.

- NANDI is a **React web app wrapped by Capacitor**. Capacitor builds both an Android app and an **iOS app** from the same code (like React Native or Flutter, but using the web code we already have).
- **Today, on any iPhone:** open https://nandi.nandi11.workers.dev in Safari → Share → **Add to Home Screen**. It runs full screen and offline, with all five tabs, data on the phone, and backups.

## What a real iOS app (App Store / TestFlight) needs

| Need | Why | Cost / effort |
|---|---|---|
| A Mac with Xcode, or a cloud Mac (e.g. GitHub's macOS runners) | iOS apps can only be built and signed on macOS | Cloud runner: free minutes then paid |
| Apple Developer Program | Required for TestFlight and the App Store; iPhones cannot install an APK-style file | USD 99 per year |
| `npx cap add ios` + an iOS signing setup in CI | Adds the `ios/` project next to `android/` | Small, one-time |

## Android-only pieces that need an iOS version

| Feature | Android today | iOS plan |
|---|---|---|
| Home-screen widget | `NandiWidgetProvider` (RemoteViews) | Rewrite as a WidgetKit widget in Swift |
| Night pause after bedtime | Usage access + foreground service | Apple's Screen Time API (FamilyControls), which needs a special entitlement Apple must approve; otherwise reminder notifications only |
| In-app updater (downloads a new APK) | `UpdaterPlugin` | Not allowed on iOS; updates come from the App Store or TestFlight (web code can still refresh itself) |
| Local notifications (shutdown, morning) | Capacitor Local Notifications | The same plugin works on iOS; needs the permission prompt |
| Automatic backups to Documents/NANDI | Capacitor Filesystem | Works, but saves into the app's Files folder; check the Share sheet export |

## When

The master plan puts public apps in Phase 4 (Play Store first). An iOS build fits there, or earlier for a TestFlight beta in Phase 3 if friends with iPhones join. Until then, iPhone users use the Add to Home Screen web app.
