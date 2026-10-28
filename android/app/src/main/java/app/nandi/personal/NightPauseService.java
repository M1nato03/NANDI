package app.nandi.personal;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.BroadcastReceiver;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.Build;
import android.provider.Settings;
import java.util.Arrays;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Set;

/** Local foreground watcher. Usage events and pause counts never leave the device. */
public class NightPauseService extends Service {
    static final int NOTICE_ID = 43002;
    /** Spec 36 focus guard: "Your focus is running" (come back), "Focus paused" and "Still working?". */
    static final int FOCUS_BACK_ID = 43003;
    static final int FOCUS_PAUSED_ID = 43004;
    static final int FOCUS_STILL_ID = 43005;
    private final Handler handler = new Handler(Looper.getMainLooper());
    /** The app last seen in front, kept between checks (a check with no new event keeps it). */
    private String current = "";
    /** The selected app already paused once since it came to the front. */
    private String prompted = "";
    /** When the last screen-on check ran, so the next one reads every event since then. */
    private long lastCheck = 0;
    /** Today's time in the chosen apps, read from usage events at most once a minute. */
    private final UsedTodayCache used = new UsedTodayCache();
    private final Runnable check = new Runnable() {
        @Override public void run() {
            SharedPreferences prefs = getSharedPreferences(NightPausePlugin.PREFS, MODE_PRIVATE);
            boolean nightOn = prefs.getBoolean("enabled", false);
            boolean focusOn = prefs.getBoolean("focusActive", false);
            if (!shouldRun(nightOn, focusOn, NightPausePlugin.usageAllowed(NightPauseService.this))) {
                stopSelf(); return;
            }
            long now = System.currentTimeMillis();
            boolean night = nightOn && (now < prefs.getLong("testUntil", 0)
                || inPauseWindow(prefs.getString("bedtime", "01:30"), prefs.getInt("leadMinutes", 30)));
            String dayMode = nightOn ? prefs.getString("dayMode", "off") : "off";
            boolean watching = night || !"off".equals(dayMode) || focusOn;
            PowerManager power = (PowerManager) getSystemService(POWER_SERVICE);
            boolean screenOn = power != null && power.isInteractive();
            if (screenOn) {
                long lookback = current.isEmpty() || lastCheck == 0 ? 600000 : Math.min(600000, now - lastCheck + 2000);
                lastCheck = now;
                String seen = currentForeground(lookback);
                if (!seen.isEmpty()) current = seen;
                Set<String> selected = new HashSet<>(Arrays.asList(prefs.getString("packages", "").split(",")));
                if (!selected.contains(current)) prompted = "";
                String snoozedPackage = prefs.getString("suppressedPackage", "");
                long snoozeUntil = prefs.getLong("suppressUntil", 0);
                if (current.equals(snoozedPackage) && snoozeUntil > 0 && now >= snoozeUntil) {
                    // "Go anyway" bought a few minutes; still in the app when they end, so ask again.
                    prompted = "";
                    prefs.edit().remove("suppressedPackage").remove("suppressUntil").apply();
                }
                boolean snoozed = current.equals(snoozedPackage) && now < snoozeUntil;
                if (focusOn) watchFocus(prefs, now);
                if (nightOn && (night || !"off".equals(dayMode)) && selected.contains(current) && !current.equals(prompted) && !snoozed) {
                    String reason = null;
                    long minutes = 0;
                    if (night) reason = "night";
                    else if ("open".equals(dayMode)) reason = "open";
                    else if ("limit".equals(dayMode)) {
                        long used = usedToday(selected, now);
                        if (used >= prefs.getInt("dayLimitMinutes", 30) * 60000L) { reason = "limit"; minutes = used / 60000; }
                    }
                    if (reason != null) {
                        prompted = current;
                        prefs.edit().putString("pending", current).putString("pendingReason", reason)
                            .putLong("pendingMinutes", minutes).apply();
                        showPause(current);
                    }
                }
            } else {
                // The screen went off: a guarded app is no longer in front.
                if (focusOn) leaveGuarded(prefs, now);
                current = "";
                prompted = "";
                lastCheck = 0;
            }
            handler.postDelayed(this, watching && screenOn ? 1500 : screenOn ? 30000 : 300000);
        }
    };
    private final BroadcastReceiver screenReceiver = new BroadcastReceiver() {
        @Override public void onReceive(Context context, Intent intent) {
            handler.removeCallbacks(check);
            handler.post(check);
        }
    };

