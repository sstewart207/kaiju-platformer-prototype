# QA results — October 27, 2026

## Idle breathing and walking hair

Solargon and human zombies have subtle upper-body breathing while idle. Zombie hair crowns sway by up to two render pixels while walking, then settle. The lower legs/feet remain fixed; action and dash poses clear the deformation. Artwork, frame UVs, physics and controls are unchanged. Both visible and wall-occluded sprites share the same subdivided geometry.

40 unit/physics tests and 12 relevant local browser checks pass, including fixed lower vertices, bounded crown motion, exact pause, pixel-identical rendered feet, all 88 atlas crops, combat, controller input and wall occlusion. Production build passes. Active 1080p enemy scene measured 144.01 FPS / 7.1 ms p95 on this laptop; no console errors. This was a short scene check, not a repeated full-course benchmark. [Measurements](art/playtest/performance/secondary-motion-fight.json) · [Rest](art/playtest/secondary-motion-rest.png) · [Breathing/hair motion](art/playtest/secondary-motion-inhale.png).

## Solargon combat and human zombies

Solargon now has J/Circle swipes and K/R2 solar beams. Three bipedal human zombies patrol, chase and use telegraphed swipes/fireballs. Their art is separate from behavior and remains replaceable. Three-hit player health has one shared damage-protection window; defeat briefly shows a pose before checkpoint recovery. Restart clears all encounters and attack state. Walking, jumping, rapid dash and stage geometry are unchanged.

38 unit/physics tests pass, including attack facing/reach/height, once-per-swing damage, solar charge/cooldown/piercing, thin-wall blocking, shared invulnerability and following authored waypoints to regain sight. The full local browser suite passed 23 checks; a separate full-course performance check also passed. Coverage includes both keyboard routes with enemies enabled, checkpoint recovery after combat defeat, synthetic Circle/R2 attacks and held-button suppression, pause/restart and all 88 sprite crops. No physical test of the new combat bindings is claimed.

Full-course 1080p run: 2:14.30, **143.99 FPS**, **7.1 ms p95**, maximum 20.8 ms, no frames above 33.4 ms and no console errors. Active enemy fight: 143.76 FPS / 7.1 ms p95. Edge headless on the RTX 5070 Ti laptop; Chromebook performance remains untested. [Course data](art/playtest/performance/human-combat-1080p.json) · [Fight data](art/playtest/performance/human-zombie-fight-1080p.json).

Inspected side-by-side scale, swipe/beam captures and four-direction contact sheets. The read-only audits and browser alpha-component checks retain complete silhouettes without neighboring-character fragments. Draft limitations: zombie walking has two poses; Solargon's anatomy and transition polish need review; falling shares jump artwork. AI uses authored patrol routes and sight checks, not general navigation-mesh pathfinding. [Art and full built-in generation prompts](art/concepts/human-zombies/GENERATION.md).

## Dash speed lines

Added six small cream/gold tapered lines during active dashes, aligned to camera-projected movement. The effect uses one reusable mesh, freezes with pause and clears when the burst ends or the run restarts. Movement and input are unchanged. All four directional captures were inspected. 32 unit/physics tests, four relevant browser checks and the production build pass; short idle/jump rendering measured 144 FPS / 7 ms p95. The effect adds one draw call while active; no full-course benchmark was repeated.

## Rapid horizontal dash

Dash now uses a steady low pose, 22 units/second for 0.18 seconds and 0.23 seconds between starts, with a 0.12-second early-tap buffer. The fixed step permits a burst every 14 ticks (about 4.3 per second). Direction is committed within a burst; queued bursts take the latest movement direction. Normal walking, jumping, gravity and collision dimensions are unchanged.

32 unit/physics tests and 18 local browser checks pass; strict TypeScript/production build passes. Repeated flat-ground dash taps remain grounded, stay within the controller contact skin and produce zero jumps. Tests cover buffered reversal, keyboard and synthetic Square/R1 chaining, jump-dash, thin walls, both walking routes, shuttle/recovery/checkpoints, pause/restart and sprite boundaries. [Ground dash capture](art/playtest/ground-dash.png) was inspected. The short rendering check measured 144 FPS / 7 ms p95 at 1080p; the full-course hardware benchmark was not repeated. This dash revision has not yet had a physical-controller feel test.

## Sprite frame fix (#3)

