# Project instructions

- Read README.md and TODO.md before changing the game. For any character or environment art work, follow ART_DIRECTION.md and inspect the relevant original reference image before generation or integration.
- Preserve each named character's identity. Solargon's generated atlas is a working draft; do not copy its clipping, inconsistent anatomy or shared jump/fall pose into new final assets.
- Keep player-facing text plain and useful: names, controls, route instructions and results. No AI-sounding slogans, forced whimsy, marketing text or development notes in the interface.
- Keep the world on continuous solid ground with broad walkable connections. The user rejected floating islands, repeated gap falls, and movement requiring diagonal counter-steering. Preserve camera/route alignment, strong stick-noise rejection and stable idle grounding.
- Preserve keyboard and DualSense input, camera-relative movement, fixed-step physics and the game's 640 × 360 render. Validate changes with the relevant unit/browser tests and a production build.
- Distinguish synthetic Gamepad tests from physical DualSense testing. Physical USB/Bluetooth results belong in PLAYTEST.md; do not mark them passed without an actual controller playtest.
- Stay within the requested milestone. Do not expand to the other characters, combat or chapter systems just because the reference document describes them.
