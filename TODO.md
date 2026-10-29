# Project TODOs

- [x] Respond to attack-readability feedback: replace the faint ring with filled claw slashes, extend melee reach/active time without increasing lunge travel, improve fireball/ray contrast and contact audio. Sarah reviewed collision/code; capsule-edge, step, corner-cover, late-contact, visible-core and blocked-muzzle regressions are covered.

- [x] Improve combat weight: stronger swipe body motion, collision-safe forward movement, directional enemy knockback/stagger, brief local hit-stop, synthesized impact sound and contact effects. Existing draft poses are reused; review feel and audio in play.
- [x] Add a separate traveling fireball on L/L1 with swept sphere collision and a buffered three-shot chain. Preserve swipe and held solar ray; holding fireball does not repeat shots.
- [x] Add stamina: discrete attack costs, continuous ray drain, regeneration delay and exhaustion that stops attacks without automatically restarting while held. Movement, jumping and repeatable dash remain free. Current tuning and checks: COMBAT_FEEL_PLAN.md.
- [ ] Playtest the combat pass: swipe impact, fireball chain timing and stamina balance. Verify physical L1/R2 behavior and audio on the actual laptop/Chromebook. Automated controller checks are synthetic.

- [x] Keep the tap solar burst and add a continuous mouth ray while holding K/R2. Follow facing while moving, stop at walls, stop on release, and recharge after sustained firing. Keyboard and synthetic controller tests cover release, pause, restart and disconnect; physical R2 validation remains pending.
- [x] Place 12 zombies in four groups along Ruins; require all 12 defeats to unlock the exit. Preserve kills through checkpoint recovery and reset on restart. New authored levels use higher quotas (18, then 24); replaying Ruins keeps its quota.
- [x] Give falling its own four-direction draft atlas and show recoil followed by collapse when Solargon dies.
- [ ] Implement coordinated enemy behavior from SQUAD_AI_PLAN.md after reviewing the proposal. Current enemies still use individual patrol/chase/attack logic.

- [ ] Review the provisional human-zombie design with Patrick. The user authorized bipedal human zombies for this combat milestone; final enemy appearance may change later. Preserve older dragon/zombie concepts separately.

- [x] Approve 1920 × 1080 as the default rendering style; update runtime, camera snapping, tests and art direction. Keep pixel-art character textures crisp.
- [x] Extend the short course with connected ruin galleries, slalom walls, hurdle bypasses and two checkpoints. Walking route measures 2:32 in deterministic tests; human pace/replay value still needs review.

- [x] Prepare an emailable no-install browser playtest link for the confirmed Chromebook target using the existing public GitHub repo, GitHub Actions and GitHub Pages. Include all runtime assets and verify anonymous browser launch, controls and pause. No Electron wrapper is needed for this delivery.
- [ ] Have the tester open the hosted build on the actual Chromebook and check performance, keyboard and DualSense behavior. Physical Chromebook/USB/Bluetooth validation remains pending. Offline/PWA packaging is optional later work.

- [x] Remove remaining hint sentences and decorative section names after user correction. UI now uses functional labels, controls, time/results and buttons only; preserve this rule in future level/UI changes.

- [ ] Choose a game title together. Current labels are placeholders: Untitled Kaiju Project / Ruins.
- [x] Increase normal movement speed and add a repeatable dash for keyboard and DualSense, with jump-dash, cooldown and collision checks. The visible timer was subsequently removed.
- [x] Make ground dash a faster horizontal burst with a steady low pose and buffered rapid taps: 0.23 seconds between starts. Preserve normal jump height and wall collision.
- [x] Redesign ruins as distinct gallery, shuttle/garden and hurdle sections, with a safe route and validated faster shortcuts; avoid a walkable bridge beneath the shuttle.

- [ ] Add a character selection screen for the planned five-kaiju roster. Show each character's name, artwork and elemental ability; support keyboard and DualSense selection. Keep unavailable characters clearly unavailable until their gameplay assets and abilities are implemented.
- [ ] Plan and implement simultaneous browser co-op AND human-versus-human 1v1 matchmaking. Each player picks a kaiju; both modes must support any stage. Include LAN rooms and online matchmaking. Before implementation, define hosting/server ownership, room creation/joining, kaiju and stage selection, co-op player limits/shared progression, 1v1 rules and results, synchronization, disconnect/rejoin behavior and input latency. Produce a technical plan first.
- [x] Build one bipedal human-zombie type in the game's pixel-art style, with directional movement, swipe/fireball windups, hurt/defeat poses, patrol/chase behavior and three placed encounters. This replaces the older dragon-only enemy direction.
- [x] Add Solargon's J/Circle basic swipe and K/R2 solar beam, health, damage protection, hit/defeat feedback and checkpoint recovery. Keep movement, dash and existing controller mappings intact.
- [ ] Polish combat animations and have the team review the feel and difficulty. Keep art swappable; runner/heavy variants remain later work.
- [x] Build the first walker encounter locally with four-view draft animation, bite/fireball windups, swept projectile world collision, three-hit player health and two-dash enemy defeat. Use a shared world-scale reference rather than automatically shrinking enemies. Runner/heavy gameplay and final animation polish remain pending.

- [x] Remove AI-sounding filler and awkward text from the title screen, HUD, area names, hints, pause menu, finish screen, loading/errors and accessibility announcements. Use plain labels, route instructions and results. Browser coverage includes compact layouts.

- [x] Implement DualSense controls: analog left stick / D-pad movement, Cross jump/select, Options pause/resume, Circle back, Triangle restart, menu selection, dead zones, keyboard switching and safe disconnect/reconnect. Unit and browser tests use synthetic Gamepad snapshots; this is not a physical-controller validation.
- [ ] Have a tester complete the course with a real DualSense. Test USB and Bluetooth where available; record the browser, connection and any wrong buttons, drift, accidental jumps or disconnect behavior in PLAYTEST.md.
- [x] Create ART_DIRECTION.md with the game's working visual rules, original character references, sprite requirements and integration checks for the other four characters.
- [x] Replace floating islands with continuous grass terrain, low terraces and broad ramped paths. Keep solid ground underneath all former gaps and an optional moving-platform route.
- [x] Address counter-steering feedback: align the camera/route axes, remove velocity look-ahead, reject diagonal stick noise, assist cardinal directions, stop on release and prevent idle slope sliding.
- [ ] Retest the revised grounded course on the user's actual DualSense. Confirm neutral stays still and right movement needs no corrective diagonal input; record remaining drift with browser/connection details.

