const CACHE_NAME = 'gap-metronome-v30';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/components.css',
  '/css/responsive.css',
  '/js/app.js',
  '/js/config/constants.js',
  '/js/core/StateManager.js',
  '/js/core/MetronomeAudio.js',
  '/js/core/MetronomeScheduler.js',
  '/js/core/audio/SoundFactory.js',
  '/js/core/audio/synthesizers/ClaveSynthesizer.js',
  '/js/core/audio/synthesizers/DigitalSynthesizer.js',
  '/js/core/audio/synthesizers/RimshotSynthesizer.js',
  '/js/core/audio/synthesizers/AgogoSynthesizer.js',
  '/js/core/audio/synthesizers/HiHatSynthesizer.js',
  '/js/core/audio/synthesizers/KickSynthesizer.js',
  '/js/core/audio/synthesizers/CowbellSynthesizer.js',
  '/js/features/TapTempo.js',
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

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // Clone the response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
  );
});
