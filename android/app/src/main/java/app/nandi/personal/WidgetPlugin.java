package app.nandi.personal;

import android.content.Context;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Widget")
public class WidgetPlugin extends Plugin {
    @PluginMethod
    public void setState(PluginCall call) {
        String dayTitle = call.getString("dayTitle", "Now · Choose your first step");
        String daySubtitle = call.getString("daySubtitle", "0 of 0 done today");
        String nightTitle = call.getString("nightTitle", "Night deck ready");
        String nightSubtitle = call.getString("nightSubtitle", "Six calm cards, then phone down.");
        int shutdownMinutes = call.getInt("shutdownMinutes", 23 * 60 + 15);
        getContext().getSharedPreferences(NandiWidgetProvider.PREFS, Context.MODE_PRIVATE).edit()
            .putString("dayTitle", dayTitle).putString("daySubtitle", daySubtitle)
            .putString("nightTitle", nightTitle).putString("nightSubtitle", nightSubtitle)
            .putInt("shutdownMinutes", Math.max(0, Math.min(1439, shutdownMinutes))).apply();
        NandiWidgetProvider.refresh(getContext());
        call.resolve();
    }
}
