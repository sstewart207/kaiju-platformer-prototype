# Ruins course design

The project has no game title yet. **Ruins** is the name of this test course, not a proposed game name.

## Design goal

Make the ground-based course worth replaying with the faster movement and repeatable dash. The old course was a floating-platform sequence with grass added beneath it: identical pads, arbitrary gaps, and a moving stone that could be bypassed on the same path. This revision uses a connected ruin compound with distinct movement choices, safe recovery and a useful upper shortcut.

## Sections

The course continues past the original end at x=192 into broad south/north ruin galleries. The current walking route completes in **152.10 seconds** in deterministic tests, versus about 40 seconds for the previous layout. This adds active movement distance rather than enforced waiting or extra enemy health.

The extension has twelve alternating wall barriers, eight jumpable hurdles, wide bypass lanes, four ground-access ramps and two checkpoint zones at (192, -42) and (324, -72). Grass stays beneath the entire course. Checkpoints restore health and retain route progress; death/falling returns to the latest checkpoint without resetting the timer. R/Restart still resets the whole course.

| Section | Casual route | Faster route / skill |
| --- | --- | --- |
| Courtyard and approach | Wide starting area and straight runway | Build speed and test dash timing without a fall penalty |
| Broken gallery | Weave south, north, then out around alternating walls | Jump two low central breaks and keep momentum through the straight center line |
| Shuttle approach | Broad bend and ramp up to the waiting dock | Cut the staging corner while keeping the upper-dock approach readable |
| Garden crossing | Descend to the lower garden path, go around, then climb the far dock | Board the moving stone at the upper dock and ride directly across |
| Column garden | Short descent into a planted court and a northward turn | Carry dash rhythm through the bend without clipping the planters |
| Final straight | Use the wide north side lane around three low hurdles | Chain jump/dash timings along the center line |

The primary path remains finishable without jumping. Optional jumping and the shuttle shorten the route. Missing an upper route lands on solid grass; players can rejoin the lower path instead of restarting.

## Why the shuttle now matters

- The waiting and arrival docks are 2.5 units high; grass is at -0.08. A player on the grass cannot simply walk onto either dock.
- There is **no ramp or bridge between the upper docks**. The only direct upper connection is the moving stone.
- The stone slides along ground-level rails. Its body extends to the terrain, so the world is not floating and the motion has a visible support context.
- The lower alternative is a real dogleg around the garden, with ramps at both ends. It is roughly 66 units from dock to dock versus 32 units across the shuttle line.
- The stone travels from x=96 to x=112 at z=-24, with a 6.4-second full cycle. It touches the dock edges at its endpoints. Time saved depends on catching it well; arriving just after it leaves can make the lower route preferable.

## Shared data and collision contract

`src/course.ts` defines the platform graph, all collision masonry, ordered route gates, main-route waypoints, shortcut takeoff/landing suggestions and visible flags. `src/world.ts` renders that shared data; physics must consume the same data.

- `RUIN_WALLS`: x/y/z are **center coordinates**, with width/height/depth extents. These include high gallery walls, jumpable low breaks, garden planters and the final hurdles.
- `PATH_RAMPS`: an explicit connection graph, intentionally excluding a waiting-to-arrival connection under the shuttle. High uphill ramps meet the dock just outside its face, avoiding a capsule-catching lip.
- `COURSE_GATES`: coarse ordered route checks, marked in the world by blue floor diamonds and paired markers. They keep an off-path run across the grass from skipping the course. The far dock gate also checks feet height >=2.1.
- `MAIN_ROUTE_WAYPOINTS`: safe broad walking line, including the side lanes around jump obstacles. It avoids structural pillars and uses the actual access ramps.
- `SHORTCUT_ROUTE`: suggested gallery jumps, shuttle boarding/exit positions and hurdle jumps. These are guidance points, not teleports or automated character movement.
- `src/course-extension.ts`: connected extension terraces, barriers, route markers, safe walking line, recovery ramps and checkpoint zones.
- `FINISH`: (486, 1.5, -42). The gate structure remains 2.5 units behind the finish target, with posts at x±1.8, keeping the walk-in approach clear.

## Visual cleanup

The route now has a starting court, a walled gallery, separate high docks, a lower planted crossing, a column garden and a long hurdle lane. Low hurdles have a blue top stripe; route flags and gate markers use the same restrained blue. Broken arch remnants frame sections. Grass texture contrast and speckle density were reduced so terrain no longer competes with the character and paths.

## Previous short-course measurements (superseded)

A no-render traversal using the actual `Player` and Rapier `Physics` followed every main-route waypoint with no jumps in approximately **39 simulated seconds**, including short stops at each waypoint. Final browser checks then completed both safe keyboard routes at **39.63 seconds** and the jump/dash/shuttle route at **37.42 seconds**, using five dashes and zero falls. The moving-platform route was boarded and ridden through actual collision/physics, not teleported. These are automated geometry/input checks, not human playtime or proof of fun. Real DualSense feel and the team's judgment of route choices still need a playtest.

Playtest questions: Are the two gallery lines immediately understandable? Does the shuttle feel worth catching? Can a missed shuttle be recovered without confusion? Is the hurdle lane satisfying when dash and jump are chained? Does the faster movement remain easy to stop at a corner?
