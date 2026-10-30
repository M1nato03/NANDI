package app.nandi.personal;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.SoundPool;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.SystemClock;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Spec 38: Calm keeps playing when the phone locks. A media playback foreground service owns the sound loop, the bell
 * plan and the sit's clock, so the WebView can sleep. It is reusable: it takes a sound, a length and a bell plan, not
 * "the Calm tab". Time counts only while it is really playing: every start, pause (and why), resume, bell and end is a
 * dated event in a journal the app reads back on its return; the app pays minutes from playing spans only.
 * Pause, Stop and headphone buttons work from the lock screen through a MediaSession.
 */
public class CalmPlaybackService extends Service {
    static final String PREFS = "calm_playback";
    static final String ACTION_START = "app.nandi.personal.CALM_START";
    static final String ACTION_PAUSE = "app.nandi.personal.CALM_PAUSE";
    static final String ACTION_RESUME = "app.nandi.personal.CALM_RESUME";
    static final String ACTION_STOP = "app.nandi.personal.CALM_STOP";
    private static final String CHANNEL = "calm_playback";
    private static final int NOTICE_ID = 4207;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private MediaPlayer player;
    private SoundPool bells;
    private int bellStart, bellInterval, bellEnd, tick;
    private MediaSession session;
    private AudioManager audio;
    private AudioFocusRequest focusRequest;
    private PowerManager.WakeLock wake;
    private float bellVolume = 0.5f;

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();
        if (ACTION_START.equals(action)) start(intent);
        else if (ACTION_PAUSE.equals(action)) pause("user");
        else if (ACTION_RESUME.equals(action)) resume();
        else if (ACTION_STOP.equals(action)) finish("stopped");
        else if (!"playing".equals(prefs().getString("status", "")) && !"paused".equals(prefs().getString("status", ""))) stopSelf();
        return START_NOT_STICKY;
    }

    private SharedPreferences prefs() { return getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    /** Adds a dated event to the sit's journal (written before anything else happens, so a killed process loses nothing). */
    private void log(String type, String reason) {
        try {
            SharedPreferences prefs = prefs();
            JSONArray journal = new JSONArray(prefs.getString("journal", "[]"));
            JSONObject event = new JSONObject();
            event.put("type", type);
            event.put("at", System.currentTimeMillis());
            if (reason != null) event.put("reason", reason);
            journal.put(event);
            prefs.edit().putString("journal", journal.toString()).commit();
        } catch (Exception ignored) { /* The journal is best effort; the app pays nothing it cannot read. */ }
    }

    /** Playing time so far: the time banked at the last pause, plus the open span since the last resume. */
    private long playedMs() {
        SharedPreferences prefs = prefs();
        long played = prefs.getLong("playedMs", 0);
        if ("playing".equals(prefs.getString("status", ""))) played += SystemClock.elapsedRealtime() - prefs.getLong("resumedAtClock", SystemClock.elapsedRealtime());
        return played;
    }

    private void start(Intent intent) {
        SharedPreferences prefs = prefs();
        // A new sit replaces any old one that never finished (its journal stays readable until the app clears it).
        if ("playing".equals(prefs.getString("status", "")) || "paused".equals(prefs.getString("status", ""))) release();
        long lengthMs = intent.getLongExtra("lengthMs", -1);
        prefs.edit().clear()
            .putString("sitId", intent.getStringExtra("sitId"))
            .putLong("startedAt", System.currentTimeMillis())
            .putLong("lengthMs", lengthMs)
            .putInt("intervalMin", intent.getIntExtra("intervalMin", 0))
            .putBoolean("ticks", intent.getBooleanExtra("ticks", false))
            .putString("title", intent.getStringExtra("title") == null ? "Calm with Kachhua" : intent.getStringExtra("title"))
            .putString("status", "playing")
            .putLong("playedMs", 0)
            .putLong("resumedAtClock", SystemClock.elapsedRealtime())
            .putInt("bellsRung", 0)
            .putString("journal", "[]")
            .commit();
        log("started", null);
        bellVolume = Math.max(0f, Math.min(1f, intent.getIntExtra("bellVolume", 50) / 100f));
        startForegroundNow();
        audio = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        requestFocus();
        setUpSession();
        setUpBells(intent.getBooleanExtra("startBell", false));
        setUpSound(intent.getStringExtra("asset"), intent.getStringExtra("file"), intent.getIntExtra("soundVolume", 60));
        holdWake(true);
        updateSession();
        schedule();
    }

    private void startForegroundNow() {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && manager.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel channel = new NotificationChannel(CHANNEL, "Calm", NotificationManager.IMPORTANCE_LOW);
            channel.setShowBadge(false);
            manager.createNotificationChannel(channel);
        }
        Notification notice = notice();
        if (Build.VERSION.SDK_INT >= 29) startForeground(NOTICE_ID, notice, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        else startForeground(NOTICE_ID, notice);
    }

    private PendingIntent action(String action, int code) {
        Intent intent = new Intent(this, CalmPlaybackService.class).setAction(action);
        return PendingIntent.getService(this, code, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    /** "Calm with Kachhua · 7:12 left" with Pause (or Resume) and Stop; the clock counts down on its own. */
    private Notification notice() {
        SharedPreferences prefs = prefs();
        boolean playing = "playing".equals(prefs.getString("status", ""));
        long length = prefs.getLong("lengthMs", -1), played = playedMs();
        Intent open = new Intent(this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
        builder.setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(prefs.getString("title", "Calm with Kachhua"))
            .setContentIntent(PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT))
            .setOngoing(playing)
            .setOnlyAlertOnce(true)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .addAction(new Notification.Action.Builder(null, playing ? "Pause" : "Resume", action(playing ? ACTION_PAUSE : ACTION_RESUME, 1)).build())
            .addAction(new Notification.Action.Builder(null, "Stop", action(ACTION_STOP, 2)).build());
        if (playing) {
            builder.setShowWhen(true).setUsesChronometer(true);
            if (length > 0) { builder.setWhen(System.currentTimeMillis() + Math.max(0, length - played)); if (Build.VERSION.SDK_INT >= 24) builder.setChronometerCountDown(true); }
            else builder.setWhen(System.currentTimeMillis() - played);
            builder.setContentText(length > 0 ? "left" : "so far");
        } else builder.setContentText("Paused").setShowWhen(false);
        Notification.MediaStyle style = new Notification.MediaStyle().setShowActionsInCompactView(0, 1);
        if (session != null) style.setMediaSession(session.getSessionToken());
        builder.setStyle(style);
        return builder.build();
    }

    private void refreshNotice() {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        manager.notify(NOTICE_ID, notice());
    }

    private void setUpSession() {
        session = new MediaSession(this, "NandiCalm");
        session.setCallback(new MediaSession.Callback() {
            @Override public void onPlay() { resume(); }
            @Override public void onPause() { pause("user"); }
            @Override public void onStop() { finish("stopped"); }
        });
        session.setActive(true);
    }

    private void updateSession() {
        if (session == null) return;
        boolean playing = "playing".equals(prefs().getString("status", ""));
        session.setPlaybackState(new PlaybackState.Builder()
            .setActions(PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE | PlaybackState.ACTION_PLAY_PAUSE | PlaybackState.ACTION_STOP)
            .setState(playing ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED, playedMs(), playing ? 1f : 0f)
            .build());
    }

    private void setUpBells(boolean startBell) {
        AudioAttributes attributes = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build();
        bells = new SoundPool.Builder().setMaxStreams(3).setAudioAttributes(attributes).build();
        bellInterval = bells.load(this, R.raw.calm_bell_interval, 1);
        bellEnd = bells.load(this, R.raw.calm_bell_end, 1);
        tick = bells.load(this, R.raw.calm_tick, 1);
        bellStart = bells.load(this, R.raw.calm_bell_start, 1);
        if (startBell) bells.setOnLoadCompleteListener((pool, id, status) -> { if (id == bellStart && status == 0) pool.play(bellStart, bellVolume, bellVolume, 1, 0, 1f); });
    }

    private void ring(int sound) { if (bells != null && sound != 0) bells.play(sound, bellVolume, bellVolume, 1, 0, 1f); }

    /** Loops a preset from the app's own assets, or Your sound copied to a private file; none plays only the bells. */
    private void setUpSound(String asset, String file, int volume) {
        if ((asset == null || asset.isEmpty()) && (file == null || file.isEmpty())) return;
        try {
            player = new MediaPlayer();
            player.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());
            if (asset != null && !asset.isEmpty()) {
                AssetFileDescriptor descriptor = getAssets().openFd(asset);
                player.setDataSource(descriptor.getFileDescriptor(), descriptor.getStartOffset(), descriptor.getLength());
                descriptor.close();
            } else player.setDataSource(file);
            player.setLooping(true);
            float level = Math.max(0f, Math.min(1f, volume / 100f));
            player.setVolume(level, level);
            player.setOnErrorListener((mp, what, extra) -> { pause("decode"); return true; });
            player.prepare();
            player.start();
        } catch (Exception error) {
            // A sound that cannot play ends the playing span: no minutes are paid on silence that should have been sound.
            if (player != null) { player.release(); player = null; }
            pause("decode");
        }
    }

    private void requestFocus() {
        if (Build.VERSION.SDK_INT < 26) return;
        focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
            .setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build())
            .setOnAudioFocusChangeListener(change -> {
                // A call or another app's sound pauses the sit (a dated pause); a short loss comes back on its own.
                if (change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT || change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) pause("call");
                else if (change == AudioManager.AUDIOFOCUS_LOSS) pause("focus");
                else if (change == AudioManager.AUDIOFOCUS_GAIN && "call".equals(prefs().getString("pausedFor", ""))) resume();
            }, handler)
            .build();
        audio.requestAudioFocus(focusRequest);
    }

    private void holdWake(boolean on) {
        if (on) {
            if (wake == null) wake = ((PowerManager) getSystemService(Context.POWER_SERVICE)).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "nandi:calm");
            if (!wake.isHeld()) wake.acquire(3L * 60 * 60 * 1000);
        } else if (wake != null && wake.isHeld()) wake.release();
    }

    void pause(String reason) {
        SharedPreferences prefs = prefs();
        if (!"playing".equals(prefs.getString("status", ""))) return;
        long played = playedMs();
        prefs.edit().putString("status", "paused").putLong("playedMs", played).putString("pausedFor", reason).commit();
        log("paused", reason);
        handler.removeCallbacksAndMessages(null);
        if (player != null && player.isPlaying()) player.pause();
        holdWake(false);
        updateSession();
        refreshNotice();
    }

    void resume() {
        SharedPreferences prefs = prefs();
        if (!"paused".equals(prefs.getString("status", ""))) return;
        prefs.edit().putString("status", "playing").putLong("resumedAtClock", SystemClock.elapsedRealtime()).remove("pausedFor").commit();
        log("resumed", null);
        if (player != null) player.start();
        holdWake(true);
        updateSession();
        refreshNotice();
        schedule();
    }

    /** The next due moment: the next interval bell, the next scan tick (every minute when asked) or the end. */
    private void schedule() {
        handler.removeCallbacksAndMessages(null);
        SharedPreferences prefs = prefs();
        if (!"playing".equals(prefs.getString("status", ""))) return;
        long played = playedMs(), length = prefs.getLong("lengthMs", -1);
        int interval = prefs.getInt("intervalMin", 0), rung = prefs.getInt("bellsRung", 0);
        long next = Long.MAX_VALUE;
        if (length > 0) next = length;
        if (interval > 0) {
            long bell = (long) (rung + 1) * interval * 60_000L;
            if (length <= 0 || bell < length) next = Math.min(next, bell);
        }
        if (next == Long.MAX_VALUE) { handler.postDelayed(this::schedule, 60_000); return; }
        handler.postDelayed(this::due, Math.max(0, next - played));
    }

    private void due() {
        SharedPreferences prefs = prefs();
        long played = playedMs(), length = prefs.getLong("lengthMs", -1);
        if (length > 0 && played >= length) { finish("ended"); return; }
        int interval = prefs.getInt("intervalMin", 0), rung = prefs.getInt("bellsRung", 0);
        if (interval > 0 && played >= (long) (rung + 1) * interval * 60_000L) {
            ring(bellInterval);
            prefs.edit().putInt("bellsRung", rung + 1).commit();
            log("bell", null);
        }
        schedule();
    }

    /** The end bell when the sit ran its length, then everything lets go and the notice goes with the service. */
    void finish(String how) {
        SharedPreferences prefs = prefs();
        String status = prefs.getString("status", "");
        if (!"playing".equals(status) && !"paused".equals(status)) { stopSelf(); return; }
        long played = playedMs();
        prefs.edit().putString("status", how).putLong("playedMs", played).commit();
        log(how, null);
        handler.removeCallbacksAndMessages(null);
        if (player != null) { player.setVolume(0.2f, 0.2f); }
        if ("ended".equals(how)) ring(bellEnd);
        handler.postDelayed(() -> { release(); stopForeground(true); stopSelf(); }, "ended".equals(how) ? 2500 : 200);
    }

    private void release() {
        if (player != null) { try { player.stop(); } catch (Exception ignored) { } player.release(); player = null; }
        if (bells != null) { bells.release(); bells = null; }
        if (session != null) { session.setActive(false); session.release(); session = null; }
        if (audio != null && focusRequest != null && Build.VERSION.SDK_INT >= 26) audio.abandonAudioFocusRequest(focusRequest);
        holdWake(false);
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        release();
        super.onDestroy();
    }
}
