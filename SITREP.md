# Untitled kaiju project build recap

October 26, 2026 · For Patrick, Nicole and the team

The current build is a playable single-player browser prototype with Solargon, a redesigned ground-based ruins course, faster movement and a repeatable dash. The game does not have a title yet. **Ruins** is the course label; **kaiju-platformer-prototype** is the GitHub repository label.

## What is playable now

- Real 3D terrain and collision, animated 2D character artwork, an elevated fixed camera, and 640 × 360 pixel rendering.
- Keyboard and DualSense movement, variable-height jumping, pause, restart, finish/replay, a live timer and dash readiness.
- Continuous safe ground, distinct courtyards, a walled gallery, raised shuttle docks, a lower garden route and a final hurdle lane.
- Ordered visible route markers: the finish requires completing the course, rather than cutting straight across the grass.

## What changed in this pass

Movement speed increased from **5.8 to 8.5 units/second**, about 46% faster. Dash reaches **16.5 units/second** for roughly **0.22 seconds**, with a **0.45-second interval between starts**. Repeated presses and jump-dash combinations work; dash still respects collision and does not grant flight or invulnerability.

The level was redesigned rather than keeping floating platforms with grass underneath. The gallery offers a safe weaving route and a straighter jump line. The shuttle now connects elevated docks without a walkable bridge beneath it; the alternate ground route makes a longer garden dogleg. The finale offers hurdles or a wider side lane. Missing an upper route lands on safe grass.

The level-design subagent built the revised course and shared geometry data; the main agent integrated physics, route checks, movement, UI and browser verification. These are implementation and traversal checks, not a substitute for the team's judgment of fun.

## Controls

| Action | Keyboard | DualSense |
| --- | --- | --- |
| Move | WASD / arrows | Left stick / D-pad |
| Jump | Space; hold for height | Cross; hold for height |
| Dash | Shift | Square or R1 |
| Pause / resume | Escape | Options |
| Select / back | Click menu buttons | Cross / Circle |
| Restart | R | Triangle |

## Validation and limits

The production build, 24 unit/physics tests and 10 browser scenarios pass. Tests cover movement, dash repetition/cooldown, walls, drift filtering, menus, reconnects and complete routes. The safe walking route took 39.63 seconds; a jump/dash/shuttle route took 37.42 seconds with five dashes and zero falls. These are automated simulated runs, not human playtime or proof of fun. The courtyard benchmark remains about 240 FPS on the RTX 5070 Ti laptop in Edge headless at 640 x 360 internal resolution.

Solargon is the only implemented character. His sprite sheet is still a generated draft: anatomy and frame edges need cleanup, and jump/fall share a pose. Combat, elemental powers, coins, zombies, health, checkpoints, ramen rewards and multiplayer are not implemented. Physical DualSense USB/Bluetooth feel still needs the team's playtest.

## Next work

1. Playtest the new pace, dash rhythm, gallery choices and shuttle timing. Check that a missed shortcut is easy to recover from.
2. Add a character selection screen as the other characters' artwork and abilities become available. Planned roster: Solargon, Voidra, Graviton, Toxicraven and provisional fifth character Blizzardon.
3. Design zombie enemies, produce their animation states, then implement and test behavior and player interactions.
4. Write a LAN/browser co-op plan: multiple PCs, simultaneous kaijus in one level, rooms/joining/local matchmaking, host/server ownership, synchronization and reconnects. Networking implementation comes after that plan.
5. Choose the game's name together. Continue using the neutral working label until then.

## Project references

- Public source repository: https://github.com/sstewart207/kaiju-platformer-prototype
- Local playtest on the development laptop: http://127.0.0.1:4173/
- Other PCs can clone the repository and run `npm install` then `npm run dev` for separate local single-player play. This is not LAN co-op or a hosted web release.
- Concept source: the user-supplied `patricks kaiju download (1).docx` in Downloads. The original concepts remain the character identity reference.
- `ART_DIRECTION.md`: visual reference and sprite requirements. `LEVEL_DESIGN.md`: ruins layout and route intent. `PLAYTEST.md`: controller/tester checklist. `TODO.md`: next work.
