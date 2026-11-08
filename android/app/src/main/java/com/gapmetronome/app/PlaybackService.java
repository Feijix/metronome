package com.gapmetronome.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.ServiceCompat;

/**
 * Playback notification + background keep-alive for the metronome.
 *
 * While playing it runs as a "media playback" foreground service holding a
 * partial wake lock, so audio keeps going with the screen off. The
 * notification shows the tempo and a Pause button. When paused it releases the
 * wake lock but stays in the foreground (otherwise the OS freezes the app and
 * its WebView, and Play could no longer reach the page), showing a Play
 * button; it removes itself after 10 minutes paused or when swiped away.
 *
 * The web app owns the audio: Play/Pause taps are forwarded to it through
 * {@link #controlListener}; it then reports the new state back via
 * {@link MetronomeNativePlugin#setPlaybackState}.
 */
public class PlaybackService extends Service {

    private static final String TAG = "PlaybackService";

    static final String ACTION_UPDATE = "com.gapmetronome.app.action.UPDATE";
    static final String ACTION_PLAY = "com.gapmetronome.app.action.PLAY";
    static final String ACTION_PAUSE = "com.gapmetronome.app.action.PAUSE";
    static final String ACTION_DISMISS = "com.gapmetronome.app.action.DISMISS";
    static final String EXTRA_PLAYING = "playing";
    static final String EXTRA_BPM = "bpm";

    private static final String CHANNEL_ID = "metronome_playback";
    private static final int NOTIFICATION_ID = 1001;
    // Safety net: never hold the CPU awake for more than 4h if stop is missed.
    private static final long WAKE_LOCK_TIMEOUT_MS = 4L * 60 * 60 * 1000;

    /** Receives "play" / "pause" taps from the notification. */
    interface ControlListener {
        void onControl(String action);
    }

    @Nullable static volatile ControlListener controlListener;
    @Nullable private static PlaybackService instance;

    // Remove the paused notification (and stop the service) after this long.
    private static final long PAUSED_TIMEOUT_MS = 10L * 60 * 1000;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable pausedTimeout = () -> {
        if (!this.playing) shutdown();
    };

    private PowerManager.WakeLock wakeLock;
    private boolean playing;
    private int bpm;

    @Nullable
    static PlaybackService getInstance() {
        return instance;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        createChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;

        if (ACTION_PLAY.equals(action) || ACTION_PAUSE.equals(action)) {
            ControlListener l = controlListener;
            if (l != null) {
                l.onControl(ACTION_PLAY.equals(action) ? "play" : "pause");
            } else {
                // The app UI is gone (process restarted from a stale
                // notification) — nothing can play, so clean up.
                shutdown();
            }
            return START_NOT_STICKY;
        }

        if (ACTION_DISMISS.equals(action)) {
            if (!playing) shutdown();
            return START_NOT_STICKY;
        }

        // ACTION_UPDATE (or a plain start)
        boolean wantPlaying = intent == null || intent.getBooleanExtra(EXTRA_PLAYING, true);
        int newBpm = intent != null ? intent.getIntExtra(EXTRA_BPM, bpm) : bpm;
        applyState(wantPlaying, newBpm);
        return START_NOT_STICKY;
    }

    /** Update the notification / foreground state. Must run on the main thread. */
    void applyState(boolean isPlaying, int newBpm) {
        this.playing = isPlaying;
        if (newBpm > 0) this.bpm = newBpm;
        Notification n = buildNotification();

        // Stay in the foreground while paused too: if we dropped out, the OS
        // freezes the backgrounded app (incl. the WebView renderer) and the
        // notification's Play button could no longer reach the page.
        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                ? ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK : 0;
        try {
            ServiceCompat.startForeground(this, NOTIFICATION_ID, n, type);
        } catch (Exception e) {
            // Not allowed to (re)enter the foreground from the background
            // right now; still show the state.
            Log.w(TAG, "startForeground failed", e);
            notifySafely(n);
        }

        handler.removeCallbacks(pausedTimeout);
        if (isPlaying) {
            acquireWakeLock();
        } else {
            // Paused: let the CPU sleep, and don't linger forever.
            releaseWakeLock();
            handler.postDelayed(pausedTimeout, PAUSED_TIMEOUT_MS);
        }
    }

    /** Re-post the notification for the current state (e.g. after permission grant). */
    void refresh() {
        applyState(playing, bpm);
    }

    /** Remove the notification and stop the service entirely. */
    void shutdown() {
        playing = false;
        handler.removeCallbacks(pausedTimeout);
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        NotificationManagerCompat.from(this).cancel(NOTIFICATION_ID);
        releaseWakeLock();
        stopSelf();
    }

    private Notification buildNotification() {
        Intent launch = new Intent(this, MainActivity.class)
                .setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(
                this, 0, launch, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        PendingIntent toggle = servicePendingIntent(playing ? ACTION_PAUSE : ACTION_PLAY, 1);
        PendingIntent dismiss = servicePendingIntent(ACTION_DISMISS, 2);

        String tempo = bpm > 0 ? bpm + " BPM" : "";
        String text = playing
                ? (tempo.isEmpty() ? "Playing" : "Playing · " + tempo)
                : (tempo.isEmpty() ? "Paused" : "Paused · " + tempo);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_metronome)
                .setContentTitle(getString(R.string.app_name))
                .setContentText(text)
                .setContentIntent(contentIntent)
                .setDeleteIntent(dismiss)
                .addAction(playing ? R.drawable.ic_notif_pause : R.drawable.ic_notif_play,
                        playing ? "Pause" : "Play", toggle)
                // Media style shows the Play/Pause button even when collapsed.
                .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                        .setShowActionsInCompactView(0))
                .setOngoing(playing)
                .setOnlyAlertOnce(true)
                .setSilent(true)
                .setShowWhen(false)
                .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
                .build();
    }

    private PendingIntent servicePendingIntent(String action, int requestCode) {
        Intent i = new Intent(this, PlaybackService.class).setAction(action);
        return PendingIntent.getService(this, requestCode, i,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private void notifySafely(Notification n) {
        try {
            NotificationManagerCompat.from(this).notify(NOTIFICATION_ID, n);
        } catch (SecurityException e) {
            // POST_NOTIFICATIONS not granted (Android 13+): nothing to show.
        }
    }

    private void acquireWakeLock() {
        if (wakeLock == null) {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "GapMetronome:playback");
            wakeLock.setReferenceCounted(false);
        }
        wakeLock.acquire(WAKE_LOCK_TIMEOUT_MS);
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "Playback", NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Play/pause controls while the metronome is in use");
        channel.setShowBadge(false);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(channel);
    }

    @Override
    public void onDestroy() {
        releaseWakeLock();
        wakeLock = null;
        if (instance == this) instance = null;
        super.onDestroy();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // App swiped away from recents: the WebView is gone, so stop.
        shutdown();
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
