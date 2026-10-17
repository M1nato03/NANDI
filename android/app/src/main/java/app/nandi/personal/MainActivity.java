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
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (bridge != null && bridge.getWebView() != null) {
            String route = intent.getStringExtra("nandiRoute");
            if ("#night".equals(route) || "#plan".equals(route)) {
                bridge.getWebView().evaluateJavascript("window.location.hash='" + route + "'; window.dispatchEvent(new Event('nandi:navigate'))", null);
            }
            bridge.getWebView().evaluateJavascript("window.dispatchEvent(new Event('nandi:night-pause'))", null);
        }
    }
}