    @Override public void onCreate() {
        super.onCreate();
        NotificationManager notifications = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26) {
            // The always-on notice is silent and sits at the bottom of the shade (audit 10-21). A channel's
            // importance cannot change once made, so the old low-importance channel is replaced.
            notifications.deleteNotificationChannel("night_watch");
            NotificationChannel quiet = new NotificationChannel("night_watch_quiet", "App pause is on", NotificationManager.IMPORTANCE_MIN);
            quiet.setShowBadge(false);
            quiet.setSound(null, null);
            notifications.createNotificationChannel(quiet);
            // The pause shows as a heads-up without a sound (Android notifications audit, F11). Sound cannot be
            // removed from an existing channel, so the old one is replaced.
            notifications.deleteNotificationChannel("night_pause");
            NotificationChannel pause = new NotificationChannel("night_pause_quiet", "App pause", NotificationManager.IMPORTANCE_HIGH);
            pause.setSound(null, null);
            notifications.createNotificationChannel(pause);
        }
        if (Build.VERSION.SDK_INT >= 26) {
            // Spec 36: the focus guard's notices come as a quiet heads-up, on their own channel.
            NotificationChannel focus = new NotificationChannel("focus_guard", "Focus check", NotificationManager.IMPORTANCE_HIGH);
            focus.setSound(null, null);
            notifications.createNotificationChannel(focus);
        }
        showOngoing();
        IntentFilter screenEvents = new IntentFilter();
        screenEvents.addAction(Intent.ACTION_SCREEN_ON);
        screenEvents.addAction(Intent.ACTION_SCREEN_OFF);
        registerReceiver(screenReceiver, screenEvents);
        handler.post(check);
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        showOngoing();
        handler.removeCallbacks(check);
        used.invalidate();
        handler.post(check);
        return START_STICKY;
    }
    @Override public void onDestroy() { handler.removeCallbacks(check); unregisterReceiver(screenReceiver); super.onDestroy(); }
    @Override public IBinder onBind(Intent intent) { return null; }

    /**
     * The watcher runs while App pause is on OR a focus runs (spec 36: the focus guard does not need App pause), and
     * only with Usage access.
     */
    static boolean shouldRun(boolean nightOn, boolean focusOn, boolean usageAllowed) {
        return (nightOn || focusOn) && usageAllowed;
    }

    /** The always-on notice: the running focus while one runs (with its clock), else App pause. */
    private void showOngoing() {
        SharedPreferences prefs = getSharedPreferences(NightPausePlugin.PREFS, MODE_PRIVATE);
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26
            ? new Notification.Builder(this, "night_watch_quiet") : new Notification.Builder(this).setPriority(Notification.PRIORITY_MIN);
        builder.setSmallIcon(R.mipmap.ic_launcher).setOngoing(true);
        if (prefs.getBoolean("focusActive", false)) {
            builder.setContentTitle("Focus: " + prefs.getString("focusTask", ""))
                .setContentText("Instagram, YouTube and the like pause it. Other apps don't.")
                .setWhen(prefs.getLong("focusSince", System.currentTimeMillis()) - prefs.getLong("focusBeforeMs", 0)).setUsesChronometer(true).setShowWhen(true)
                .setContentIntent(openApp(FOCUS_BACK_ID));
        } else {
            builder.setContentTitle("NANDI app pause is on").setContentText("You can turn it off in You > Settings > App pause.");
        }
        startForeground(43001, builder.build());
    }

    /** A focus notice opens Plan, where the focus card is (spec 37: an open with no route lands on Yatra). */
    private PendingIntent openApp(int code) {
        Intent launch = new Intent(this, MainActivity.class);
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        launch.putExtra("nandiRoute", "#plan");
        return PendingIntent.getActivity(this, code, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private void focusNotice(int id, String title, String text) {
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, "focus_guard") : new Notification.Builder(this).setPriority(Notification.PRIORITY_HIGH);
        Notification notice = builder.setSmallIcon(R.mipmap.ic_launcher).setContentTitle(title).setContentText(text)
            .setStyle(new Notification.BigTextStyle().bigText(text))
            .setCategory(Notification.CATEGORY_REMINDER).setContentIntent(openApp(id)).setAutoCancel(true).build();
        ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(id, notice);
    }

    private String appName(String packageName) {
        try {
            android.content.pm.PackageManager manager = getPackageManager();
            return manager.getApplicationLabel(manager.getApplicationInfo(packageName, 0)).toString();
        } catch (android.content.pm.PackageManager.NameNotFoundException missing) { return packageName; }
    }

    /**
     * Spec 36 focus guard (Jenil's idea): a guarded app in front during a focus gets a notice at once; still in front
     * after the grace time, the focus pauses as of the moment it opened and a second notice says so. A shorter visit is
     * kept as a span that comes off the paid minutes. Nothing here leaves the phone.
     */
    private void watchFocus(SharedPreferences prefs, long now) {
        Set<String> guarded = new HashSet<>(Arrays.asList(prefs.getString("focusPackages", "").split(",")));
        String seen = prefs.getString("focusSeenPkg", "");
        SharedPreferences.Editor edit = prefs.edit();
        if (guarded.contains(current)) {
            if (!current.equals(seen)) {
                if (!seen.isEmpty()) closeSpan(prefs, edit, now);
                edit.putString("focusSeenPkg", current).putLong("focusSeenAt", now).apply();
                focusNotice(FOCUS_BACK_ID, "Your focus on " + prefs.getString("focusTask", "your task") + " is running",
                    "Come back to keep it going.");
                return;
            }
            long seenAt = prefs.getLong("focusSeenAt", now);
            if (prefs.getLong("focusPausedAt", 0) == 0 && now - seenAt >= prefs.getInt("focusGraceSec", 60) * 1000L) {
                long worked = Math.max(0, prefs.getLong("focusBeforeMs", 0) + seenAt - prefs.getLong("focusSince", seenAt) - prefs.getLong("focusDistractMs", 0));
                long minutes = worked / 60000;
                // Paused as of the moment the app opened; nothing more to watch until NANDI resumes the focus.
                edit.putLong("focusPausedAt", seenAt).putString("focusPausedApp", current).putString("focusSeenPkg", "")
                    .putBoolean("focusActive", false).apply();
                NotificationManager notifications = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
                notifications.cancel(FOCUS_BACK_ID);
                notifications.cancel(FOCUS_STILL_ID);
                focusNotice(FOCUS_PAUSED_ID, "Focus paused", "You opened " + appName(current) + ". Your " + minutes + (minutes == 1 ? " minute" : " minutes") + " before that are saved.");
                showOngoing();
                return;
            }
        } else if (!seen.isEmpty()) {
            closeSpan(prefs, edit, now);
            edit.putString("focusSeenPkg", "").apply();
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).cancel(FOCUS_BACK_ID);
        }
        long stillAt = prefs.getLong("focusStillAt", 0);
        if (stillAt > 0 && now >= stillAt && !prefs.getBoolean("focusStillShown", false)) {
            edit.putBoolean("focusStillShown", true).apply();
            focusNotice(FOCUS_STILL_ID, "Still working?", "Tap to keep the timer. With no tap in 5 minutes it pauses itself.");
        }
    }

    /** A short visit to a guarded app ended: its time comes off the paid minutes and breaks a clean block. */
    private void closeSpan(SharedPreferences prefs, SharedPreferences.Editor edit, long now) {
        long seenAt = prefs.getLong("focusSeenAt", now);
        if (prefs.getLong("focusPausedAt", 0) != 0 || now <= seenAt) return;
        String spans = prefs.getString("focusSpans", "");
        String[] kept = spans.isEmpty() ? new String[0] : spans.split(";");
        StringBuilder next = new StringBuilder();
        for (int i = Math.max(0, kept.length - 49); i < kept.length; i++) next.append(kept[i]).append(';');
        next.append(seenAt).append('-').append(now);
        edit.putLong("focusDistractMs", prefs.getLong("focusDistractMs", 0) + (now - seenAt)).putString("focusSpans", next.toString());
    }

    private void leaveGuarded(SharedPreferences prefs, long now) {
        if (prefs.getString("focusSeenPkg", "").isEmpty()) return;
        SharedPreferences.Editor edit = prefs.edit();
        closeSpan(prefs, edit, now);
        edit.putString("focusSeenPkg", "").apply();
    }

    private boolean inPauseWindow(String bedtime, int leadMinutes) {
        try {
            String[] parts = bedtime.split(":");
            int bed = Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
            if (bed < 720) bed += 1440;
            Calendar clock = Calendar.getInstance();
            int current = clock.get(Calendar.HOUR_OF_DAY) * 60 + clock.get(Calendar.MINUTE);
            if (current < 720) current += 1440;
            return current >= bed - leadMinutes && current < 1680;
        } catch (RuntimeException ignored) { return false; }
    }

    private String currentForeground(long lookbackMs) {
        UsageStatsManager stats = (UsageStatsManager) getSystemService(USAGE_STATS_SERVICE);
        if (stats == null) return "";
        long now = System.currentTimeMillis();
        UsageEvents events = stats.queryEvents(now - lookbackMs, now);
        // queryEvents can return null (for example while the phone is still locked after a reboot).
        if (events == null) return "";
        UsageEvents.Event event = new UsageEvents.Event();
        String foreground = "";
        while (events.hasNextEvent()) {
            events.getNextEvent(event);
            if (event.getEventType() == UsageEvents.Event.ACTIVITY_RESUMED || event.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND) foreground = event.getPackageName();
        }
        return foreground;
    }

    /** Called while a chosen app is in front: the cached total plus the time since it was read. */
    private long usedToday(Set<String> selected, long now) {
        // An unknown read keeps the day's last good total frozen (UsedTodayCache; idea engine items 71 B4, 73).
        return used.get(now, dayStart(now), () -> readUsedToday(selected, now));
    }

    /** 04:00 of NANDI's current day: its day starts there, after the night window. */
    private static long dayStart(long now) {
        Calendar start = Calendar.getInstance();
        start.setTimeInMillis(now);
        if (start.get(Calendar.HOUR_OF_DAY) < 4) start.add(Calendar.DAY_OF_MONTH, -1);
        start.set(Calendar.HOUR_OF_DAY, 4);
        start.set(Calendar.MINUTE, 0);
        start.set(Calendar.SECOND, 0);
        start.set(Calendar.MILLISECOND, 0);
        return start.getTimeInMillis();
    }

    /**
     * Time with a chosen app on screen since 04:00 (NANDI's day starts there, after the night window), or -1 when it
     * cannot be read. Each screen of an app is tracked on its own, and time counts while any chosen screen is open, so
     * moving between screens of one app is not lost and split screen is not counted twice. Screen-off, the lock screen
     * and a shutdown close everything; a restart drops what was open without counting the gap (idea engine item 71, B4).
     */
    private long readUsedToday(Set<String> selected, long now) {
        if (!NightPausePlugin.usageAllowed(this)) return -1;
        if (Build.VERSION.SDK_INT >= 24) {
            android.os.UserManager users = (android.os.UserManager) getSystemService(USER_SERVICE);
            if (users != null && !users.isUserUnlocked()) return -1;
        }
        UsageStatsManager stats = (UsageStatsManager) getSystemService(USAGE_STATS_SERVICE);
        if (stats == null) return -1;
        UsageEvents events = stats.queryEvents(dayStart(now), now);
        if (events == null) return -1;
        // From Android 10 an activity reports STOPPED when it leaves the screen; a paused one in split screen is
        // still visible, so PAUSED only closes a screen on older phones.
        boolean stoppedEvents = Build.VERSION.SDK_INT >= 29;
        UsageEvents.Event event = new UsageEvents.Event();
        Set<String> open = new HashSet<>();
        long since = 0;
        long total = 0;
        while (events.hasNextEvent()) {
            events.getNextEvent(event);
            int type = event.getEventType();
            long at = event.getTimeStamp();
            if (type == UsageEvents.Event.DEVICE_STARTUP) { open.clear(); continue; }
            if (type == UsageEvents.Event.DEVICE_SHUTDOWN || type == UsageEvents.Event.SCREEN_NON_INTERACTIVE || type == UsageEvents.Event.KEYGUARD_SHOWN) {
                if (!open.isEmpty()) total += Math.max(0, at - since);
                open.clear();
                continue;
            }
            String name = event.getPackageName();
            if (name == null || !selected.contains(name)) continue;
            String screen = name + "/" + (event.getClassName() == null ? "" : event.getClassName());
            boolean opens = type == UsageEvents.Event.ACTIVITY_RESUMED || type == UsageEvents.Event.MOVE_TO_FOREGROUND;
            boolean closes = stoppedEvents ? type == UsageEvents.Event.ACTIVITY_STOPPED
                : type == UsageEvents.Event.ACTIVITY_PAUSED || type == UsageEvents.Event.MOVE_TO_BACKGROUND;
            if (opens) {
                if (open.isEmpty()) since = at;
                open.add(screen);
            } else if (closes && open.remove(screen) && open.isEmpty()) {
                total += Math.max(0, at - since);
            }
        }
        if (!open.isEmpty()) total += Math.max(0, now - since);
        return total;
    }

    private void showPause(String packageName) {
        Intent launch = new Intent(this, MainActivity.class);
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        // With "Display over other apps" Android lets this service bring NANDI to the front over the app.
        if (Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(this)) {
            try { startActivity(launch); } catch (RuntimeException ignored) { /* the notice below still offers the pause */ }
        }
        PendingIntent intent = PendingIntent.getActivity(this, NOTICE_ID, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder pauseBuilder = Build.VERSION.SDK_INT >= 26
            ? new Notification.Builder(this, "night_pause_quiet") : new Notification.Builder(this);
        Notification notice = pauseBuilder
            .setSmallIcon(R.mipmap.ic_launcher).setContentTitle("Take one breath")
            .setContentText("Tap to open NANDI.")
            .setCategory(Notification.CATEGORY_REMINDER).setPriority(Notification.PRIORITY_HIGH)
            .setContentIntent(intent).setFullScreenIntent(intent, true).setAutoCancel(true).build();
        ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(NOTICE_ID, notice);
    }
}
