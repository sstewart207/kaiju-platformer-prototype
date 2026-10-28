# Kaiju project status

October 27, 2026 · Game title undecided

**Status:** Playable single-player browser prototype. Solargon is the only implemented character. The Ruins course is ready for team playtesting.

**Current release:** Solargon has a basic swipe and solar beam. Three bipedal human-zombie encounters add patrols, melee attacks and fireballs. The course has a tested 2:32 walking route and two checkpoints. No HUD area labels or visible timer.

**Play:** https://sstewart207.github.io/kaiju-platformer-prototype/

**Source:** https://github.com/sstewart207/kaiju-platformer-prototype

## Current build

- Ground-based 3D ruins with pixel-art character sprites, a safe walking route, and optional jump/shuttle shortcuts. Approved default: 1920 × 1080 rendering.
- Keyboard and DualSense controls; movement, variable-height jump, rapid dash, attacks, health/checkpoint recovery, pause, restart and replay. Attack: J / Circle. Solar beam: K / R2.
- Full-course 1080p test: 143.9 FPS average on Shane's laptop. Wall occlusion and grass-to-path recovery fixes are included.
- Build and automated movement, collision, combat, controller-input and route checks pass. Shane reported DualSense working on October 26; the new combat bindings and Chromebook performance still need physical testing.

## Decisions and limits

- Keep the world grounded and controls aligned with the camera. Interface text is limited to functional labels, controls and results.
- Preserve the original character designs. Solargon's combat art and the human-zombie sprites are replaceable drafts for team review; anatomy/animation polish remains. Jump and fall share a pose.
- Planned roster: Solargon, Voidra, Graviton, Toxicraven and provisional fifth character Blizzardon.
- Not implemented: character selection, other playable characters and their abilities, coins, ramen rewards or multiplayer. Co-op and human 1v1 matchmaking with kaiju/stage selection are planned. A ramen bowl remains the planned chapter-completion reward.

## Next actions

1. Patrick/Nicole test the Chromebook build: movement/stopping, dash, controller drift, performance, route clarity and shuttle usefulness. Record issues in PLAYTEST.md.
2. Fix playtest issues before expanding the build.
3. Review the provisional human zombies and combat feel with Patrick. The user authorized this draft; final enemy appearance can change later. Plan networking before implementing co-op or 1v1.
4. Choose the game's name together.

**Working references:** ART_DIRECTION.md for visuals; LEVEL_DESIGN.md for the course; TODO.md for the backlog. Original concepts: patricks kaiju download (1).docx in Downloads.