Reproduced neighboring-frame fragments on the left/back rows. The generated atlas has uneven horizontal spacing, but its old metadata divided every row into equal eighths. Updated each row's cuts between complete silhouettes and retained constant source-pixel scale. Original artwork, movement and controls are unchanged.

The browser pixel regression checks all 32 crops against connected silhouettes in the actual atlas, rejecting partial characters and neighboring-character fragments. Before/after contact sheets were inspected for all directions and idle/run/jump/landing poses: [before](art/playtest/sprites-before.png), [after](art/playtest/sprites-after.png). Falling still shares the existing jump pose; anatomy polish remains separate work.

Validation: 31 unit/physics tests, nine relevant browser checks and strict TypeScript/production build pass. Browser checks cover all sprite crops, synthetic controller behavior, the saved enemy preview, jump/pause/restart/focus handling and compact layout. The short 1080p rendering check measured 144 FPS with 7 ms p95; the full-course benchmark was not repeated for this artwork-metadata change.

## Release scope

The longer course, two checkpoints and HUD cleanup are released together. Enemy combat is saved behind the development-only `?enemies=1` preview; production builds ignore that flag. Patrick's pending decision is dragons versus zombies, not approval of existing artwork. The earlier enemy test results below describe the prototype only.

Release validation: strict TypeScript/production build and 31 unit/physics tests pass. All 18 enabled browser checks pass (the arrow route was rerun after a formatter-triggered reload interrupted its first run); the opt-in full-course hardware benchmark was not repeated. A production preview opened with `?enemies=1` still hides health and makes no enemy-atlas request. Physical controller and Chromebook tests remain pending.

## Extended course candidate (PR #2)

The walking line now measures **152.10 seconds** with WASD and arrows; the tested jump/shuttle route measures **149.67 seconds**. This replaces the earlier 37–40-second layout. Movement speed and dash timing are unchanged. These are scripted route timings, not a human playtime guarantee.

Added ten connected stone terraces, twelve slalom barriers, eight jumpable hurdles, wide bypass lanes, four ground-access ramps and two checkpoint zones. Falling or combat defeat returns to the latest checkpoint with full health and saved route progress; the timer continues. Restart clears the checkpoints and starts the course over.

Both keyboard routes finish without falls or jumps. Checkpoint tests cover falls, combat defeat, progress retention and full restart. Existing enemy, controller, shuttle, collision and production-launch checks pass. The unit/physics suite remains 31 passing tests.

Real-time full-course run: **2:14.43**, **144.0 FPS average**, **7.1 ms p95**, one 34.6 ms frame in the starting section, no console errors. Edge headless at 1920 × 1080 on this laptop. [Full measurements](art/playtest/performance/extended-1080p.json). Extended-section screenshots were inspected and flags moved off the walking line to preserve character visibility. Chromebook/physical controller checks remain pending.

## Zombie kaiju candidate (local branch)

- One optional encounter at world (18, -11), north of the starting runway. Bite has a 0.45-second windup; fireball aim locks during a 0.65-second charge. Jump/dodge or use two separate dashes to defeat it. Three player hits restart the course and clear attacks.
- Scale was checked beside Solargon, then corrected to remove an unrequested small-enemy size bias. The atlas uses a constant 90 pixels per world unit across all directions/poses; measured feet anchors, collision capsule and contact shadow share the ground plane. [Scale capture](art/playtest/enemy-scale.png).
- 31 unit/physics checks pass. The full 16-check browser run passed; a subsequently added active-combat performance scenario and the two fight scenarios also pass. Coverage includes thin-wall projectile collision, melee dodge/window, one hit per dash, defeat/restart, three-hit player reset, pause with a fireball in flight and both original keyboard routes.
- Full course with the enemy present: 143.8 FPS average, 7.1 ms p95, no frames over 33.4 ms. Active fireball fight: 144.0 FPS, 7.1 ms p95, no console errors. Both are Edge headless at 1920 × 1080 on this laptop. [Course measurement](art/playtest/performance/enemy-1080p.json) · [Active fight](art/playtest/performance/enemy-combat.json).
- Generated four-direction sprite sheet remains draft art: two walking frames and individual attack/hit/defeat poses; anatomy/motion polish still needs visual review. No runner/heavy gameplay, drops, elemental powers or multiplayer were added. Physical DualSense and Chromebook checks remain pending.

[Atlas and generation notes](art/concepts/zombies/WALKER_ATLAS_PROMPT.md). The live GitHub Pages build is unchanged until this candidate is merged.

