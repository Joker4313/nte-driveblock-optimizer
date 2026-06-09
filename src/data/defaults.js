export const BOARD_SIZE = 5;

export const SHAPES = [
  {
    id: "2-h",
    name: "2-横",
    kind: "II",
    area: 2,
    cells: [
      { r: 0, c: 0 },
      { r: 0, c: 1 }
    ]
  },
  {
    id: "2-v",
    name: "2-竖",
    kind: "II",
    area: 2,
    cells: [
      { r: 0, c: 0 },
      { r: 1, c: 0 }
    ]
  },
  {
    id: "3-h",
    name: "3-横",
    kind: "III",
    area: 3,
    cells: [
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 0, c: 2 }
    ]
  },
  {
    id: "3-v",
    name: "3-竖",
    kind: "III",
    area: 3,
    cells: [
      { r: 0, c: 0 },
      { r: 1, c: 0 },
      { r: 2, c: 0 }
    ]
  },
  {
    id: "3-lu",
    name: "3-左上",
    kind: "III",
    area: 3,
    cells: [
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 1, c: 0 }
    ]
  },
  {
    id: "3-ru",
    name: "3-右上",
    kind: "III",
    area: 3,
    cells: [
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 1, c: 1 }
    ]
  },
  {
    id: "3-ld",
    name: "3-左下",
    kind: "III",
    area: 3,
    cells: [
      { r: 0, c: 0 },
      { r: 1, c: 0 },
      { r: 1, c: 1 }
    ]
  },
  {
    id: "3-rd",
    name: "3-右下",
    kind: "III",
    area: 3,
    cells: [
      { r: 0, c: 0 },
      { r: 1, c: -1 },
      { r: 1, c: 0 }
    ]
  },
  {
    id: "4-h",
    name: "4-横",
    kind: "IV",
    area: 4,
    cells: [
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 0, c: 2 },
      { r: 0, c: 3 }
    ]
  },
  {
    id: "4-v",
    name: "4-竖",
    kind: "IV",
    area: 4,
    cells: [
      { r: 0, c: 0 },
      { r: 1, c: 0 },
      { r: 2, c: 0 },
      { r: 3, c: 0 }
    ]
  },
  {
    id: "4-z",
    name: "4-Z型",
    kind: "IV",
    area: 4,
    cells: [
      { r: 0, c: 0 },
      { r: 1, c: -1 },
      { r: 1, c: 0 },
      { r: 2, c: -1 }
    ]
  },
  {
    id: "4-s",
    name: "4-S型",
    kind: "IV",
    area: 4,
    cells: [
      { r: 0, c: 0 },
      { r: 1, c: 0 },
      { r: 1, c: 1 },
      { r: 2, c: 1 }
    ]
  }
];

export const SHAPE_BY_ID = Object.fromEntries(SHAPES.map((shape) => [shape.id, shape]));

export const STAT_DEFS = [
  { key: "attackPct", label: "攻击%", kind: "percent" },
  { key: "attackFlat", label: "攻击固定", kind: "flat" },
  { key: "hpPct", label: "生命%", kind: "percent" },
  { key: "hpFlat", label: "生命固定", kind: "flat" },
  { key: "defensePct", label: "防御%", kind: "percent" },
  { key: "defenseFlat", label: "防御固定", kind: "flat" },
  { key: "critRate", label: "暴击率", kind: "percent" },
  { key: "critDamage", label: "暴击伤害", kind: "percent" },
  { key: "genericDamageBonus", label: "通用增伤", kind: "percent" },
  { key: "typedDamageBonus", label: "类型增伤", kind: "percent" },
  { key: "sourceDamageBonus", label: "来源增伤", kind: "percent" },
  { key: "otherDamageBonus", label: "其他增伤", kind: "percent" },
  { key: "damageReduction", label: "伤害降低", kind: "percent" },
  { key: "extraDamage", label: "额外伤害", kind: "flat" }
];

export const STAT_BY_KEY = Object.fromEntries(STAT_DEFS.map((stat) => [stat.key, stat]));

