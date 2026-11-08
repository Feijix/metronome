package com.gapmetronome.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.view.WindowManager;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Native helpers the web layer can't do on its own inside Android WebView:
 *  - keep the screen on (the web Wake Lock API is unreliable / missing in WebView)
 *  - playback notification with Play/Pause, which also keeps the process and
 *    audio alive while the screen is off (see {@link PlaybackService}).
 *
 * Notification taps are delivered to the page as window events
 * "metronome:play" / "metronome:pause".
 */
@CapacitorPlugin(name = "MetronomeNative")
public class MetronomeNativePlugin extends Plugin {

    private static final String PREFS = "metronome_native";
    private static final String KEY_ASKED_NOTIF = "askedNotificationPermission";
    private static final int REQ_NOTIFICATIONS = 4711;

    @Override
    public void load() {
        PlaybackService.controlListener = action ->
                getBridge().triggerWindowJSEvent("metronome:" + action);
    }

    @PluginMethod
    public void setKeepScreenOn(PluginCall call) {
        final boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        getActivity().runOnUiThread(() -> {
            if (enabled) {
                getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            } else {
                getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }
        });
        call.resolve();
    }

    /**
     * Report the current playback state: { playing: boolean, bpm: number }.
     * Starts the foreground service on the first play; afterwards updates it.
     */
    @PluginMethod
    public void setPlaybackState(PluginCall call) {
        final boolean playing = Boolean.TRUE.equals(call.getBoolean("playing", false));
        final int bpm = call.getInt("bpm", 0);

        if (playing) maybeAskNotificationPermission();

        getActivity().runOnUiThread(() -> {
            PlaybackService svc = PlaybackService.getInstance();
            if (svc != null) {
                svc.applyState(playing, bpm);
                call.resolve();
                return;
            }
            if (!playing) { // never started — nothing to show for "paused"
                call.resolve();
                return;
            }
            Intent intent = new Intent(getContext(), PlaybackService.class)
                    .setAction(PlaybackService.ACTION_UPDATE)
                    .putExtra(PlaybackService.EXTRA_PLAYING, true)
                    .putExtra(PlaybackService.EXTRA_BPM, bpm);
            try {
                ContextCompat.startForegroundService(getContext(), intent);
                call.resolve();
            } catch (Exception e) {
                // e.g. ForegroundServiceStartNotAllowedException if called from
                // the background — playback still works while visible.
                call.reject("Could not start playback service", e);
            }
        });
    }

    /** Android 13+: ask once for notification permission so controls are visible. */
    private void maybeAskNotificationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return;
        Context ctx = getContext();
        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED) return;
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (prefs.getBoolean(KEY_ASKED_NOTIF, false)) return;
        prefs.edit().putBoolean(KEY_ASKED_NOTIF, true).apply();
        ActivityCompat.requestPermissions(getActivity(),
                new String[] { Manifest.permission.POST_NOTIFICATIONS }, REQ_NOTIFICATIONS);
    }

    @Override
    protected void handleOnResume() {
        // Back from the notification-permission dialog (or elsewhere): a
        // notification posted while permission was missing isn't shown
        // retroactively, so post it again.
        PlaybackService svc = PlaybackService.getInstance();
        if (svc != null) svc.refresh();
    }

    @Override
    protected void handleOnDestroy() {
        PlaybackService.controlListener = null;
        PlaybackService svc = PlaybackService.getInstance();
        if (svc != null) {
            svc.shutdown();
        } else {
            NotificationManagerCompat.from(getContext()).cancelAll();
        }
    }
}
