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
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/** Local foreground watcher. Usage events and pause counts never leave the device. */
public class NightPauseService extends Service {
    static final int NOTICE_ID = 43002;
    private final Handler handler = new Handler(Looper.getMainLooper());
    /** The app last seen in front, kept between checks (a check with no new event keeps it). */
    private String current = "";
    /** The selected app already paused once since it came to the front. */
    private String prompted = "";
    /** When the last screen-on check ran, so the next one reads every event since then. */
    private long lastCheck = 0;
    /** Today's time in the chosen apps, read from usage events at most once a minute. */
    private long usedMs = 0;
    private long usedAt = 0;
    private final Runnable check = new Runnable() {
        @Override public void run() {
            SharedPreferences prefs = getSharedPreferences(NightPausePlugin.PREFS, MODE_PRIVATE);
            if (!prefs.getBoolean("enabled", false) || !NightPausePlugin.usageAllowed(NightPauseService.this)) {
                stopSelf(); return;
            }
            long now = System.currentTimeMillis();
            boolean night = now < prefs.getLong("testUntil", 0)
                || inPauseWindow(prefs.getString("bedtime", "01:30"), prefs.getInt("leadMinutes", 30));
            String dayMode = prefs.getString("dayMode", "off");
            boolean watching = night || !"off".equals(dayMode);
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
                if (watching && selected.contains(current) && !current.equals(prompted) && !snoozed) {
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
        Notification.Builder ongoingBuilder = Build.VERSION.SDK_INT >= 26
            ? new Notification.Builder(this, "night_watch_quiet") : new Notification.Builder(this).setPriority(Notification.PRIORITY_MIN);
        Notification ongoing = ongoingBuilder
            .setSmallIcon(R.mipmap.ic_launcher).setContentTitle("NANDI app pause is on")
            .setContentText("You can turn it off in You > Settings > App pause.").setOngoing(true).build();
        startForeground(43001, ongoing);
        IntentFilter screenEvents = new IntentFilter();
        screenEvents.addAction(Intent.ACTION_SCREEN_ON);
        screenEvents.addAction(Intent.ACTION_SCREEN_OFF);
        registerReceiver(screenReceiver, screenEvents);
        handler.post(check);
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        handler.removeCallbacks(check);
        usedAt = 0;
        handler.post(check);
        return START_STICKY;
    }
    @Override public void onDestroy() { handler.removeCallbacks(check); unregisterReceiver(screenReceiver); super.onDestroy(); }
    @Override public IBinder onBind(Intent intent) { return null; }

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
        if (usedAt == 0 || now - usedAt > 60000 || now < usedAt) {
            usedMs = readUsedToday(selected, now);
            usedAt = now;
            return usedMs;
        }
        return usedMs + (now - usedAt);
    }

    /** Time in front for the chosen apps since 04:00 (NANDI's day starts there, after the night window). */
    private long readUsedToday(Set<String> selected, long now) {
        UsageStatsManager stats = (UsageStatsManager) getSystemService(USAGE_STATS_SERVICE);
        if (stats == null) return 0;
        Calendar start = Calendar.getInstance();
        start.setTimeInMillis(now);
        if (start.get(Calendar.HOUR_OF_DAY) < 4) start.add(Calendar.DAY_OF_MONTH, -1);
        start.set(Calendar.HOUR_OF_DAY, 4);
        start.set(Calendar.MINUTE, 0);
        start.set(Calendar.SECOND, 0);
        start.set(Calendar.MILLISECOND, 0);
        UsageEvents events = stats.queryEvents(start.getTimeInMillis(), now);
        UsageEvents.Event event = new UsageEvents.Event();
        Map<String, Long> openSince = new HashMap<>();
        long total = 0;
        while (events.hasNextEvent()) {
            events.getNextEvent(event);
            String name = event.getPackageName();
            if (!selected.contains(name)) continue;
            int type = event.getEventType();
            if (type == UsageEvents.Event.ACTIVITY_RESUMED || type == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                if (!openSince.containsKey(name)) openSince.put(name, event.getTimeStamp());
            } else if (type == UsageEvents.Event.ACTIVITY_PAUSED || type == UsageEvents.Event.MOVE_TO_BACKGROUND) {
                Long since = openSince.remove(name);
                if (since != null) total += Math.max(0, event.getTimeStamp() - since);
            }
        }
        for (Long since : openSince.values()) total += Math.max(0, now - since);
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
