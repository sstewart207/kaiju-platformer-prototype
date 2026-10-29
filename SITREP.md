# Kaiju project status

October 28, 2026 · Game title undecided

**Status:** Playable single-player browser prototype. Solargon is the only implemented character. The Ruins course is ready for team playtesting.

**Current build:** Solargon has a longer claw slash with knockback, a three-shot fireball chain, tap solar burst and held mouth ray. Attack effects are more visible, with shared collision/effect bounds. Attacks use stamina; the ray stops on exhaustion. Ruins has 12 human zombies in four groups; defeat all 12 to unlock the exit, then reach it. The course has two checkpoints. Kills survive checkpoint recovery; restart resets them.

**Play:** https://sstewart207.github.io/kaiju-platformer-prototype/

**Source:** https://github.com/sstewart207/kaiju-platformer-prototype

## Current build

- Ground-based 3D ruins with pixel-art character sprites, a safe walking route, and optional jump/shuttle shortcuts. Approved default: 1920 × 1080 rendering.
- Keyboard and DualSense controls; movement, variable-height jump, rapid dash, attacks, health/checkpoint recovery, pause, restart and replay. Swipe: J / Circle. Fireball: L / L1; tap to chain. Solar: tap K / R2 for a burst, hold for a ray. Movement/jump/dash stay free when stamina is empty. Falling uses separate directional poses; death shows recoil then collapse.
- 1080p fireball/ray effects check: 144 FPS, 7.0 ms p95 on Shane's laptop. Full scripted combat clear: 2:43, no deaths; human playtime is unmeasured. Chromebook performance remains untested.
- Build and automated movement, collision, combat, controller-input and route checks pass. Shane reported DualSense working on October 26; the new combat bindings and Chromebook performance still need physical testing.

## Decisions and limits

- Keep the world grounded and controls aligned with the camera. Interface text is limited to functional labels, controls and results.
- Preserve the original character designs. Solargon's combat/falling art and the human-zombie sprites are replaceable drafts for team review; anatomy/animation polish remains.
- Enemy flanking, shared awareness and coordinated attacks are proposed in SQUAD_AI_PLAN.md, not implemented. New authored levels get higher kill targets; Ruins replays stay at 12.
- Planned roster: Solargon, Voidra, Graviton, Toxicraven and provisional fifth character Blizzardon.
- Not implemented: character selection, other playable characters and their abilities, coins, ramen rewards or multiplayer. Co-op and human 1v1 matchmaking with kaiju/stage selection are planned. A ramen bowl remains the planned chapter-completion reward.

## Next actions

1. Patrick/Nicole test the Chromebook build: movement/stopping, dash, controller drift, performance, route clarity and shuttle usefulness. Record issues in PLAYTEST.md.
2. Fix playtest issues before expanding the build.
3. Review the provisional human zombies and combat feel with Patrick. The user authorized this draft; final enemy appearance can change later. Plan networking before implementing co-op or 1v1.
4. Choose the game's name together.

**Working references:** ART_DIRECTION.md for visuals; LEVEL_DESIGN.md for the course; TODO.md for the backlog. Original concepts: patricks kaiju download (1).docx in Downloads.
