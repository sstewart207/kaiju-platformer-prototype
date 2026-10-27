# Kaiju project status

October 27, 2026 · Game title undecided

**Status:** Playable single-player browser prototype. Solargon is the only implemented character. The Ruins course is ready for team playtesting.

**Play:** https://sstewart207.github.io/kaiju-platformer-prototype/

**Source:** https://github.com/sstewart207/kaiju-platformer-prototype

## Current build

- Ground-based 3D ruins with pixel-art character sprites, a safe walking route, and optional jump/shuttle shortcuts. Approved default: 1920 × 1080 rendering.
- Keyboard and DualSense controls; movement, variable-height jump, repeatable dash, timer, pause, restart and replay.
- Full-course 1080p test: 143.9 FPS average on Shane's laptop. Wall occlusion and grass-to-path recovery fixes are included.
- Build and automated movement, collision, controller-input and route checks pass. The public build was checked without signing in. Actual Chromebook performance and physical DualSense testing remain pending.

## Decisions and limits

- Keep the world grounded and controls aligned with the camera. Interface text is limited to functional labels, controls and results.
- Preserve the original character designs. Solargon's sprites remain a draft with anatomy/edge cleanup needed; jump and fall share a pose.
- Planned roster: Solargon, Voidra, Graviton, Toxicraven and provisional fifth character Blizzardon.
- Not implemented: character selection, other playable characters, elemental abilities, zombies/combat, coins, health/checkpoints, ramen rewards or multiplayer. A ramen bowl remains the planned chapter-completion reward.

## Next actions

1. Patrick/Nicole test the Chromebook build: movement/stopping, dash, controller drift, performance, route clarity and shuttle usefulness. Record issues in PLAYTEST.md.
2. Fix playtest issues before expanding the build.
3. Scope character selection and zombie designs, animations and gameplay. Plan simultaneous LAN co-op rooms/joining and synchronization before implementing networking.
4. Choose the game's name together.

**Working references:** ART_DIRECTION.md for visuals; LEVEL_DESIGN.md for the course; TODO.md for the backlog. Original concepts: patricks kaiju download (1).docx in Downloads.
