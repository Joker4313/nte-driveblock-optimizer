export const BOARD_SIZE = 5;

export const SHAPES = [
  { id: "2-h", name: "2-横", kind: "II", area: 2, cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }] },
  { id: "2-v", name: "2-竖", kind: "II", area: 2, cells: [{ r: 0, c: 0 }, { r: 1, c: 0 }] },
  { id: "3-h", name: "3-横", kind: "III", area: 3, cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }] },
  { id: "3-v", name: "3-竖", kind: "III", area: 3, cells: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }] },
  { id: "3-lu", name: "3-左上", kind: "III", area: 3, cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }] },
  { id: "3-ru", name: "3-右上", kind: "III", area: 3, cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 1 }] },
  { id: "3-ld", name: "3-左下", kind: "III", area: 3, cells: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }] },
  { id: "3-rd", name: "3-右下", kind: "III", area: 3, cells: [{ r: 0, c: 0 }, { r: 1, c: -1 }, { r: 1, c: 0 }] },
  { id: "4-h", name: "4-横", kind: "IV", area: 4, cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 }] },
  { id: "4-v", name: "4-竖", kind: "IV", area: 4, cells: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 3, c: 0 }] },
  { id: "4-z", name: "4-Z型", kind: "IV", area: 4, cells: [{ r: 0, c: 0 }, { r: 1, c: -1 }, { r: 1, c: 0 }, { r: 2, c: -1 }] },
  { id: "4-s", name: "4-S型", kind: "IV", area: 4, cells: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 1 }] }
];

export const SHAPE_BY_ID = Object.fromEntries(SHAPES.map((shape) => [shape.id, shape]));

export const STAT_DEFS = [
  { key: "critRate", label: "暴击率", kind: "percent" },
  { key: "critDamage", label: "暴击伤害", kind: "percent" },
  { key: "hpFlat", label: "生命值", kind: "flat" },
  { key: "hpPct", label: "生命值百分比", kind: "percent" },
  { key: "attackFlat", label: "攻击力", kind: "flat" },
  { key: "attackPct", label: "攻击力百分比", kind: "percent" },
  { key: "defenseFlat", label: "防御力", kind: "flat" },
  { key: "defensePct", label: "防御力百分比", kind: "percent" },
  { key: "tiltIntensity", label: "倾陷强度", kind: "flat", damageWeight: 0 },
  { key: "ringFusionIntensity", label: "环合强度", kind: "flat", damageWeight: 0 },
  { key: "genericDamageBonus", label: "通用伤害增强", kind: "percent" },
  { key: "elementDamageBonus", label: "属性伤害增强", kind: "percent", mainOnly: true },
  { key: "healingBonus", label: "治疗加成", kind: "percent", mainOnly: true, damageWeight: 0 },
  { key: "psychicDamageBonus", label: "心灵伤害增强", kind: "percent", mainOnly: true, damageWeight: 0 }
];

export const STAT_BY_KEY = Object.fromEntries(STAT_DEFS.map((stat) => [stat.key, stat]));

export const DRIVE_BLOCK_AFFIX_KEYS = [
  "critRate",
  "critDamage",
  "hpFlat",
  "hpPct",
  "attackFlat",
  "attackPct",
  "defenseFlat",
  "defensePct",
  "tiltIntensity",
  "ringFusionIntensity",
  "genericDamageBonus"
];

export const CASSETTE_MAIN_AFFIX_KEYS = [
  ...DRIVE_BLOCK_AFFIX_KEYS,
  "elementDamageBonus",
  "healingBonus",
  "psychicDamageBonus"
];

export const CASSETTE_AFFIX_KEYS = DRIVE_BLOCK_AFFIX_KEYS;

export const RARITIES = [
  { key: "gold", label: "金色", color: "#d6a12b" },
  { key: "purple", label: "紫色", color: "#8b5cf6" },
  { key: "blue", label: "蓝色", color: "#2684c2" }
];

export const RARITY_BY_KEY = Object.fromEntries(RARITIES.map((rarity) => [rarity.key, rarity]));

export const SHAPE_KINDS = [
  { key: "II", label: "II 型" },
  { key: "III", label: "III 型" },
  { key: "IV", label: "IV 型" }
];

export const DEFAULT_AFFIX = { statKey: "critRate", value: 0 };

