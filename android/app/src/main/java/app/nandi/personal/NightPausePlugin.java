package app.nandi.personal;

import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Process;
import android.os.Build;
import android.provider.Settings;
import android.net.Uri;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
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
     * window, on Android 10+ only. Returns every app's foreground and background events, the screen on/off events and
     * the phone starting up or shutting down, from the last start-up before the window (up to a day back), plus
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
        // A day back, so the set of open apps at the window's start can be built (a start-up resets it).
        UsageEvents events = stats.queryEvents(from - 24L * 60 * 60 * 1000, Math.min(to, now));
        if (events == null) {
            result.put("available", false);
            call.resolve(result);
            return;
        }
        // Every app's front/back events, not only the chosen ones: the count follows which app is in front (item 55).
        List<JSObject> list = new ArrayList<>();
        int resetAt = 0;
        long logStart = -1;
        UsageEvents.Event event = new UsageEvents.Event();
        while (events.hasNextEvent()) {
            events.getNextEvent(event);
            if (logStart < 0) logStart = event.getTimeStamp();
            int type = event.getEventType();
            String name = event.getPackageName();
            String kind = null;
            if (type == UsageEvents.Event.ACTIVITY_RESUMED || type == UsageEvents.Event.MOVE_TO_FOREGROUND) kind = "fg";
            else if (type == UsageEvents.Event.ACTIVITY_PAUSED || type == UsageEvents.Event.MOVE_TO_BACKGROUND) kind = "bg";
            else if (type == UsageEvents.Event.SCREEN_INTERACTIVE) kind = "on";
            else if (type == UsageEvents.Event.SCREEN_NON_INTERACTIVE) kind = "off";
            else if (type == UsageEvents.Event.DEVICE_STARTUP) kind = "boot";
            else if (type == UsageEvents.Event.DEVICE_SHUTDOWN) kind = "down";
            if (kind == null) continue;
            JSObject item = new JSObject();
            item.put("type", kind);
            item.put("at", event.getTimeStamp());
            if (kind.equals("fg") || kind.equals("bg")) item.put("pkg", name);
            // A start-up before the window empties the set of open apps, so older events are dropped.
            if (event.getTimeStamp() <= from && kind.equals("boot")) resetAt = list.size();
            list.add(item);
        }
        JSArray kept = new JSArray();
        for (int i = resetAt; i < list.size(); i++) kept.put(list.get(i));
        result.put("available", logStart >= 0);
        if (logStart >= 0) result.put("logStart", logStart);
        result.put("events", kept);
        call.resolve(result);
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