export const RARITIES = [
  { key: "gold", label: "金色", color: "#d6a12b" },
  { key: "purple", label: "紫色", color: "#8b5cf6" },
  { key: "blue", label: "蓝色", color: "#2684c2" }
];

export const RARITY_BY_KEY = Object.fromEntries(RARITIES.map((rarity) => [rarity.key, rarity]));

export const STAT_VALUE_RULES = {
  gold: {
    2: {
      attackPct: 0.06,
      attackFlat: 48,
      hpPct: 0.06,
      hpFlat: 360,
      defensePct: 0.075,
      defenseFlat: 42,
      critRate: 0.04,
      critDamage: 0.08,
      genericDamageBonus: 0.05,
      typedDamageBonus: 0.05,
      sourceDamageBonus: 0.05,
      otherDamageBonus: 0.05,
      extraDamage: 80
    },
    3: {
      attackPct: 0.09,
      attackFlat: 72,
      hpPct: 0.09,
      hpFlat: 540,
      defensePct: 0.1125,
      defenseFlat: 63,
      critRate: 0.06,
      critDamage: 0.12,
      genericDamageBonus: 0.075,
      typedDamageBonus: 0.075,
      sourceDamageBonus: 0.075,
      otherDamageBonus: 0.075,
      extraDamage: 120
    },
    4: {
      attackPct: 0.12,
      attackFlat: 96,
      hpPct: 0.12,
      hpFlat: 720,
      defensePct: 0.15,
      defenseFlat: 84,
      critRate: 0.08,
      critDamage: 0.16,
      genericDamageBonus: 0.1,
      typedDamageBonus: 0.1,
      sourceDamageBonus: 0.1,
      otherDamageBonus: 0.1,
      extraDamage: 160
    }
  },
  purple: {
    2: {
      attackPct: 0.045,
      attackFlat: 36,
      hpPct: 0.045,
      hpFlat: 270,
      defensePct: 0.056,
      defenseFlat: 32,
      critRate: 0.03,
      critDamage: 0.06,
      genericDamageBonus: 0.0375,
      typedDamageBonus: 0.0375,
      sourceDamageBonus: 0.0375,
      otherDamageBonus: 0.0375,
      extraDamage: 60
    },
    3: {
      attackPct: 0.0675,
      attackFlat: 54,
      hpPct: 0.0675,
      hpFlat: 405,
      defensePct: 0.084,
      defenseFlat: 48,
      critRate: 0.045,
      critDamage: 0.09,
      genericDamageBonus: 0.056,
      typedDamageBonus: 0.056,
      sourceDamageBonus: 0.056,
      otherDamageBonus: 0.056,
      extraDamage: 90
    },
    4: {
      attackPct: 0.09,
      attackFlat: 72,
      hpPct: 0.09,
      hpFlat: 540,
      defensePct: 0.112,
      defenseFlat: 64,
      critRate: 0.06,
      critDamage: 0.12,
      genericDamageBonus: 0.075,
      typedDamageBonus: 0.075,
      sourceDamageBonus: 0.075,
      otherDamageBonus: 0.075,
      extraDamage: 120
    }
  },
  blue: {
    2: {
      attackPct: 0.03,
      attackFlat: 24,
      hpPct: 0.03,
      hpFlat: 180,
      defensePct: 0.038,
      defenseFlat: 21,
      critRate: 0.02,
      critDamage: 0.04,
      genericDamageBonus: 0.025,
      typedDamageBonus: 0.025,
      sourceDamageBonus: 0.025,
      otherDamageBonus: 0.025,
      extraDamage: 40
    },
    3: {
      attackPct: 0.045,
      attackFlat: 36,
      hpPct: 0.045,
      hpFlat: 270,
      defensePct: 0.056,
      defenseFlat: 32,
      critRate: 0.03,
      critDamage: 0.06,
      genericDamageBonus: 0.0375,
      typedDamageBonus: 0.0375,
      sourceDamageBonus: 0.0375,
      otherDamageBonus: 0.0375,
      extraDamage: 60
    },
    4: {
      attackPct: 0.06,
      attackFlat: 48,
      hpPct: 0.06,
      hpFlat: 360,
      defensePct: 0.075,
      defenseFlat: 42,
      critRate: 0.04,
      critDamage: 0.08,
      genericDamageBonus: 0.05,
      typedDamageBonus: 0.05,
      sourceDamageBonus: 0.05,
      otherDamageBonus: 0.05,
      extraDamage: 80
    }
  }
};

