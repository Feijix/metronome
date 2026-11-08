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
import android.os.IBinder;
import android.os.PowerManager;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

/**
 * Foreground "media playback" service that runs while the metronome is
 * playing. It keeps the app process from being frozen when the screen is
 * turned off (power button) and holds a partial wake lock so the CPU keeps
 * driving the WebView's audio scheduler.
 */
public class PlaybackService extends Service {

    private static final String CHANNEL_ID = "metronome_playback";
    private static final int NOTIFICATION_ID = 1001;
    // Safety net: never hold the CPU awake for more than 4h if stop is missed.
    private static final long WAKE_LOCK_TIMEOUT_MS = 4L * 60 * 60 * 1000;

    private PowerManager.WakeLock wakeLock;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        createChannel();

        Intent launch = new Intent(this, MainActivity.class)
                .setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(
                this, 0, launch, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(getString(R.string.app_name))
                .setContentText("Metronome is playing")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(contentIntent)
                .setOngoing(true)
                .setSilent(true)
                .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();

        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                ? ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK : 0;
        ServiceCompat.startForeground(this, NOTIFICATION_ID, notification, type);

        if (wakeLock == null) {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "GapMetronome:playback");
            wakeLock.setReferenceCounted(false);
        }
        wakeLock.acquire(WAKE_LOCK_TIMEOUT_MS);

        // If the system kills us, don't restart without the app driving audio.
        return START_NOT_STICKY;
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "Playback", NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Shown while the metronome is playing");
        channel.setShowBadge(false);
        nm.createNotificationChannel(channel);
    }

    @Override
    public void onDestroy() {
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        wakeLock = null;
        super.onDestroy();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // App swiped away from recents: the WebView is gone, so stop.
        stopSelf();
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
