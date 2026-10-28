export function killTargetForLevel(levelNumber: number) {
  if (!Number.isInteger(levelNumber) || levelNumber < 1)
    throw new Error("Level number must be a positive integer.");
  return 12 + (levelNumber - 1) * 6;
}
export const RUINS_LEVEL = {
  id: "ruins",
  number: 1,
  killTarget: killTargetForLevel(1),
} as const;
export class KillObjective {
  private defeated = new Set<number>();
  constructor(
    readonly target: number,
    private enemyCount: number,
  ) {
    if (
      !Number.isInteger(target) ||
      target < 1 ||
      !Number.isInteger(enemyCount) ||
      enemyCount < target
    )
      throw new Error("The kill target needs enough unique enemies.");
  }
  get kills() {
    return this.defeated.size;
  }
  get unlocked() {
    return this.kills >= this.target;
  }
  record(enemyId: number) {
    if (!Number.isInteger(enemyId) || enemyId < 0 || enemyId >= this.enemyCount)
      throw new Error("Unknown enemy in kill objective.");
    this.defeated.add(enemyId);
  }
  has(enemyId: number) {
    return this.defeated.has(enemyId);
  }
  reset() {
    this.defeated.clear();
  }
}