export const DEFAULT_STAT_TABLES = {
  driveBlockBasePerCell: {
    gold: { attackFlat: 24, hpFlat: 180 },
    purple: { attackFlat: 18, hpFlat: 135 },
    blue: { attackFlat: 12, hpFlat: 90 }
  },
  driveBlockAffixPerCell: {
    gold: {
      critRate: 0.02,
      critDamage: 0.04,
      hpFlat: 180,
      hpPct: 0.03,
      attackFlat: 24,
      attackPct: 0.03,
      defenseFlat: 21,
      defensePct: 0.0375,
      tiltIntensity: 5,
      ringFusionIntensity: 5,
      genericDamageBonus: 0.025
    },
    purple: {
      critRate: 0.015,
      critDamage: 0.03,
      hpFlat: 135,
      hpPct: 0.0225,
      attackFlat: 18,
      attackPct: 0.0225,
      defenseFlat: 16,
      defensePct: 0.028,
      tiltIntensity: 4,
      ringFusionIntensity: 4,
      genericDamageBonus: 0.01875
    },
    blue: {
      critRate: 0.01,
      critDamage: 0.02,
      hpFlat: 90,
      hpPct: 0.015,
      attackFlat: 12,
      attackPct: 0.015,
      defenseFlat: 11,
      defensePct: 0.019,
      tiltIntensity: 3,
      ringFusionIntensity: 3,
      genericDamageBonus: 0.0125
    }
  },
  cassetteMainAffixValues: {
    gold: {
      critRate: 0.09,
      critDamage: 0.18,
      hpFlat: 810,
      hpPct: 0.135,
      attackFlat: 108,
      attackPct: 0.135,
      defenseFlat: 95,
      defensePct: 0.16875,
      tiltIntensity: 23,
      ringFusionIntensity: 23,
      genericDamageBonus: 0.1125,
      elementDamageBonus: 0.18,
      healingBonus: 0.18,
      psychicDamageBonus: 0.18
    },
    purple: {
      critRate: 0.0675,
      critDamage: 0.135,
      hpFlat: 608,
      hpPct: 0.10125,
      attackFlat: 81,
      attackPct: 0.10125,
      defenseFlat: 72,
      defensePct: 0.126,
      tiltIntensity: 18,
      ringFusionIntensity: 18,
      genericDamageBonus: 0.084,
      elementDamageBonus: 0.135,
      healingBonus: 0.135,
      psychicDamageBonus: 0.135
    },
    blue: {
      critRate: 0.045,
      critDamage: 0.09,
      hpFlat: 405,
      hpPct: 0.0675,
      attackFlat: 54,
      attackPct: 0.0675,
      defenseFlat: 48,
      defensePct: 0.084,
      tiltIntensity: 14,
      ringFusionIntensity: 14,
      genericDamageBonus: 0.05625,
      elementDamageBonus: 0.09,
      healingBonus: 0.09,
      psychicDamageBonus: 0.09
    }
  },
  cassetteAffixValues: {
    gold: {
      critRate: 0.06,
      critDamage: 0.12,
      hpFlat: 540,
      hpPct: 0.09,
      attackFlat: 72,
      attackPct: 0.09,
      defenseFlat: 63,
      defensePct: 0.1125,
      tiltIntensity: 15,
      ringFusionIntensity: 15,
      genericDamageBonus: 0.075
    },
    purple: {
      critRate: 0.045,
      critDamage: 0.09,
      hpFlat: 405,
      hpPct: 0.0675,
      attackFlat: 54,
      attackPct: 0.0675,
      defenseFlat: 48,
      defensePct: 0.084,
      tiltIntensity: 12,
      ringFusionIntensity: 12,
      genericDamageBonus: 0.056
    },
    blue: {
      critRate: 0.03,
      critDamage: 0.06,
      hpFlat: 270,
      hpPct: 0.045,
      attackFlat: 36,
      attackPct: 0.045,
      defenseFlat: 32,
      defensePct: 0.056,
      tiltIntensity: 9,
      ringFusionIntensity: 9,
      genericDamageBonus: 0.0375
    }
  }
};

export function getDriveBlockBaseStats(item, statTables = DEFAULT_STAT_TABLES) {
  const area = SHAPE_BY_ID[item.shapeId]?.area ?? 0;
  const base = statTables.driveBlockBasePerCell?.[item.rarity] ?? {};
  return {
    attackFlat: Number(base.attackFlat ?? 0) * area,
    hpFlat: Number(base.hpFlat ?? 0) * area
  };
}

