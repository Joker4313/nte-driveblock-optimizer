export type Coord = {
  r: number;
  c: number;
};

export type ShapeKind = "II" | "III" | "IV";

export type ShapeId =
  | "2-h"
  | "2-v"
  | "3-h"
  | "3-v"
  | "3-lu"
  | "3-ru"
  | "3-ld"
  | "3-rd"
  | "4-h"
  | "4-v"
  | "4-z"
  | "4-s";

export type Rarity = "gold" | "purple" | "blue";

export type StatKey =
  | "critRate"
  | "critDamage"
  | "hpFlat"
  | "hpPct"
  | "attackFlat"
  | "attackPct"
  | "defenseFlat"
  | "defensePct"
  | "tiltIntensity"
  | "ringFusionIntensity"
  | "genericDamageBonus"
  | "elementDamageBonus"
  | "healingBonus"
  | "psychicDamageBonus";

export type StatMap = Partial<Record<StatKey, number>>;

export type Affix = {
  statKey: StatKey;
  value: number;
};

export type DriveBlockShape = {
  id: ShapeId;
  name: string;
  kind: ShapeKind;
  area: 2 | 3 | 4;
  cells: Coord[];
};

export type CharacterPreference = {
  shapeKind: ShapeKind;
  stat: StatKey;
  value: number;
};

export type Character = {
  id: string;
  name: string;
  baseAttack: number;
  baseHp: number;
  baseDefense: number;
  baseCritRate: number;
  baseCritDamage: number;
  element: string;
  preference: CharacterPreference;
};

export type Weapon = {
  id: string;
  name: string;
  baseAttack: number;
  stats: StatMap;
};

export type DriveBlockItem = {
  id: string;
  name: string;
  rarity: Rarity;
  shapeId: ShapeId;
  affixes: [Affix, Affix, Affix, Affix];
  enabled: boolean;
  locked: boolean;
  legacyStats?: Record<string, number>;
};

export type Cassette = {
  id: string;
  name: string;
  rarity: Rarity;
  enabled: boolean;
  mainAffix: Affix;
  affixes: [Affix, Affix, Affix, Affix];
  legacyStats?: Record<string, number>;
};

export type SkillProfile = {
  attackMultiplier: number;
  hpMultiplier: number;
  defenseMultiplier: number;
  extraDamage: number;
};

export type AppState = {
  version: number;
  board: {
    size: 5;
    activeCells: Coord[];
  };
  characters: Character[];
  weapons: Weapon[];
  driveBlocks: DriveBlockItem[];
  cassettes: Cassette[];
  statTables: StatTables;
  requiredShapes: ShapeId[];
  fillPriority: 2 | 3 | 4;
  selectedCharacterId: string;
  selectedWeaponId: string;
  skill: SkillProfile;
  invalidStats: StatKey[];
  topN: number;
  branchLimit: number;
};

export type StatTables = {
  driveBlockBasePerCell: Record<Rarity, Pick<StatMap, "attackFlat" | "hpFlat">>;
  driveBlockAffixPerCell: Record<Rarity, StatMap>;
  cassetteMainAffixValues: Record<Rarity, StatMap>;
  cassetteAffixValues: Record<Rarity, StatMap>;
};

export type DamageBreakdown = {
  expectedDamage: number;
  baseDamage: number;
  damageZone: number;
  critExpectation: number;
  preferenceCount: number;
  stats: {
    attack: number;
    hp: number;
    defense: number;
    critRate: number;
    critDamage: number;
  };
  statTotals: StatMap;
};

export type Placement = {
  itemId: string;
  cells: Coord[];
};

export type OptimizerResult = {
  rank: number;
  damage: DamageBreakdown;
  placements: Placement[];
  driveBlockIds: string[];
  cassetteId: string | null;
};
