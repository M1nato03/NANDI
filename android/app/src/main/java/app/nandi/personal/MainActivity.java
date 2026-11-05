package app.nandi.personal;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.content.Intent;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NightPausePlugin.class);
        registerPlugin(UpdaterPlugin.class);
        registerPlugin(WidgetPlugin.class);
        registerPlugin(CalmPlaybackPlugin.class);
        registerPlugin(LinkPlugin.class);
        super.onCreate(savedInstanceState);
        // Spec 55: a crew link that opened the app waits in LinkPlugin until the web app takes it.
        LinkPlugin.capture(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        boolean link = LinkPlugin.capture(intent);
        if (bridge != null && bridge.getWebView() != null) {
            // Only a fixed event name goes to the page; the link itself is taken through LinkPlugin.take().
            if (link) bridge.getWebView().evaluateJavascript("window.dispatchEvent(new Event('nandi:link'))", null);
            String route = intent.getStringExtra("nandiRoute");
            if ("#night".equals(route) || "#plan".equals(route)) {
                bridge.getWebView().evaluateJavascript("window.location.hash='" + route + "'; window.dispatchEvent(new Event('nandi:navigate'))", null);
            }
            bridge.getWebView().evaluateJavascript("window.dispatchEvent(new Event('nandi:night-pause'))", null);
        }
    }
}