export function getDriveBlockAffixValue(item, statKey, statTables = DEFAULT_STAT_TABLES) {
  const area = SHAPE_BY_ID[item.shapeId]?.area ?? 0;
  return Number(statTables.driveBlockAffixPerCell?.[item.rarity]?.[statKey] ?? 0) * area;
}

export function getCassetteAffixValue(item, statKey, statTables = DEFAULT_STAT_TABLES) {
  return Number(statTables.cassetteAffixValues?.[item.rarity]?.[statKey] ?? 0);
}

export function getCassetteMainAffixValue(item, statKey, statTables = DEFAULT_STAT_TABLES) {
  return Number(statTables.cassetteMainAffixValues?.[item.rarity]?.[statKey] ?? 0);
}

export function resolveDriveBlockAffixes(item, statTables = DEFAULT_STAT_TABLES) {
  return (item.affixes ?? []).map((affix) => ({
    statKey: affix.statKey,
    value: getDriveBlockAffixValue(item, affix.statKey, statTables)
  }));
}

export function resolveCassetteAffixes(item, statTables = DEFAULT_STAT_TABLES) {
  return (item.affixes ?? []).map((affix) => ({
    statKey: affix.statKey,
    value: getCassetteAffixValue(item, affix.statKey, statTables)
  }));
}

export function resolveCassetteMainAffix(item, statTables = DEFAULT_STAT_TABLES) {
  return {
    statKey: item.mainAffix?.statKey ?? CASSETTE_MAIN_AFFIX_KEYS[0],
    value: getCassetteMainAffixValue(item, item.mainAffix?.statKey, statTables)
  };
}

export function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function fullBoardCells() {
  return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({
    r: Math.floor(index / BOARD_SIZE),
    c: index % BOARD_SIZE
  }));
}

export function makeAffixes(entries = []) {
  return Array.from({ length: 4 }, (_, index) => ({
    ...DEFAULT_AFFIX,
    ...(entries[index] ?? {})
  }));
}

export const DEFAULT_CHARACTERS = [
  {
    id: "char-output",
    name: "示例输出角色",
    baseAttack: 810,
    baseHp: 9200,
    baseDefense: 620,
    baseCritRate: 0.05,
    baseCritDamage: 0.5,
    element: "Cosmos",
    preference: { shapeKind: "III", stat: "critRate", value: 0.03 }
  },
  {
    id: "char-burst",
    name: "偏好 IV 暴伤角色",
    baseAttack: 760,
    baseHp: 9800,
    baseDefense: 680,
    baseCritRate: 0.05,
    baseCritDamage: 0.5,
    element: "Chaos",
    preference: { shapeKind: "IV", stat: "critDamage", value: 0.06 }
  }
];

export const DEFAULT_WEAPONS = [
  {
    id: "weapon-standard",
    name: "示例武器",
    baseAttack: 580,
    stats: { attackPct: 0.18, critRate: 0.08 }
  },
  {
    id: "weapon-damage",
    name: "增伤武器",
    baseAttack: 520,
    stats: { genericDamageBonus: 0.18, critDamage: 0.18 }
  }
];

