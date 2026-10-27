# Project TODOs

- [x] Prepare an emailable no-install browser playtest link for the confirmed Chromebook target using the existing public GitHub repo, GitHub Actions and GitHub Pages. Include all runtime assets and verify anonymous browser launch, controls and pause. No Electron wrapper is needed for this delivery.
- [ ] Have the tester open the hosted build on the actual Chromebook and check performance, keyboard and DualSense behavior. Physical Chromebook/USB/Bluetooth validation remains pending. Offline/PWA packaging is optional later work.

- [x] Remove remaining hint sentences and decorative section names after user correction. UI now uses functional labels, controls, time/results and buttons only; preserve this rule in future level/UI changes.

- [ ] Choose a game title together. Current labels are placeholders: Untitled Kaiju Project / Ruins.
- [x] Increase normal movement speed and add a repeatable dash for keyboard and DualSense, with jump-dash, cooldown, collision checks and a live timer.
- [x] Redesign ruins as distinct gallery, shuttle/garden and hurdle sections, with a safe route and validated faster shortcuts; avoid a walkable bridge beneath the shuttle.

- [ ] Add a character selection screen for the planned five-kaiju roster. Show each character's name, artwork and elemental ability; support keyboard and DualSense selection. Keep unavailable characters clearly unavailable until their gameplay assets and abilities are implemented.
- [ ] Plan simultaneous browser co-op over LAN: multiple PCs join the same room and play different kaijus in one level. Decide host/server ownership, room codes or a room browser, local matchmaking/join flow, player limits, shared progression, synchronization, disconnect/rejoin handling and input latency. Produce a technical plan before implementing networking; internet matchmaking is a separate scope decision.
- [ ] Design zombie enemies, create consistent directional animation assets, and implement enemy gameplay. Define silhouettes, movement/attack/taking-damage/defeat states, behavior, collisions and player feedback; test them in the ruins before adding more enemy types.

- [x] Remove AI-sounding filler and awkward text from the title screen, HUD, area names, hints, pause menu, finish screen, loading/errors and accessibility announcements. Use plain labels, route instructions and results. Browser coverage includes compact layouts.

- [x] Implement DualSense controls: analog left stick / D-pad movement, Cross jump/select, Options pause/resume, Circle back, Triangle restart, menu selection, dead zones, keyboard switching and safe disconnect/reconnect. Unit and browser tests use synthetic Gamepad snapshots; this is not a physical-controller validation.
- [ ] Have a tester complete the course with a real DualSense. Test USB and Bluetooth where available; record the browser, connection and any wrong buttons, drift, accidental jumps or disconnect behavior in PLAYTEST.md.
- [x] Create ART_DIRECTION.md with the game's working visual rules, original character references, sprite requirements and integration checks for the other four characters.
- [x] Replace floating islands with continuous grass terrain, low terraces and broad ramped paths. Keep solid ground underneath all former gaps and an optional moving-platform route.
- [x] Address counter-steering feedback: align the camera/route axes, remove velocity look-ahead, reject diagonal stick noise, assist cardinal directions, stop on release and prevent idle slope sliding.
- [ ] Retest the revised grounded course on the user's actual DualSense. Confirm neutral stays still and right movement needs no corrective diagonal input; record remaining drift with browser/connection details.

