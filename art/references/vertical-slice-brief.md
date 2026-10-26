# Kaiju Platformer — Initial Vertical Slice

## Role

You are a senior gameplay programmer, technical artist, and game systems engineer. Develop the first playable vertical slice of an original, commercially styled 2.5D platformer inspired by the camera design and movement principles of Super Mario 3D World.

Prioritize responsive gameplay, coherent graphics, maintainable architecture, and efficient implementation.

This is a production-oriented prototype, not a technology demonstration.

## Technical stack

Use:

- TypeScript with strict typing
- Vite
- Three.js for 3D rendering
- Rapier 3D for physics and collision detection
- HTML/CSS for the game interface
- WebGL as the primary rendering backend

Do not use Unity, Unreal, Godot, Phaser, React Three Fiber, or a general-purpose game-engine editor.

Use existing library functionality wherever practical. Do not build a custom rendering engine or physics engine.

## Visual direction

Create a colorful, polished pixel-art world using a hybrid 2D/3D approach.

The environment must be genuinely three-dimensional. Characters are rendered using transparent 2D artwork positioned within that environment.

Implement:

- A fixed three-quarter camera with smooth player tracking
- Three-dimensional platforms, terrain, obstacles, and moving objects
- Consistent pixel-art textures and color palettes
- A low-resolution rendering target, initially 640 × 360
- Nearest-neighbor upscaling
- Pixel-consistent character artwork
- Environmental lighting and atmospheric depth
- Character contact shadows
- Distinct elemental visual effects
- Camera and sprite pixel-snapping where needed to prevent shimmer
- Screen-space UI rendered sharply at the browser's display resolution

Favor visually coherent environments with carefully composed colors, silhouettes, and lighting.

Avoid generic untextured cubes, excessive bloom, random visual noise, inconsistent pixel sizes, and photorealistic assets mixed with pixel art.

## Character asset handling

The attached Word document contains reference artwork for the Kaiju characters.

These are concept sheets, not finished gameplay sprites.

Inspect the supplied assets before implementation. Identify the characters, their colors, silhouettes, distinguishing features, and elemental themes.

Do not treat composite promotional images as sprite sheets.

Implement an asset pipeline supporting:

- Transparent PNG and WebP sprites
- Directional character views
- Frame-based animation
- Configurable sprite dimensions and ground anchors
- Animation states and transitions
- Character-specific particle effects

The gameplay implementation must remain independent of the final artwork so that placeholder graphics can be replaced without rewriting character mechanics.

If usable gameplay sprites are missing, document the exact required assets. Do not disguise missing animation assets with unrelated images or misleading effects.

Preserve each character's recognizable design.

## Characters

Support five playable characters:

1. Solargon — solar beam
2. Voidra — short-range teleport
3. Graviton — gravity manipulation
4. Toxicraven — corrosive projectile
5. Blizzardon — freezing ability, provisional fifth character

Build a shared character controller and implement special abilities as separate modules.

Each character should support:

- Idle
- Running
- Jumping
- Falling
- Landing
- Attacking
- Special ability
- Taking damage
- Defeat

Animation states must be supported even when final sprite frames are pending.

## Movement and physics

Implement real three-dimensional movement on the horizontal X/Z plane with vertical jumping along Y.

Controls:

- WASD or arrow keys: movement relative to the camera
- Space: jump
- J: basic attack
- K: elemental ability
- R: restart after defeat
- Gamepad support where practical

Movement requirements:

- Smooth acceleration and deceleration
- Responsive directional changes
- Variable jump height
- Coyote time
- Jump input buffering
- Reliable grounded detection
- Predictable air control
- Stable collision against walls and terrain
- Moving-platform support
- Proper edge and ledge behavior
- No tunneling through platforms or falling through floors

Use a fixed physics timestep and keep simulation logic separate from rendering.

Prioritize game feel over realistic physical simulation.

## First playable level

Create one approximately 3–5-minute demonstration level.

It must contain:

- A visually coherent starting area
- Platforms at multiple elevations and depths
- Gaps requiring carefully timed jumps
- At least one moving-platform sequence
- Collectible coins
- Basic enemies that can be defeated or avoided
- One environmental hazard
- One checkpoint
- At least one opportunity to demonstrate elemental abilities
- Optional collectible paths
- A clearly defined finish area

The level must be designed around an understandable difficulty curve.

Introduce movement in a safe environment before asking players to execute difficult jumps.

## Collectibles and progression

Coins are the standard collectible.

The major chapter-completion reward is a ramen bowl.

For the vertical slice, the demonstration stage represents the conclusion of the first chapter.

Reaching the final reward triggers:

- A ramen bowl collection animation
- A celebratory particle effect
- A victory sound hook
- A chapter-complete interface
- A restart or replay option

The ramen bowl must be visually prominent and distinct from standard collectibles.

## Interface

Implement:

- Title screen
- Character selection screen
- In-game HUD
- Coin counter
- Health indicator
- Special ability cooldown indicator
- Pause menu
- Defeat/retry screen
- Chapter-complete screen

The interface should have an intentional, cohesive pixel-art visual identity.

Avoid generic debug-style UI in the player-facing build.

## Architecture

Separate the project into clear modules for:

- Application initialization
- Rendering and camera
- Physics
- Player movement
- Character definitions
- Character abilities
- Animation
- Level construction
- Enemies and hazards
- Collectibles
- UI
- Audio
- Asset management

Keep character statistics and ability settings data-driven.

Avoid large monolithic files, unnecessary abstractions, premature optimization, and additional dependencies without a concrete purpose.

## Implementation sequence

Work in the following order:

1. Audit assets and establish the project structure.
2. Create the 3D world and fixed camera.
3. Implement and tune the player controller.
4. Build a small platforming test course.
5. Integrate the initial sprite rendering system.
6. Add character selection and abilities.
7. Add coins, enemies, hazards, and checkpoints.
8. Implement the ramen bowl chapter-completion sequence.
9. Apply cohesive environmental art, effects, and UI.
10. Test the complete playable experience.

Maintain a working build between stages.

## Acceptance criteria

The initial build is complete when:

- The application starts locally with a documented command.
- The player can select any of the five characters.
- Movement and jumping function reliably in three dimensions.
- The camera keeps the player and important landing areas visible.
- Platforms and environmental objects demonstrate real depth.
- Coins can be collected and counted.
- The character's elemental ability functions.
- The player can take damage, lose, and retry.
- A complete level can be finished.
- Collecting the final ramen bowl triggers chapter completion.
- The visual presentation is stylistically cohesive.
- The browser console contains no recurring errors.
- The game maintains a target of 60 FPS on the intended desktop hardware.

Document any unfinished artwork or feature clearly.

## Scope restrictions

Do not implement multiplayer, networking, procedural world generation, a level editor, monetization, account systems, or extensive campaign progression.

Do not create additional chapters during this phase.

Do not introduce unnecessary frameworks.

Do not copy Nintendo assets, level layouts, or branded interface elements.

Concentrate on making one small, polished, enjoyable experience.

The first milestone is a playable platforming prototype with functioning movement, collisions, camera tracking, and a coherent graphical presentation.

Do not expand the feature scope until that milestone is validated.