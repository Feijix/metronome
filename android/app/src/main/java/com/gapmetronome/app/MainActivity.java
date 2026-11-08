package com.gapmetronome.app;

import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MetronomeNativePlugin.class);
        super.onCreate(savedInstanceState);

        // Keep the WebView renderer at "important" priority even when the
        // screen is off / app is not visible, so Android doesn't deprioritise
        // or kill it while the metronome plays in the background.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WebView webView = getBridge().getWebView();
            webView.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);
        }
    }
}
