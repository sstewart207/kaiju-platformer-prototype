# Squad AI proposal

Status: design for review. Current enemies patrol, chase with sight checks, and use swipe/fireball windups. Four encounter groups now exist; their placement is not coordinated flanking AI yet.

## Behaviors to build first

| Behavior | What the player sees | Implementation |
| --- | --- | --- |
| Pressure | One zombie keeps the player busy from the front. | Reserve a close approach slot; enter swipe range without occupying another zombie's slot. |
| Flank | A second zombie takes a side route while the first pressures. | Score left/right tactical positions and route to the best reachable one with A*. |
| Ranged support | A third keeps distance and fires from another angle. | Reserve a firing lane, check walls and allies, lock aim during the existing windup. |
| Local alerts | Nearby teammates react when a zombie spots the player or hears combat. | Share last-seen position/time within the encounter; emit short-lived noise events from attacks. |
| Search | Zombies investigate the last known position after losing sight. | Use a timed search state and a few nearby navigation nodes, then return to patrol. |
| Regroup | Survivors change roles when a teammate dies. | Release its position/attack reservations and rescore remaining assignments. |

Start with a three-zombie squad. Validate its decisions in one encounter before applying it to every pack. Increase difficulty through angles, timing and varied compositions as well as kill quotas.

## Runtime structure

- `EnemyPerception`: sight rays and hearing events at 10 Hz. Track the last visible position and its age. Hidden players do not remain perfectly tracked through walls.
- `SquadDirector`: shared encounter knowledge, roles, reserved approach positions and attack permissions. Reassign roughly twice a second, with a short minimum commitment so enemies do not constantly swap sides.
- `EnemyBrain`: score actions such as pressure, flank, shoot, search and regroup. Keep the existing small action state machine for windup, active attack, recovery, hurt and defeat.
- `Navigation`: a small waypoint graph with alternate paths around obstacles. A* chooses routes; Rapier capsule clearance validates edges. Nodes include floor height and usable width. Existing route waypoints alone are insufficient because they describe one walking line, not flanking options.
- `Steering`: follow the selected path and apply nearby-ally separation every fixed physics tick. Keep Rapier collision and ledge checks authoritative. Replan when blocked rather than continuing to push against a wall.

All decisions run locally in TypeScript. Stagger perception/planning between enemies; retain the 60 Hz movement/physics loop. Measure a busy encounter before increasing the enemy count further. Future co-op should run these decisions on the authoritative host/server and replicate results.

## Picking a flank

Sample reachable positions at several angles around the player, using close positions for pressure and wider ones for ranged support. Score each candidate for angle advantage, visibility, path cost, room to stand, ally crowding and exposure to the player's current facing/last beam lane. Reserve the best different positions for the squad. Smooth local steering gets enemies there; choosing a point behind the player without a valid route is not a flank.

Give the group a small attack budget, initially two close attackers and one ranged attacker, with staggered attack starts. This creates sustained pressure instead of one synchronized volley followed by an empty pause. Clear reservations immediately on death, interruption or loss of a valid route. Preserve obvious windups and recovery windows.

## Moves worth adding after coordination works

1. **Short lunge:** a visible crouch/windup, a short swept forward burst, then recovery. Needs dedicated anticipation/strike poses; walls stop the movement.
2. **Covering fire:** a ranged zombie throws while a teammate changes position. Use squad attack timing and a clear firing lane.
3. **Group rush:** a local alert assigns two distinct approach lanes, rather than sending every zombie toward the same point.
4. **Reposition after a beam:** a survivor changes its angle after seeing the beam, reducing repeated line-ups for the next shot. React to visible actions, not future button presses.

Keep these separate from art: move definitions own range, timing, damage and locomotion; sprite manifests own the corresponding poses and anchors. Avoid adding all move types in the first pass.

## Stage objectives and death

Ruins requires 12 unique zombie defeats across four encounters, then the player reaches the existing exit. New authored levels start at 18 and 24 kills; replaying Ruins keeps its 12-kill target. Every level must contain enough eligible enemies. Kill credit and defeated enemies persist through checkpoint recovery; Restart clears the run. Each enemy can contribute once.

Health is already implemented. A lethal hit stops attacks/movement, shows recoil then collapse, and restores the checkpoint. Enemy defeat disables attacks/hurtboxes and releases future squad reservations. Falling uses a distinct directional pose rather than the rising jump sprite.

## Acceptance scenarios

- A flanker reaches a side angle around a wall instead of walking into it.
- Three enemies claim different spaces and do not stack into one sprite.
- Ranged attacks respect geometry and occupied friendly firing lanes.
- Lost sight produces a search at the last known location, not hidden tracking.
- Death or interruption frees attack slots; the squad keeps functioning.
- Sudden player movement produces readable reactions and new plans.
- Pause, restart and checkpoint recovery clear/rebuild squad state safely.
- The full encounter meets the frame-rate target with console errors captured.
