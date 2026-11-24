# Project TODOs

- [ ] **Solar ray charge-up polish.** Shane suggested a more deliberate charge-up on November 24, 2026 to give the ray a finished, powerful feel. Build on the existing 0.35-second held-breath windup with a braced inhale, energy gathering toward the mouth, a growing concentrated glow and rising charge sound, then a distinct release into the beam. Playtest the buildup and release at normal gameplay size. Keep the approved quick-tap burst responsive. This is future polish; timing changes need a feel review.

- [ ] **Resume after the break — approved shield shape.** Shane chose a short upright crescent just ahead of Solargon for the elevated camera. Use a bright gold edge and faint pixel pattern, follow his position/facing during held block, and flash at actual attack contacts. The protected direction must be immediately readable in combat. Record this as the chosen adaptation for the force-field references below. Implementation is deferred until after the break.

- [ ] **Next block pass — following vertical force field.** Shane requested a short upright barrier in front of Solargon that follows his position and facing for the entire held block. Use gold/cream pixel-art cells, a steady held state and a separate contact ripple/spark burst. Research candidates are [Sprite Fusion Shield](https://www.spritefusion.com/pixel-art-vfx/shield), [PixelFX shield-block](https://github.com/patch-gg/pixelfx/blob/main/src/fx/impacts/shield-block.js) and [PixelFX force-field](https://github.com/patch-gg/pixelfx/blob/main/src/fx/scifi/force-field.js). Adapt their shape to a short vertical front barrier. Test fireball interception at the visible surface, melee coverage, turning/walking, release, guard break, pause and restart. Research saved November 23; implementation is pending.
- [ ] **After the break — Graviton art and level planning.** Start from `ART_DIRECTION.md` and the bottom-center Graviton panel in `art/references/graviton-toxicraven-reference.png`. Prepare a 2D pixel-art character preview in the existing browser style, then consistent directional gameplay assets. Plan his level and black-hole mechanics with Shane. The saved Sprite Fusion black-hole reference belongs to this milestone. Additional original Solargon plush reference is expected from Shane later.

- [ ] **Block and shield release.** Test the separate local guard prototype and upright crescent shield before including them in a shared browser build.
- [ ] Human block playtest. Review stamina cost, turn-to-face behavior and guard visibility in combat. The pose currently uses the existing raised-paw artwork. Physical L2 testing remains pending.

- [ ] Review the November 23 solar animation pass in the local browser build. New four-direction inhale, release, sustained breath and recovery frames are integrated. The ray has a custom amber/gold stream, inward mouth corona and separate wave front. Check visual weight, mouth alignment and transitions beside Patrick's reference. Claw windup/strike/follow-through drawings are the next animation task.

- [ ] Develop **Graviton second, after Solargon**. His signature ability is a **black hole**. Save [Sprite Fusion's Black Hole VFX](https://www.spritefusion.com/pixel-art-vfx/black-hole) as the future effect reference. Review its pull, orbiting disk and collapse animation when Graviton's milestone begins. Recorded from Shane's direction on November 23, 2026.

- [x] Retest November 5 tap responsiveness: Shane said the tap change is good. Quick K/R2 release fires without the held breath's charge delay and allows normal movement. Physical R2-specific confirmation is still separate.
- [ ] Playtest the November 5 claw extension (2.8 → 3.1 units, visual and damage bounds shared). Shane requested a small reach increase; automated edge/exclusion/wall checks pass.

- [x] Replace the cosmetic-only ray pass with the user's chosen braced held breath: charge, committed aim, planted firing, finite beam propagation, shared width/collision envelope, recoil, release collapse/recovery, dash/jump escape and damage interruption. Preserve the separate fireball and tap solar burst.
- [ ] User playtest of the braced breath's weight, windup, aim commitment and cutoff. Passing automated checks does not establish that the ray feels good.

- [x] Integrate pinned MIT PixelFX effects for Solargon's claws, fireballs, charge, ray and contacts, plus the zombies' orange claws/projectiles/charge/contacts. Tie atlas animation to simulation ages, preserve wall clipping and attack controls, and align zombie strike art and melee damage with the visible footprint. Source, baking script and licenses are preserved in the repo.
- [ ] Human review of the November 2 PixelFX pass: slash readability, contact weight, player/enemy effect separation and charge/release feel. Character attack cycles remain draft poses; physical DualSense and Chromebook checks remain pending.

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

