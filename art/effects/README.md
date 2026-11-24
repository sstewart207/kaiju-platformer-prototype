# Combat effects — November 2, 2026

## Next guard reference — November 23, 2026

Shane's follow-up selected a short upright crescent ahead of Solargon for the elevated gameplay camera. Its bright gold edge and faint pixel pattern should make the protected direction readable while following his position and facing during held block. Flash at actual attack contacts. Schedule this implementation after the break, followed by Graviton's 2D sprite preview and level planning.

Shane requested a short vertical force field that follows Solargon for the duration of held block. [Sprite Fusion Shield](https://www.spritefusion.com/pixel-art-vfx/shield) supplies a hex-cell shell with formation, localized impact ripples and breakup. [PixelFX shield-block](https://github.com/patch-gg/pixelfx/blob/main/src/fx/impacts/shield-block.js) is a 1.1-second frontal impact effect. [PixelFX force-field](https://github.com/patch-gg/pixelfx/blob/main/src/fx/scifi/force-field.js) is a 2.4-second looping shell. Both PixelFX modules credit Sprite Fusion's MIT shield as a source.

Proposed adaptation uses a short upright gold/cream front panel, a quiet continuous held animation, and contact-triggered ripples. The upstream force-field demo includes scripted shots and hit flashes in its loop; extract the held shell and trigger impact feedback from actual gameplay contacts. Couple visible coverage to directional guard checks and intercept incoming fireballs at the barrier surface. Validate moving/turning while guarding, melee and projectile contact points, release/break removal, scenery depth, pause and restart. Research is complete; this visual and collision pass is pending.

## Solar animation update — November 23, 2026

The fireball launch correction sweeps from the body to the directional mouth offset, then initializes both interpolation endpoints at that mouth position. Its atlas tail reveals according to distance traveled, preserving the head pivot and avoiding a full-length trail behind Solargon at birth. The front-facing sprite's mouth socket blends onto the simulation path over the first body-width. Close-wall sweeps and damage still use the projectile simulation. The separate local block prototype and planned shield remain pending team playtesting.

The local solar pass replaces the cropped arcane beam with three original effect modules in `scripts/effects/`: `solar-stream.js`, `solar-mouth.js` and `solar-front.js`. They use the pinned PixelFX painter and existing bake pipeline. Run `node scripts/bake-pixelfx.mjs` to regenerate their atlases and metadata. The stream's dark amber envelope contains moving gold knots and a fine hot core. Its mesh stays inside the simulated segment and thickness. The separate mouth and front effects stay clamped by cover and available beam length. Existing player hit sparks still originate at actual hits. Current ray geometry uses one textured layer.

`public/assets/solargon-solar-v2.png` was generated with the built-in image tool from `solargon-combat-v1.png` and Patrick's `art/references/solargon-concept.png`. The request specified eight columns, four direction rows, anchored feet, and distinct brace, inhale, open-jaw release, sustained firing and recovery poses, with transparent background and the existing browser sprite style. The delivered image is 1774 × 887. `scripts/audit-combat-sprites.py` finds its 32 isolated character components and writes the actual irregular crops and ground anchors to `art/solargon-solar-v2.audit.json`; generated pixels are preserved. Runtime orders charge as 0/1/3, firing as 2/4/5/4, and recovery as 6/7. Fireball release shares this artwork. These are generated review assets. Claw, hurt and defeat still use the earlier sheet.

Verification on November 23 passed the production build, 62 unit tests and 13 focused browser tests, including action-frame progression, four-direction rendering, wall clipping, tap burst, held breath, pause, restart and interruption. The sustained ray check exceeded 60 FPS at 1080p in headless Edge on this PC. Physical controller and human art/feel review remain pending.

## Original PixelFX integration

Source: [patch-gg/pixelfx](https://github.com/patch-gg/pixelfx), pinned to
`a84159688af3ca37a4be05a0d422b94451b2e24e` (MIT, Patch and Hugo Duprez).
The selected effect modules, helpers, core and PNG encoder are preserved in
`scripts/vendor/pixelfx/`, with the upstream LICENSE and NOTICE. No gallery font
or dummy-character pixels are used in the game.

Regenerate with `node scripts/bake-pixelfx.mjs`. This uses the upstream drawing
code with deterministic seed 8 at 30 fps, exports transparent sheets to
`public/assets/fx/`, writes `pixelfx-manifest.json`, and builds
`pixelfx-contact.png` for inspection. No extra package installation is needed.
The vendor directory is build tooling; none of its particle simulations ship in
the game bundle. Runtime effects use pooled sprites/meshes and shared texture
sources, with per-instance frame UVs and nearest-neighbour sampling.

Selected effects: `melee/claw-swipe`, `fire/fireball`, `impacts/hit-spark`,
`arcane/spell-charge`, and `arcane/arcane-beam`. Solargon uses gold/cream ramps;
zombies use ember-orange ramps. The script records exact palettes, crops and
glow strength. Alpha below 70 is discarded to remove faint haze. Frames have
one transparent pixel of padding on each edge. Nine PNGs total approximately
706 KiB. The contact sheet rows follow the script's definition order.

Claws animate on the shared wall-clipped ground footprint, with their opening
and closure retimed to the existing damage window. Ray artwork uses only the
beam-body crop: its source and end flares are omitted so a stretched atlas cannot
cross a wall. The separate muzzle is clamped to the available space. Fireball
head scale uses the collision radius; the tail and contact sparks are cosmetic.
Projectile trails and impacts rotate using the camera projection of their actual
travel direction. Impacts retain that direction even if the player turns.

All frame choices use fixed-step action/projectile/impact ages. Pause freezes
them; restart clears both player and enemy effects. Existing character artwork
remains draft art. This integration adds charge/release body accents and selects
the zombie's strike pose explicitly at contact; it does not create a new limb
animation cycle or approve the drafts as final.