export const DEFAULT_DRIVE_BLOCKS = [
  {
    id: "block-01",
    name: "金 IV 双暴 S",
    rarity: "gold",
    shapeId: "4-s",
    enabled: true,
    locked: false,
    affixes: makeAffixes([
      { statKey: "critRate", value: 0.08 },
      { statKey: "critDamage", value: 0.16 },
      { statKey: "attackPct", value: 0.06 },
      { statKey: "genericDamageBonus", value: 0.04 }
    ])
  },
  {
    id: "block-02",
    name: "金 IV 攻击 Z",
    rarity: "gold",
    shapeId: "4-z",
    enabled: true,
    locked: false,
    affixes: makeAffixes([
      { statKey: "attackPct", value: 0.12 },
      { statKey: "genericDamageBonus", value: 0.1 },
      { statKey: "critDamage", value: 0.08 },
      { statKey: "attackFlat", value: 96 }
    ])
  },
  {
    id: "block-03",
    name: "紫 IV 增伤竖",
    rarity: "purple",
    shapeId: "4-v",
    enabled: true,
    locked: false,
    affixes: makeAffixes([
      { statKey: "genericDamageBonus", value: 0.075 },
      { statKey: "critDamage", value: 0.12 },
      { statKey: "attackPct", value: 0.05 },
      { statKey: "ringFusionIntensity", value: 12 }
    ])
  },
  {
    id: "block-04",
    name: "金 III 暴击横",
    rarity: "gold",
    shapeId: "3-h",
    enabled: true,
    locked: false,
    affixes: makeAffixes([
      { statKey: "critRate", value: 0.06 },
      { statKey: "attackPct", value: 0.09 },
      { statKey: "critDamage", value: 0.08 },
      { statKey: "genericDamageBonus", value: 0.04 }
    ])
  },
  {
    id: "block-05",
    name: "金 III 增伤竖",
    rarity: "gold",
    shapeId: "3-v",
    enabled: true,
    locked: false,
    affixes: makeAffixes([
      { statKey: "genericDamageBonus", value: 0.075 },
      { statKey: "critDamage", value: 0.12 },
      { statKey: "critRate", value: 0.03 },
      { statKey: "attackFlat", value: 72 }
    ])
  },
  {
    id: "block-06",
    name: "紫 III 攻击左上",
    rarity: "purple",
    shapeId: "3-lu",
    enabled: true,
    locked: false,
    affixes: makeAffixes([
      { statKey: "attackPct", value: 0.0675 },
      { statKey: "critRate", value: 0.045 },
      { statKey: "critDamage", value: 0.06 },
      { statKey: "tiltIntensity", value: 10 }
    ])
  },
  {
    id: "block-07",
    name: "金 II 增伤横",
    rarity: "gold",
    shapeId: "2-h",
    enabled: true,
    locked: false,
    affixes: makeAffixes([
      { statKey: "genericDamageBonus", value: 0.05 },
      { statKey: "critRate", value: 0.04 },
      { statKey: "attackPct", value: 0.03 },
      { statKey: "critDamage", value: 0.04 }
    ])
  },
  {
    id: "block-08",
    name: "蓝 II 攻击竖",
    rarity: "blue",
    shapeId: "2-v",
    enabled: true,
    locked: false,
    affixes: makeAffixes([
      { statKey: "attackPct", value: 0.03 },
      { statKey: "critDamage", value: 0.04 },
      { statKey: "attackFlat", value: 24 },
      { statKey: "critRate", value: 0.02 }
    ])
  },
  {
    id: "block-09",
    name: "金 III 防御右上",
    rarity: "gold",
    shapeId: "3-ru",
    enabled: false,
    locked: false,
    affixes: makeAffixes([
      { statKey: "defensePct", value: 0.1125 },
      { statKey: "defenseFlat", value: 63 },
      { statKey: "hpPct", value: 0.05 },
      { statKey: "hpFlat", value: 360 }
    ])
  },
  {
    id: "block-10",
    name: "紫 II 生命竖",
    rarity: "purple",
    shapeId: "2-v",
    enabled: false,
    locked: false,
    affixes: makeAffixes([
      { statKey: "hpPct", value: 0.045 },
      { statKey: "hpFlat", value: 270 },
      { statKey: "defensePct", value: 0.03 },
      { statKey: "defenseFlat", value: 21 }
    ])
  }
];

export const DEFAULT_CASSETTES = [
  {
    id: "cassette-01",
    name: "属性增伤卡带",
    rarity: "gold",
    enabled: true,
    mainAffix: { statKey: "elementDamageBonus", value: 0.18 },
    affixes: makeAffixes([
      { statKey: "critRate", value: 0.06 },
      { statKey: "critDamage", value: 0.12 },
      { statKey: "attackPct", value: 0.08 },
      { statKey: "genericDamageBonus", value: 0.06 }
    ])
  },
  {
    id: "cassette-02",
    name: "暴击卡带",
    rarity: "purple",
    enabled: true,
    mainAffix: { statKey: "critDamage", value: 0.2 },
    affixes: makeAffixes([
      { statKey: "critRate", value: 0.05 },
      { statKey: "attackPct", value: 0.08 },
      { statKey: "attackFlat", value: 64 },
      { statKey: "ringFusionIntensity", value: 18 }
    ])
  }
];
