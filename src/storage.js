import {
  CASSETTE_AFFIX_KEYS,
  CASSETTE_MAIN_AFFIX_KEYS,
  DEFAULT_CASSETTES,
  DEFAULT_CHARACTERS,
  DEFAULT_DRIVE_BLOCKS,
  DEFAULT_STAT_TABLES,
  DEFAULT_WEAPONS,
  DRIVE_BLOCK_AFFIX_KEYS,
  fullBoardCells,
  makeAffixes
} from "./data/defaults.js";

const STORAGE_KEY = "nte-driveblock-optimizer-state-v1";

export function createDefaultState() {
  return {
    version: 3,
    board: {
      size: 5,
      activeCells: fullBoardCells()
    },
    characters: structuredClone(DEFAULT_CHARACTERS),
    weapons: structuredClone(DEFAULT_WEAPONS),
    driveBlocks: structuredClone(DEFAULT_DRIVE_BLOCKS),
    cassettes: structuredClone(DEFAULT_CASSETTES),
    statTables: structuredClone(DEFAULT_STAT_TABLES),
    requiredShapes: [],
    fillPriority: 3,
    selectedCharacterId: DEFAULT_CHARACTERS[0].id,
    selectedWeaponId: DEFAULT_WEAPONS[0].id,
    skill: {
      attackMultiplier: 2.5,
      hpMultiplier: 0,
      defenseMultiplier: 0,
      extraDamage: 0
    },
    invalidStats: ["hpPct", "hpFlat", "defensePct", "defenseFlat"],
    topN: 5,
    branchLimit: 100000
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }
    return migrateState(JSON.parse(raw));
  } catch (error) {
    console.warn("Failed to load saved state.", error);
    return createDefaultState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: 3 }));
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function serializeState(state) {
  return JSON.stringify({ ...state, version: 3 }, null, 2);
}

export function parseImportedState(text) {
  return migrateState(JSON.parse(text));
}

export function migrateState(value = {}) {
  const fallback = createDefaultState();
  const driveBlockSource = Array.isArray(value.driveBlocks)
    ? value.driveBlocks
    : Array.isArray(value.inventory)
      ? value.inventory
      : fallback.driveBlocks;

  const state = {
    ...fallback,
    ...value,
    version: 3,
    board: {
      ...fallback.board,
      ...(value.board ?? {})
    },
    characters: Array.isArray(value.characters) ? value.characters : fallback.characters,
    weapons: Array.isArray(value.weapons) ? value.weapons : fallback.weapons,
    driveBlocks: driveBlockSource.map(migrateDriveBlock),
    cassettes: Array.isArray(value.cassettes)
      ? value.cassettes.map(migrateCassette)
      : fallback.cassettes,
    statTables: mergeStatTables(fallback.statTables, value.statTables),
    requiredShapes: Array.isArray(value.requiredShapes)
      ? value.requiredShapes.filter(Boolean)
      : fallback.requiredShapes,
    fillPriority: [2, 3, 4].includes(Number(value.fillPriority))
      ? Number(value.fillPriority)
      : fallback.fillPriority,
    skill: {
      ...fallback.skill,
      ...(value.skill ?? {})
    },
    invalidStats: Array.isArray(value.invalidStats)
      ? value.invalidStats.filter((key) => DRIVE_BLOCK_AFFIX_KEYS.includes(key) || CASSETTE_MAIN_AFFIX_KEYS.includes(key))
      : fallback.invalidStats,
    topN: Number(value.topN) || fallback.topN,
    branchLimit: Number(value.branchLimit) || fallback.branchLimit
  };

  delete state.inventory;
  return state;
}

function mergeStatTables(fallback, value = {}) {
  return {
    driveBlockBasePerCell: mergeNestedTable(
      fallback.driveBlockBasePerCell,
      value.driveBlockBasePerCell
    ),
    driveBlockAffixPerCell: mergeNestedTable(
      fallback.driveBlockAffixPerCell,
      value.driveBlockAffixPerCell
    ),
    cassetteMainAffixValues: mergeNestedTable(
      fallback.cassetteMainAffixValues,
      value.cassetteMainAffixValues
    ),
    cassetteAffixValues: mergeNestedTable(
      fallback.cassetteAffixValues,
      value.cassetteAffixValues
    )
  };
}

function mergeNestedTable(fallback, value = {}) {
  const merged = structuredClone(fallback);
  for (const [rarity, stats] of Object.entries(value ?? {})) {
    merged[rarity] = {
      ...(merged[rarity] ?? {}),
      ...(stats ?? {})
    };
  }
  return merged;
}

function migrateDriveBlock(item) {
  const { affixes, legacyStats } = migrateAffixes(item.affixes, item.stats, DRIVE_BLOCK_AFFIX_KEYS);
  const migrated = {
    id: item.id,
    name: item.name || "驱动块",
    rarity: item.rarity || "gold",
    shapeId: item.shapeId || "2-h",
    enabled: Boolean(item.enabled ?? true),
    locked: Boolean(item.locked ?? false),
    affixes
  };
  if (Object.keys({ ...(item.legacyStats ?? {}), ...legacyStats }).length) {
    migrated.legacyStats = { ...(item.legacyStats ?? {}), ...legacyStats };
  }
  return migrated;
}

function migrateCassette(item) {
  const mainAffix = normalizeAffix(item.mainAffix, CASSETTE_MAIN_AFFIX_KEYS);
  const { affixes, legacyStats } = migrateAffixes(item.affixes, item.stats, CASSETTE_AFFIX_KEYS);
  const migrated = {
    id: item.id,
    name: item.name || "卡带",
    rarity: item.rarity || "gold",
    enabled: Boolean(item.enabled ?? true),
    mainAffix,
    affixes
  };
  if (Object.keys({ ...(item.legacyStats ?? {}), ...legacyStats }).length) {
    migrated.legacyStats = { ...(item.legacyStats ?? {}), ...legacyStats };
  }
  return migrated;
}

function migrateAffixes(affixes, stats, allowedKeys) {
  if (Array.isArray(affixes)) {
    return {
      affixes: makeAffixes(affixes.map((affix) => normalizeAffix(affix, allowedKeys))),
      legacyStats: {}
    };
  }

  const mergedStats = mergeLegacyStats(stats ?? {});
  const validEntries = [];
  const legacyStats = {};
  for (const [key, value] of Object.entries(mergedStats)) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue === 0) {
      continue;
    }
    if (allowedKeys.includes(key)) {
      validEntries.push({ statKey: key, value: numericValue });
    } else {
      legacyStats[key] = numericValue;
    }
  }

  return {
    affixes: makeAffixes(validEntries.slice(0, 4)),
    legacyStats
  };
}

function normalizeAffix(affix, allowedKeys) {
  const statKey = allowedKeys.includes(affix?.statKey) ? affix.statKey : allowedKeys[0];
  const value = Number(affix?.value ?? 0);
  return {
    statKey,
    value: Number.isFinite(value) ? value : 0
  };
}

function mergeLegacyStats(stats) {
  const merged = { ...stats };
  const genericTotal =
    Number(merged.genericDamageBonus ?? 0) +
    Number(merged.typedDamageBonus ?? 0) +
    Number(merged.sourceDamageBonus ?? 0) +
    Number(merged.otherDamageBonus ?? 0);
  if (genericTotal) {
    merged.genericDamageBonus = genericTotal;
  }
  delete merged.typedDamageBonus;
  delete merged.sourceDamageBonus;
  delete merged.otherDamageBonus;
  return merged;
}
