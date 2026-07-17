# Click sound samples

All samples below are Public Domain (PD) or CC0 — free to use and redistribute
with no attribution required. Credits listed as courtesy.

| File           | Sound        | Source                                                                                  | License |
|----------------|--------------|-----------------------------------------------------------------------------------------|---------|
| digital.wav    | Digital beep | Synthesized in-repo (scripts/gen-sounds.js) — a digital metronome is an electronic tone | original / CC0 |
| mechanical.wav | Wind-up metronome tick | Synthesized in-repo (scripts/gen-sounds.js) — dry escapement click model       | original / CC0 |
| clave.ogg      | Wooden claves | Wikimedia Commons — "Son clave.ogg"                                                     | PD      |
| cowbell.ogg    | Cowbell      | Wikimedia Commons — "Cowbell.ogg"                                                        | PD      |
| block.wav      | Wood/temple block | Synthesized in-repo (scripts/gen-sounds.js) — additive woodblock model             | original / CC0 |
| shaker.wav     | Egg shaker / maraca | Synthesized in-repo (scripts/gen-sounds.js) — high-passed noise burst            | original / CC0 |

The app plays only the first transient ("hit") of each recording via runtime
onset detection, so multi-hit source recordings render as a single clean click.

## Spoken bar-count (assets/sounds/voice/1.wav … 16.wav)

Number words spoken by the "voice count" feature. Generated locally with the
Windows SAPI text-to-speech engine (Microsoft Zira). Replaceable: drop your own
`N.wav` recordings (spoken "one".."sixteen") into `assets/sounds/voice/` to use
a different voice.
