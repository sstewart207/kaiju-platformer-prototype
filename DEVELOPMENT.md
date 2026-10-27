# Development notes

[Back to the project overview](README.md).

GitHub Pages hosts the `dist` build. `.github/workflows/pages.yml` checks and deploys pushes to `main` using standard GitHub-hosted runners. The build uses the repository subpath, and the sprite URL follows Vite's base URL. Local development and preview keep the normal `/` path.

To run the optional anonymous hosted-build smoke test in PowerShell:

```powershell
$env:PLAYTEST_URL='https://sstewart207.github.io/kaiju-platformer-prototype/'
npm run test:browser -- --grep 'published game'
```

## Run locally

Use Node.js 22.12+ or 24 LTS. From this folder:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite, normally http://127.0.0.1:5173/. The first installation needs internet access. All game artwork and fonts are served locally afterward.

```powershell
npm run build        # Strict TypeScript check and production build
npm run preview      # Serve the production build
npm test             # Physics/controller regression tests
npm run test:browser # Edge browser tests on Windows
```

The browser tests use an installed Microsoft Edge. For other operating systems, change the Playwright channel in its config to an installed browser.

## Controls

| Key | Action |
| --- | --- |
| WASD or arrow keys | Move relative to the camera |
| Space | Jump; hold for more height |
| Shift | Dash; repeated presses are supported |
| Escape or pause button | Pause / resume |
| R | Restart the course |

Click **Start** or press Cross on the DualSense to start. Follow the blue flags to the sun gate. You can walk the connected main route without jumping, or jump onto the terraces and ride the moving stone. Stepping off the path lands on solid grass; only leaving the entire world boundary triggers recovery to the courtyard. Losing browser focus pauses the game and clears held inputs.

### DualSense

Connect over USB or Windows Bluetooth, focus the page and press a controller button. Use the browser's standard Gamepad mapping. Left stick / D-pad moves, Cross jumps or selects, Options pauses/resumes, Circle returns from pause, and Triangle restarts. Stick tilt controls speed. A 30% radial dead zone, small-axis noise rejection and cardinal-direction assist reduce unintended movement. Releasing input stops grounded movement immediately; idle slope correction cannot slide the character sideways. Up/down selects the pause-menu buttons. Release held controls after menu transitions or reconnecting before the next action.

