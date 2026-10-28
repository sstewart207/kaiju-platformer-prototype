# Combat follow-up

Status: researched proposal; gameplay unchanged. October 27, 2026.

## Current problems

The swipe deals one damage against two-health zombies, while solar deals two. More importantly, a hit changes HP and selects a hurt pose without directional knockback. Swipe animation uses two poses. There is no stamina system; a held ray can continue indefinitely. These are code findings. Their contribution to the weak combat feel is our diagnosis to validate in play.

## Implementation order

1. **Make one swipe feel solid.** Add planted anticipation, a clear contact pose and recovery. Add a small forward step through the existing Rapier controller, never a teleport. Match the contact frame and attack volume. On impact, apply wall-safe directional knockback/stagger, a short sound, contact flash and approximately 40–60 ms of local hit-stop. These timings are starting values. Preserve fixed-step physics; do not pause unrelated world systems or discard buffered input. Distinguish missed swings from landed hits. Retune damage after the hit feels convincing.
2. **Add a separate fireball.** A traveling, finite-speed projectile with swept sphere collision, lifetime and one hit per enemy/projectile. Give it a separate binding from swipe and ray. Start with a three-shot chain: fresh taps during a short input buffer schedule the next shot in the allowed recovery window. Holding does not repeat shots. Reset the chain after its timing window; no unlimited queued inputs. Keep mouth origin, visible projectile and collision radius aligned.
3. **Add stamina.** Discrete costs for swipe/fireball, per-second drain for the ray, delayed regeneration after spending. Initial tuning proposal: 100 capacity, swipe 12, fireball 18, ray 25/second, regeneration 25/second after 0.6 seconds without spending. Charge per action once, not per animation frame. At zero, stop the ray; require release and a fresh press before restarting. Block unaffordable attacks before windup. Walking and jumping remain free. Evaluate a small dash cost separately while preserving the approved rapid-dash rhythm. Display only a functional stamina bar/label.

## Checks

- Swipe reliably connects in all four directions and near steps; neither attacker nor victim passes through walls.
- Hit feedback appears once per valid contact; missed swings do not trigger it.
- Fireballs hit thin walls, do not tunnel, and chain correctly at 30/60/144 Hz rendering.
- Holding any attack cannot bypass stamina, queue endless attacks or restart an exhausted beam automatically.
- Pause, blur, disconnect, death and restart safely clear chains/held attacks; document stamina recovery/reset rules.
- Compare a short fight before/after for impact, responsiveness and clarity. Keep the existing 1080p/60 FPS target.

## Research

[Mihir Sheth, Santa Monica Studio: Evolving God of War's Combat for a New Perspective, GDC 2019](https://media.gdcvault.com/gdc2019/presentations/Sheth_Mihir_EvolvingCombat.pdf), especially slides 20–21: responsive combinations, expressive enemy reactions and attacks that physically carry the attacker forward. Our proposed swipe step, reactions and chaining adapt those principles to this game's fixed camera and Rapier controller. The specific stamina values and hit-stop duration above are proposed tuning, not values established by that source.
