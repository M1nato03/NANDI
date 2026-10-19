package app.nandi.personal;

import android.app.AppOpsManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Process;
import android.os.Build;
import android.provider.Settings;
import android.net.Uri;
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

    @PluginMethod
    public void status(PluginCall call) {
        JSObject result = new JSObject();
        result.put("usageAllowed", usageAllowed(getContext()));
        result.put("overlayAllowed", Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(getContext()));
        result.put("pendingPackage", getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("pending", ""));
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
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putBoolean("enabled", enabled).putString("bedtime", bedtime).putString("packages", packages).putInt("leadMinutes", leadMinutes)
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
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove("pending").apply();
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