Base: `c2a6265`. Current approved build uses 1920 × 1080 by default. The earlier 640 × 360 measurements below are retained as historical evidence.

## Recovery fix

Missing the shuttle lands on safe grass, but the lower path's 0.43-unit lip exceeded the controller's 0.28-unit automatic step height. Walking back onto the path was blocked.

Raised automatic step height to 0.5. The new browser regression walks from spawn to the dock, deliberately misses the shuttle, rejoins the low path without jumping, and completes the course. A physics regression also confirms the 0.8-unit hurdle still blocks walking and can be jumped.

## Verification

- Production build and strict TypeScript check passed.
- 25 physics/input tests passed.
- 12 browser checks passed: both keyboard routes, shortcut/shuttle route, missed-shuttle recovery, ordered finish, jumping/dashing, pause/restart/replay, focus handling, compact menus, synthetic controller input/disconnect/noise and anonymous public launch.
- Local safe route: 39.50 seconds; shortcut: 37.35 seconds. Scripted routes, not human playtimes.
- Courtyard benchmark: 144 FPS, 7 ms 95th-percentile frame interval; Edge headless, 1280 × 720 viewport, 640 × 360 rendering, RTX 5070 Ti Laptop GPU. Whole-course performance was not measured.
- Visible public-browser check covered the start, straight movement and pause. Inspected gallery, shuttle and recovery screenshots from scripted runs. No full manual playthrough claimed.

Physical DualSense USB/Bluetooth and Chromebook testing remain pending. Sprite anatomy/edge consistency remains a known draft-art issue.

[Recovery screenshot](art/playtest/shuttle-recovery.png). No UI copy or shared-document edits.

## Performance and visibility candidate

Reduced repeated static scenery to spatially grouped instances, preserving the moving shuttle and shadow/camera culling. Uploaded textures and compiled materials before Start. Added a faint silhouette only where nearer geometry obscures Solargon. Resolution, camera, sprite size and UI wording are unchanged.

Real-time keyboard walking route across all six sections, Edge headless on this laptop, 1280 × 720 viewport and 640 × 360 world. One baseline/candidate pair; not Chromebook results or proof that all stutters are eliminated.

| Measurement | Baseline | Candidate |
| --- | --- | --- |
| Average FPS | 143.6 | 143.9 |
| 95th-percentile frame interval | 7.1 ms | 7.0 ms |
| Longest frame | 48.6 ms | 27.9 ms |
| Frames over 33.4 ms | 3 | 0 |
| Average draw calls | 293 | 190 |

Build and 25 unit/physics tests pass. The standard browser suite passes 11 functional scenarios plus one visual capture; hosted smoke and hardware benchmark are opt-in. The full-course benchmark completed separately without falls or console errors. Gallery/shuttle screenshots and the before/after front-wall captures were inspected.

Raw measurements: [baseline](art/playtest/performance/baseline.json), [candidate](art/playtest/performance/candidate.json).

![Front-wall visibility before](art/playtest/performance/occlusion-baseline.png)

![Front-wall visibility after](art/playtest/performance/occlusion-candidate.png)

Repeat the hardware benchmark in PowerShell with `$env:COURSE_BENCHMARK='review'; npm run test:browser -- performance.spec.ts`. Production preview: `npm run preview -- --port 4173`.

## Approved 1080p default

1920 × 1080 is now the default in development and production. Camera/sprite pixel snapping follows that resolution. No query parameter is required; physics and artwork are unchanged.

Final default-build verification: 25 unit/physics tests and all 14 browser checks passed, including the real-time full-course benchmark and production smoke test. The full-course run averaged **144.0 FPS**, with **7.0 ms p95**, **7.6 ms longest frame** and no frames over 16.7 ms. [Default-build measurements](art/playtest/performance/default-1080p.json).

Full-course real-time run at a matching 1920 × 1080 browser viewport: **143.9 FPS average**, **7.0 ms p95**, **27.8 ms longest frame**, **zero frames over 33.4 ms**. Completed without falls or console errors. This meets 60 FPS on the tested RTX 5070 Ti laptop; Chromebook results remain untested.

[Raw 1080p measurements](art/playtest/performance/1080p.json) · [1080p visual capture](art/playtest/performance/occlusion-1080p.png).

Repeat with `$env:COURSE_BENCHMARK='review'; npm run test:browser -- performance.spec.ts`. Local production preview: `http://127.0.0.1:4173/`. Public build: `https://sstewart207.github.io/kaiju-platformer-prototype/`.
