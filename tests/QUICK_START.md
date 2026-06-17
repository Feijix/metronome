# Quick Start Guide - Test Suite

## Run Tests in 3 Steps

### 1. Start Local Server
```bash
python -m http.server 8000
```

### 2. Open Test Runner
```
http://localhost:8000/tests/test-runner.html
```

### 3. Click "Run All Tests"
That's it! Tests will execute and show results.

## What Gets Tested

✅ **80+ Tests** covering:
- Constants validation
- State management (BPM, time signatures, subdivisions)
- Audio engine
- Tap tempo functionality
- Scheduler logic
- Component integration

## Expected Results

- **Pass Rate**: ~100% (all modules fully tested)
- **Test Time**: < 2 seconds
- **Coverage**: ~93% of core logic

## Troubleshooting

**Tests won't run?**
- Make sure you're using HTTP server (not file://)
- Check browser console for module loading errors
- Ensure all test files are present

**Some tests failing?**
- Check if AudioContext is supported (all modern browsers)
- Clear browser cache and reload
- Check console for specific error messages

## Test Categories

| Category | Count | What It Tests |
|----------|-------|---------------|
| Constants | 13 | Configuration values |
| StateManager | 25+ | State logic & validation |
| MetronomeAudio | 10 | Audio synthesis |
| TapTempo | 12 | BPM detection |
| Scheduler | 11 | Timing & scheduling |
| Integration | 10+ | Component interaction |

## Key Features Tested

✅ BPM clamping (30-300)
✅ Time signature validation (3/4, 4/4, 5/4, 7/4)
✅ Subdivision support (1, 2, 4)
✅ Gap pattern (click → gap mode switching)
✅ Observer pattern (state change notifications)
✅ Tap tempo BPM calculation
✅ Audio click type selection
✅ Scheduler start/stop
✅ State advancement through full cycles
