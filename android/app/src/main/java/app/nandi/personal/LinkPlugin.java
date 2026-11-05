package app.nandi.personal;

import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.regex.Pattern;

/**
 * Spec 55: a crew link tapped in a chat opens NANDI (App Links). The link's hash waits here until the app takes it;
 * it is only ever returned as a string, never run. This filter is a first check only: the app's one TypeScript
 * validator decides what a link may do.
 */
@CapacitorPlugin(name = "Link")
public class LinkPlugin extends Plugin {
    static final String HOST = "nandi.nandi11.workers.dev";
    private static final Pattern ROUTE = Pattern.compile("^crew/(join|joined|add)/[A-Za-z0-9_-]{1,1500}$");
    private static String pending = "";

    /** Keeps an App Link's crew route, if the intent carries one. */
    static boolean capture(Intent intent) {
        if (intent == null || !Intent.ACTION_VIEW.equals(intent.getAction())) return false;
        Uri data = intent.getData();
        if (data == null || !"https".equals(data.getScheme()) || !HOST.equals(data.getHost())) return false;
        String fragment = data.getFragment();
        if (fragment == null || !ROUTE.matcher(fragment).matches()) return false;
        pending = fragment;
        return true;
    }

    @PluginMethod
    public void take(PluginCall call) {
        JSObject result = new JSObject();
        result.put("route", pending);
        pending = "";
        call.resolve(result);
    }
}
