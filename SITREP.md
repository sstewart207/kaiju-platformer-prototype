# Kaiju project status

November 24, 2026 · Game title undecided

**Browser combat release — November 24:** Solargon has a four-direction solar animation sheet with inhale, release, firing and recovery poses. The gold ray uses separate stream, mouth and front effects. Fireballs start at the directional mouth socket and reveal their trail as they travel. Zombies have PixelFX attacks and impacts, contact-timed strike poses and wall-clipped melee coverage. Quick solar taps fire immediately on release; held breath charges, commits aim and braces the player. The shared build includes these browser changes. The block/shield prototype remains in Shane's local test copy pending human playtesting. The next art milestone is Graviton's 2D preview, followed by black-hole level planning. Human approval of generated attack artwork, physical combat controller testing and Chromebook performance remain pending.

**Earlier local revision — November 2:** The user rejected the cosmetic-only ray and chose braced held breath. K/R2 now charges for 0.35 seconds, commits aim and braces movement while the thicker beam extends outward. Release stops damage, collapses the effect and settles into recovery; dash/jump escape and incoming damage interrupt it. Tap burst and the separate fireballs remain. 61 unit tests, 27 focused browser checks and production build pass; the full scripted course clear passed with 12 kills and no deaths. User feel/audio approval is still pending. Preview: `http://127.0.0.1:4173/` while the local preview server is running.

**Local update — November 2:** PixelFX is integrated for both sides: animated claw rakes, flame trails, charge motes, a streaming solar ray and directional contact sparks. Zombies select their strike pose at contact, and melee damage follows the visible wall-clipped footprint. 59 unit tests, 21 focused browser checks, production build and a production-preview smoke check pass. Mixed effects remain about 144 FPS at 1080p on the development laptop. This local pass is available with `npm run build` then `npm run preview`; the public link below describes the previously published build. Character attack art remains draft poses, with human feel/physical-controller/Chromebook review pending. Details: `art/effects/README.md`.

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
