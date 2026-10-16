# NANDI Android APK

## Get and install the APK

1. Open this repository on GitHub, choose **Actions**, then **Android APK**. Open the latest successful run on `main` (or a run started with **Run workflow**).
2. Under **Artifacts**, download **nandi-apk** and unzip it. The file inside is `app-release.apk` when the signing secrets are configured, otherwise `app-debug.apk`.
3. Copy the signed release APK to your Android phone and open it. Allow installs from the app you used to open the file when Android asks, then install NANDI. This hand install is needed once.
4. In Android Settings > Apps > NANDI > Notifications, allow notifications. NANDI asks for notification permission when it sets up your first task or rest reminder. Check that **Task blocks**, **Rest timer**, and **Planning** channels are present.
5. For exact task and rest alarms, check Android Settings > Apps > Special app access > Alarms & reminders and allow NANDI if Android offers the switch. Set NANDI's battery use to **Unrestricted** for the device test.

After that first signed install, NANDI quietly checks for a newer signed APK when it opens and when you return to it, at most once every 30 minutes. A small **New version ready** strip appears at the top. Tap **Update**. NANDI writes a backup JSON file to the device's Documents folder, checks the APK's SHA-256 checksum, then opens Android's own install confirmation. The strip shows the backup file name and download progress. You can choose **Later** for 24 hours or check manually in **You > Settings > App updates**.

The first in-app update may open Android's **Allow from this source** screen. NANDI explains this before opening the setting. Allow NANDI to install its own updates, then return to NANDI; it will continue to Android's install confirmation. This permission does not skip Android's confirmation. Do not uninstall the old APK: uninstalling removes its local data.

A debug APK from one Actions run may use a different debug key from the next run, so it may refuse to update the old APK. The workflow warns when it makes a debug build. Keep the signed release keystore safe in your password manager and configure all four GitHub secrets (`ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) before relying on APK updates. The keystore itself must never be committed. A signed release APK can update only an APK signed with that same key and app ID.

## Move PWA data to the APK

After the baseline week ends around **26 October 2026**, open the PWA in Chrome and use You > Backup > Export backup. Save the JSON file. Open the APK and use You > Backup > Choose restore file, select the PWA file, review the table counts, and confirm restore. Check the same counts on the APK before using it as your daily app. The PWA will become a read-only **retired** copy after this migration; do not keep entering new data in both places. Until that date, keep using the PWA normally for the baseline.

The APK has its own local IndexedDB. Its app ID (`app.nandi.personal`) and web origin (`https://nandi.local`) are pinned so future APKs use the same local storage. NANDI saves a backup before each in-app update; keep a separate copy of important backups too.

## Optional Night pause

Open **You > Night pause**. This feature is off by default. Android **Usage access** lets NANDI see which app is currently in front, so it can offer your own night plan when you open one of your selected apps after bedtime minus 30 minutes. NANDI uses this information only on your phone; it does not send it anywhere. It does not use an Accessibility Service.

1. Read the explanation on the Night pause card, then tap **Open Usage access settings**.
2. In Android's Usage access list, choose NANDI and turn on **Permit usage access**. Return to NANDI.
3. Turn on **Night pause**. Instagram, YouTube, and Snapchat are selected by default. Uncheck any of them or add another app's Android package name. You can turn Night pause off on the same screen at any time.

While the phone screen is on during the bedtime window, NANDI checks the current app at most every two seconds. It shows a small ongoing notification while the optional watcher is enabled. On a selected app entry, Android may open the five-second breath card directly; if Android restricts full-screen intents, tap the heads-up notification to open it. Both **Open my night deck** and **Go to Instagram anyway** remain available. There is no lockout. The counts of deck openings and “went anyway” choices are stored only in NANDI's local settings and are included in your backup.

The first APK has not been device-tested on the Nothing phone yet. Use [the device checklist](device-test-checklist.md) to check exact alarms, reboot, Night pause behavior, haptics, wake lock, and backup migration.
