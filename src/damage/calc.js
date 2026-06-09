import { SHAPE_BY_ID, STAT_DEFS } from "../data/defaults.js";

const STAT_KEYS = STAT_DEFS.map((stat) => stat.key);

export function emptyStats() {
  return Object.fromEntries(STAT_KEYS.map((key) => [key, 0]));
}

export function sumStats(sources) {
  const totals = emptyStats();
  for (const source of sources) {
    const stats = source?.stats ?? source ?? {};
    for (const key of STAT_KEYS) {
      totals[key] += Number(stats[key] ?? 0);
    }
  }
  return totals;
}

export function calculateDamage({ character, weapon, skill, items }) {
  const statTotals = sumStats([weapon, ...items]);
  const preference = character.preference;
  const preferenceCount = items.filter((item) => {
    const shape = SHAPE_BY_ID[item.shapeId];
    return shape?.kind === preference.shapeKind;
  }).length;

  statTotals[preference.stat] =
    Number(statTotals[preference.stat] ?? 0) + preferenceCount * Number(preference.value ?? 0);

  const attack = Math.floor(
    (Number(character.baseAttack) + Number(weapon.baseAttack)) *
      (1 + Number(statTotals.attackPct ?? 0)) +
      Number(statTotals.attackFlat ?? 0)
  );
  const hp = Math.floor(
    Number(character.baseHp) * (1 + Number(statTotals.hpPct ?? 0)) +
      Number(statTotals.hpFlat ?? 0)
  );
  const defense = Math.floor(
    Number(character.baseDefense) * (1 + Number(statTotals.defensePct ?? 0)) +
      Number(statTotals.defenseFlat ?? 0)
  );

  const baseDamage =
    Number(skill.attackMultiplier ?? 0) * attack +
    Number(skill.hpMultiplier ?? 0) * hp +
    Number(skill.defenseMultiplier ?? 0) * defense +
    Number(skill.extraDamage ?? 0) +
    Number(statTotals.extraDamage ?? 0);

  const damageZone =
    1 +
    Number(statTotals.genericDamageBonus ?? 0) +
    Number(statTotals.typedDamageBonus ?? 0) +
    Number(statTotals.sourceDamageBonus ?? 0) +
    Number(statTotals.otherDamageBonus ?? 0) -
    Number(statTotals.damageReduction ?? 0);

  const critRate = clamp(Number(character.baseCritRate) + Number(statTotals.critRate ?? 0), 0, 1);
  const critDamage = Math.max(0, Number(character.baseCritDamage) + Number(statTotals.critDamage ?? 0));
  const critExpectation = 1 + critRate * critDamage;
  const expectedDamage = baseDamage * damageZone * critExpectation;

  return {
    expectedDamage,
    baseDamage,
    damageZone,
    critExpectation,
    preferenceCount,
    stats: {
      attack,
      hp,
      defense,
      critRate,
      critDamage
    },
    statTotals
  };
}

export function itemDamageDelta(context, item) {
  const base = calculateDamage({ ...context, items: [] }).expectedDamage;
  const withItem = calculateDamage({ ...context, items: [item] }).expectedDamage;
  return withItem - base;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
