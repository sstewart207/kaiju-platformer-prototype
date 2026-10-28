# Combat art provenance

October 27, 2026. Generated with the built-in image generation tool, not the CLI/API fallback. These are replaceable working drafts; Patrick has not approved a final enemy design.

## Saved assets

- Neutral zombie preview: `art/concepts/human-zombies/walker-preview-v1.png`.
- Human zombie sheet: `public/assets/human-zombie-atlas-v1.png` (1774 × 887, four directions, eight poses).
- Solargon combat sheet: `public/assets/solargon-combat-v1.png` (1536 × 1024, four directions, six poses; unmodified generated pixels).
- Frame metadata: `art/human-zombie-atlas-v1.audit.json` and `art/solargon-combat-v1.audit.json`.
- Read-only audit: `scripts/audit-combat-sprites.py`. It reads actual alpha-connected silhouettes, derives unequal row/column cuts and foot anchors, and checks complete containment. It does not edit pixels. Standing heights are authored at 2.1 world units for the human and 1.75 for Solargon's combat poses; other poses retain their source-pixel scale.

Reference roles: `art/references/solargon-concept.png` supplies Solargon's identity; `public/assets/solargon-atlas-v2.png` supplies the shared gameplay style. The human preview supplies the zombie's identity. Earlier undead-dragon assets remain preserved in the repository.

Limitations: zombie walking has two poses; each attack/hit/defeat action uses a few authored poses rather than a fully cleaned animation cycle. Solargon's generated anatomy, six-leg/four-wing visibility and transitions need an artist/team review. Movement falling still shares jump art. No final-art approval is implied.

## Full prompts

All three requests used `transparent_background: true`.

### Neutral zombie

Reference: Solargon gameplay atlas (style only).

> Create ONE neutral full-body gameplay sprite concept of a BIPEDAL HUMAN ZOMBIE for a colorful 2.5D kaiju platformer. Reference image is STYLE ONLY: match its crisp chunky pixel-art clusters, dark colored outlines, compact rounded proportions, warm highlights, slightly elevated three-quarter view. Subject must be clearly human: two legs, two arms, oversized expressive human head, olive gray-green skin, dark messy hair, torn plum tunic/shirt, muted charcoal trousers, worn boots, pale magical amber eyes. Cute-menacing cartoon undead, no gore, no realistic horror, no horns, wings, tail, dragon anatomy or weapons. Natural idle standing pose, hands visible for later swiping and throwing fireballs. Complete silhouette centered with generous transparent margin, feet level. Genuine alpha transparency. No background, floor, shadow, text, captions, grid, watermark or other characters. Preserve simple consistent anatomy for later animation.

### Zombie animation sheet

References: human preview (identity), Solargon movement atlas (style).

> Create a production-layout transparent PNG GAMEPLAY ANIMATION SHEET for the bipedal human zombie in reference 1. Reference 2 is pixel-art style only. 8 equal columns by 4 equal rows, wide 2:1 sheet. Exactly 32 full-body sprites, ONE sprite per cell, NO other marks. Row directions in order: right-facing, left-facing, front-facing, back-facing. Columns in EACH row: 1 idle standing; 2 walking left foot forward; 3 walking right foot forward; 4 forward arm swipe fully extended; 5 fireball windup one palm held near chest; 6 throwing pose palm extended (NO actual projectile); 7 hit recoil; 8 defeated slumped on ground. Preserve SAME human anatomy, head size, messy dark hair, olive skin, amber eyes, torn plum shirt, charcoal trousers and brown boots in every frame. Two arms and two legs only. Same source-pixel body scale across all cells. Slight elevated orthographic sprite view; crisp chunky pixel clusters and dark outlines matching the second reference, not smooth painted shading. Use large transparent gutters on ALL sides of every cell, at least 20 percent of cell width. Keep all feet on the same baseline at 85 percent of cell height, center of support under cell center. Absolutely NO shared silhouettes across cell boundaries, NO clipping, NO touching frames. Actual alpha-transparent background, no checkerboard, NO glow/halo around character, NO floor or cast shadow. No text, labels, numbers, borders, props, background or other characters. This is draft replaceable game art, not a poster.

### Solargon combat sheet

References: original Solargon concept (identity), movement atlas (style).

> Make a transparent PIXEL ART COMBAT ANIMATION SHEET for SOLARGON, the golden kaiju in reference1. Reference2 establishes gameplay pixel-art style, scale and four directional views. Preserve gold layered scales, red eyes, crown horns, cream belly, SIX legs, FOUR wings and SUN-shaped tail. Not a humanoid or different dragon. Exactly 6 columns by 4 rows, ONE complete isolated sprite per cell. Row directions: right, left, front, back. Columns: 1 claw swipe preparation with one front leg raised; 2 claw swipe strike extending that front leg; 3 solar beam charge head lifted and mouth opening; 4 solar beam release head forward mouth open (NO beam or glow drawn in sheet); 5 hit recoil; 6 defeated crouched low eyes closed. Slight elevated orthographic pixel sprite perspective, compact proportions, crisp dark brown outlines, warm gold/cream clusters; match existing character identity. All views/poses same body size. Large genuine transparent gutters, full horns/wings/tail inside each cell, at least 15 percent cell margin, feet share baseline at 85 percent cell height. Actual alpha-transparent background. No labels, text, grid, floor, ground shadow, halo, baked VFX or projectiles. Artwork is a replaceable working draft.
