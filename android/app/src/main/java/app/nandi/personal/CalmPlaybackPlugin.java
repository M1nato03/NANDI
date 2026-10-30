package app.nandi.personal;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;

/**
 * Spec 38: the app's handle on CalmPlaybackService. start takes a sound (a preset in the app's assets, or Your sound as
 * base64, copied to a private file), a length (or none, until stopped) and a bell plan; status returns the sit and its
 * dated journal; pause, resume and stop act on it; clear forgets a sit the app has saved.
 */
@CapacitorPlugin(name = "CalmPlayback")
public class CalmPlaybackPlugin extends Plugin {
    @PluginMethod
    public void start(PluginCall call) {
        Context context = getContext();
        Intent intent = new Intent(context, CalmPlaybackService.class).setAction(CalmPlaybackService.ACTION_START);
        intent.putExtra("sitId", call.getString("sitId", ""));
        Long length = call.getLong("lengthMs");
        intent.putExtra("lengthMs", length == null ? -1L : length);
        intent.putExtra("intervalMin", call.getInt("intervalMin", 0));
        intent.putExtra("startBell", call.getBoolean("startBell", false));
        intent.putExtra("soundVolume", call.getInt("soundVolume", 60));
        intent.putExtra("bellVolume", call.getInt("bellVolume", 50));
        intent.putExtra("title", call.getString("title", "Calm with Kachhua"));
        String asset = call.getString("asset", "");
        if (asset != null && !asset.isEmpty()) intent.putExtra("asset", asset);
        String data = call.getString("fileBase64", "");
        if (data != null && !data.isEmpty()) {
            try {
                File file = new File(context.getFilesDir(), "calm-own-sound");
                try (FileOutputStream out = new FileOutputStream(file)) { out.write(Base64.decode(data, Base64.DEFAULT)); }
                intent.putExtra("file", file.getAbsolutePath());
            } catch (Exception error) { call.reject("Could not prepare your sound", error); return; }
        }
        if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent); else context.startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void status(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(CalmPlaybackService.PREFS, Context.MODE_PRIVATE);
        JSObject result = new JSObject();
        result.put("sitId", prefs.getString("sitId", ""));
        result.put("status", prefs.getString("status", ""));
        result.put("startedAt", prefs.getLong("startedAt", 0));
        result.put("lengthMs", prefs.getLong("lengthMs", -1));
        result.put("pausedFor", prefs.getString("pausedFor", ""));
        try { result.put("journal", new JSArray(prefs.getString("journal", "[]"))); } catch (Exception error) { result.put("journal", new JSArray()); }
        call.resolve(result);
    }

    private void send(String action, PluginCall call) {
        Context context = getContext();
        context.startService(new Intent(context, CalmPlaybackService.class).setAction(action));
        call.resolve();
    }

    @PluginMethod public void pause(PluginCall call) { send(CalmPlaybackService.ACTION_PAUSE, call); }
    @PluginMethod public void resume(PluginCall call) { send(CalmPlaybackService.ACTION_RESUME, call); }
    @PluginMethod public void stop(PluginCall call) { send(CalmPlaybackService.ACTION_STOP, call); }

    /** Forgets a finished sit once the app has written its row (the row's id is the sit's, so a second save is a no-op). */
    @PluginMethod
    public void clear(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(CalmPlaybackService.PREFS, Context.MODE_PRIVATE);
        String status = prefs.getString("status", "");
        if (call.getString("sitId", "").equals(prefs.getString("sitId", "")) && !"playing".equals(status) && !"paused".equals(status)) prefs.edit().clear().apply();
        call.resolve();
    }
}
