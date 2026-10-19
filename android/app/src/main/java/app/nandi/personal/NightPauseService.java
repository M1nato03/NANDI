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
    private final Handler handler = new Handler(Looper.getMainLooper());
    /** The app last seen in front, kept between checks (a check with no new event keeps it). */
    private String current = "";
    /** The selected app already paused once since it came to the front. */
    private String prompted = "";
    /** When the last screen-on check ran, so the next one reads every event since then. */
    private long lastCheck = 0;
    private final Runnable check = new Runnable() {
        @Override public void run() {
            SharedPreferences prefs = getSharedPreferences(NightPausePlugin.PREFS, MODE_PRIVATE);
            if (!prefs.getBoolean("enabled", false) || !NightPausePlugin.usageAllowed(NightPauseService.this)) {
                stopSelf(); return;
            }
            boolean testing = System.currentTimeMillis() < prefs.getLong("testUntil", 0);
            boolean active = testing || inPauseWindow(prefs.getString("bedtime", "01:30"), prefs.getInt("leadMinutes", 30));
            PowerManager power = (PowerManager) getSystemService(POWER_SERVICE);
            boolean screenOn = power != null && power.isInteractive();
            if (screenOn) {
                long now = System.currentTimeMillis();
                long lookback = current.isEmpty() || lastCheck == 0 ? 600000 : Math.min(600000, now - lastCheck + 2000);
                lastCheck = now;
                String seen = currentForeground(lookback);
                if (!seen.isEmpty()) current = seen;
                Set<String> selected = new HashSet<>(Arrays.asList(prefs.getString("packages", "").split(",")));
                if (!selected.contains(current)) prompted = "";
                boolean suppressed = current.equals(prefs.getString("suppressedPackage", ""))
                    && System.currentTimeMillis() < prefs.getLong("suppressUntil", 0);
                if (active && selected.contains(current) && !current.equals(prompted) && !suppressed) {
                    prompted = current;
                    prefs.edit().putString("pending", current).apply();
                    showPause(current);
                }
            } else {
                current = "";
                prompted = "";
                lastCheck = 0;
            }
            handler.postDelayed(this, active && screenOn ? 1500 : screenOn ? 30000 : 300000);
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
            notifications.createNotificationChannel(new NotificationChannel("night_watch", "Night pause is on", NotificationManager.IMPORTANCE_LOW));
            notifications.createNotificationChannel(new NotificationChannel("night_pause", "Night pause", NotificationManager.IMPORTANCE_HIGH));
        }
        Notification.Builder ongoingBuilder = Build.VERSION.SDK_INT >= 26
            ? new Notification.Builder(this, "night_watch") : new Notification.Builder(this);
        Notification ongoing = ongoingBuilder
            .setSmallIcon(R.mipmap.ic_launcher).setContentTitle("NANDI night pause is on")
            .setContentText("You can turn it off in You > Night.").setOngoing(true).build();
        startForeground(43001, ongoing);
        IntentFilter screenEvents = new IntentFilter();
        screenEvents.addAction(Intent.ACTION_SCREEN_ON);
        screenEvents.addAction(Intent.ACTION_SCREEN_OFF);
        registerReceiver(screenReceiver, screenEvents);
        handler.post(check);
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        handler.removeCallbacks(check);
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

    private void showPause(String packageName) {
        Intent launch = new Intent(this, MainActivity.class);
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        // With "Display over other apps" Android lets this service bring NANDI to the front over the app.
        if (Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(this)) {
            try { startActivity(launch); } catch (RuntimeException ignored) { /* the notice below still offers the pause */ }
        }
        PendingIntent intent = PendingIntent.getActivity(this, NOTICE_ID, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder pauseBuilder = Build.VERSION.SDK_INT >= 26
            ? new Notification.Builder(this, "night_pause") : new Notification.Builder(this);
        Notification notice = pauseBuilder
            .setSmallIcon(R.mipmap.ic_launcher).setContentTitle("Take one breath")
            .setContentText("Tap to open your night plan in NANDI.")
            .setCategory(Notification.CATEGORY_REMINDER).setPriority(Notification.PRIORITY_HIGH)
            .setContentIntent(intent).setFullScreenIntent(intent, true).setAutoCancel(true).build();
        ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(NOTICE_ID, notice);
    }
}
