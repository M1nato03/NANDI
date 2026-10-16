package app.nandi.personal;

import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

@CapacitorPlugin(name = "Updater")
public class UpdaterPlugin extends Plugin {
    private static final String HOST = "nandi-updates.nandi11.workers.dev";
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private PluginCall waitingForPermission;
    private File waitingFile;

    @Override
    protected void handleOnDestroy() {
        io.shutdownNow();
    }

    @PluginMethod
    public void getInstalledVersion(PluginCall call) {
        try {
            PackageInfo info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            long code = Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode;
            JSObject result = new JSObject();
            result.put("versionCode", code);
            result.put("versionName", info.versionName);
            call.resolve(result);
        } catch (Exception error) { call.reject("Could not read the installed version.", error); }
    }

    private URL trustedUrl(String value, boolean apk) throws Exception {
        URL url = new URL(value);
        if (!"https".equals(url.getProtocol()) || !HOST.equals(url.getHost()) || url.getPort() != -1
            || !(apk ? url.getPath().matches("/nandi-[0-9]+\\.apk") : "/version.json".equals(url.getPath()))) {
            throw new IllegalArgumentException("Update address is not trusted.");
        }
        return url;
    }

    private HttpURLConnection connect(URL url) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setConnectTimeout(15000);
        connection.setReadTimeout(30000);
        connection.setInstanceFollowRedirects(false);
        int status = connection.getResponseCode();
        if (status != 200) {
            connection.disconnect();
            throw new IllegalStateException("Update server returned " + status + ".");
        }
        return connection;
    }

    @PluginMethod
    public void checkForUpdate(PluginCall call) {
        String address = call.getString("url", "");
        io.execute(() -> {
            HttpURLConnection connection = null;
            try {
                connection = connect(trustedUrl(address, false));
                try (InputStream input = connection.getInputStream()) {
                    ByteArrayOutputStream output = new ByteArrayOutputStream();
                    byte[] buffer = new byte[4096];
                    int read;
                    while ((read = input.read(buffer)) != -1) {
                        if (output.size() + read > 16384) throw new IllegalStateException("Update details are too large.");
                        output.write(buffer, 0, read);
                    }
                    JSONObject json = new JSONObject(new String(output.toByteArray(), java.nio.charset.StandardCharsets.UTF_8));
                    call.resolve(JSObject.fromJSONObject(json));
                }
            } catch (Exception error) { call.reject("Could not check for updates: " + error.getMessage(), error); }
            finally { if (connection != null) connection.disconnect(); }
        });
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String address = call.getString("url", "");
        String expected = call.getString("sha256", "");
        io.execute(() -> {
            HttpURLConnection connection = null;
            File file = new File(getContext().getCacheDir(), "nandi-update.apk");
            try {
                URL url = trustedUrl(address, true);
                if (!expected.matches("(?i)[0-9a-f]{64}")) throw new IllegalArgumentException("Update checksum is invalid.");
                connection = connect(url);
                long total = connection.getContentLengthLong();
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                long count = 0;
                try (InputStream input = connection.getInputStream(); FileOutputStream output = new FileOutputStream(file)) {
                    byte[] buffer = new byte[64 * 1024];
                    int read;
                    int previousPercent = -1;
                    while ((read = input.read(buffer)) != -1) {
                        output.write(buffer, 0, read);
                        digest.update(buffer, 0, read);
                        count += read;
                        int percent = total > 0 ? (int) Math.min(100, count * 100 / total) : 0;
                        if (percent != previousPercent) {
                            JSObject progress = new JSObject();
                            progress.put("percent", percent);
                            notifyListeners("updateProgress", progress);
                            previousPercent = percent;
                        }
                    }
                }
                if (count == 0 || (total > 0 && count != total)) throw new IllegalStateException("Update download was incomplete.");
                byte[] hash = digest.digest();
                StringBuilder actual = new StringBuilder();
                for (byte value : hash) actual.append(String.format("%02x", value & 0xff));
                if (!expected.equalsIgnoreCase(actual.toString())) throw new IllegalStateException("Update checksum did not match. Please try again.");
                getActivity().runOnUiThread(() -> installOrAsk(call, file));
            } catch (Exception error) {
                file.delete();
                call.reject("Could not prepare the update: " + error.getMessage(), error);
            } finally { if (connection != null) connection.disconnect(); }
        });
    }

    private void installOrAsk(PluginCall call, File file) {
        if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) {
            waitingForPermission = call;
            waitingFile = file;
            new AlertDialog.Builder(getActivity())
                .setMessage("Android asks once to let NANDI install its own updates")
                .setPositiveButton("Continue", (dialog, which) -> {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + getContext().getPackageName()));
                    startActivityForResult(call, intent, "permissionResult");
                })
                .setNegativeButton("Later", (dialog, which) -> {
                    waitingForPermission = null;
                    waitingFile = null;
                    file.delete();
                    call.reject("Update permission was not granted.");
                }).show();
            return;
        }
        launchInstaller(call, file);
    }

    @com.getcapacitor.annotation.ActivityCallback
    private void permissionResult(PluginCall call, androidx.activity.result.ActivityResult result) {
        PluginCall pending = waitingForPermission;
        File file = waitingFile;
        waitingForPermission = null;
        waitingFile = null;
        if (pending == null || file == null) return;
        if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) {
            file.delete();
            pending.reject("Allow NANDI to install updates, then try again.");
            return;
        }
        launchInstaller(pending, file);
    }

    private void launchInstaller(PluginCall call, File file) {
        try {
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception error) { file.delete(); call.reject("Could not open Android's installer.", error); }
    }
}
