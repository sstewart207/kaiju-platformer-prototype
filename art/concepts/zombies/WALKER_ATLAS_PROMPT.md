# Zombie walker gameplay atlas

October 27, 2026. Built-in image generation tool. Reference: left walker in `zombie-kaiju-concepts-v2.png`; Solargon atlas for sprite treatment only. Active image: `public/assets/zombie-walker-atlas-v1.png`.

The result is a 1774 × 887 draft with irregular gutters, so `scripts/audit-zombie-atlas.py` writes individual frame rectangles and feet anchors to `art/zombie-walker-atlas-v1.audit.json`. It reads the image without modifying pixels. No audited frame has a solid silhouette touching its horizontal boundary. Four directions, two walking poses, bite, charge, release, hit and defeated poses are connected. Anatomy/motion remain generated drafts for visual review.

Scale: 90 source pixels per world unit, shared across all views and poses. This matches Solargon's body scale rather than assigning a small-enemy size tier. Collision uses its own capsule (radius 0.4, half-height 0.34); feet remain at the measured ground anchor. Neither tail nor wing tips change collision size.

## Prompt

Create a production-oriented transparent pixel-art animation atlas of ONLY the small undead dragon WALKER on the LEFT of reference image 1. Use reference image 2 only for the game's pixel-art treatment.
Preserve the walker's identity: compact horizontal four-legged dragon body, ash-lavender scales, ivory chipped curved horns and jaw plates, ONE PAIR of small ragged purple wings, thick tapering spined tail, pale amber eyes, sparse purple magical cracks, orange mouth/throat glow. Exactly four legs, no humanoid body or clothes. Do not turn it into the lean runner, heavy brute or golden hero.
EXACT LAYOUT: 8 columns by 4 rows of equal SQUARE cells. Target canvas 1536 wide x 768 high, each cell 192x192. No visible grid, borders or lettering. Rows: row 1 right-facing three-quarter; row 2 left-facing three-quarter; row 3 front-facing slightly elevated; row 4 back-facing slightly elevated. All eight poses in a row face that row's direction.
Columns in EACH row: (1) neutral idle, (2) walk step A, (3) walk step B opposite limb cycle, (4) close bite/claw lunge with mouth open, (5) fireball charge with head raised and throat glowing orange, (6) fireball release with open mouth and head thrust forward but NO detached projectile, (7) recoil/hit with eyes squinting, (8) defeated crouched sideways slump, closed eyes, clearly different pose, non-gory.
Scale/anchors: keep the body size consistent across all poses and views; no enlargement on attack. Plant grounded toes on pixel baseline y=162 in every 192px cell. Center the body weight over x=96, not the tail. Fit complete horns, tail and wings inside the inner 144x144px zone, with at least 24px transparent padding on every edge. Leave generous margins even for the bite lunge and defeated pose. Four-leg anatomy stays consistent. Use a readable simplified 96px-style sprite drawn with crisp square pixel clusters and a dark plum outline, warm ivory highlights and cool muted purple shadows. No smooth gradients, airbrushed halo, photographic fabric or glossy 3D rendering.
Background must be genuinely alpha-transparent. No glow outside silhouettes, colored fringe, red contamination, checkerboard, background color, baked ground shadow, text, labels, effect particles or unrelated characters. This is a clean animation sheet, not a poster or concept board.

