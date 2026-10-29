# NAITIK-006 media assets

All media is loaded from `public/assets/` using Vite's configured base path. Keep the filenames shown here to replace media without editing component logic. The site remains playable when optional files are absent.

## Personal birthday assets

- `public/assets/voice-note.m4a` — Naitik's personal voice message. M4A/AAC works in current Chrome, Safari, and Edge. An MP3 replacement is broadly compatible; update the filename in `src/components/BirthdayFinale.jsx` if changing the extension.
- `public/assets/birthday-song.mp3` — owner-authorized Hindi birthday song. It starts quietly after the voice note and loops continuously; it is ducked during the Marathi message and raised for the celebration. MP3 is broadly supported. Other formats require updating the component source path.
- `public/assets/naitik-photo-1.jpg` — first personal photo.
- `public/assets/naitik-photo-2.jpg` — optional second personal photo. Portrait and landscape images are supported without stretching. Missing images are skipped; when both are unavailable a clearly marked placeholder appears.

Only publish a song recording the owner is authorized to use. Assets committed to a public repository or deployed to public GitHub Pages can be accessed by anyone.

## Optional spoken narration

Place narration clips in `public/assets/audio/narration/`. The app uses one shared narration player, observes the shared sound toggle, ducks the in-app ambience while clips play, and cancels or replaces a previous line instead of overlapping voices. If a clip is missing or cannot play, the same written instruction remains on screen and the browser's built-in speech synthesis reads the line when available. This generated mission-control narration is not a family recording. If speech synthesis is unavailable or muted, gameplay proceeds silently.

Narration clip filenames:

| Moment | File |
| --- | --- |
| Stage 1 welcome | `stage1-welcome.mp3` |
| Stage 2 ignition, liftoff, atmosphere, arrival | `stage2-ignition.mp3`, `stage2-liftoff.mp3`, `stage2-atmosphere.mp3`, `stage2-arrival.mp3` |
| Stage 3 signal, worlds, rocket-ready, hints | `stage3-signal.mp3`, `stage3-wonder-world.mp3`, `stage3-rocket-forge.mp3`, `stage3-pixel-planet.mp3`, `stage3-encouragement.mp3`, `stage3-rocket-ready.mp3`, `stage3-pattern-solved.mp3`, `stage3-hint.mp3` |
| Stage 4 Asteroid Run | `stage4-asteroid-run.mp3`, `stage4-energy-star.mp3`, `stage4-asteroid-bump.mp3`, `stage4-gate.mp3` |
| Stage 5 birthday reveal | `stage5-birthday-reveal.mp3` |

The short Stage 2 countdown numbers are spoken by speech synthesis for close timing with the visual countdown. Voice-note, song, and photo fallbacks are described in `public/assets/README.md`.
