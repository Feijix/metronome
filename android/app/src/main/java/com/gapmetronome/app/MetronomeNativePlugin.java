package com.gapmetronome.app;

import android.content.Intent;
import android.view.WindowManager;

import androidx.core.content.ContextCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Native helpers the web layer can't do on its own inside Android WebView:
 *  - keep the screen on (the web Wake Lock API is unreliable / missing in WebView)
 *  - keep the process + audio alive while the screen is off, via a
 *    media-playback foreground service started while the metronome plays.
 */
@CapacitorPlugin(name = "MetronomeNative")
public class MetronomeNativePlugin extends Plugin {

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

    @PluginMethod
    public void startPlayback(PluginCall call) {
        Intent intent = new Intent(getContext(), PlaybackService.class);
        try {
            ContextCompat.startForegroundService(getContext(), intent);
            call.resolve();
        } catch (Exception e) {
            // e.g. ForegroundServiceStartNotAllowedException if somehow called
            // from the background — playback still works while visible.
            call.reject("Could not start playback service", e);
        }
    }

    @PluginMethod
    public void stopPlayback(PluginCall call) {
        getContext().stopService(new Intent(getContext(), PlaybackService.class));
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        getContext().stopService(new Intent(getContext(), PlaybackService.class));
    }
}
