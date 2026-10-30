package app.nandi.personal;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/** Restarts the opted-in local watcher after a reboot. */
public class NightPauseBootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        if (!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return;
        android.content.SharedPreferences prefs = context.getSharedPreferences(NightPausePlugin.PREFS, Context.MODE_PRIVATE);
        // A focus never survives a reboot, so only App pause or the Pause card (spec 39) restart the watcher.
        if (!NightPauseService.shouldRun(prefs.getBoolean("enabled", false), false, prefs.getBoolean("pauseCard", false), NightPausePlugin.usageAllowed(context))) return;
        try {
            Intent service = new Intent(context, NightPauseService.class);
            if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(service);
            else context.startService(service);
        } catch (RuntimeException ignored) {
            // Android may defer background services; opening NANDI starts it again.
        }
    }
}
