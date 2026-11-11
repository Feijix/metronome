// Full deploy to connected Android device.
// Run: npm run deploy              (keeps the app's saved settings and presets)
//      npm run deploy -- --clean   (also wipes all app data first)
// With several devices connected, pick one: set ANDROID_SERIAL=<serial>.
const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const ANDROID_DIR = path.join(ROOT, 'android');
const APK = path.join(ANDROID_DIR, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const APP_ID = 'com.gapmetronome.app';
const GRADLEW = process.platform === 'win32'
  ? path.join(ANDROID_DIR, 'gradlew.bat')
  : path.join(ANDROID_DIR, 'gradlew');

function run(cmd, cwd = ROOT) {
  console.log(`\n→ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

function findAdb() {
  const candidates = [
    process.env.ANDROID_HOME && path.join(process.env.ANDROID_HOME, 'platform-tools'),
    process.env.ANDROID_SDK_ROOT && path.join(process.env.ANDROID_SDK_ROOT, 'platform-tools'),
    process.platform === 'win32'
      ? path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk', 'platform-tools')
      : path.join(os.homedir(), 'Android', 'Sdk', 'platform-tools'),
  ].filter(Boolean);

  const exe = process.platform === 'win32' ? 'adb.exe' : 'adb';
  for (const dir of candidates) {
    const full = path.join(dir, exe);
    if (fs.existsSync(full)) return full;
  }
  return 'adb'; // hope it's on PATH
}

const adb = findAdb();
const CLEAN = process.argv.includes('--clean');

// 1. Build web assets and sync into Android project
run('npm run sync');

// 2. Build APK (clean to ensure assets are always repackaged)
run(`${GRADLEW} clean assembleDebug`, ANDROID_DIR);

// 3. Optional: wipe all app data (settings, presets, WebView caches). Not needed
//    for updates: the service worker loads bundled files first and every
//    release bumps its cache name. Only for a truly fresh start.
if (CLEAN) {
  console.log('\n--clean: wiping app data (settings and presets will be lost)');
  run(`"${adb}" shell pm clear ${APP_ID}`);
}

// 4. Install
run(`"${adb}" install -r "${APK}"`);

// 5. Launch
run(`"${adb}" shell am start -n ${APP_ID}/.MainActivity`);

console.log('\nDone.');
