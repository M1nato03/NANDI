package app.nandi.personal;

import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Process;
import android.os.Build;
import android.provider.Settings;
import android.net.Uri;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NightPause")
public class NightPausePlugin extends Plugin {
    static final String PREFS = "night-pause";

    static boolean usageAllowed(Context context) {
        AppOpsManager ops = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
        return ops != null && ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(), context.getPackageName()) == AppOpsManager.MODE_ALLOWED;
    }

    /**
     * Spec 24 #1 (Phone ki chhutti): the usage events for one past window, read afterwards. Nothing runs during the
     * window, on Android 10+ only. Returns the state at the last start-up before the window (up to ten days back):
     * the activities still open, the last screen change and any shutdown; then every activity resume and pause (with
     * its package and class), screen change, start-up and shutdown inside the window. Plus
     * logStart, the first event the log still holds, so the app can tell "quiet" from "no history".
     * No access, a locked phone (null) or an empty log returns available false, and the app then writes nothing.
     */
    @PluginMethod
    public void windowEvents(PluginCall call) {
        JSObject result = new JSObject();
        Long from = call.getLong("from");
        Long to = call.getLong("to");
        UsageStatsManager stats = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
        long now = System.currentTimeMillis();
        // Android 10+ only: older phones have no start-up/shutdown events, so they always get the one-tap answer (item 56).
        if (Build.VERSION.SDK_INT < 29 || from == null || to == null || to <= from || stats == null || !usageAllowed(getContext())) {
            result.put("available", false);
            call.resolve(result);
            return;
        }
        // Ten days back, to find the last start-up before the window: the only proven point where no app is open (item 57).
        UsageEvents events = stats.queryEvents(from - 10L * 24 * 60 * 60 * 1000, Math.min(to, now));
        if (events == null) {
            result.put("available", false);
            call.resolve(result);
            return;
        }
        // Before the window only the state is kept: the last start-up, the activities open since then (per package
        // and class, since resume and pause are per activity), the last screen change and a shutdown after it.
        // From the window's start every event is sent as it is.
        Map<String, Long> open = new HashMap<>();
        Map<String, String> openPkg = new HashMap<>();
        long bootAt = -1, screenAt = -1, downAt = -1, lockAt = -1, logStart = -1;
        String screen = null;
        JSArray inside = new JSArray();
        Set<String> seen = new HashSet<>();
        UsageEvents.Event event = new UsageEvents.Event();
        while (events.hasNextEvent()) {
            events.getNextEvent(event);
            long at = event.getTimeStamp();
            if (logStart < 0) logStart = at;
            int type = event.getEventType();
            String kind = null;
            if (type == UsageEvents.Event.ACTIVITY_RESUMED) kind = "fg";
            // Some builds go RESUMED -> STOPPED with no PAUSED event (AOSP 9e87948a44c1), so a stop also closes the activity; a destroyed one was stopped first (item 59).
            else if (type == UsageEvents.Event.ACTIVITY_PAUSED || type == UsageEvents.Event.ACTIVITY_STOPPED) kind = "bg";
            else if (type == UsageEvents.Event.SCREEN_INTERACTIVE) kind = "on";
            else if (type == UsageEvents.Event.SCREEN_NON_INTERACTIVE) kind = "off";
            else if (type == UsageEvents.Event.DEVICE_STARTUP) kind = "boot";
            else if (type == UsageEvents.Event.DEVICE_SHUTDOWN) kind = "down";
            // The lock screen: a baseline only once this phone passed the lock self-test (item 59, Jenil's choice A).
            else if (type == UsageEvents.Event.KEYGUARD_SHOWN) kind = "lock";
            if (kind == null) continue;
            String pkg = event.getPackageName();
            String cls = event.getClassName() == null ? "" : event.getClassName();
            if ((kind.equals("fg") || kind.equals("bg")) && pkg != null) seen.add(pkg);
            if (at > from) {
                JSObject item = new JSObject();
                item.put("type", kind);
                item.put("at", at);
                if (kind.equals("fg") || kind.equals("bg")) { item.put("pkg", pkg); item.put("cls", cls); }
                inside.put(item);
                continue;
            }
            String key = pkg + "/" + cls;
            if (kind.equals("boot")) { bootAt = at; open.clear(); openPkg.clear(); screen = null; screenAt = -1; downAt = -1; lockAt = -1; }
            else if (kind.equals("lock")) lockAt = at;
            else if (kind.equals("down")) { downAt = at; open.clear(); openPkg.clear(); }
            else if (kind.equals("fg")) { open.put(key, at); openPkg.put(key, pkg); }
            else if (kind.equals("bg")) { open.remove(key); openPkg.remove(key); }
            else { screen = kind; screenAt = at; }
        }
        JSArray kept = new JSArray();
        if (bootAt >= 0 || lockAt >= 0) {
            List<JSObject> state = new ArrayList<>();
            if (bootAt >= 0) state.add(stateEvent("boot", bootAt, null, null));
            if (lockAt >= 0) state.add(stateEvent("lock", lockAt, null, null));
            if (screen != null && screenAt >= bootAt) state.add(stateEvent(screen, screenAt, null, null));
            for (Map.Entry<String, Long> entry : open.entrySet()) {
                String pkg = openPkg.get(entry.getKey());
                state.add(stateEvent("fg", entry.getValue(), pkg, entry.getKey().substring(pkg.length() + 1)));
            }
            if (downAt > bootAt) state.add(stateEvent("down", downAt, null, null));
            Collections.sort(state, (x, y) -> Long.compare(x.optLong("at"), y.optLong("at")));
            for (JSObject item : state) kept.put(item);
        }
        for (int i = 0; i < inside.length(); i++) kept.put(inside.opt(i));
        result.put("available", logStart >= 0);
        if (logStart >= 0) result.put("logStart", logStart);
        result.put("events", kept);
        result.put("lockSafe", lockSafe(call.getString("packages", ""), seen));
        call.resolve(result);
    }

    /**
     * The lock self-test (item 59): NANDI's own activities resumed ("fg") and paused or stopped ("bg"), and the lock
     * screen shown ("lock"), from a day before `since` (so NANDI's state at the first lock is known) up to now, at most
     * ten days back. Android 10+ with Usage access only; anything else returns available false.
     */
    @PluginMethod
    public void lockEvents(PluginCall call) {
        JSObject result = new JSObject();
        long now = System.currentTimeMillis();
        long since = call.getLong("since", 0L);
        UsageStatsManager stats = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
        if (Build.VERSION.SDK_INT < 29 || stats == null || !usageAllowed(getContext())) {
            result.put("available", false);
            call.resolve(result);
            return;
        }
        long start = Math.max(since - 24L * 60 * 60 * 1000, now - 10L * 24 * 60 * 60 * 1000);
        UsageEvents events = stats.queryEvents(start, now);
        if (events == null) {
            result.put("available", false);
            call.resolve(result);
            return;
        }
        String own = getContext().getPackageName();
        JSArray list = new JSArray();
        UsageEvents.Event event = new UsageEvents.Event();
        while (events.hasNextEvent()) {
            events.getNextEvent(event);
            int type = event.getEventType();
            String kind = null;
            if (type == UsageEvents.Event.KEYGUARD_SHOWN) kind = "lock";
            else if (own.equals(event.getPackageName())) {
                if (type == UsageEvents.Event.ACTIVITY_RESUMED) kind = "fg";
                else if (type == UsageEvents.Event.ACTIVITY_PAUSED || type == UsageEvents.Event.ACTIVITY_STOPPED) kind = "bg";
            }
            if (kind == null) continue;
            JSObject item = new JSObject();
            item.put("type", kind);
            item.put("at", event.getTimeStamp());
            if (!kind.equals("lock")) item.put("cls", event.getClassName() == null ? "" : event.getClassName());
            list.put(item);
        }
        result.put("available", true);
        result.put("events", list);
        call.resolve(result);
    }

    /** The default chosen apps, declared in the manifest's <queries> so this phone can look them up (item 63). */
    private static final Set<String> QUERIED = new HashSet<>(Arrays.asList("com.instagram.android", "com.google.android.youtube", "com.snapchat.android"));

    /** ActivityInfo.FLAG_SHOW_WHEN_LOCKED (API 27) is hidden from the public SDK, so its documented bit is used. */
    private static final int FLAG_SHOW_WHEN_LOCKED = 0x800000;

    /**
     * Whether a lock can serve as a baseline for these apps (Codex A items 63, 65): none of them may declare an
     * activity that shows over the lock screen (FLAG_SHOW_WHEN_LOCKED, read from the public flags field), and each must
     * be one this phone can look up. A package that cannot be seen is unknown, so not safe. One of the 3 declared in
     * <queries> that is missing counts as not installed only if it is also absent from the retained log (`seen`).
     * An activity that turns this on at run time (setShowWhenLocked) cannot be seen here; Jenil accepted that (24 Oct).
     */
    private boolean lockSafe(String packages, Set<String> seen) {
        if (Build.VERSION.SDK_INT < 27) return false;
        PackageManager manager = getContext().getPackageManager();
        for (String pkg : packages.split(",")) {
            String name = pkg.trim();
            if (name.isEmpty()) continue;
            try {
                PackageInfo info = manager.getPackageInfo(name, PackageManager.GET_ACTIVITIES);
                if (info.activities == null) continue;
                for (ActivityInfo activity : info.activities) {
                    if ((activity.flags & FLAG_SHOW_WHEN_LOCKED) != 0) return false;
                }
            } catch (PackageManager.NameNotFoundException missing) {
                if (!QUERIED.contains(name) || seen.contains(name)) return false;
            }
        }
        return true;
    }

    private static JSObject stateEvent(String type, long at, String pkg, String cls) {
        JSObject item = new JSObject();
        item.put("type", type);
        item.put("at", at);
        if (pkg != null) { item.put("pkg", pkg); item.put("cls", cls); }
        return item;
    }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject result = new JSObject();
        result.put("usageAllowed", usageAllowed(getContext()));
        result.put("overlayAllowed", Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(getContext()));
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        result.put("pendingPackage", prefs.getString("pending", ""));
        result.put("pendingReason", prefs.getString("pendingReason", "night"));
        result.put("pendingMinutes", prefs.getLong("pendingMinutes", 0));
        call.resolve(result);
    }

    @PluginMethod
    public void openUsageSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:" + getContext().getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try { getContext().startActivity(intent); }
        catch (android.content.ActivityNotFoundException error) {
            Intent fallback = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
            fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(fallback);
        }
        call.resolve();
    }

    /** Treats the next few minutes as the bedtime window, so the pause can be tried by day. */
    @PluginMethod
    public void test(PluginCall call) {
        int durationMs = Math.max(0, Math.min(call.getInt("durationMs", 120000), 600000));
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (!prefs.getBoolean("enabled", false) || !usageAllowed(getContext())) { call.reject("Night pause is off or Usage access is off"); return; }
        prefs.edit().putLong("testUntil", System.currentTimeMillis() + durationMs)
            .remove("suppressedPackage").remove("suppressUntil").apply();
        Intent service = new Intent(getContext(), NightPauseService.class);
        if (Build.VERSION.SDK_INT >= 26) getContext().startForegroundService(service);
        else getContext().startService(service);
        call.resolve();
    }

    @PluginMethod
    public void openAppInfo(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
            Uri.parse("package:app.nandi.personal"));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void configure(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", false);
        String bedtime = call.getString("bedtime", "01:30");
        String packages = call.getString("packages", "com.instagram.android,com.google.android.youtube,com.snapchat.android");
        int leadMinutes = call.getInt("leadMinutes", 30);
        String dayMode = call.getString("dayMode", "off");
        int dayLimitMinutes = call.getInt("dayLimitMinutes", 30);
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putBoolean("enabled", enabled).putString("bedtime", bedtime).putString("packages", packages).putInt("leadMinutes", leadMinutes)
            .putString("dayMode", dayMode).putInt("dayLimitMinutes", dayLimitMinutes)
            .putString("pending", enabled ? getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("pending", "") : "").apply();
        Intent service = new Intent(getContext(), NightPauseService.class);
        if (enabled && usageAllowed(getContext())) {
            if (Build.VERSION.SDK_INT >= 26) getContext().startForegroundService(service);
            else getContext().startService(service);
        }
        else getContext().stopService(service);
        call.resolve();
    }

    @PluginMethod
    public void clearPending(PluginCall call) {
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove("pending").remove("pendingReason").remove("pendingMinutes").apply();
        NotificationManager notifications = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (notifications != null) notifications.cancel(NightPauseService.NOTICE_ID);
        call.resolve();
    }

    @PluginMethod
    public void openApp(PluginCall call) {
        String packageName = call.getString("packageName", "");
        Intent launch = new Intent(Intent.ACTION_MAIN);
        launch.addCategory(Intent.CATEGORY_LAUNCHER);
        launch.setPackage(packageName);
        int snoozeMs = call.getInt("snoozeMs", 600000);
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putString("suppressedPackage", packageName)
            .putLong("suppressUntil", System.currentTimeMillis() + Math.max(0, snoozeMs)).apply();
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try { getContext().startActivity(launch); call.resolve(); }
        catch (android.content.ActivityNotFoundException error) { call.reject("App is not installed", error); }
    }
}