Prompts switch between keyboard and controller. Disconnecting the active controller pauses the game; keyboard remains available. Unknown nonstandard mappings are reported rather than guessed. Automated tests use synthetic Gamepad snapshots; **physical DualSense USB/Bluetooth validation is pending**. See [PLAYTEST.md](PLAYTEST.md) for the tester checklist and results table. The implementation follows the [standard Gamepad mapping](https://w3c.github.io/gamepad/#remapping) and [per-frame polling guidance](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API).

The redesigned ruins has a weaving gallery route, jumpable central breaks, raised shuttle docks, a longer lower-garden alternative and final hurdles with a side lane. The shuttle has no walkable bridge beneath it. Missing a shortcut lands on safe grass. Blue floor markers must be passed in order before finishing. See [LEVEL_DESIGN.md](LEVEL_DESIGN.md) for the layout and shared collision data.

Movement is **8.5 units/second**, up from 5.8. Dash is **16.5 units/second for 0.22 seconds**, with a **0.45-second interval between starts** and a small press buffer. Use **Shift** or DualSense **Square / R1**. Dash direction is committed for that burst; normal steering returns afterward. Jump-dash works, gravity/collision remain active, and holding a dash button does not auto-repeat. The HUD shows elapsed time and dash readiness.

The extended walking route is verified at **152.10 seconds** with no jumps or falls. The earlier 39.50-second walking / 37.35-second shortcut measurements describe the superseded short layout. These scripted runs are geometry/input checks, not measured human playtime. See LEVEL_DESIGN.md and QA_RESULTS.md for the current layout and validation.

## Implementation map

- `src/player.ts`, `physics.ts`, `input.ts`, `timestep.ts`: Rapier kinematic capsule, fixed 60 Hz simulation, buffered/coyote/variable-height jumps, wall sliding and swept moving-platform transport.
- `src/course.ts`, `world.ts`: shared platform and pillar definitions, authored route, deterministic pixel textures, lighting, background ruins and sun gate. Plants and pennants are decorative; stone columns and terrain are solid.
- `src/camera.ts`, `animation.ts`, `types.ts`: smooth orthographic tracking, render-only pixel snapping, transparent directional atlas frames, animation clips and ground anchors.
- `src/ui.ts`, `main.ts`: title, pause, finish/replay, focus handling, rendering and scene integration. Diagnostics exist only on the development server with `?test`; they are absent from the production build.

## Character asset pipeline

The document's posters are references, not sprite sheets. The source Solargon concept is preserved under `art/references/`. The active, generated draft atlas is `public/assets/solargon-atlas-v2.png`; the earlier draft is preserved under `art/drafts/`.

The typed `CharacterManifest` supports PNG/WebP paths, directional views, frame sequences, frame rate, loop behavior, sprite size and ground anchors. Optional per-frame rectangles support uneven source sheets. The gameplay controller has no artwork dependency. To replace the character, supply a transparent atlas and update its manifest and frame metadata.

For this generated draft, run the read-only pixel audit / metadata builder:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/audit-sprites.ps1
```

It reads the PNG and writes frame rectangles, measured ground anchors and edge-contact flags to `art/solargon-atlas-v2.audit.json`. The script's row boundaries are authored specifically for this draft's irregular gutters; adjust them when replacing the atlas. It does not modify image pixels. Generation method, reference and full prompts are in `art/GENERATION.md`.

## Verified checkpoint

- Production build and strict TypeScript checks pass.
- **31 unit/physics tests pass**, covering movement, collision, platform carry, render-rate independence, controller input, idle stability, dash distance, repeat/cooldown behavior, thin-wall collision, grass recovery and enemy melee/fireball behavior.
- Browser checks cover both keyboard routes, the faster jump/dash/shuttle route, missed-shuttle recovery to the finish, ordered route checks, performance, compact UI and synthetic DualSense input. A visual capture checks character occlusion. Hosted launch and the full-course hardware benchmark are opt-in. Physical USB/Bluetooth playtesting remains pending.
- The console-error/page-error capture in the live rendering test is empty. The live in-app browser was also checked for movement, jumping and presentation.
- Full-course 1080p benchmark: **143.9 FPS average**, **7.0 ms p95**, no frames over 33.4 ms in the measured run. Edge headless, 1920 × 1080 viewport/render buffer, RTX 5070 Ti Laptop GPU. This is this laptop's result; Chromebook performance remains untested. Measurements and visual comparisons are in [QA_RESULTS.md](QA_RESULTS.md).
- Screenshots are preserved under `art/playtest/`.

Rendering dimensions are defined in `src/rendering.ts`. Camera/sprite pixel snapping follows the 1080p buffer. Static scenery is batched, textures/materials warm up before Start, and a faint silhouette keeps Solargon visible behind walls. To repeat the real-time full-course benchmark in PowerShell: `$env:COURSE_BENCHMARK='review'; npm run test:browser -- performance.spec.ts`.

## Artwork and milestone limits

The sprite atlas is a generated **draft for visual review**. All four directions and five movement states are connected. Falling currently shares the jump pose. Idle/run movement is subtle; wing/leg counts and silhouettes are not perfectly consistent between generated frames. Some wings/tails reach cell boundaries (recorded by the audit), so minor edge clipping remains. A final artist-cleaned sprite pass should provide consistent anatomy, clear run timing, separate falling frames, and transparent padding around every frame.

The public course includes two checkpoints. One bite/fireball enemy and three-hit player health are development-only prototypes: run `npm run dev` and open `http://127.0.0.1:5173/?enemies=1` to preview them. Production builds ignore this flag and do not load the enemy atlas, render enemies or enable their collisions/attacks. Patrick will decide between dragons and zombies before further enemy work. Audio, elemental abilities, coins, touch support, chapter rewards, other playable characters and multiplayer remain unimplemented.

The production bundle includes Rapier's inline WebAssembly, so Vite reports a large chunk warning. It is functional and served locally; optimizing first-download size can wait until deployment is in scope.

## Next review

Play the redesigned course and review Solargon's silhouette, dash/jump rhythm, route readability, and whether catching the shuttle feels worthwhile. Character selection, final enemy design/animation/gameplay, and LAN/browser co-op planning are recorded in TODO.md. GitHub Pages hosts the current single-player build; multiplayer is not implemented.

Use [ART_DIRECTION.md](ART_DIRECTION.md) for future character artwork: it includes original references, character-specific features, rendering constants, sprite requirements and integration checks. Requested follow-ups are tracked in [TODO.md](TODO.md).
