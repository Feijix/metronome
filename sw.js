const CACHE_NAME = 'gap-metronome-v60';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/components.css',
  '/css/responsive.css',
  '/assets/fonts/Bravura.woff2',
  '/js/app.js',
  '/js/config/constants.js',
  '/js/core/StateManager.js',
  '/js/core/MetronomeAudio.js',
  '/js/core/MetronomeScheduler.js',
  '/js/core/audio/SamplePlayer.js',
  '/assets/sounds/digital.wav',
  '/assets/sounds/mechanical.wav',
  '/assets/sounds/clave.ogg',
  '/assets/sounds/cowbell.ogg',
  '/assets/sounds/block.wav',
  '/assets/sounds/shaker.wav',
  '/assets/sounds/voice/1.wav',
  '/assets/sounds/voice/2.wav',
  '/assets/sounds/voice/3.wav',
  '/assets/sounds/voice/4.wav',
  '/assets/sounds/voice/5.wav',
  '/assets/sounds/voice/6.wav',
  '/assets/sounds/voice/7.wav',
  '/assets/sounds/voice/8.wav',
  '/assets/sounds/voice/9.wav',
  '/assets/sounds/voice/10.wav',
  '/assets/sounds/voice/11.wav',
  '/assets/sounds/voice/12.wav',
  '/assets/sounds/voice/13.wav',
  '/assets/sounds/voice/14.wav',
  '/assets/sounds/voice/15.wav',
  '/assets/sounds/voice/16.wav',
  '/js/features/TapTempo.js',
  '/js/features/VoiceCounter.js',
  '/js/ui/BPMDisplay.js',
  '/js/ui/BeatsVisualizer.js',
  '/js/ui/GapPatternWheel.js',
  '/js/ui/TimeSignatureWheel.js',
  '/js/ui/SubdivisionControl.js',
  '/js/ui/PlayButton.js',
  '/js/ui/SettingsPanel.js',
  '/js/ui/ScreenFlash.js',
  '/js/utils/DOMHelpers.js',
  '/js/utils/PWAInstaller.js',
  '/js/utils/NoteRenderer.js',
  '/js/utils/ThemeManager.js',
  '/js/utils/WakeLockManager.js',
  '/js/utils/NativeBridge.js',
  '/js/utils/PresetManager.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - NETWORK FIRST, cache as offline fallback.
// In the Capacitor app "network" is the locally-bundled asset, so freshly
// installed files always win (no stale cache after an app update). The cache
// is only used when offline, preserving PWA offline support in the browser.
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