export const SHAPE_KINDS = [
  { key: "II", label: "II 型" },
  { key: "III", label: "III 型" },
  { key: "IV", label: "IV 型" }
];

export function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function fullBoardCells() {
  return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({
    r: Math.floor(index / BOARD_SIZE),
    c: index % BOARD_SIZE
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
    preference: {
      shapeKind: "III",
      stat: "critRate",
      value: 0.03
    }
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
    preference: {
      shapeKind: "IV",
      stat: "critDamage",
      value: 0.06
    }
  }
];

export const DEFAULT_WEAPONS = [
  {
    id: "weapon-standard",
    name: "示例武器",
    baseAttack: 580,
    stats: {
      attackPct: 0.18,
      critRate: 0.08
    }
  },
  {
    id: "weapon-damage",
    name: "增伤武器",
    baseAttack: 520,
    stats: {
      genericDamageBonus: 0.18,
      critDamage: 0.18
    }
  }
];

export const DEFAULT_INVENTORY = [
  {
    id: "cart-01",
    name: "金 IV 双暴 S",
    rarity: "gold",
    shapeId: "4-s",
    enabled: true,
    locked: false,
    stats: {
      critRate: 0.08,
      critDamage: 0.16
    }
  },
  {
    id: "cart-02",
    name: "金 IV 攻击 Z",
    rarity: "gold",
    shapeId: "4-z",
    enabled: true,
    locked: false,
    stats: {
      attackPct: 0.12,
      genericDamageBonus: 0.1
    }
  },
  {
    id: "cart-03",
    name: "紫 IV 来源竖",
    rarity: "purple",
    shapeId: "4-v",
    enabled: true,
    locked: false,
    stats: {
      sourceDamageBonus: 0.075,
      critDamage: 0.12
    }
  },
  {
    id: "cart-04",
    name: "金 III 暴击横",
    rarity: "gold",
    shapeId: "3-h",
    enabled: true,
    locked: false,
    stats: {
      critRate: 0.06,
      attackPct: 0.09
    }
  },
  {
    id: "cart-05",
    name: "金 III 类型竖",
    rarity: "gold",
    shapeId: "3-v",
    enabled: true,
    locked: false,
    stats: {
      typedDamageBonus: 0.075,
      critDamage: 0.12
    }
  },
  {
    id: "cart-06",
    name: "紫 III 攻击左上",
    rarity: "purple",
    shapeId: "3-lu",
    enabled: true,
    locked: false,
    stats: {
      attackPct: 0.0675,
      critRate: 0.045
    }
  },
  {
    id: "cart-07",
    name: "金 II 增伤横",
    rarity: "gold",
    shapeId: "2-h",
    enabled: true,
    locked: false,
    stats: {
      genericDamageBonus: 0.05,
      critRate: 0.04
    }
  },
  {
    id: "cart-08",
    name: "蓝 II 攻击竖",
    rarity: "blue",
    shapeId: "2-v",
    enabled: true,
    locked: false,
    stats: {
      attackPct: 0.03,
      critDamage: 0.04
    }
  },
  {
    id: "cart-09",
    name: "金 III 额外右上",
    rarity: "gold",
    shapeId: "3-ru",
    enabled: false,
    locked: false,
    stats: {
      extraDamage: 120,
      otherDamageBonus: 0.075
    }
  },
  {
    id: "cart-10",
    name: "紫 II 生命竖",
    rarity: "purple",
    shapeId: "2-v",
    enabled: false,
    locked: false,
    stats: {
      hpPct: 0.045,
      hpFlat: 270
    }
  }
];
